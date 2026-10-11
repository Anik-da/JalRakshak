import {
  FloodReport,
  FloodBlindZone,
  FloodBlindSummary,
  VerificationPriority,
} from './types.js';
import { calculateMultiHorizonFloodRisk } from './riskEngine.js';
import { getOfficialWeatherWarnings, getExtendedWeatherTelemetry } from './weatherAdapter.js';
import { getHistoricalHotspots } from './layerService.js';

interface SectorDefinition {
  id: string;
  name: string;
  center: [number, number];
  radiusMeters: number;
  isHistoricalChokepoint: boolean;
  knownVulnerabilityReason: string;
}

// Urban monitored sectors across high-density metropolitan flood basins
const MONITORED_METRO_SECTORS: SectorDefinition[] = [
  {
    id: 'sec-velachery-lake',
    name: 'Velachery Lowland Lake Basin',
    center: [12.9715, 80.218],
    radiusMeters: 1600,
    isHistoricalChokepoint: true,
    knownVulnerabilityReason: 'Marshland runoff convergence; shallow 5m MSL elevation; limited canal outlet capacity',
  },
  {
    id: 'sec-madipakkam-lake',
    name: 'Madipakkam Lake Lowlands',
    center: [12.9647, 80.1985],
    radiusMeters: 1400,
    isHistoricalChokepoint: true,
    knownVulnerabilityReason: 'Flat topography lacking secondary stormwater channels; water table saturation',
  },
  {
    id: 'sec-tnagar-usman',
    name: 'T. Nagar South Usman Corridor & Subway',
    center: [13.0418, 80.2341],
    radiusMeters: 1200,
    isHistoricalChokepoint: true,
    knownVulnerabilityReason: 'High impervious surface cover; historic micro-topographic depression in arterial retail district',
  },
  {
    id: 'sec-perambur-subway',
    name: 'Perambur Railway Underpass Chokepoint',
    center: [13.1098, 80.2435],
    radiusMeters: 1000,
    isHistoricalChokepoint: true,
    knownVulnerabilityReason: 'Depressed railway underpass basin prone to flash waterlogging above 25mm/hr precipitation',
  },
  {
    id: 'sec-porur-lake',
    name: 'Porur Lake Downstream Spillway',
    center: [13.0382, 80.1565],
    radiusMeters: 1800,
    isHistoricalChokepoint: true,
    knownVulnerabilityReason: 'Adyar river tributary feeder; discharge overflow during prolonged precipitation',
  },
  {
    id: 'sec-omr-sholinganallur',
    name: 'OMR Sholinganallur IT Canal Corridor',
    center: [12.901, 80.2279],
    radiusMeters: 2000,
    isHistoricalChokepoint: false,
    knownVulnerabilityReason: 'Buckingham Canal adjacent; drainage impacted by high-tide sea backwaters',
  },
  {
    id: 'sec-ambattur-industrial',
    name: 'Ambattur Industrial Estate Lowland',
    center: [13.0984, 80.1612],
    radiusMeters: 1500,
    isHistoricalChokepoint: false,
    knownVulnerabilityReason: 'Industrial drainage bottlenecks; slow surface runoff release into Korattur lake',
  },
  {
    id: 'sec-central-station',
    name: 'Central Railway & Wall Tax Road Chokepoint',
    center: [13.0827, 80.2707],
    radiusMeters: 1200,
    isHistoricalChokepoint: true,
    knownVulnerabilityReason: 'Buckingham canal backwater confluence; high commuter density',
  },
];

/**
 * Calculates spatial distance between two geographic coordinates in meters.
 */
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
 * FloodBlind AI Engine:
 * Analyzes monitored sectors to detect monitoring gaps where environmental risk is elevated
 * but citizen ground corroboration is sparse or absent.
 */
