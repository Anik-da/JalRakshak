export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type RoadCondition = 'PASSABLE' | 'DIFFICULT' | 'BLOCKED' | 'UNKNOWN';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FloodReport {
  reportId: string;
  userId?: string;
  userEmailMasked?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  severity: SeverityLevel;
  waterDepthCm?: number;
  roadCondition: RoadCondition;
  description: string;
  imageUrl?: string;
  observedAt: string;
  submittedAt: string;
  status: VerificationStatus;
  verifiedBy?: string;
  verificationNotes?: string;
  verificationTimestamp?: string;
  flagCount: number;
  isDemonstration?: boolean;
  duplicateOf?: string;
}

export interface CreateReportInput {
  latitude: number;
  longitude: number;
  locationName: string;
  severity: SeverityLevel;
  waterDepthCm?: number;
  roadCondition: RoadCondition;
  description: string;
  observedAt: string;
  imageUrl?: string;
  consentPublicSharing?: boolean;
}

export interface RiskFactor {
  name: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'WARNING' | 'CRITICAL';
  weight: number;
  description: string;
}

export interface RiskAssessment {
  areaName: string;
  latitude: number;
  longitude: number;
  overallScore: number;
  category: SeverityLevel;
  confidence: ConfidenceLevel;
  explanation: string;
  factors: RiskFactor[];
  activeReportCount: number;
  blockedRoadCount: number;
  recentRainfallMm: number;
  forecastRainfallMm: number;
  calculatedAt: string;
  dataQualityNotes: string[];
}

export interface WeatherData {
  source: string;
  latitude: number;
  longitude: number;
  retrievalTime: string;
  measurementTime: string;
  currentPrecipitationMm: number;
  hourlyForecastMm: Array<{
    time: string;
    precipitationMm: number;
  }>;
  isLive: boolean;
  freshness: 'LIVE' | 'RECENT' | 'STALE' | 'CACHED' | 'FALLBACK';
  unit: string;
}

export interface RouteHazardAssessment {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  distanceKm: number;
  estimatedDurationMin: number;
  safetyStatus: 'CLEAR' | 'CAUTION' | 'HAZARDOUS';
  intersectingHazards: Array<{
    reportId: string;
    locationName: string;
    severity: SeverityLevel;
    roadCondition: RoadCondition;
    distanceToRouteMeters: number;
    verificationStatus: VerificationStatus;
    observedAt: string;
  }>;
  warnings: string[];
  alternativeAvailable: boolean;
  disclaimer: string;
}

export interface AuditRecord {
  auditId: string;
  action: 'VERIFY' | 'REJECT' | 'FLAG' | 'EDIT';
  reportId: string;
  adminId: string;
  adminEmail: string;
  timestamp: string;
  reason: string;
  previousStatus?: VerificationStatus;
  newStatus?: VerificationStatus;
}

export interface AdminMetrics {
  totalReports: number;
  unverifiedCount: number;
  verifiedCount: number;
  rejectedCount: number;
  blockedRoadCount: number;
  duplicateCandidatesCount: number;
  flaggedCount: number;
  severityBreakdown: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
    CRITICAL: number;
  };
  recentAuditCount: number;
  lastComputed: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  token?: string;
}

// ==========================================
// PREDICTIVE FLOOD INTELLIGENCE & HORIZONS
// ==========================================
export type ForecastHorizon = 'NOW' | '1H' | '3H' | '6H' | '24H';

export interface HorizonRiskAssessment {
  horizon: ForecastHorizon;
  timeLabel: string;
  targetTimestamp: string;
  overallScore: number; // 0 - 100
  category: SeverityLevel;
  confidence: ConfidenceLevel;
  projectedPrecipitationMm: number;
  accumulatedPrecipitationMm: number;
  factors: RiskFactor[];
  summary: string;
}

export interface TerrainIndicator {
  elevationMeters: number;
  slopeCategory: 'FLAT_LOWLAND' | 'GENTLE_SLOPE' | 'ELEVATED';
  distanceToNearestWaterbodyMeters: number;
  nearestWaterbodyName: string;
  historicalVulnerabilityIndex: number; // 0 - 100
  drainageCapacityCategory: 'CONSTRAINED' | 'MODERATE' | 'ADEQUATE';
}

