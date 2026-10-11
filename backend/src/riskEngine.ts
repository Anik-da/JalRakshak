import {
  FloodReport,
  RiskAssessment,
  RiskFactor,
  SeverityLevel,
  ConfidenceLevel,
  ForecastHorizon,
  HorizonRiskAssessment,
  MultiHorizonRiskAssessment,
  TerrainIndicator,
  WeatherWarning,
  WhatIfSimulationRequest,
  WhatIfSimulationResult,
} from './types.js';
import { ExtendedWeatherData, getOfficialWeatherWarnings } from './weatherAdapter.js';

export interface RiskEngineOptions {
  areaName?: string;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  recentRainfallMm?: number;
  forecastRainfallMm?: number;
  weatherFreshness?: 'LIVE' | 'RECENT' | 'STALE' | 'CACHED' | 'UNAVAILABLE' | 'FALLBACK';
}

/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Known geographic water bodies & low-lying flood-prone corridors in urban India
 */
interface GeographicAnchor {
  name: string;
  lat: number;
  lng: number;
  type: 'RIVER' | 'LAKE_MARSH' | 'UNDERPASS' | 'COASTAL_BASIN';
  baseElevationM: number;
  vulnerabilityIndex: number; // 0 - 100
  drainage: 'CONSTRAINED' | 'MODERATE' | 'ADEQUATE';
}

const GEOGRAPHIC_ANCHORS: GeographicAnchor[] = [
  // Chennai Met Area
  { name: 'Pallikaranai Marshland & Velachery Basin', lat: 12.934, lng: 80.213, type: 'LAKE_MARSH', baseElevationM: 3.2, vulnerabilityIndex: 88, drainage: 'CONSTRAINED' },
  { name: 'Adyar River Estuary & Kotturpuram', lat: 13.018, lng: 80.245, type: 'RIVER', baseElevationM: 4.1, vulnerabilityIndex: 82, drainage: 'CONSTRAINED' },
  { name: 'Cooum River Central Canal Basin', lat: 13.078, lng: 80.264, type: 'RIVER', baseElevationM: 5.0, vulnerabilityIndex: 78, drainage: 'CONSTRAINED' },
  { name: 'T. Nagar South Usman Road Underpass Corridor', lat: 13.041, lng: 80.234, type: 'UNDERPASS', baseElevationM: 6.8, vulnerabilityIndex: 85, drainage: 'CONSTRAINED' },
  { name: 'Poonamallee High Road Railway Underpass', lat: 13.082, lng: 80.270, type: 'UNDERPASS', baseElevationM: 6.2, vulnerabilityIndex: 76, drainage: 'CONSTRAINED' },
  { name: 'Madipakkam & Kilkattalai Lake Outflow', lat: 12.964, lng: 80.198, type: 'LAKE_MARSH', baseElevationM: 4.5, vulnerabilityIndex: 84, drainage: 'CONSTRAINED' },
  { name: 'Vyasarpadi & Otteri Nullah Lowland Basin', lat: 13.111, lng: 80.258, type: 'COASTAL_BASIN', baseElevationM: 3.8, vulnerabilityIndex: 86, drainage: 'CONSTRAINED' },
  { name: 'Guindy & St. Thomas Mount Ridge (Elevated)', lat: 13.006, lng: 80.201, type: 'COASTAL_BASIN', baseElevationM: 22.0, vulnerabilityIndex: 25, drainage: 'ADEQUATE' },

  // Mumbai Met Area
  { name: 'Mithi River Basin & Kurla SRA Corridor', lat: 19.066, lng: 72.879, type: 'RIVER', baseElevationM: 4.0, vulnerabilityIndex: 90, drainage: 'CONSTRAINED' },
  { name: 'Hindmata Dadar Lowland Subway', lat: 19.018, lng: 72.843, type: 'UNDERPASS', baseElevationM: 5.5, vulnerabilityIndex: 92, drainage: 'CONSTRAINED' },
  { name: 'Milan Subway Santa Cruz', lat: 19.083, lng: 72.842, type: 'UNDERPASS', baseElevationM: 6.0, vulnerabilityIndex: 88, drainage: 'CONSTRAINED' },

  // Bengaluru Met Area
  { name: 'Bellandur & Varthur Lake Valley Spillway', lat: 12.935, lng: 77.674, type: 'LAKE_MARSH', baseElevationM: 885.0, vulnerabilityIndex: 80, drainage: 'CONSTRAINED' },
  { name: 'Manyata Tech Park Stormwater Corridor', lat: 13.047, lng: 77.620, type: 'COASTAL_BASIN', baseElevationM: 898.0, vulnerabilityIndex: 75, drainage: 'CONSTRAINED' },
];

