import {
  FloodReport,
  RoadSegmentImpact,
  RoadImpactSimulationResult,
  ConfidenceLevel,
} from './types.js';
import { getExtendedWeatherTelemetry } from './weatherAdapter.js';

interface ArterialRoadDefinition {
  segmentId: string;
  roadName: string;
  corridor: string;
  coordinates: [number, number][];
  center: [number, number];
  elevationMslMeters: number;
  drainageThresholdMm: number; // rainfall mm over 3h that triggers waterlogging
  isKnownUnderpassOrLowPoint: boolean;
  alternativeRouteName?: string;
  hasReliableTerrainData: boolean;
}

// Major urban arterials and transit corridors with realistic geometries
const MONITORED_ARTERIAL_ROADS: ArterialRoadDefinition[] = [
  {
    segmentId: 'rd-usman-subway',
    roadName: 'South Usman Road & Duraisamy Subway',
    corridor: 'T. Nagar Commercial Radial',
    coordinates: [
      [13.045, 80.231],
      [13.0418, 80.2341],
      [13.037, 80.236],
    ],
    center: [13.0418, 80.2341],
    elevationMslMeters: 6.2,
    drainageThresholdMm: 22.0,
    isKnownUnderpassOrLowPoint: true,
    alternativeRouteName: 'Elevated T. Nagar Flyover ➔ Venkatanarayana Road',
    hasReliableTerrainData: true,
  },
  {
    segmentId: 'rd-velachery-bypass',
    roadName: 'Velachery 100ft Bypass Road',
    corridor: 'South Basin Transit Link',
    coordinates: [
      [12.985, 80.215],
      [12.978, 80.219],
      [12.9715, 80.224],
    ],
    center: [12.978, 80.219],
    elevationMslMeters: 5.4,
    drainageThresholdMm: 25.0,
    isKnownUnderpassOrLowPoint: true,
    alternativeRouteName: 'Taramani Link Road ➔ SRP Tools OMR Bypass',
    hasReliableTerrainData: true,
  },
  {
    segmentId: 'rd-perambur-rail',
    roadName: 'Perambur High Road Railway Underpass',
    corridor: 'North Trunk Transit',
    coordinates: [
      [13.113, 80.241],
      [13.1098, 80.2435],
      [13.106, 80.246],
    ],
    center: [13.1098, 80.2435],
    elevationMslMeters: 4.8,
    drainageThresholdMm: 18.0,
    isKnownUnderpassOrLowPoint: true,
    alternativeRouteName: 'Stephenson Road Flyover ➔ Cooks Road',
    hasReliableTerrainData: true,
  },
  {
    segmentId: 'rd-gst-kathipara',
    roadName: 'GST Road Kathipara Surface Incline',
    corridor: 'Airport Arterial Trunk',
    coordinates: [
      [13.012, 80.201],
      [13.0067, 80.204],
      [13.001, 80.207],
    ],
    center: [13.0067, 80.204],
    elevationMslMeters: 16.5,
    drainageThresholdMm: 55.0,
    isKnownUnderpassOrLowPoint: false,
    alternativeRouteName: 'Kathipara Grade Separator (Upper Tier Level)',
    hasReliableTerrainData: true,
  },
  {
    segmentId: 'rd-omr-karapakkam',
    roadName: 'OMR IT Expressway Karapakkam Stretch',
    corridor: 'Coastal IT Expressway',
    coordinates: [
      [12.925, 80.231],
      [12.918, 80.233],
      [12.911, 80.236],
    ],
    center: [12.918, 80.233],
    elevationMslMeters: 7.8,
    drainageThresholdMm: 35.0,
    isKnownUnderpassOrLowPoint: false,
    alternativeRouteName: 'Medavakkam-Sholinganallur Radial Road',
    hasReliableTerrainData: true,
  },
  {
    segmentId: 'rd-mount-poonamallee',
    roadName: 'Mount-Poonamallee Road Ramapuram Basin',
    corridor: 'West Arterial Link',
    coordinates: [
      [13.038, 80.178],
      [13.032, 80.181],
      [13.025, 80.185],
    ],
    center: [13.032, 80.181],
    elevationMslMeters: 8.5,
    drainageThresholdMm: 30.0,
    isKnownUnderpassOrLowPoint: false,
    alternativeRouteName: 'Porur Outer Bypass ➔ Kattupakkam Highway',
    hasReliableTerrainData: true,
  },
  {
    segmentId: 'rd-peripheral-sector9',
    roadName: 'Outer Sector 9 Unmapped Feeder Road',
    corridor: 'Semi-Urban Peripheral Link',
    coordinates: [
      [13.145, 80.182],
      [13.141, 80.186],
    ],
    center: [13.141, 80.186],
    elevationMslMeters: 0,
    drainageThresholdMm: 0,
    isKnownUnderpassOrLowPoint: false,
    hasReliableTerrainData: false, // Explicitly simulates unmapped/insufficient data segment
  },
];

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Road-Level Flood Impact Simulator:
 * Estimates which arterial road segments and underpasses may suffer waterlogging
 * under specified or forecast rainfall scenarios.
 */
