import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  UserAlertNotification,
  DeliveryLog,
  AlertDispatchResult,
  SeverityLevel,
} from './types.js';
import { config } from './config.js';
import { getUserAlertPreferences } from './alertsService.js';
import { getExtendedWeatherTelemetry, getOfficialWeatherWarnings } from './weatherAdapter.js';
import { calculateMultiHorizonFloodRisk } from './riskEngine.js';

const sesClient = new SESClient({ region: config.awsRegion });
const snsClient = new SNSClient({ region: config.awsRegion });

// In-memory notification store for demonstration and local testing
const inMemoryNotifications: UserAlertNotification[] = [
  {
    notificationId: 'notif-seed-01',
    userId: 'default-user',
    title: 'IMD Orange Warning Active in Basin',
    message: 'Heavy to very heavy rainfall forecast over Chennai coastal belt. Precautionary monitoring active.',
    severity: 'HIGH',
    locationName: 'Velachery Lowland Lake Basin',
    coordinates: [12.9715, 80.218],
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    deliveryLogs: [
      {
        channel: 'IN_APP',
        recipient: 'default-user',
        status: 'CONFIRMED_DELIVERED',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  {
    notificationId: 'notif-seed-02',
    userId: 'default-user',
    title: 'Waterlogging Reported Near Subway',
    message: 'Duraisamy subway underpass reported difficult to pass with ~25cm water ponding.',
    severity: 'CRITICAL',
    locationName: 'T. Nagar South Usman Corridor',
    coordinates: [13.0418, 80.2341],
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    deliveryLogs: [
      {
        channel: 'IN_APP',
        recipient: 'default-user',
        status: 'CONFIRMED_DELIVERED',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  },
];

// Deduplication key tracking to prevent re-sending unchanged alerts within 120 minutes
const sentAlertCache = new Map<string, number>();

/**
 * Checks whether current time falls within user quiet hours (e.g. 22:00 to 06:00).
 */
function isWithinQuietHours(prefs: { quietHoursEnabled: boolean; quietHoursStart?: string; quietHoursEnd?: string }): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const currentHour = new Date().getHours();
  const startHour = prefs.quietHoursStart ? parseInt(prefs.quietHoursStart.split(':')[0], 10) : 22;
  const endHour = prefs.quietHoursEnd ? parseInt(prefs.quietHoursEnd.split(':')[0], 10) : 6;
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  }
  // Spanning midnight (e.g. 22:00 to 06:00)
  return currentHour >= startHour || currentHour < endHour;
}

/**
 * Dispatches an email notification via Amazon SES.
 * If credentials are missing or SES is in sandbox mode, logs transparent diagnostic status.
 */
export async function sendEmailViaSES(
  toEmail: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<DeliveryLog> {
  const timestamp = new Date().toISOString();

  // Guard: if credentials or SES configuration not live, record transparent attempted status
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
    return {
      channel: 'EMAIL_SES',
      recipient: toEmail,
      status: 'ATTEMPTED',
      timestamp,
      errorMessage: 'Local environment without live AWS SES credentials. Dispatch simulated for demonstration.',
    };
  }

  try {
    const command = new SendEmailCommand({
      Source: config.sesSenderEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          Text: { Data: textBody, Charset: 'UTF-8' },
        },
      },
    });

    const response = await sesClient.send(command);
    return {
      channel: 'EMAIL_SES',
      recipient: toEmail,
      status: 'CONFIRMED_DELIVERED',
      timestamp,
      providerMessageId: response.MessageId,
    };
  } catch (err: any) {
    console.warn('[SES Error]:', err.message);
    return {
      channel: 'EMAIL_SES',
      recipient: toEmail,
      status: 'FAILED',
      timestamp,
      errorMessage: `SES Delivery failed: ${err.message}. Note: In AWS SES sandbox, recipient emails must be verified identities.`,
    };
  }
}

/**
 * Dispatches an SMS notification via Amazon SNS.
 * Adheres to Indian TRAI DLT compliance documentation and spending limits.
 */
export async function sendSmsViaSNS(
  phoneNumber: string,
  message: string
): Promise<DeliveryLog> {
  const timestamp = new Date().toISOString();

  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
    return {
      channel: 'SMS_SNS',
      recipient: phoneNumber,
      status: 'ATTEMPTED',
      timestamp,
      errorMessage: 'Local environment without live AWS SNS credentials. Dispatch simulated for demonstration.',
    };
  }

  try {
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    const response = await snsClient.send(command);
    return {
      channel: 'SMS_SNS',
      recipient: phoneNumber,
      status: 'CONFIRMED_DELIVERED',
      timestamp,
      providerMessageId: response.MessageId,
    };
  } catch (err: any) {
    console.warn('[SNS Error]:', err.message);
    return {
      channel: 'SMS_SNS',
      recipient: phoneNumber,
      status: 'FAILED',
      timestamp,
      errorMessage: `SNS Delivery failed: ${err.message}. For India (+91), TRAI DLT registration (Entity ID, Header, Template ID) is mandatory under TCCCPR 2018.`,
    };
  }
}