/**
 * Estimates terrain indicators (elevation, slope, waterbody proximity, historical vulnerability)
 */
export function estimateTerrainIndicators(lat: number, lon: number): TerrainIndicator {
  let closestAnchor = GEOGRAPHIC_ANCHORS[0];
  let minDistanceKm = 9999;

  for (const anchor of GEOGRAPHIC_ANCHORS) {
    const d = calculateDistanceKm(lat, lon, anchor.lat, anchor.lng);
    if (d < minDistanceKm) {
      minDistanceKm = d;
      closestAnchor = anchor;
    }
  }

  const distanceMeters = Math.round(minDistanceKm * 1000);

  // If near a known anchor (< 8 km)
  if (minDistanceKm < 8.0) {
    const proximityFactor = Math.max(0, 1 - minDistanceKm / 8.0);
    const estimatedElevation = Number((closestAnchor.baseElevationM + (1 - proximityFactor) * 5).toFixed(1));
    const historicalVulnerability = Math.round(closestAnchor.vulnerabilityIndex * proximityFactor + 25 * (1 - proximityFactor));
    
    return {
      elevationMeters: estimatedElevation,
      slopeCategory: estimatedElevation < 6 ? 'FLAT_LOWLAND' : estimatedElevation < 18 ? 'GENTLE_SLOPE' : 'ELEVATED',
      distanceToNearestWaterbodyMeters: distanceMeters,
      nearestWaterbodyName: closestAnchor.name,
      historicalVulnerabilityIndex: historicalVulnerability,
      drainageCapacityCategory: closestAnchor.drainage,
    };
  }

  // Generalized fallback for general terrain
  return {
    elevationMeters: 14.5,
    slopeCategory: 'GENTLE_SLOPE',
    distanceToNearestWaterbodyMeters: Math.min(distanceMeters, 2500),
    nearestWaterbodyName: 'Regional Urban Drainage Outfall',
    historicalVulnerabilityIndex: 35,
    drainageCapacityCategory: 'MODERATE',
  };
}

/**
 * Deterministic baseline risk calculation (Original backward-compatible function)
 */
