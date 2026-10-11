import {
  UserAlertPreference,
  AlertNotification,
  SeverityLevel,
  FloodReport,
  WeatherWarning,
} from './types.js';
import { getDynamoDocClient } from './db/dynamoClient.js';
import { config } from './config.js';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { calculateDistanceKm } from './riskEngine.js';

// In-memory backing stores for local dev/testing
const inMemoryPreferences = new Map<string, UserAlertPreference>();
const inMemoryNotifications = new Map<string, AlertNotification[]>();

let snsClient: SNSClient | null = null;
function getSnsClient(): SNSClient | null {
  if (snsClient) return snsClient;
  try {
    snsClient = new SNSClient({ region: config.awsRegion });
    return snsClient;
  } catch {
    return null;
  }
}

/**
 * Get user alert preferences
 */
export async function getUserAlertPreferences(userId: string, email: string): Promise<UserAlertPreference> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      const res = await ddb.send(
        new GetCommand({
          TableName: config.userAlertsTableName,
          Key: { userId },
        })
      );
      if (res.Item) return res.Item as UserAlertPreference;
    } catch {
      // Fall through to in-memory store
    }
  }

  const existing = inMemoryPreferences.get(userId);
  if (existing) return existing;

  // Default initial configuration
  const defaultPref: UserAlertPreference = {
    userId,
    email,
    enableInApp: true,
    enableEmail: false,
    enableSns: false,
    savedLocations: [
      {
        id: 'loc-home',
        label: 'Home Locality',
        latitude: 13.0418,
        longitude: 80.2341,
        radiusKm: 5,
        triggerOnSeverity: 'HIGH',
        notifyOnOfficialWarnings: true,
        notifyOnRoadBlockages: true,
      },
    ],
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    updatedAt: new Date().toISOString(),
  };

  inMemoryPreferences.set(userId, defaultPref);
  return defaultPref;
}

/**
 * Update user alert preferences
 */
export async function updateUserAlertPreferences(
  userId: string,
  updates: Partial<UserAlertPreference>
): Promise<UserAlertPreference> {
  const current = await getUserAlertPreferences(userId, updates.email || 'user@jalrakshak.org');
  const merged: UserAlertPreference = {
    ...current,
    ...updates,
    userId,
    updatedAt: new Date().toISOString(),
  };

  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      await ddb.send(
        new PutCommand({
          TableName: config.userAlertsTableName,
          Item: merged,
        })
      );
    } catch {
      // safe fallback
    }
  }

  inMemoryPreferences.set(userId, merged);
  return merged;
}

/**
 * Retrieve user's notification history
 */
export async function getUserNotifications(userId: string): Promise<AlertNotification[]> {
  const list = inMemoryNotifications.get(userId) || [
    {
      notificationId: `notif-seed-1-${userId}`,
      userId,
      title: 'Official Orange Heavy Rainfall Warning Issued',
      body: 'Regional Met Centre Chennai has upgraded monsoon watch to Orange Alert. Prepare for localized waterlogging.',
      severity: 'HIGH',
      type: 'WARNING_ISSUED',
      locationName: 'Chennai Metropolitan Basin',
      latitude: 13.0827,
      longitude: 80.2707,
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      notificationId: `notif-seed-2-${userId}`,
      userId,
      title: 'Critical Road Inundation: T. Nagar South Usman Road',
      body: 'Verified report confirms road completely blocked under flyover. Diversion via Anna Salai recommended.',
      severity: 'CRITICAL',
      type: 'ROAD_BLOCKED',
      locationName: 'T. Nagar South Usman Road',
      latitude: 13.0418,
      longitude: 80.2341,
      timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      isRead: true,
      sourceReportId: 'demo-chennai-002',
    },
  ];

  return list;
}

/**
 * Dispatch an alert notification (with duplicate suppression, quiet hours, and SNS delivery)
 */
export async function dispatchAlertNotification(
  userId: string,
  notification: Omit<AlertNotification, 'notificationId' | 'isRead'>
): Promise<AlertNotification | null> {
  const prefs = await getUserAlertPreferences(userId, 'resident@jalrakshak.org');

  // Quiet hours check
  if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
    const currentHour = new Date().getHours();
    const startHour = parseInt(prefs.quietHoursStart.split(':')[0], 10);
    const endHour = parseInt(prefs.quietHoursEnd.split(':')[0], 10);
    const inQuietHours = startHour > endHour
      ? currentHour >= startHour || currentHour < endHour
      : currentHour >= startHour && currentHour < endHour;

    if (inQuietHours && notification.severity !== 'CRITICAL') {
      return null; // Suppress non-critical notifications during quiet hours
    }
  }

  const existingList = inMemoryNotifications.get(userId) || [];

  // Duplicate suppression: if identical title was dispatched in last 30 minutes, suppress
  const isDuplicate = existingList.some(
    (n) =>
      n.title === notification.title &&
      Date.now() - new Date(n.timestamp).getTime() < 30 * 60 * 1000
  );
  if (isDuplicate) return null;

  const newNotification: AlertNotification = {
    ...notification,
    notificationId: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isRead: false,
  };

  existingList.unshift(newNotification);
  inMemoryNotifications.set(userId, existingList.slice(0, 50)); // keep last 50

  // Optional SNS Publish if configured
  if (prefs.enableSns && config.snsTopicArn) {
    const sns = getSnsClient();
    if (sns) {
      try {
        await sns.send(
          new PublishCommand({
            TopicArn: config.snsTopicArn,
            Subject: `JalRakshak Alert: ${notification.title}`,
            Message: `${notification.body}\n\nLocation: ${notification.locationName}\nTimestamp: ${notification.timestamp}`,
          })
        );
      } catch {
        // SNS publish failure should not break app flow
      }
    }
  }

  return newNotification;
}

/**
 * Checks newly submitted/verified reports against all users' saved location preferences
 */
export async function evaluateAlertTriggersForReport(report: FloodReport): Promise<void> {
  // Check each registered user's saved locations
  for (const [userId, prefs] of inMemoryPreferences.entries()) {
    for (const savedLoc of prefs.savedLocations) {
      const distKm = calculateDistanceKm(savedLoc.latitude, savedLoc.longitude, report.latitude, report.longitude);
      if (distKm <= savedLoc.radiusKm) {
        // Severity threshold check
        const severityOrder: Record<SeverityLevel, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
        if (severityOrder[report.severity] >= severityOrder[savedLoc.triggerOnSeverity]) {
          await dispatchAlertNotification(userId, {
            userId,
            title: report.roadCondition === 'BLOCKED' ? `Road Blocked Near ${savedLoc.label}` : `Elevated Flood Hazard Near ${savedLoc.label}`,
            body: `${report.locationName}: ${report.description} (${distKm.toFixed(1)} km from your saved location)`,
            severity: report.severity,
            type: report.roadCondition === 'BLOCKED' ? 'ROAD_BLOCKED' : 'VERIFIED_REPORT_NEARBY',
            locationName: report.locationName,
            latitude: report.latitude,
            longitude: report.longitude,
            timestamp: new Date().toISOString(),
            sourceReportId: report.reportId,
          });
        }
      }
    }
  }
}