export interface WeatherWarning {
  warningId: string;
  district: string;
  state: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  colorCode: string;
  headline: string;
  description: string;
  issuedAt: string;
  validUntil: string;
  issuingAgency: string;
}

export interface BedrockAIExplanation {
  summary: string;
  horizonProgression: string;
  communityEvidenceSynthesis: string;
  missingTelemetry: string;
  recommendedPrecautions: string[];
  uncertaintyStatement: string;
  modelIdentifier: string;
  generatedAt: string;
  isAiGenerated: boolean;
}

export interface MultiHorizonRiskAssessment {
  location: {
    latitude: number;
    longitude: number;
    localityName: string;
    district?: string;
  };
  currentScore: number;
  currentCategory: SeverityLevel;
  overallConfidence: ConfidenceLevel;
  horizons: Record<ForecastHorizon, HorizonRiskAssessment>;
  terrain: TerrainIndicator;
  officialWarnings: WeatherWarning[];
  nearbyActiveReports: Array<{
    reportId: string;
    locationName: string;
    distanceMeters: number;
    severity: SeverityLevel;
    roadCondition: RoadCondition;
    status: VerificationStatus;
    observedAt: string;
  }>;
  weatherTelemetry: WeatherData & {
    accumulated1hMm: number;
    accumulated3hMm: number;
    accumulated6hMm: number;
    accumulated24hMm: number;
    stationName?: string;
    temperatureC?: number;
    humidityPercent?: number;
  };
  aiAnalystExplanation?: BedrockAIExplanation;
  dataFreshness: 'LIVE' | 'RECENT' | 'STALE' | 'CACHED' | 'FALLBACK';
  dataQualityNotes: string[];
  safetyGuidance: string[];
  calculatedAt: string;
}

// ==========================================
// AI PHOTO ANALYSIS
// ==========================================
export interface PhotoAnalysisResult {
  isFloodRelated: boolean;
  confidenceScore: number; // 0 - 1
  detectedIndicators: {
    waterloggingObserved: boolean;
    submergedRoadSurface: boolean;
    vehiclesInundated: boolean;
    pedestrianPathwayObstructed: boolean;
    debrisOrDrainOverflow: boolean;
  };
  estimatedDepthBand: 'DRY_OR_MINIMAL' | 'ANKLE_DEPTH_10_20CM' | 'KNEE_DEPTH_30_50CM' | 'DEEP_ABOVE_50CM' | 'INDETERMINATE';
  plainSummary: string;
  uncertaintyDisclaimer: string;
  analyzedAt: string;
  modelUsed: string;
}

// ==========================================
// ASK JALRAKSHAK ASSISTANT
// ==========================================
export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingSources?: string[];
  dataFreshness?: string;
  uncertaintyNote?: string;
  suggestedFollowUps?: string[];
}

// ==========================================
// PERSONALIZED ALERTS
// ==========================================
export interface UserAlertPreference {
  userId: string;
  email: string;
  phone?: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enableSns: boolean;
  savedLocations: Array<{
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    triggerOnSeverity: SeverityLevel;
    notifyOnOfficialWarnings: boolean;
    notifyOnRoadBlockages: boolean;
  }>;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  updatedAt: string;
}

export interface AlertNotification {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  severity: SeverityLevel;
  type: 'WARNING_ISSUED' | 'RISK_ESCALATED' | 'ROAD_BLOCKED' | 'VERIFIED_REPORT_NEARBY';
  locationName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  isRead: boolean;
  sourceReportId?: string;
}

// ==========================================
// WHAT-IF SIMULATION & PREDICTION FEEDBACK
// ==========================================
export interface WhatIfSimulationRequest {
  latitude: number;
  longitude: number;
  localityName: string;
  rainfallMultiplierPercent: number;
  prolongedRainHours: number;
  simulateRoadBlockage: boolean;
  excludeCommunityReports: boolean;
}