export async function simulateRoadLevelFloodImpact(
  reports: FloodReport[],
  rainfallScenarioMm?: number
): Promise<RoadImpactSimulationResult> {
  const now = new Date().toISOString();
  const activeReports = reports.filter((r) => r.status !== 'REJECTED');

  const simulatedSegments: RoadSegmentImpact[] = [];
  let affectedCount = 0;
  let blockedCount = 0;

  for (const road of MONITORED_ARTERIAL_ROADS) {
    // 1. Check for Insufficient Data condition
    if (!road.hasReliableTerrainData) {
      simulatedSegments.push({
        segmentId: road.segmentId,
        roadName: road.roadName,
        corridor: road.corridor,
        coordinates: road.coordinates,
        center: road.center,
        status: 'INSUFFICIENT_DATA',
        estimatedRiskScore: 0,
        elevationMslMeters: 0,
        isKnownUnderpassOrLowPoint: false,
        nearbyReportCount: 0,
        primaryRiskReason: 'Insufficient municipal stormwater and topographic survey data for this feeder sector.',
        underlyingDataTimestamp: now,
        evidenceConfidence: 'LOW',
      });
      continue;
    }

    // 2. Check for Confirmed Field Reports intersecting road buffer (350m)
    const intersectingReports = activeReports.filter((r) => {
      const dist = calculateDistanceMeters(road.center[0], road.center[1], r.latitude, r.longitude);
      return dist <= 350;
    });

    const hasConfirmedBlockage = intersectingReports.some(
      (r) => r.roadCondition === 'BLOCKED' || (r.status === 'VERIFIED' && r.severity === 'CRITICAL')
    );

    const hasConfirmedHazard = intersectingReports.some(
      (r) => r.status === 'VERIFIED' || r.severity === 'HIGH' || r.severity === 'CRITICAL'
    );

    // 3. Obtain Weather Telemetry
    const weather = await getExtendedWeatherTelemetry(road.center[0], road.center[1]);
    const effectiveRainfall =
      rainfallScenarioMm !== undefined
        ? rainfallScenarioMm
        : Math.max(weather.currentPrecipitationMm * 2, weather.accumulated3hMm);

    let status: RoadSegmentImpact['status'] = 'PASSABLE_NORMAL';
    let riskScore = 15;
    let primaryReason = 'Drainage capacity adequate for current precipitation rate.';
    let confidence: ConfidenceLevel = 'MEDIUM';

    if (hasConfirmedBlockage) {
      status = 'CONFIRMED_HAZARD';
      riskScore = 95;
      blockedCount++;
      affectedCount++;
      confidence = 'HIGH';
      primaryReason = `CONFIRMED ROAD BLOCKAGE: Field report logged by citizens with active standing water obstruction.`;
    } else if (hasConfirmedHazard) {
      status = 'CONFIRMED_HAZARD';
      riskScore = 80;
      affectedCount++;
      confidence = 'HIGH';
      primaryReason = `CONFIRMED WATERLOGGING: Verified ground observations logged within 350m carriageway buffer.`;
    } else {
      // Model-estimated calculation based on rainfall vs drainage threshold
      const rainfallRatio = effectiveRainfall / road.drainageThresholdMm;
      if (rainfallRatio >= 1.2) {
        status = 'ELEVATED_RISK_ESTIMATED';
        riskScore = Math.min(88, Math.round(55 + rainfallRatio * 20));
        affectedCount++;
        confidence = road.isKnownUnderpassOrLowPoint ? 'HIGH' : 'MEDIUM';
        primaryReason = `MODEL ESTIMATE: Projected rainfall (${effectiveRainfall.toFixed(1)}mm) exceeds local drain threshold (${road.drainageThresholdMm}mm) over low-point ${road.elevationMslMeters}m MSL elevation.`;
      } else if (rainfallRatio >= 0.85) {
        status = 'ELEVATED_RISK_ESTIMATED';
        riskScore = 52;
        affectedCount++;
        confidence = 'MEDIUM';
        primaryReason = `MODEL ESTIMATE: Precipitation approaching saturation threshold for low-lying corridor.`;
      } else {
        status = 'PASSABLE_NORMAL';
        riskScore = Math.max(10, Math.round(rainfallRatio * 35));
        confidence = 'MEDIUM';
        primaryReason = `MODEL ESTIMATE: Surface runoff within normal culvert drainage capacity.`;
      }
    }

    simulatedSegments.push({
      segmentId: road.segmentId,
      roadName: road.roadName,
      corridor: road.corridor,
      coordinates: road.coordinates,
      center: road.center,
      status,
      estimatedRiskScore: riskScore,
      elevationMslMeters: road.elevationMslMeters,
      isKnownUnderpassOrLowPoint: road.isKnownUnderpassOrLowPoint,
      nearbyReportCount: intersectingReports.length,
      primaryRiskReason: primaryReason,
      underlyingDataTimestamp: weather.measurementTime || now,
      suggestedAlternativeRoute:
        status === 'CONFIRMED_HAZARD' || status === 'ELEVATED_RISK_ESTIMATED'
          ? road.alternativeRouteName
          : undefined,
      evidenceConfidence: confidence,
    });
  }

  const effectiveSimulatedMm =
    rainfallScenarioMm !== undefined ? rainfallScenarioMm : 25;

  return {
    simulationId: `sim-road-${Date.now()}`,
    rainfallScenarioMm: effectiveSimulatedMm,
    affectedSegmentsCount: affectedCount,
    blockedConfirmedCount: blockedCount,
    segments: simulatedSegments,
    summary: `${affectedCount} of ${MONITORED_ARTERIAL_ROADS.length} arterial road corridors flagged with elevated flood impact under ${effectiveSimulatedMm}mm rainfall scenario.`,
    disclaimer:
      'Road impact simulation represents engineering estimates based on culvert drainage thresholds and terrain elevation. Never enter flooded roads. Turn Around Don’t Drown.',
    evaluatedAt: now,
  };
}
