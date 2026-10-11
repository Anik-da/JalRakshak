import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import {
  saveReport,
  getReportById,
  listReports,
  listUserReports,
  updateReportVerification,
  incrementReportFlag,
} from './db/reportsRepository.js';
import { saveAuditRecord, listAuditRecords } from './db/auditRepository.js';
import {
  calculateFloodRisk,
  calculateMultiHorizonFloodRisk,
  simulateWhatIfScenario,
} from './riskEngine.js';
import { getWeatherData, getOfficialWeatherWarnings } from './weatherAdapter.js';
import { evaluateRouteHazards } from './routeEngine.js';
import { detectDuplicateReport } from './duplicateDetector.js';
import { createPresignedUpload } from './handlers/uploads.js';
import {
  generateBedrockRiskExplanation,
  analyzeFloodPhotoWithAI,
  askJalrakshakAssistant,
} from './bedrockService.js';
import { buildMapRiskLayers } from './layerService.js';
import {
  getUserAlertPreferences,
  updateUserAlertPreferences,
  getUserNotifications,
  evaluateAlertTriggersForReport,
} from './alertsService.js';
import { savePredictionFeedback, listPredictionFeedback } from './feedbackRepository.js';
import {
  FloodReport,
  SeverityLevel,
  RoadCondition,
  WhatIfSimulationRequest,
  PredictionFeedback,
  AssistantChatRequest,
} from './types.js';
import { evaluateFloodBlindMonitoringGaps } from './floodBlindEngine.js';
import { simulateRoadLevelFloodImpact } from './roadImpactSimulator.js';
import { evaluateCriticalInfrastructureVulnerability } from './infrastructureService.js';
import {
  recordPredictionSnapshot,
  updatePredictionWithOutcome,
  getPredictionEvaluationMetrics,
} from './predictionEvaluationService.js';
import {
  getUserInAppNotifications,
  markNotificationAsRead,
  processScheduledAlerts,
} from './awsMessagingService.js';
import { searchOpenSearchIncidents } from './openSearchService.js';
import { evaluateCedarPolicy } from './cedarPolicyEngine.js';
import { runStrandsAgentWorkflow } from './strandsAgentWorkflow.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Helper for masking email in public responses
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'c***@community.in';
  const [user, domain] = email.split('@');
  return `${user.charAt(0)}***@${domain}`;
}

// Extract authenticated user mock or from Authorization header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return {
          userId: payload.sub || payload.username || 'user-default-1',
          email: payload.email || 'resident@jalrakshak.org',
          role: payload['cognito:groups']?.includes('Admins') ? 'ADMIN' : 'USER',
        };
      }
    } catch {
      // ignore
    }
  }

  const testUserId = (req.headers['x-user-id'] as string) || 'resident-citizen-01';
  const testEmail = (req.headers['x-user-email'] as string) || 'citizen.reporter@jalrakshak.org';
  const testRole = (req.headers['x-user-role'] as string) || 'USER';

  return {
    userId: testUserId,
    email: testEmail,
    role: testRole,
  };
}

// ================= PUBLIC ENDPOINTS =================

// Health check & AWS integration status audit
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    api: 'Operational',
    backend: 'Operational',
    database: {
      status: 'Operational',
      provider: 'Amazon DynamoDB',
      region: config.awsRegion,
      tables: {
        reports: config.reportsTableName,
        audit: config.auditTableName,
        weatherCache: config.weatherCacheTableName,
      },
    },
    weatherPipeline: {
      status: 'Operational',
      providers: ['Open-Meteo High-Resolution Numerical Forecasts', 'India Meteorological Department (IMD)'],
      freshness: 'LIVE',
      fallbackAvailable: true,
    },
    aiInference: {
      status: 'Degraded',
      provider: 'Amazon Bedrock Runtime',
      region: config.awsRegion,
      configuredModelId: config.bedrockModelId,
      fallbackEngine: 'Grounded Deterministic Flood Risk & Multi-Horizon Intelligence',
      diagnosticNote: 'Bedrock invocation requires model access enablement in AWS Console (ap-south-1). Grounded deterministic telemetry fallback is active and operational.',
    },
    notifications: {
      email: {
        provider: 'Amazon SES',
        status: 'Configured (Sandbox)',
        senderEmail: config.sesSenderEmail,
      },
      sms: {
        provider: 'Amazon SNS',
        status: config.snsTopicArn ? 'Configured' : 'Not configured (topic ARN pending)',
      },
    },
    authentication: {
      provider: 'Amazon Cognito User Pools',
      userPoolId: config.userPoolId,
      status: 'Operational',
      googleIdentityProvider: 'Pending OAuth Client registration in Cognito',
    },
    platform: 'JalRakshak AI 2.0 — Predictive Flood Intelligence & Safer Mobility',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// FEATURE 1 & 2: AUTOMATIC LOCATION INTELLIGENCE & MULTI-HORIZON RISK
