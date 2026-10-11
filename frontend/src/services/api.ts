import {
  FloodReport,
  RiskAssessment,
  WeatherData,
  RouteHazardAssessment,
  AdminMetrics,
  AuditRecord,
  SeverityLevel,
  RoadCondition,
  MultiHorizonRiskAssessment,
  WeatherWarning,
  BedrockAIExplanation,
  PhotoAnalysisResult,
  AssistantChatMessage,
  UserAlertPreference,
  AlertNotification,
  WhatIfSimulationRequest,
  WhatIfSimulationResult,
  PredictionFeedback,
  MapRiskLayersResponse,
  FloodBlindSummary,
  RoadImpactSimulationResult,
  CriticalInfrastructureResponse,
  EvaluationDashboardMetrics,
  UserAlertNotification,
  AlertDispatchResult,
} from '../types';
import { getStoredSession } from './cognitoAuth';

const AWS_LIVE_API_BASE_URL = 'https://bzmu87ldv4.execute-api.ap-south-1.amazonaws.com/dev/api/v1';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || AWS_LIVE_API_BASE_URL;

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  if (session?.userId) {
    headers['X-User-Id'] = session.userId;
    headers['X-User-Email'] = session.email;
    headers['X-User-Role'] = session.role;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Public
  getHealth: () => fetchJson<{ status: string; region: string; platform: string }>('/health'),

  // FEATURE 1 & 2: AUTOMATIC LOCATION INTELLIGENCE & MULTI-HORIZON RISK
  getLocationIntelligence: (lat: number = 13.0827, lng: number = 80.2707, locality?: string, radius?: number) => {
    const query = new URLSearchParams();
    query.append('lat', String(lat));
    query.append('lng', String(lng));
    if (locality) query.append('locality', locality);
    if (radius) query.append('radius', String(radius));
    return fetchJson<MultiHorizonRiskAssessment>(`/intelligence/location?${query.toString()}`);
  },

  getForecastIntelligence: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<{
      location: { latitude: number; longitude: number; localityName: string };
      currentScore: number;
      currentCategory: SeverityLevel;
      horizons: any;
      weatherTelemetry: any;
      calculatedAt: string;
    }>(`/intelligence/forecast?lat=${lat}&lng=${lng}`),

  getHistoryIntelligence: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<{
      location: { latitude: number; longitude: number };
      historySnapshots: Array<{ timestamp: string; score: number; category: SeverityLevel; rainfallMm: number; reportCount: number; event: string }>;
      lastUpdated: string;
    }>(`/intelligence/history?lat=${lat}&lng=${lng}`),

  getBedrockExplanation: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<BedrockAIExplanation>(`/intelligence/explanation?lat=${lat}&lng=${lng}`),

  // FEATURE 3: WEATHER & WARNINGS
  getLatestWeather: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<WeatherData & { accumulated1hMm: number; accumulated3hMm: number; accumulated6hMm: number; accumulated24hMm: number }>(
      `/weather/latest?lat=${lat}&lng=${lng}`
    ),

  getWeatherWarnings: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<{ count: number; warnings: WeatherWarning[] }>(`/weather/warnings?lat=${lat}&lng=${lng}`),

  // FEATURE 5: MAP RISK LAYERS
  getMapRiskLayers: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<MapRiskLayersResponse>(`/map/risk-layers?lat=${lat}&lng=${lng}`),

  // FEATURE 6: PERSONALIZED ALERTS
  getAlertPreferences: () => fetchJson<UserAlertPreference>('/alerts/preferences'),

  updateAlertPreferences: (preferences: Partial<UserAlertPreference>) =>
    fetchJson<{ message: string; preferences: UserAlertPreference }>('/alerts/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  getAlertHistory: () => fetchJson<{ count: number; notifications: AlertNotification[] }>('/alerts/history'),

  // FEATURE 7: AI PHOTO ANALYSIS
  analyzePhoto: (imageUrl?: string, base64Data?: string) =>
    fetchJson<PhotoAnalysisResult>('/reports/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, base64Data }),
    }),

  // FEATURE 8: ASK JALRAKSHAK ASSISTANT
  askAssistant: (params: {
    message: string;
    latitude?: number;
    longitude?: number;
    localityName?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) =>
    fetchJson<AssistantChatMessage>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // FEATURE 9: WHAT-IF SIMULATION & PREDICTION FEEDBACK
  runRainfallSimulation: (request: WhatIfSimulationRequest) =>
    fetchJson<WhatIfSimulationResult>('/simulations/rainfall', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  submitPredictionFeedback: (feedback: {
    latitude: number;
    longitude: number;
    localityName?: string;
    predictedCategory: SeverityLevel;
    observedOutcome: 'ACTUAL_FLOODING_OCCURRED' | 'MINOR_WATERLOGGING_ONLY' | 'NO_FLOODING_OBSERVED' | 'UNSURE';
    actualWaterDepthCm?: number;
    comments?: string;
  }) =>
    fetchJson<{ message: string; feedback: PredictionFeedback }>('/feedback/prediction', {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),

  getPredictionFeedbackList: () =>
    fetchJson<{ count: number; feedbackList: PredictionFeedback[] }>('/feedback/prediction'),

  // FLOODBLIND AI — MONITORING GAP ANALYSIS
  getFloodBlindSummary: (lat?: number, lng?: number) => {
    const query = new URLSearchParams();
    if (lat !== undefined) query.append('lat', String(lat));
    if (lng !== undefined) query.append('lng', String(lng));
    return fetchJson<FloodBlindSummary>(`/intelligence/floodblind?${query.toString()}`);
  },

  // ROAD-LEVEL FLOOD IMPACT SIMULATOR
  getRoadImpactSimulation: (rainfallMm?: number) => {
    const query = new URLSearchParams();
    if (rainfallMm !== undefined) query.append('rainfallMm', String(rainfallMm));
    return fetchJson<RoadImpactSimulationResult>(`/simulations/road-impact?${query.toString()}`);
  },

  runRoadImpactSimulation: (rainfallMm: number) =>
    fetchJson<RoadImpactSimulationResult>('/simulations/road-impact', {
      method: 'POST',
      body: JSON.stringify({ rainfallMm }),
    }),

  // CRITICAL INFRASTRUCTURE ACCESSIBILITY
  getCriticalInfrastructure: () =>
    fetchJson<CriticalInfrastructureResponse>('/infrastructure/vulnerability'),

  // PREDICTION VS REALITY EVALUATION DASHBOARD
  getEvaluationDashboard: () =>
    fetchJson<EvaluationDashboardMetrics>('/evaluation/dashboard'),

  // AWS MESSAGING & NOTIFICATIONS
  getInAppNotifications: () =>
    fetchJson<{ count: number; notifications: UserAlertNotification[] }>('/alerts/notifications'),

  markNotificationRead: (notificationId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/alerts/notifications/${notificationId}/read`, {
      method: 'POST',
    }),

  testDispatchAlert: () =>
    fetchJson<{ message: string; result: AlertDispatchResult }>('/alerts/test-dispatch', {
      method: 'POST',
    }),

    processScheduledAlerts: () =>
    fetchJson<{ message: string; result: AlertDispatchResult }>('/alerts/process-scheduled', {
      method: 'POST',
    }),

  // AWS OPENSEARCH FULL-TEXT & GEOSPATIAL SEARCH
  searchIncidents: (params: {
    q?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minSeverity?: SeverityLevel;
    roadCondition?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.lat) query.append('lat', String(params.lat));
    if (params.lng) query.append('lng', String(params.lng));
    if (params.radius) query.append('radius', String(params.radius));
    if (params.minSeverity) query.append('minSeverity', params.minSeverity);
    if (params.roadCondition) query.append('roadCondition', params.roadCondition);
    if (params.limit) query.append('limit', String(params.limit));
    return fetchJson<any>(`/search/incidents?${query.toString()}`);
  },

  // AWS CEDAR AUTHORIZATION POLICY EVALUATION
  evaluateCedarPolicy: (action: string, resource?: any) =>
    fetchJson<any>('/policy/evaluate', {
      method: 'POST',
      body: JSON.stringify({ action, resource }),
    }),

  // AWS STRANDS AGENTS SDK MULTI-AGENT WORKFLOW
  evaluateStrandsAgents: (latitude?: number, longitude?: number, localityName?: string) =>
    fetchJson<any>('/agents/evaluate-watershed', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, localityName }),
    }),



  // BACKWARD-COMPATIBLE EXISTING ENDPOINTS
  getReports: (params?: {
    severity?: SeverityLevel;
    roadCondition?: RoadCondition;
    status?: string;
    includeDemo?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.roadCondition) query.append('roadCondition', params.roadCondition);
    if (params?.status) query.append('status', params.status);
    if (params?.includeDemo !== undefined) query.append('includeDemo', String(params.includeDemo));

    return fetchJson<{ count: number; reports: FloodReport[] }>(`/reports?${query.toString()}`);
  },

  getReportById: (reportId: string) => fetchJson<FloodReport>(`/reports/${reportId}`),

  getRisk: (lat: number = 13.0827, lng: number = 80.2707, radius: number = 15) =>
    fetchJson<{ risk: RiskAssessment; weatherTelemetry: WeatherData }>(
      `/risk?lat=${lat}&lng=${lng}&radius=${radius}`
    ),

  getRainfall: (lat: number = 13.0827, lng: number = 80.2707) =>
    fetchJson<WeatherData>(`/rainfall?lat=${lat}&lng=${lng}`),

  getMapSummary: () =>
    fetchJson<{
      totalReports: number;
      verifiedCount: number;
      unverifiedCount: number;
      blockedRoadCount: number;
      highOrCriticalCount: number;
      weatherStatus: string;
      currentRainfallMm: number;
      lastUpdated: string;
    }>('/map-summary'),

  getRouteHazards: (
    origin: { lat: number; lng: number; name: string },
    destination: { lat: number; lng: number; name: string }
  ) =>
    fetchJson<RouteHazardAssessment>('/route-hazards', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    }),

  // Authenticated
  createReport: (reportData: {
    latitude: number;
    longitude: number;
    locationName: string;
    severity: SeverityLevel;
    waterDepthCm?: number;
    roadCondition: RoadCondition;
    description: string;
    observedAt: string;
    imageUrl?: string;
    consentPublicSharing: boolean;
  }) =>
    fetchJson<{ message: string; report: FloodReport; duplicateWarning?: string | null }>(
      '/reports',
      {
        method: 'POST',
        body: JSON.stringify(reportData),
      }
    ),

  flagReport: (reportId: string) =>
    fetchJson<{ message: string; flagCount: number }>(`/reports/${reportId}/flags`, {
      method: 'POST',
    }),

  getPresignedUploadUrl: (fileName: string, contentType: string) =>
    fetchJson<{
      uploadUrl: string;
      imageUrl: string;
      key: string;
      expiresInSeconds: number;
    }>('/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    }),

  getMyReports: () => fetchJson<{ count: number; reports: FloodReport[] }>('/me/reports'),

  // Admin
  getAdminReports: () => fetchJson<{ count: number; reports: FloodReport[] }>('/admin/reports'),

  adminVerify: (reportId: string, reason: string) =>
    fetchJson<{ message: string; report: FloodReport }>(`/admin/reports/${reportId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  adminReject: (reportId: string, reason: string) =>
    fetchJson<{ message: string; report: FloodReport }>(`/admin/reports/${reportId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getAdminMetrics: () => fetchJson<AdminMetrics>('/admin/metrics'),

  getAdminAudits: () => fetchJson<{ count: number; audits: AuditRecord[] }>('/admin/audits'),
};