export async function evaluateFloodBlindMonitoringGaps(
  allReports: FloodReport[],
  targetCoordinates?: { lat: number; lng: number }
): Promise<FloodBlindSummary> {
  const activeReports = allReports.filter((r) => r.status !== 'REJECTED');
  const now = new Date().toISOString();

  // Determine sectors to evaluate
  let sectorsToScan = MONITORED_METRO_SECTORS;
  if (targetCoordinates) {
    // Include user's immediate coordinates as a custom sector if far from known sectors
    const nearestSector = MONITORED_METRO_SECTORS.find(
      (s) => calculateDistanceMeters(s.center[0], s.center[1], targetCoordinates.lat, targetCoordinates.lng) < 2500
    );
    if (!nearestSector) {
      sectorsToScan = [
        ...MONITORED_METRO_SECTORS,
        {
          id: 'sec-user-custom',
          name: 'Current Vicinity Monitoring Sector',
          center: [targetCoordinates.lat, targetCoordinates.lng],
          radiusMeters: 1500,
          isHistoricalChokepoint: false,
          knownVulnerabilityReason: 'User-selected geographic coordinate buffer',
        },
      ];
    }
  }

  const gapZones: FloodBlindZone[] = [];
  let urgentCount = 0;
  let blindSpotCount = 0;

  for (const sector of sectorsToScan) {
    // Count active ground reports within sector radius
    const nearbyReports = activeReports.filter((r) => {
      const dist = calculateDistanceMeters(sector.center[0], sector.center[1], r.latitude, r.longitude);
      return dist <= sector.radiusMeters;
    });

    // Obtain current weather & risk assessment for this sector
    const weather = await getExtendedWeatherTelemetry(sector.center[0], sector.center[1]);
    const assessment = calculateMultiHorizonFloodRisk(nearbyReports, {
      latitude: sector.center[0],
      longitude: sector.center[1],
      localityName: sector.name,
      weather,
    });

    const estimatedScore = assessment.horizons['3H'].overallScore;
    const estimatedCategory = assessment.horizons['3H'].category;
    const reportCount = nearbyReports.length;

    // Calculate Monitoring Gap Index (0 - 100):
    // Combines model estimated score and historical/terrain vulnerability when ground reports are 0
    let gapIndex = 0;
    const baseVulnerability = Math.max(estimatedScore, sector.isHistoricalChokepoint ? 45 : 25);
    if (reportCount === 0) {
      gapIndex = Math.min(100, Math.round(baseVulnerability * 1.2));
    } else if (reportCount === 1) {
      gapIndex = Math.min(100, Math.round(baseVulnerability * 0.8));
    } else if (reportCount <= 3) {
      gapIndex = Math.max(0, Math.round(baseVulnerability * 0.45));
    } else {
      gapIndex = Math.max(0, Math.round(baseVulnerability * 0.2));
    }

    // Determine verification priority
    let priority: VerificationPriority = 'ADEQUATELY_COVERED';
    if (gapIndex >= 55) {
      priority = 'URGENT_GROUND_CHECK';
      urgentCount++;
    } else if (gapIndex >= 35) {
      priority = 'MONITORING_SUGGESTED';
    }

    if (gapIndex >= 40 && reportCount === 0) {
      blindSpotCount++;
    }

    // Identify influencing data factors
    const factors: string[] = [
      `Weather telemetry: ${weather.currentPrecipitationMm}mm current rain, ${weather.accumulated3hMm}mm 3h forecast accumulation`,
      `Terrain elevation: ${assessment.terrain.elevationMeters}m MSL (${assessment.terrain.drainageCapacityCategory} drainage capacity)`,
    ];
    if (assessment.officialWarnings.length > 0) {
      factors.push(`Official warning active: ${assessment.officialWarnings[0].headline}`);
    }
    if (sector.isHistoricalChokepoint) {
      factors.push(`Recurring historical hotspot: ${sector.knownVulnerabilityReason}`);
    }

    const missingTelemetry: string[] = [];
    if (reportCount === 0) {
      missingTelemetry.push('Zero verified citizen reports in 1.5km buffer');
    }
    missingTelemetry.push('Municipal real-time stormwater pipe flow meters offline');

    const recommendedActions: string[] = [];
    if (priority === 'URGENT_GROUND_CHECK') {
      recommendedActions.push('Dispatch field wardens to verify underpass drain grates');
      recommendedActions.push('Advise local motorists to avoid low-lying underpass roads');
    } else {
      recommendedActions.push('Encourage nearby residents to log quick passability updates');
    }

    gapZones.push({
      zoneId: sector.id,
      name: sector.name,
      center: sector.center,
      estimatedRiskScore: estimatedScore,
      estimatedCategory,
      groundReportCount: reportCount,
      monitoringGapIndex: gapIndex,
      status: 'POTENTIAL_RISK_NEEDS_VERIFICATION',
      verificationPriority: priority,
      isHistoricalChokepoint: sector.isHistoricalChokepoint,
      influencingFactors: factors,
      missingTelemetry,
      lastTelemetryUpdate: weather.measurementTime || now,
      dataFreshness: weather.freshness,
      recommendedActions,
    });
  }

  // Sort: highest gap index first
  gapZones.sort((a, b) => b.monitoringGapIndex - a.monitoringGapIndex);

  return {
    totalMonitoredZones: sectorsToScan.length,
    blindSpotsCount: blindSpotCount,
    urgentVerificationCount: urgentCount,
    activeGapZones: gapZones,
    disclaimer:
      'FloodBlind AI identifies potential risk hotspots using meteorological forecasts and terrain models. An absence of community reports does NOT indicate safety. All flagged areas represent potential risk requiring ground verification.',
    generatedAt: now,
  };
}