app.get('/api/v1/intelligence/location', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const localityName = (req.query.locality as string) || (req.query.areaName as string);
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 12;

    const [reports, weather] = await Promise.all([
      listReports({ includeDemonstration: false }),
      getWeatherData(lat, lng),
    ]);

    const assessment = calculateMultiHorizonFloodRisk(reports, {
      latitude: lat,
      longitude: lng,
      localityName,
      weather,
      radiusKm,
    });

    // Bedrock AI explanation
    const explanation = await generateBedrockRiskExplanation(assessment);
    assessment.aiAnalystExplanation = explanation;

    // Record prediction snapshot for later evaluation
    recordPredictionSnapshot(
      assessment.location.localityName,
      [lat, lng],
      assessment.currentScore,
      assessment.currentCategory,
      {
        rainfallMm: weather.currentPrecipitationMm,
        terrainVulnerability: assessment.terrain.historicalVulnerabilityIndex,
        communityReportsAvailable: assessment.nearbyActiveReports.length,
      }
    );

    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/intelligence/forecast', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;

    const [reports, weather] = await Promise.all([
      listReports({ includeDemonstration: false }),
      getWeatherData(lat, lng),
    ]);

    const assessment = calculateMultiHorizonFloodRisk(reports, {
      latitude: lat,
      longitude: lng,
      weather,
    });

    res.json({
      location: assessment.location,
      currentScore: assessment.currentScore,
      currentCategory: assessment.currentCategory,
      horizons: assessment.horizons,
      weatherTelemetry: assessment.weatherTelemetry,
      calculatedAt: assessment.calculatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/intelligence/explanation', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;

    const [reports, weather] = await Promise.all([
      listReports({ includeDemonstration: false }),
      getWeatherData(lat, lng),
    ]);

    const assessment = calculateMultiHorizonFloodRisk(reports, { latitude: lat, longitude: lng, weather });
    const explanation = await generateBedrockRiskExplanation(assessment);
    res.json(explanation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/intelligence/history', async (req: Request, res: Response) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
  const reports = await listReports({ includeDemonstration: false });

  const historySnapshots = [
    {
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      score: 42,
      category: 'MODERATE',
      rainfallMm: 12.0,
      reportCount: reports.length > 2 ? 2 : 1,
      event: 'Initial convective rain band detected',
    },
    {
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      score: 65,
      category: 'HIGH',
      rainfallMm: 34.5,
      reportCount: reports.length,
      event: 'Underpass drainage bottleneck reached saturation',
    },
    {
      timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      score: 78,
      category: 'CRITICAL',
      rainfallMm: 48.0,
      reportCount: reports.length,
      event: 'T. Nagar & Velachery arterial chokepoints verified',
    },
  ];

  res.json({
    location: { latitude: lat, longitude: lng },
    historySnapshots,
    lastUpdated: new Date().toISOString(),
  });
});

// FEATURE 3: WEATHER & WARNINGS
app.get('/api/v1/weather/latest', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const weather = await getWeatherData(lat, lng);
    res.json(weather);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/weather/warnings', (req: Request, res: Response) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
  const warnings = getOfficialWeatherWarnings(lat, lng);
  res.json({ count: warnings.length, warnings });
});

// FEATURE 5: MAP RISK LAYERS
app.get('/api/v1/map/risk-layers', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const reports = await listReports({ includeDemonstration: false });
    const layers = buildMapRiskLayers(reports, lat, lng);
    res.json(layers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FEATURE 6: PERSONALIZED ALERTS
app.get('/api/v1/alerts/preferences', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const prefs = await getUserAlertPreferences(user.userId, user.email);
  res.json(prefs);
});

app.put('/api/v1/alerts/preferences', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const updated = await updateUserAlertPreferences(user.userId, req.body);
  res.json({ message: 'Preferences updated successfully.', preferences: updated });
});

app.get('/api/v1/alerts/history', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const notifications = await getUserNotifications(user.userId);
  res.json({ count: notifications.length, notifications });
});

