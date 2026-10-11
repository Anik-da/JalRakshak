import {
  CriticalFacility,
  CriticalInfrastructureResponse,
  FacilityType,
  AccessStatus,
  FloodReport,
  SeverityLevel,
} from './types.js';
import { simulateRoadLevelFloodImpact } from './roadImpactSimulator.js';

interface FacilitySeed {
  facilityId: string;
  name: string;
  type: FacilityType;
  coordinates: [number, number];
  accessRoadName: string;
  associatedRoadSegmentId: string;
}

const CRITICAL_METRO_FACILITIES: FacilitySeed[] = [
  {
    facilityId: 'fac-miot-hospital',
    name: 'MIOT International Hospital',
    type: 'HOSPITAL',
    coordinates: [13.0232, 80.1878],
    accessRoadName: 'Mount-Poonamallee Road & Manapakkam Canal Bridge',
    associatedRoadSegmentId: 'rd-mount-poonamallee',
  },
  {
    facilityId: 'fac-apollo-speciality',
    name: 'Apollo Speciality Hospitals OMR',
    type: 'HOSPITAL',
    coordinates: [12.964, 80.245],
    accessRoadName: 'OMR IT Expressway Access Slipway',
    associatedRoadSegmentId: 'rd-omr-karapakkam',
  },
  {
    facilityId: 'fac-rajiv-gandhi-govt',
    name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    type: 'HOSPITAL',
    coordinates: [13.0815, 80.2785],
    accessRoadName: 'EVR Periyar Salai & Chennai Central Subway',
    associatedRoadSegmentId: 'rd-central-station',
  },
  {
    facilityId: 'fac-velachery-dav-school',
    name: 'DAV Public School Velachery',
    type: 'SCHOOL',
    coordinates: [12.9812, 80.2195],
    accessRoadName: 'Velachery 100ft Bypass Road',
    associatedRoadSegmentId: 'rd-velachery-bypass',
  },
  {
    facilityId: 'fac-tnagar-fire-station',
    name: 'T. Nagar Divisional Fire & Rescue Station',
    type: 'EMERGENCY_FIRE',
    coordinates: [13.0401, 80.2312],
    accessRoadName: 'South Usman Road Radial Access',
    associatedRoadSegmentId: 'rd-usman-subway',
  },
  {
    facilityId: 'fac-central-metro-transit',
    name: 'Chennai Central Suburban & Metro Hub',
    type: 'TRANSIT_STATION',
    coordinates: [13.0827, 80.2755],
    accessRoadName: 'Wall Tax Road & Station Concourse Entry',
    associatedRoadSegmentId: 'rd-central-station',
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
 * Assesses accessibility to critical emergency infrastructure (hospitals, schools, fire stations)
 * based on adjacent road impact status and ground observations.
 */
export async function evaluateCriticalInfrastructureVulnerability(
  reports: FloodReport[]
): Promise<CriticalInfrastructureResponse> {
  const now = new Date().toISOString();
  const roadSimulation = await simulateRoadLevelFloodImpact(reports);

  const facilities: CriticalFacility[] = [];
  let impededCount = 0;
  let blockedCount = 0;

  for (const seed of CRITICAL_METRO_FACILITIES) {
    // Find closest road segment simulation result
    const linkedRoad = roadSimulation.segments.find(
      (s) => s.segmentId === seed.associatedRoadSegmentId
    );

    // Find nearest reported ground hazard
    let nearestDistMeters = 99999;
    let nearestReport: FloodReport | null = null;
    for (const r of reports) {
      if (r.status === 'REJECTED') continue;
      const d = calculateDistanceMeters(seed.coordinates[0], seed.coordinates[1], r.latitude, r.longitude);
      if (d < nearestDistMeters) {
        nearestDistMeters = Math.round(d);
        nearestReport = r;
      }
    }

    let status: AccessStatus = 'ACCESSIBLE';
    let supportingEvidence = 'Feeder access road is clear and passable.';
    let isEstimate = true;
    let nearbyBasinCategory: SeverityLevel = 'LOW';

    if (linkedRoad) {
      if (linkedRoad.status === 'CONFIRMED_HAZARD') {
        if (linkedRoad.primaryRiskReason.includes('BLOCKAGE')) {
          status = 'ACCESS_BLOCKED_CONFIRMED';
          blockedCount++;
          isEstimate = false;
          nearbyBasinCategory = 'CRITICAL';
          supportingEvidence = `CONFIRMED ACCESS ROAD OBSTRUCTION: ${linkedRoad.roadName} reported impassable. Alternate detour required.`;
        } else {
          status = 'ACCESS_IMPEDED_ESTIMATED';
          impededCount++;
          isEstimate = false;
          nearbyBasinCategory = 'HIGH';
          supportingEvidence = `CONFIRMED WATERLOGGING ON APPROACH: ${linkedRoad.roadName} has active verified waterlogging. High-clearance vehicles advised.`;
        }
      } else if (linkedRoad.status === 'ELEVATED_RISK_ESTIMATED') {
        status = 'ACCESS_IMPEDED_ESTIMATED';
        impededCount++;
        isEstimate = true;
        nearbyBasinCategory = 'MODERATE';
        supportingEvidence = `ESTIMATED RUNOFF RISK: Approach corridor (${linkedRoad.roadName}) exhibits elevated waterlogging risk based on precipitation models. Facility itself is unaffected.`;
      } else if (linkedRoad.status === 'INSUFFICIENT_DATA') {
        status = 'INSUFFICIENT_DATA';
        supportingEvidence = 'Insufficient municipal stormwater telemetry on secondary approach roads.';
      }
    }

    facilities.push({
      facilityId: seed.facilityId,
      name: seed.name,
      type: seed.type,
      coordinates: seed.coordinates,
      nearbyBasinRiskCategory: nearbyBasinCategory,
      accessStatus: status,
      accessRoadName: seed.accessRoadName,
      distanceToNearestHazardMeters: nearestDistMeters < 99999 ? nearestDistMeters : 0,
      supportingEvidence,
      dataTimestamp: linkedRoad?.underlyingDataTimestamp || now,
      isEstimate,
    });
  }

  return {
    facilities,
    totalFacilities: CRITICAL_METRO_FACILITIES.length,
    impededCount,
    blockedCount,
    generatedAt: now,
    disclaimer:
      'Critical facility access status evaluates approach roads only. A flagged access road does not mean the hospital or facility structure itself is inundated.',
  };
}