export interface WhatIfSimulationResult {
  simulationId: string;
  isHypothetical: true;
  baselineScore: number;
  baselineCategory: SeverityLevel;
  simulatedScore: number;
  simulatedCategory: SeverityLevel;
  deltaScore: number;
  assumptions: string[];
  horizonForecasts: Record<ForecastHorizon, { score: number; category: SeverityLevel; precipitationMm: number }>;
  disclaimer: string;
  simulatedAt: string;
}

export interface PredictionFeedback {
  feedbackId: string;
  userId: string;
  latitude: number;
  longitude: number;
  localityName: string;
  predictedCategory: SeverityLevel;
  observedOutcome: 'ACTUAL_FLOODING_OCCURRED' | 'MINOR_WATERLOGGING_ONLY' | 'NO_FLOODING_OBSERVED' | 'UNSURE';
  actualWaterDepthCm?: number;
  comments?: string;
  submittedAt: string;
}

// ==========================================
// MAP RISK LAYERS
// ==========================================
export interface RiskZoneLayer {
  zoneId: string;
  zoneName: string;
  center: [number, number];
  radiusMeters: number;
  currentRiskScore: number;
  category: SeverityLevel;
  dominantFactor: string;
  horizons: Record<ForecastHorizon, SeverityLevel>;
}

export interface RainfallObservationPoint {
  stationId: string;
  stationName: string;
  coordinates: [number, number];
  observedMm: number;
  freshness: string;
  source: string;
}

export interface HistoricalHotspot {
  hotspotId: string;
  name: string;
  coordinates: [number, number];
  historicalFrequency: 'ANNUAL_MONSOON' | 'CYCLONE_TRIGGERED' | 'PERSISTENT_CHOKEPOINT';
  averageInundationCm: number;
  knownVulnerabilityReason: string;
}

export interface MapRiskLayersResponse {
  reportsLayer: FloodReport[];
  riskZonesLayer: RiskZoneLayer[];
  observedRainfallLayer: RainfallObservationPoint[];
  forecastRainfallLayer: Array<{
    coordinates: [number, number];
    areaName: string;
    forecast1hMm: number;
    forecast6hMm: number;
    forecast24hMm: number;
  }>;
  historicalHotspotsLayer: HistoricalHotspot[];
  officialWarningsLayer: WeatherWarning[];
  floodBlindGapsLayer?: FloodBlindZone[];
  roadImpactsLayer?: RoadSegmentImpact[];
  criticalFacilitiesLayer?: CriticalFacility[];
  generatedAt: string;
}

// ==========================================
// FLOODBLIND AI — MONITORING GAP & PROACTIVE DETECTION
// ==========================================
export type VerificationPriority = 'URGENT_GROUND_CHECK' | 'MONITORING_SUGGESTED' | 'ADEQUATELY_COVERED';

export interface FloodBlindZone {
  zoneId: string;
  name: string;
  center: [number, number];
  estimatedRiskScore: number;
  estimatedCategory: SeverityLevel;
  groundReportCount: number;
  monitoringGapIndex: number; // 0 - 100: elevated risk with 0 or few ground reports
  status: 'POTENTIAL_RISK_NEEDS_VERIFICATION';
  verificationPriority: VerificationPriority;
  isHistoricalChokepoint: boolean;
  influencingFactors: string[];
  missingTelemetry: string[];
  lastTelemetryUpdate: string;
  dataFreshness: 'LIVE' | 'RECENT' | 'STALE' | 'CACHED' | 'FALLBACK';
  recommendedActions: string[];
}

export interface FloodBlindSummary {
  totalMonitoredZones: number;
  blindSpotsCount: number;
  urgentVerificationCount: number;
  activeGapZones: FloodBlindZone[];
  disclaimer: string;
  generatedAt: string;
}

// ==========================================
// ROAD-LEVEL FLOOD IMPACT SIMULATOR
// ==========================================
export type RoadSegmentRiskStatus =
  | 'CONFIRMED_HAZARD'
  | 'ELEVATED_RISK_ESTIMATED'
  | 'PASSABLE_NORMAL'
  | 'INSUFFICIENT_DATA';