export function calculateFloodRisk(
  reports: FloodReport[],
  options: RiskEngineOptions = {}
): RiskAssessment {
  const {
    areaName = 'Monsoon Monitoring Sector',
    centerLat = 13.0827,
    centerLng = 80.2707,
    radiusKm = 15,
    recentRainfallMm = 0,
    forecastRainfallMm = 0,
    weatherFreshness = 'RECENT',
  } = options;

  const now = Date.now();
  const factors: RiskFactor[] = [];
  const dataQualityNotes: string[] = [];

  // Filter out rejected reports, duplicates, or reports outside radius
  const validReports = reports.filter((r) => {
    if (r.status === 'REJECTED') return false;
    if (r.duplicateOf) return false;
    if (options.centerLat && options.centerLng) {
      const dist = calculateDistanceKm(options.centerLat, options.centerLng, r.latitude, r.longitude);
      if (dist > radiusKm) return false;
    }
    return true;
  });

  if (validReports.length === 0 && recentRainfallMm === 0 && forecastRainfallMm === 0) {
    return {
      areaName,
      latitude: centerLat,
      longitude: centerLng,
      overallScore: 0,
      category: 'LOW',
      confidence: 'LOW',
      explanation: 'Insufficient recent evidence. No active community flood hazard reports or heavy rainfall registered.',
      factors: [
        {
          name: 'Community Observations',
          impact: 'NEUTRAL',
          weight: 0,
          description: 'No active resident reports in this sector within observation window.',
        },
      ],
      activeReportCount: 0,
      blockedRoadCount: 0,
      recentRainfallMm,
      forecastRainfallMm,
      calculatedAt: new Date().toISOString(),
      dataQualityNotes: ['Baseline low-risk assumption due to absence of verified hazard telemetry.'],
    };
  }

  let baseScore = 0;
  let blockedCount = 0;
  let verifiedCount = 0;

  const severityWeights: Record<SeverityLevel, number> = {
    LOW: 15,
    MODERATE: 35,
    HIGH: 65,
    CRITICAL: 85,
  };

  let maxObservationScore = 0;
  let strongestReportLocation = '';

  for (const report of validReports) {
    const ageHours = Math.max(0, (now - new Date(report.observedAt).getTime()) / (1000 * 60 * 60));
    let decayFactor = 1.0;
    if (ageHours > 24) decayFactor = 0.1;
    else if (ageHours > 12) decayFactor = 0.3;
    else if (ageHours > 6) decayFactor = 0.6;
    else if (ageHours > 3) decayFactor = 0.85;

    const verificationMultiplier = report.status === 'VERIFIED' ? 1.0 : 0.8;
    if (report.status === 'VERIFIED') verifiedCount++;

    const reportScore = severityWeights[report.severity] * decayFactor * verificationMultiplier;
    if (reportScore > maxObservationScore) {
      maxObservationScore = reportScore;
      strongestReportLocation = report.locationName;
    }

    if (report.roadCondition === 'BLOCKED') {
      blockedCount++;
    }
  }

  baseScore += maxObservationScore;

  if (validReports.length > 0) {
    factors.push({
      name: 'Primary Observation Anchor',
      impact: maxObservationScore > 50 ? 'WARNING' : 'NEUTRAL',
      weight: Math.round(maxObservationScore),
      description: `Highest active hazard report (${strongestReportLocation || 'local road'}) provides baseline risk of ${Math.round(maxObservationScore)} pts.`,
    });
  }

  const corroborationReports = Math.min(validReports.length - 1, 5);
  if (corroborationReports > 0) {
    const corroborationBonus = corroborationReports * 5;
    baseScore += corroborationBonus;
    factors.push({
      name: 'Corroborating Community Reports',
      impact: 'WARNING',
      weight: corroborationBonus,
      description: `${corroborationReports} additional independent reports confirm waterlogging conditions across neighbouring roads.`,
    });
  }

  if (blockedCount > 0) {
    const blockedPenalty = Math.min(blockedCount * 8, 20);
    baseScore += blockedPenalty;
    factors.push({
      name: 'Critical Road Inundation',
      impact: 'CRITICAL',
      weight: blockedPenalty,
      description: `${blockedCount} critical road passage(s) reported completely impassable due to deep floodwater.`,
    });
  }

  if (recentRainfallMm > 0) {
    let rainImpact = 0;
    if (recentRainfallMm >= 75) rainImpact = 25;
    else if (recentRainfallMm >= 35) rainImpact = 18;
    else if (recentRainfallMm >= 15) rainImpact = 10;
    else rainImpact = 4;

    baseScore += rainImpact;
    factors.push({
      name: 'Accumulated Rainfall (Past 6h)',
      impact: rainImpact >= 18 ? 'WARNING' : 'NEUTRAL',
      weight: rainImpact,
      description: `Meteorological telemetry recorded ${recentRainfallMm}mm rainfall in the sector (${weatherFreshness.toLowerCase()} data source).`,
    });
  }

  if (forecastRainfallMm > 20) {
    const forecastImpact = Math.min(10, Math.round((forecastRainfallMm / 50) * 10));
    baseScore += forecastImpact;
    factors.push({
      name: 'Imminent Precipitation Forecast',
      impact: 'WARNING',
      weight: forecastImpact,
      description: `Expected precipitation of ${forecastRainfallMm}mm over next 6 hours elevates probability of further surface runoff.`,
    });
  }

  const overallScore = Math.min(100, Math.max(0, Math.round(baseScore)));

  let category: SeverityLevel = 'LOW';
  if (overallScore >= 75) category = 'CRITICAL';
  else if (overallScore >= 50) category = 'HIGH';
  else if (overallScore >= 25) category = 'MODERATE';
  else category = 'LOW';

  let confidence: ConfidenceLevel = 'LOW';
  if (validReports.length >= 3 && (verifiedCount >= 1 || recentRainfallMm > 0)) {
    confidence = 'HIGH';
  } else if (validReports.length >= 1 || recentRainfallMm > 15) {
    confidence = 'MEDIUM';
  }

  if (verifiedCount === 0 && validReports.length > 0) {
    dataQualityNotes.push('Reports are crowd-sourced and await official municipal or community verification.');
  }
  if (weatherFreshness === 'STALE' || weatherFreshness === 'UNAVAILABLE' || weatherFreshness === 'FALLBACK') {
    dataQualityNotes.push('Environmental rainfall telemetry is currently running on cached or limited station readings.');
  }

  const explanation = `${category} flood risk (${overallScore}/100) estimated with ${confidence.toLowerCase()} confidence based on ${validReports.length} active report(s)${blockedCount > 0 ? `, ${blockedCount} blocked road(s)` : ''}${recentRainfallMm > 0 ? `, and ${recentRainfallMm}mm recent rainfall` : ''}.`;

  return {
    areaName,
    latitude: centerLat,
    longitude: centerLng,
    overallScore,
    category,
    confidence,
    explanation,
    factors,
    activeReportCount: validReports.length,
    blockedRoadCount: blockedCount,
    recentRainfallMm,
    forecastRainfallMm,
    calculatedAt: new Date().toISOString(),
    dataQualityNotes,
  };
}