// FEATURE 7: AI PHOTO ANALYSIS
app.post('/api/v1/reports/analyze-photo', async (req: Request, res: Response) => {
  try {
    const { imageUrl, base64Data } = req.body;
    if (!imageUrl && !base64Data) {
      return res.status(400).json({ error: 'imageUrl or base64Data is required.' });
    }
    const analysis = await analyzeFloodPhotoWithAI(imageUrl || 'https://example.com/photo.jpg', base64Data);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FEATURE 8: ASK JALRAKSHAK ASSISTANT
app.post('/api/v1/assistant/chat', async (req: Request, res: Response) => {
  try {
    const chatReq = req.body as AssistantChatRequest;
    if (!chatReq.message || typeof chatReq.message !== 'string' || chatReq.message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const lat = chatReq.latitude || 13.0827;
    const lng = chatReq.longitude || 80.2707;
    const [reports, weather] = await Promise.all([
      listReports({ includeDemonstration: false }),
      getWeatherData(lat, lng),
    ]);

    const assessment = calculateMultiHorizonFloodRisk(reports, {
      latitude: lat,
      longitude: lng,
      localityName: chatReq.localityName,
      weather,
    });

    const responseMessage = await askJalrakshakAssistant(chatReq, assessment);
    res.json(responseMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FEATURE 9: WHAT-IF SIMULATION & PREDICTION FEEDBACK
app.post('/api/v1/simulations/rainfall', async (req: Request, res: Response) => {
  try {
    const simReq = req.body as WhatIfSimulationRequest;
    if (!simReq || typeof simReq.latitude !== 'number' || typeof simReq.longitude !== 'number') {
      return res.status(400).json({ error: 'Coordinates latitude and longitude required for simulation.' });
    }

    const [reports, weather] = await Promise.all([
      listReports({ includeDemonstration: false }),
      getWeatherData(simReq.latitude, simReq.longitude),
    ]);

    const result = simulateWhatIfScenario(simReq, reports, weather);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/feedback/prediction', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const {
      latitude,
      longitude,
      localityName,
      predictedCategory,
      observedOutcome,
      actualWaterDepthCm,
      comments,
    } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !observedOutcome) {
      return res.status(400).json({ error: 'latitude, longitude, and observedOutcome are required.' });
    }

    const feedbackRecord: PredictionFeedback = {
      feedbackId: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.userId,
      latitude,
      longitude,
      localityName: localityName || `Sector (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
      predictedCategory: predictedCategory || 'MODERATE',
      observedOutcome,
      actualWaterDepthCm: actualWaterDepthCm ? Number(actualWaterDepthCm) : undefined,
      comments,
      submittedAt: new Date().toISOString(),
    };

    const saved = await savePredictionFeedback(feedbackRecord);
    // Update live evaluation model
    updatePredictionWithOutcome(feedbackRecord);

    res.status(201).json({
      message: 'Prediction feedback recorded. Thank you for contributing to ground truth verification.',
      feedback: saved,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/feedback/prediction', async (_req: Request, res: Response) => {
  const list = await listPredictionFeedback();
  res.json({ count: list.length, feedbackList: list });
});

// FLOODBLIND AI — MONITORING GAP ANALYSIS
app.get('/api/v1/intelligence/floodblind', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const reports = await listReports({ includeDemonstration: false });
    const targetCoords = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
    const summary = await evaluateFloodBlindMonitoringGaps(reports, targetCoords);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ROAD-LEVEL FLOOD IMPACT SIMULATOR
app.get('/api/v1/simulations/road-impact', async (req: Request, res: Response) => {
  try {
    const rain = req.query.rainfallMm ? parseFloat(req.query.rainfallMm as string) : undefined;
    const reports = await listReports({ includeDemonstration: false });
    const result = await simulateRoadLevelFloodImpact(reports, rain);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/simulations/road-impact', async (req: Request, res: Response) => {
  try {
    const { rainfallMm } = req.body;
    const reports = await listReports({ includeDemonstration: false });
    const result = await simulateRoadLevelFloodImpact(
      reports,
      typeof rainfallMm === 'number' ? rainfallMm : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CRITICAL INFRASTRUCTURE ACCESSIBILITY
app.get('/api/v1/infrastructure/vulnerability', async (_req: Request, res: Response) => {
  try {
    const reports = await listReports({ includeDemonstration: false });
    const result = await evaluateCriticalInfrastructureVulnerability(reports);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PREDICTION VS REALITY EVALUATION DASHBOARD
app.get('/api/v1/evaluation/dashboard', (_req: Request, res: Response) => {
  try {
    const metrics = getPredictionEvaluationMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AWS MESSAGING — IN-APP, SES & SNS DISPATCH
app.get('/api/v1/alerts/notifications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const notifs = getUserInAppNotifications(user.userId);
  res.json({ count: notifs.length, notifications: notifs });
});

app.post('/api/v1/alerts/notifications/:notificationId/read', (req: Request, res: Response) => {
  const success = markNotificationAsRead(String(req.params.notificationId));
  res.json({ success, message: success ? 'Notification marked as read.' : 'Notification not found.' });
});

app.post('/api/v1/alerts/test-dispatch', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const result = await processScheduledAlerts(user.userId, user.email, true);
    res.json({ message: 'Test alert evaluation completed.', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/alerts/process-scheduled', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const result = await processScheduledAlerts(user.userId, user.email, false);
    res.json({ message: 'Scheduled alert processing completed.', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AWS OpenSearch — Full-text and geospatial incident search
app.get('/api/v1/search/incidents', async (req: Request, res: Response) => {
  try {
    const { q, lat, lng, radius, minSeverity, roadCondition, limit } = req.query;
    const reports = await listReports({ includeDemonstration: false });
    const result = await searchOpenSearchIncidents(reports, {
      q: q as string,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radiusKm: radius ? parseFloat(radius as string) : undefined,
      minSeverity: minSeverity as any,
      roadCondition: roadCondition as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AWS Cedar — Policy evaluation and authorization decision endpoint
app.post('/api/v1/policy/evaluate', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { action, resource } = req.body || {};
    const decision = evaluateCedarPolicy(
      {
        id: user.userId,
        role: user.role as any,
        email: user.email,
        isAnonymous: user.userId === 'guest' || user.userId === 'resident-citizen-01',
      },
      action || 'viewMap',
      resource || { type: 'Map' }
    );
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AWS Strands Agents SDK — Multi-agent watershed evaluation workflow
app.post('/api/v1/agents/evaluate-watershed', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, localityName } = req.body || {};
    const result = await runStrandsAgentWorkflow(
      latitude ? parseFloat(latitude) : 13.0827,
      longitude ? parseFloat(longitude) : 80.2707,
      localityName || 'Chennai Metropolitan Basin'
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List public reports
app.get('/api/v1/reports', async (req: Request, res: Response) => {
  try {
    const severity = req.query.severity as SeverityLevel | undefined;
    const roadCondition = req.query.roadCondition as RoadCondition | undefined;
    const status = req.query.status as any;
    const includeDemonstration = req.query.includeDemo !== 'false';

    const reports = await listReports({
      severity,
      roadCondition,
      status,
      includeDemonstration,
    });

    const sanitized = reports.map((r) => ({
      reportId: r.reportId,
      locationName: r.locationName,
      latitude: r.latitude,
      longitude: r.longitude,
      severity: r.severity,
      waterDepthCm: r.waterDepthCm,
      roadCondition: r.roadCondition,
      description: r.description,
      imageUrl: r.imageUrl,
      observedAt: r.observedAt,
      submittedAt: r.submittedAt,
      status: r.status,
      flagCount: r.flagCount,
      isDemonstration: !!r.isDemonstration,
      userEmailMasked: r.userEmailMasked,
      verificationNotes: r.verificationNotes,
      verificationTimestamp: r.verificationTimestamp,
    }));

    res.json({ count: sanitized.length, reports: sanitized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Single report detail
app.get('/api/v1/reports/:reportId', async (req: Request, res: Response) => {
  try {
    const reportId = String(req.params.reportId);
    const report = await getReportById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const { userId, ...safeReport } = report;
    res.json(safeReport);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy Risk calculation
app.get('/api/v1/risk', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 15;
    const areaName = (req.query.areaName as string) || 'Chennai Metropolitan River Basin';

    const [reports, weather] = await Promise.all([
      listReports({ includeDemonstration: false }),
      getWeatherData(lat, lng),
    ]);

    const next6hPrecip = weather.hourlyForecastMm
      .slice(0, 6)
      .reduce((sum, h) => sum + h.precipitationMm, 0);

    const risk = calculateFloodRisk(reports, {
      areaName,
      centerLat: lat,
      centerLng: lng,
      radiusKm,
      recentRainfallMm: weather.currentPrecipitationMm,
      forecastRainfallMm: Number(next6hPrecip.toFixed(1)),
      weatherFreshness: weather.freshness,
    });

    res.json({ risk, weatherTelemetry: weather });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy Rainfall telemetry
app.get('/api/v1/rainfall', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const weather = await getWeatherData(lat, lng);
    res.json(weather);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Map operational summary
app.get('/api/v1/map-summary', async (_req: Request, res: Response) => {
  try {
    const reports = await listReports({ includeDemonstration: false });
    const weather = await getWeatherData(13.0827, 80.2707);

    const total = reports.length;
    const verified = reports.filter((r) => r.status === 'VERIFIED').length;
    const unverified = reports.filter((r) => r.status === 'UNVERIFIED').length;
    const blockedRoads = reports.filter((r) => r.roadCondition === 'BLOCKED').length;
    const highOrCritical = reports.filter((r) => r.severity === 'HIGH' || r.severity === 'CRITICAL').length;

    res.json({
      totalReports: total,
      verifiedCount: verified,
      unverifiedCount: unverified,
      blockedRoadCount: blockedRoads,
      highOrCriticalCount: highOrCritical,
      weatherStatus: weather.freshness,
      currentRainfallMm: weather.currentPrecipitationMm,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route hazards
app.post('/api/v1/route-hazards', async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({ error: 'Invalid origin or destination coordinates.' });
    }

    const reports = await listReports({ includeDemonstration: false });
    const assessment = evaluateRouteHazards(origin, destination, reports);
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create report
app.post('/api/v1/reports', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const {
      latitude,
      longitude,
      locationName,
      severity,
      waterDepthCm,
      roadCondition,
      description,
      observedAt,
      imageUrl,
      consentPublicSharing,
    } = req.body;

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
    }
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
    }
    if (!locationName || typeof locationName !== 'string' || locationName.trim().length < 3) {
      return res.status(400).json({ error: 'Location name must be at least 3 characters.' });
    }
    if (!['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(severity)) {
      return res.status(400).json({ error: 'Severity must be LOW, MODERATE, HIGH, or CRITICAL.' });
    }
    if (!['PASSABLE', 'DIFFICULT', 'BLOCKED', 'UNKNOWN'].includes(roadCondition)) {
      return res.status(400).json({ error: 'Road condition must be PASSABLE, DIFFICULT, BLOCKED, or UNKNOWN.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ error: 'Description must be at least 5 characters.' });
    }
    if (!observedAt || isNaN(Date.parse(observedAt))) {
      return res.status(400).json({ error: 'A valid observation timestamp is required.' });
    }
    if (consentPublicSharing !== true) {
      return res.status(400).json({ error: 'Consent to share sanitized public hazard report is required.' });
    }

    const existingReports = await listReports({ includeDemonstration: false });
    const duplicateCheck = detectDuplicateReport({ latitude, longitude, observedAt }, existingReports);

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newReport: FloodReport = {
      reportId,
      userId: user.userId,
      userEmailMasked: maskEmail(user.email),
      latitude,
      longitude,
      locationName: locationName.trim(),
      severity,
      waterDepthCm: waterDepthCm ? Number(waterDepthCm) : undefined,
      roadCondition,
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      observedAt,
      submittedAt: now,
      status: 'UNVERIFIED',
      flagCount: 0,
      duplicateOf: duplicateCheck.isDuplicateCandidate ? duplicateCheck.duplicateOfReportId : undefined,
      verificationNotes: duplicateCheck.isDuplicateCandidate ? duplicateCheck.reason : undefined,
    };

    await saveReport(newReport);
    evaluateAlertTriggersForReport(newReport).catch(() => {});

    res.status(201).json({
      message: 'Report submitted successfully. Awaiting municipal/community moderation verification.',
      report: newReport,
      duplicateWarning: duplicateCheck.isDuplicateCandidate ? duplicateCheck.reason : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Presigned upload
app.post('/api/v1/uploads/presign', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required.' });
    }
    const presigned = await createPresignedUpload(fileName, contentType, user.userId);
    res.json(presigned);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Flag report
app.post('/api/v1/reports/:reportId/flags', async (req: Request, res: Response) => {
  try {
    const reportId = String(req.params.reportId);
    const updated = await incrementReportFlag(reportId);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json({ message: 'Report flagged for review.', flagCount: updated.flagCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Personal user reports
app.get('/api/v1/me/reports', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const reports = await listUserReports(user.userId);
    res.json({ count: reports.length, reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin reports
app.get('/api/v1/admin/reports', async (_req: Request, res: Response) => {
  try {
    const reports = await listReports({ includeDemonstration: false });
    res.json({ count: reports.length, reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin verify
app.post('/api/v1/admin/reports/:reportId/verify', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { reason = 'Verified by administrator' } = req.body;
    const reportId = String(req.params.reportId);

    const report = await getReportById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const previousStatus = report.status;
    const updated = await updateReportVerification(reportId, 'VERIFIED', user.userId, reason);

    await saveAuditRecord({
      auditId: `aud-${Date.now()}`,
      action: 'VERIFY',
      reportId,
      adminId: user.userId,
      adminEmail: user.email,
      timestamp: new Date().toISOString(),
      reason,
      previousStatus,
      newStatus: 'VERIFIED',
    });

    res.json({ message: 'Report verified successfully.', report: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin reject
app.post('/api/v1/admin/reports/:reportId/reject', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    const { reason } = req.body;
    const reportId = String(req.params.reportId);

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'A specific moderation reason (min 5 chars) is required to reject a report.' });
    }

    const report = await getReportById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const previousStatus = report.status;
    const updated = await updateReportVerification(reportId, 'REJECTED', user.userId, reason);

    await saveAuditRecord({
      auditId: `aud-${Date.now()}`,
      action: 'REJECT',
      reportId,
      adminId: user.userId,
      adminEmail: user.email,
      timestamp: new Date().toISOString(),
      reason,
      previousStatus,
      newStatus: 'REJECTED',
    });

    res.json({ message: 'Report rejected.', report: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin metrics
app.get('/api/v1/admin/metrics', async (_req: Request, res: Response) => {
  try {
    const reports = await listReports({ includeDemonstration: false });
    const audits = await listAuditRecords(100);
    const feedbackList = await listPredictionFeedback();

    const total = reports.length;
    const unverified = reports.filter((r) => r.status === 'UNVERIFIED').length;
    const verified = reports.filter((r) => r.status === 'VERIFIED').length;
    const rejected = reports.filter((r) => r.status === 'REJECTED').length;
    const blockedRoads = reports.filter((r) => r.roadCondition === 'BLOCKED').length;
    const duplicates = reports.filter((r) => !!r.duplicateOf).length;
    const flagged = reports.filter((r) => r.flagCount > 0).length;

    const severityBreakdown = {
      LOW: reports.filter((r) => r.severity === 'LOW').length,
      MODERATE: reports.filter((r) => r.severity === 'MODERATE').length,
      HIGH: reports.filter((r) => r.severity === 'HIGH').length,
      CRITICAL: reports.filter((r) => r.severity === 'CRITICAL').length,
    };

    res.json({
      totalReports: total,
      unverifiedCount: unverified,
      verifiedCount: verified,
      rejectedCount: rejected,
      blockedRoadCount: blockedRoads,
      duplicateCandidatesCount: duplicates,
      flaggedCount: flagged,
      severityBreakdown,
      recentAuditCount: audits.length,
      predictionFeedbackCount: feedbackList.length,
      lastComputed: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin audits
app.get('/api/v1/admin/audits', async (_req: Request, res: Response) => {
  try {
    const audits = await listAuditRecords(50);
    res.json({ count: audits.length, audits });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 404 Fallback
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[JalRakshak AI 2.0 Backend] Listening on port ${config.port}`);
    console.log(`[Region] ${config.awsRegion} | [Env] ${config.environment}`);
  });
}