export interface RoadSegmentImpact {
  segmentId: string;
  roadName: string;
  corridor: string;
  coordinates: [number, number][]; // polyline coordinates
  center: [number, number];
  status: RoadSegmentRiskStatus;
  estimatedRiskScore: number;
  elevationMslMeters: number;
  isKnownUnderpassOrLowPoint: boolean;
  nearbyReportCount: number;
  primaryRiskReason: string;
  underlyingDataTimestamp: string;
  suggestedAlternativeRoute?: string;
  evidenceConfidence: ConfidenceLevel;
}

export interface RoadImpactSimulationResult {
  simulationId: string;
  rainfallScenarioMm: number;
  affectedSegmentsCount: number;
  blockedConfirmedCount: number;
  segments: RoadSegmentImpact[];
  summary: string;
  disclaimer: string;
  evaluatedAt: string;
}

// ==========================================
// CRITICAL INFRASTRUCTURE VULNERABILITY
// ==========================================
export type FacilityType = 'HOSPITAL' | 'SCHOOL' | 'EMERGENCY_FIRE' | 'TRANSIT_STATION';
export type AccessStatus = 'ACCESSIBLE' | 'ACCESS_IMPEDED_ESTIMATED' | 'ACCESS_BLOCKED_CONFIRMED' | 'INSUFFICIENT_DATA';

export interface CriticalFacility {
  facilityId: string;
  name: string;
  type: FacilityType;
  coordinates: [number, number];
  nearbyBasinRiskCategory: SeverityLevel;
  accessStatus: AccessStatus;
  accessRoadName: string;
  distanceToNearestHazardMeters: number;
  supportingEvidence: string;
  dataTimestamp: string;
  isEstimate: boolean;
}

export interface CriticalInfrastructureResponse {
  facilities: CriticalFacility[];
  totalFacilities: number;
  impededCount: number;
  blockedCount: number;
  generatedAt: string;
  disclaimer: string;
}

// ==========================================
// PREDICTION VS REALITY EVALUATION
// ==========================================
export interface PredictionEvaluationRecord {
  predictionId: string;
  timestamp: string;
  localityName: string;
  coordinates: [number, number];
  predictedRiskScore: number;
  predictedCategory: SeverityLevel;
  inputsUsed: {
    rainfallMm: number;
    terrainVulnerability: number;
    communityReportsAvailable: number;
  };
  subsequentOutcome: 'CONFIRMED_FLOOD' | 'CONFIRMED_CLEAR' | 'UNVERIFIED_REPORTS_ONLY' | 'INSUFFICIENT_EVALUATION_DATA';
  evaluationResult: 'ACCURATE_ELEVATED' | 'FALSE_ALARM' | 'MISSED_HAZARD' | 'ACCURATE_CLEAR' | 'INSUFFICIENT_DATA';
  evaluatedAt: string;
  notes: string;
}

export interface EvaluationDashboardMetrics {
  totalEvaluated: number;
  accurateElevatedCount: number;
  accurateClearCount: number;
  falseAlarmCount: number;
  missedHazardCount: number;
  insufficientDataCount: number;
  evaluationRecords: PredictionEvaluationRecord[];
  scientificValidationDisclaimer: string;
  lastUpdated: string;
}

// ==========================================
// AWS AUTOMATED MESSAGING SYSTEM (SES / SNS)
// ==========================================
export type NotificationDeliveryStatus =
  | 'CREATED'
  | 'ATTEMPTED'
  | 'CONFIRMED_DELIVERED'
  | 'FAILED'
  | 'SUPPRESSED_QUIET_HOURS'
  | 'SUPPRESSED_DUPLICATE';

export interface DeliveryLog {
  channel: 'IN_APP' | 'EMAIL_SES' | 'SMS_SNS';
  recipient: string;
  status: NotificationDeliveryStatus;
  timestamp: string;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface UserAlertNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  severity: SeverityLevel;
  locationName: string;
  coordinates: [number, number];
  isRead: boolean;
  createdAt: string;
  deliveryLogs: DeliveryLog[];
}

export interface AlertDispatchResult {
  dispatchId: string;
  evaluatedUsersCount: number;
  notificationsCreated: number;
  emailsAttempted: number;
  smsAttempted: number;
  suppressedQuietHours: number;
  suppressedDuplicates: number;
  results: Array<{
    userId: string;
    notificationTitle: string;
    deliveryLogs: DeliveryLog[];
  }>;
}