/**
 * Score mapper helper
 */
function scoreToCategory(score: number): SeverityLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

/**
 * Calculates Hyperlocal Predictive Multi-Horizon Flood Risk
 * 
 * CENTRAL INNOVATION:
 * Proactively estimates flood risk using available weather forecasts, terrain indicators,
 * official meteorological warnings, and geographic drainage factors,
 * EVEN WHEN NOBODY HAS REPORTED FLOODING AT THAT LOCATION.
 */
export function calculateMultiHorizonFloodRisk(
  reports: FloodReport[],
  options: {
    latitude: number;
    longitude: number;
    localityName?: string;
    weather: ExtendedWeatherData;
    radiusKm?: number;
  }
): MultiHorizonRiskAssessment {
  const { latitude, longitude, weather, radiusKm = 10 } = options;
  const localityName = options.localityName || `Locality (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;

  const terrain = estimateTerrainIndicators(latitude, longitude);
  const warnings = getOfficialWeatherWarnings(latitude, longitude);

  // Find nearby reports within search radius
  const nearbyReportsWithDist = reports
    .filter((r) => r.status !== 'REJECTED' && !r.duplicateOf)
    .map((r) => ({
      report: r,
      distanceMeters: Math.round(calculateDistanceKm(latitude, longitude, r.latitude, r.longitude) * 1000),
    }))
    .filter((item) => item.distanceMeters <= radiusKm * 1000)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const nearbyActiveReports = nearbyReportsWithDist.slice(0, 8).map((item) => ({
    reportId: item.report.reportId,
    locationName: item.report.locationName,
    distanceMeters: item.distanceMeters,
    severity: item.report.severity,
    roadCondition: item.report.roadCondition,
    status: item.report.status,
    observedAt: item.report.observedAt,
  }));

  // Helper to compute horizon scores
  const horizons: Record<ForecastHorizon, HorizonRiskAssessment> = {
    NOW: computeHorizonRisk({
      horizon: 'NOW',
      timeLabel: 'Current Conditions',
      targetTimestamp: new Date().toISOString(),
      precipMm: weather.currentPrecipitationMm,
      accumulatedMm: weather.accumulated1hMm,
      terrain,
      warnings,
      nearbyReportsWithDist,
      isForecast: false,
    }),
    '1H': computeHorizonRisk({
      horizon: '1H',
      timeLabel: 'Next 1 Hour',
      targetTimestamp: new Date(Date.now() + 3600 * 1000).toISOString(),
      precipMm: weather.accumulated1hMm,
      accumulatedMm: weather.accumulated1hMm,
      terrain,
      warnings,
      nearbyReportsWithDist,
      isForecast: true,
    }),
    '3H': computeHorizonRisk({
      horizon: '3H',
      timeLabel: 'Next 3 Hours',
      targetTimestamp: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      precipMm: weather.accumulated3hMm,
      accumulatedMm: weather.accumulated3hMm,
      terrain,
      warnings,
      nearbyReportsWithDist,
      isForecast: true,
    }),
    '6H': computeHorizonRisk({
      horizon: '6H',
      timeLabel: 'Next 6 Hours',
      targetTimestamp: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      precipMm: weather.accumulated6hMm,
      accumulatedMm: weather.accumulated6hMm,
      terrain,
      warnings,
      nearbyReportsWithDist,
      isForecast: true,
    }),
    '24H': computeHorizonRisk({
      horizon: '24H',
      timeLabel: 'Next 24 Hours',
      targetTimestamp: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      precipMm: weather.accumulated24hMm,
      accumulatedMm: weather.accumulated24hMm,
      terrain,
      warnings,
      nearbyReportsWithDist,
      isForecast: true,
    }),
  };

  const currentScore = horizons.NOW.overallScore;
  const currentCategory = horizons.NOW.category;

  // Determine overall confidence
  let overallConfidence: ConfidenceLevel = 'LOW';
  if (nearbyReportsWithDist.length >= 2 && weather.freshness === 'LIVE') {
    overallConfidence = 'HIGH';
  } else if (weather.freshness === 'LIVE' || weather.freshness === 'RECENT' || nearbyReportsWithDist.length >= 1) {
    overallConfidence = 'MEDIUM';
  }

  // Data quality notes & caveats
  const dataQualityNotes: string[] = [];
  if (nearbyReportsWithDist.length === 0) {
    dataQualityNotes.push('No ground community reports present in this zone. Assessment is proactively calculated from meteorological models and terrain topography.');
  }
  if (weather.freshness === 'STALE' || weather.freshness === 'FALLBACK') {
    dataQualityNotes.push('Environmental precipitation telemetry is utilizing cached or regional station fallback.');
  }
  dataQualityNotes.push('Estimated flood risk reflects localized runoff propensity, not guaranteed street-level ponding depth.');

  // Safety guidance tailored to conditions
  const safetyGuidance: string[] = [];
  if (currentCategory === 'CRITICAL' || horizons['3H'].category === 'CRITICAL') {
    safetyGuidance.push('Avoid all non-essential road travel. Do not drive or walk through standing floodwater of unknown depth.');
    safetyGuidance.push('Move sensitive electricals and vehicles to elevated ground away from low-lying basement corridors.');
    safetyGuidance.push('Monitor official municipal district alerts and state emergency helpline bulletins.');
  } else if (currentCategory === 'HIGH' || horizons['3H'].category === 'HIGH') {
    safetyGuidance.push('Exercise strong caution near underpasses, canal bridges, and stormwater drains.');
    safetyGuidance.push('Plan alternate higher-elevation routes if commuting through identified low-lying basins.');
  } else if (currentCategory === 'MODERATE') {
    safetyGuidance.push('Stay observant for rapid water accumulation during sudden localized downpours.');
    safetyGuidance.push('Verify road passage conditions before traveling through low-elevation service lanes.');
  } else {
    safetyGuidance.push('Conditions currently normal. Maintain awareness of monsoon weather forecasts.');
  }

  return {
    location: {
      latitude,
      longitude,
      localityName,
      district: warnings[0]?.district,
    },
    currentScore,
    currentCategory,
    overallConfidence,
    horizons,
    terrain,
    officialWarnings: warnings,
    nearbyActiveReports,
    weatherTelemetry: weather,
    dataFreshness: weather.freshness,
    dataQualityNotes,
    safetyGuidance,
    calculatedAt: new Date().toISOString(),
  };
}

interface HorizonCalculationParams {
  horizon: ForecastHorizon;
  timeLabel: string;
  targetTimestamp: string;
  precipMm: number;
  accumulatedMm: number;
  terrain: TerrainIndicator;
  warnings: WeatherWarning[];
  nearbyReportsWithDist: Array<{ report: FloodReport; distanceMeters: number }>;
  isForecast: boolean;
}

function computeHorizonRisk(params: HorizonCalculationParams): HorizonRiskAssessment {
  const { horizon, timeLabel, targetTimestamp, precipMm, accumulatedMm, terrain, warnings, nearbyReportsWithDist, isForecast } = params;
  let score = 0;
  const factors: RiskFactor[] = [];

  // 1. Terrain Vulnerability Base (0 - 25 points)
  // Low elevation + constrained drainage + proximity to waterbodies creates structural vulnerability
  let terrainPoints = 0;
  if (terrain.elevationMeters < 5.0) terrainPoints += 12;
  else if (terrain.elevationMeters < 10.0) terrainPoints += 6;

  if (terrain.drainageCapacityCategory === 'CONSTRAINED') terrainPoints += 8;
  else if (terrain.drainageCapacityCategory === 'MODERATE') terrainPoints += 3;

  if (terrain.distanceToNearestWaterbodyMeters < 800) terrainPoints += 5;

  score += terrainPoints;
  if (terrainPoints > 10) {
    factors.push({
      name: 'Terrain & Drainage Susceptibility',
      impact: 'WARNING',
      weight: terrainPoints,
      description: `Low elevation (${terrain.elevationMeters}m MSL) and constrained drainage in the ${terrain.nearestWaterbodyName} watershed naturally increases runoff stagnation.`,
    });
  } else {
    factors.push({
      name: 'Topographic Baseline',
      impact: 'NEUTRAL',
      weight: terrainPoints,
      description: `Elevated or moderate slope gradient (${terrain.elevationMeters}m MSL) provides baseline gravitational surface drainage.`,
    });
  }

  // 2. Meteorological Precipitation Contribution (0 - 45 points)
  let rainPoints = 0;
  if (accumulatedMm >= 75) rainPoints = 42; // Very heavy cloudburst
  else if (accumulatedMm >= 40) rainPoints = 32; // Heavy rainfall
  else if (accumulatedMm >= 20) rainPoints = 22; // Moderate to heavy
  else if (accumulatedMm >= 10) rainPoints = 14; // Moderate showers
  else if (accumulatedMm >= 3) rainPoints = 7; // Light rain
  else if (accumulatedMm > 0) rainPoints = 3;

  score += rainPoints;
  if (rainPoints >= 20) {
    factors.push({
      name: isForecast ? `Projected Precipitation (${horizon})` : 'Current Precipitation Intensity',
      impact: 'CRITICAL',
      weight: rainPoints,
      description: `${accumulatedMm}mm ${isForecast ? 'forecast accumulated rainfall' : 'observed precipitation'} exceeds standard urban drainage absorption thresholds.`,
    });
  } else if (rainPoints > 0) {
    factors.push({
      name: isForecast ? `Forecast Rainfall (${horizon})` : 'Observed Rainfall',
      impact: 'NEUTRAL',
      weight: rainPoints,
      description: `${accumulatedMm}mm rainfall expected over observation window.`,
    });
  }

  // 3. Official Meteorological Warning Multiplier (0 - 15 points)
  const highestWarning = warnings.find((w) => w.severity === 'RED') || warnings.find((w) => w.severity === 'ORANGE') || warnings.find((w) => w.severity === 'YELLOW');
  if (highestWarning) {
    let warnPoints = 0;
    if (highestWarning.severity === 'RED') warnPoints = 15;
    else if (highestWarning.severity === 'ORANGE') warnPoints = 10;
    else if (highestWarning.severity === 'YELLOW') warnPoints = 5;

    score += warnPoints;
    factors.push({
      name: 'Official Meteorological Warning',
      impact: highestWarning.severity === 'RED' || highestWarning.severity === 'ORANGE' ? 'WARNING' : 'NEUTRAL',
      weight: warnPoints,
      description: `${highestWarning.issuingAgency} has issued an active ${highestWarning.severity} alert (${highestWarning.headline}).`,
    });
  }

  // 4. Ground Hazard Reports (Proximity Decay) (0 - 35 points)
  if (nearbyReportsWithDist.length > 0) {
    let reportScore = 0;
    let closestBlocked = false;

    for (const item of nearbyReportsWithDist) {
      const distKm = item.distanceMeters / 1000;
      // Proximity decay factor: closer reports weigh significantly higher
      const proxWeight = Math.max(0.1, 1 - distKm / 10);
      const sevPoints = item.report.severity === 'CRITICAL' ? 30 : item.report.severity === 'HIGH' ? 22 : item.report.severity === 'MODERATE' ? 12 : 5;
      const verif = item.report.status === 'VERIFIED' ? 1.0 : 0.8;

      const contribution = sevPoints * proxWeight * verif;
      if (contribution > reportScore) {
        reportScore = contribution;
      }
      if (item.report.roadCondition === 'BLOCKED' && distKm < 3.0) {
        closestBlocked = true;
      }
    }

    if (closestBlocked) reportScore += 8;

    const roundedReportScore = Math.min(35, Math.round(reportScore));
    score += roundedReportScore;

    factors.push({
      name: 'Nearby Community Observations',
      impact: roundedReportScore > 18 ? 'CRITICAL' : 'WARNING',
      weight: roundedReportScore,
      description: `${nearbyReportsWithDist.length} active flood report(s) confirmed within sector (closest: ${nearbyReportsWithDist[0].distanceMeters}m away).`,
    });
  }

  const overallScore = Math.min(100, Math.max(0, Math.round(score)));
  const category = scoreToCategory(overallScore);

  let confidence: ConfidenceLevel = 'LOW';
  if (nearbyReportsWithDist.length >= 2 || (accumulatedMm > 15 && terrainPoints > 8)) {
    confidence = 'HIGH';
  } else if (accumulatedMm > 5 || nearbyReportsWithDist.length >= 1) {
    confidence = 'MEDIUM';
  }

  const summary = `${category} flood risk (${overallScore}/100) estimated for ${timeLabel.toLowerCase()} based on ${accumulatedMm}mm precipitation, ${terrain.drainageCapacityCategory.toLowerCase()} drainage capacity, and ${nearbyReportsWithDist.length} nearby ground observation(s).`;

  return {
    horizon,
    timeLabel,
    targetTimestamp,
    overallScore,
    category,
    confidence,
    projectedPrecipitationMm: precipMm,
    accumulatedPrecipitationMm: accumulatedMm,
    factors,
    summary,
  };
}

/**
 * Executes a hypothetical What-If Simulation
 */
export function simulateWhatIfScenario(
  request: WhatIfSimulationRequest,
  baseReports: FloodReport[],
  weather: ExtendedWeatherData
): WhatIfSimulationResult {
  const { latitude, longitude, localityName, rainfallMultiplierPercent, prolongedRainHours, simulateRoadBlockage, excludeCommunityReports } = request;

  // Calculate baseline
  const baseline = calculateMultiHorizonFloodRisk(baseReports, { latitude, longitude, localityName, weather });

  // Synthesize modified weather
  const multiplier = 1 + (rainfallMultiplierPercent || 0) / 100;
  const prolongedBonusMm = (prolongedRainHours || 0) * 8.0;

  const modifiedWeather: ExtendedWeatherData = {
    ...weather,
    currentPrecipitationMm: Number((weather.currentPrecipitationMm * multiplier).toFixed(1)),
    accumulated1hMm: Number(((weather.accumulated1hMm * multiplier) + (prolongedRainHours > 0 ? 5 : 0)).toFixed(1)),
    accumulated3hMm: Number(((weather.accumulated3hMm * multiplier) + prolongedBonusMm * 0.5).toFixed(1)),
    accumulated6hMm: Number(((weather.accumulated6hMm * multiplier) + prolongedBonusMm).toFixed(1)),
    accumulated24hMm: Number(((weather.accumulated24hMm * multiplier) + prolongedBonusMm * 1.5).toFixed(1)),
  };

  // Modify reports according to simulation options
  let modifiedReports: FloodReport[] = excludeCommunityReports ? [] : [...baseReports];
  if (simulateRoadBlockage) {
    modifiedReports.push({
      reportId: `sim-blockage-${Date.now()}`,
      userId: 'simulation-engine',
      userEmailMasked: 's***@sim.local',
      latitude,
      longitude,
      locationName: localityName,
      severity: 'CRITICAL',
      roadCondition: 'BLOCKED',
      description: 'Hypothetical simulated road blockage due to deep stormwater overflow.',
      observedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'VERIFIED',
      flagCount: 0,
      isDemonstration: true,
    });
  }

  const simulated = calculateMultiHorizonFloodRisk(modifiedReports, { latitude, longitude, localityName, weather: modifiedWeather });

  const assumptions: string[] = [
    `Rainfall adjusted by ${rainfallMultiplierPercent >= 0 ? '+' : ''}${rainfallMultiplierPercent}%`,
  ];
  if (prolongedRainHours > 0) assumptions.push(`Sustained downpour continuing for ${prolongedRainHours} additional hour(s) (+${prolongedBonusMm}mm runoff)`);
  if (simulateRoadBlockage) assumptions.push('Critical road artery assumed completely inundated and blocked');
  if (excludeCommunityReports) assumptions.push('Zero community hazard observations (proactive model-only testing)');

  const horizonForecasts: Record<ForecastHorizon, { score: number; category: SeverityLevel; precipitationMm: number }> = {
    NOW: { score: simulated.horizons.NOW.overallScore, category: simulated.horizons.NOW.category, precipitationMm: modifiedWeather.currentPrecipitationMm },
    '1H': { score: simulated.horizons['1H'].overallScore, category: simulated.horizons['1H'].category, precipitationMm: modifiedWeather.accumulated1hMm },
    '3H': { score: simulated.horizons['3H'].overallScore, category: simulated.horizons['3H'].category, precipitationMm: modifiedWeather.accumulated3hMm },
    '6H': { score: simulated.horizons['6H'].overallScore, category: simulated.horizons['6H'].category, precipitationMm: modifiedWeather.accumulated6hMm },
    '24H': { score: simulated.horizons['24H'].overallScore, category: simulated.horizons['24H'].category, precipitationMm: modifiedWeather.accumulated24hMm },
  };

  return {
    simulationId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isHypothetical: true,
    baselineScore: baseline.currentScore,
    baselineCategory: baseline.currentCategory,
    simulatedScore: simulated.currentScore,
    simulatedCategory: simulated.currentCategory,
    deltaScore: simulated.currentScore - baseline.currentScore,
    assumptions,
    horizonForecasts,
    disclaimer: 'This simulation represents an exploratory hypothetical model calculation for disaster preparedness and municipal stress-testing. It is NOT an official meteorological weather forecast.',
    simulatedAt: new Date().toISOString(),
  };
}