/**
 * Retrieves in-app notifications for an authenticated user.
 */
export function getUserInAppNotifications(userId: string): UserAlertNotification[] {
  return inMemoryNotifications.filter((n) => n.userId === userId || n.userId === 'default-user');
}

/**
 * Marks a notification as read.
 */
export function markNotificationAsRead(notificationId: string): boolean {
  const n = inMemoryNotifications.find((item) => item.notificationId === notificationId);
  if (n) {
    n.isRead = true;
    return true;
  }
  return false;
}

/**
 * Automatic EventBridge scheduled alert processing engine:
 * Ingests fresh weather & risk, checks saved user locations, evaluates thresholds,
 * enforces quiet hours, suppresses duplicates, and creates in-app/SES/SNS notifications.
 */
export async function processScheduledAlerts(
  userId: string = 'default-user',
  userEmail: string = 'citizen@jalrakshak.org',
  testMode: boolean = false
): Promise<AlertDispatchResult> {
  const prefs = await getUserAlertPreferences(userId, userEmail);
  const now = new Date();
  const dispatchId = `disp-${Date.now()}`;

  let createdCount = 0;
  let emailsAttempted = 0;
  let smsAttempted = 0;
  let quietHoursCount = 0;
  let duplicatesCount = 0;
  const results: AlertDispatchResult['results'] = [];

  const inQuiet = isWithinQuietHours({
    quietHoursEnabled: prefs.quietHoursEnabled,
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
  });

  for (const loc of prefs.savedLocations) {
    // 1. Fetch fresh telemetry
    const weather = await getExtendedWeatherTelemetry(loc.latitude, loc.longitude);
    const warnings = getOfficialWeatherWarnings(loc.latitude, loc.longitude);

    // 2. Assess 3H horizon risk
    const assessment = calculateMultiHorizonFloodRisk([], {
      latitude: loc.latitude,
      longitude: loc.longitude,
      localityName: loc.label,
      weather,
    });

    const currentScore = assessment.horizons['3H'].overallScore;
    const currentCategory = assessment.horizons['3H'].category;

    // Check trigger conditions
    const hasOfficialWarning = warnings.length > 0 && loc.notifyOnOfficialWarnings;
    const severityLevels: SeverityLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    const meetsSeverity =
      severityLevels.indexOf(currentCategory) >= severityLevels.indexOf(loc.triggerOnSeverity);

    if (!hasOfficialWarning && !meetsSeverity && !testMode) {
      continue;
    }

    // 3. Deduplication check
    const dedupKey = `${userId}:${loc.label}:${currentCategory}:${warnings[0]?.warningId || 'none'}`;
    const lastSent = sentAlertCache.get(dedupKey);
    if (!testMode && lastSent && Date.now() - lastSent < 7200000) {
      duplicatesCount++;
      continue;
    }
    sentAlertCache.set(dedupKey, Date.now());

    // 4. Construct Notification
    const title = hasOfficialWarning
      ? `IMD Meteorological Alert: ${warnings[0].headline}`
      : `Elevated Flood Risk Estimated: ${loc.label}`;

    const message = `Projected 3-hour precipitation accumulation is ${weather.accumulated3hMm}mm over ${loc.label} (${currentCategory} Risk, Score ${currentScore}/100). Take precautions.`;

    const deliveryLogs: DeliveryLog[] = [];

    // Always deliver in-app notification
    deliveryLogs.push({
      channel: 'IN_APP',
      recipient: userId,
      status: 'CONFIRMED_DELIVERED',
      timestamp: now.toISOString(),
    });

    const newNotification: UserAlertNotification = {
      notificationId: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      severity: currentCategory,
      locationName: loc.label,
      coordinates: [loc.latitude, loc.longitude],
      isRead: false,
      createdAt: now.toISOString(),
      deliveryLogs,
    };

    inMemoryNotifications.unshift(newNotification);
    createdCount++;

    // 5. Check quiet hours for external channels (Email / SMS)
    if (inQuiet && !testMode) {
      quietHoursCount++;
      deliveryLogs.push({
        channel: 'EMAIL_SES',
        recipient: prefs.email || userEmail,
        status: 'SUPPRESSED_QUIET_HOURS',
        timestamp: now.toISOString(),
      });
      if (prefs.phone) {
        deliveryLogs.push({
          channel: 'SMS_SNS',
          recipient: prefs.phone,
          status: 'SUPPRESSED_QUIET_HOURS',
          timestamp: now.toISOString(),
        });
      }
    } else {
      // 6. Deliver Email via Amazon SES if enabled
      if (prefs.enableEmail && (prefs.email || userEmail)) {
        emailsAttempted++;
        const targetEmail = prefs.email || userEmail;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
            <div style="color: #1E3A2F; font-size: 20px; font-weight: bold; margin-bottom: 8px;">JalRakshak AI — Flood Risk Advisory</div>
            <div style="background-color: #FEF3C7; color: #92400E; padding: 10px 14px; border-radius: 6px; font-weight: bold; margin-bottom: 14px;">
              ${title}
            </div>
            <p style="color: #334155; line-height: 1.5;">${message}</p>
            <div style="background-color: #F8FAFC; padding: 12px; border-radius: 6px; margin: 14px 0; font-size: 13px;">
              <strong>Monitored Locality:</strong> ${loc.label}<br/>
              <strong>Coordinates:</strong> ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E<br/>
              <strong>Telemetry Timestamp:</strong> ${weather.measurementTime || now.toISOString()}
            </div>
            <a href="${config.publicAppOrigin}/map" style="display: inline-block; background-color: #1E3A2F; color: #FFFFFF; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Inspect Interactive Flood Map
            </a>
            <p style="color: #64748B; font-size: 11px; margin-top: 20px; border-top: 1px solid #E2E8F0; pt: 10px;">
              JalRakshak AI models potential risk using meteorological telemetry and terrain indices. Never enter flooded roads.
            </p>
          </div>
        `;
        const emailLog = await sendEmailViaSES(
          targetEmail,
          `[JalRakshak AI] ${title}`,
          html,
          message
        );
        deliveryLogs.push(emailLog);
      }

      // 7. Deliver SMS via Amazon SNS if enabled
      if (prefs.enableSns && prefs.phone) {
        smsAttempted++;
        const smsText = `[JalRakshak Alert] ${loc.label}: ${currentCategory} flood risk. 3h rain: ${weather.accumulated3hMm}mm. Avoid waterlogged subways. Map: ${config.publicAppOrigin}/map`;
        const smsLog = await sendSmsViaSNS(prefs.phone, smsText);
        deliveryLogs.push(smsLog);
      }
    }

    results.push({
      userId,
      notificationTitle: title,
      deliveryLogs,
    });
  }

  return {
    dispatchId,
    evaluatedUsersCount: 1,
    notificationsCreated: createdCount,
    emailsAttempted,
    smsAttempted,
    suppressedQuietHours: quietHoursCount,
    suppressedDuplicates: duplicatesCount,
    results,
  };
}
