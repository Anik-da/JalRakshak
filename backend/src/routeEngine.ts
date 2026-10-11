import { FloodReport, RouteHazardAssessment } from './types.js';
import { calculateDistanceKm } from './riskEngine.js';

export interface RouteRequest {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
}

/**
 * Calculates perpendicular/minimum distance from a point to a line segment
 */
function distanceToSegmentKm(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dAB = calculateDistanceKm(aLat, aLng, bLat, bLng);
  if (dAB === 0) return calculateDistanceKm(pLat, pLng, aLat, aLng);

  // Approximate flat-earth projection for short distances
  const t = Math.max(
    0,
    Math.min(
      1,
      ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) /
        (Math.pow(bLat - aLat, 2) + Math.pow(bLng - aLng, 2))
    )
  );

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);
  return calculateDistanceKm(pLat, pLng, projLat, projLng);
}

/**
 * Analyzes route transit corridors against active community flood reports.
 */
export function evaluateRouteHazards(
  origin: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string },
  activeReports: FloodReport[]
): RouteHazardAssessment {
  const straightLineKm = calculateDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );
  // Estimate driving distance (approx 1.25x straight line in urban transit grids)
  const distanceKm = Number((straightLineKm * 1.25).toFixed(1));
  const estimatedDurationMin = Math.max(5, Math.round((distanceKm / 25) * 60)); // Avg 25 km/h urban monsoon speed

  const corridorBufferKm = 0.6; // 600m corridor around transit line
  const intersectingHazards: RouteHazardAssessment['intersectingHazards'] = [];
  const warnings: string[] = [];

  for (const report of activeReports) {
    if (report.status === 'REJECTED') continue;

    const distToCorridor = distanceToSegmentKm(
      report.latitude,
      report.longitude,
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    if (distToCorridor <= corridorBufferKm) {
      const distanceToRouteMeters = Math.round(distToCorridor * 1000);
      intersectingHazards.push({
        reportId: report.reportId,
        locationName: report.locationName,
        severity: report.severity,
        roadCondition: report.roadCondition,
        distanceToRouteMeters,
        verificationStatus: report.status,
        observedAt: report.observedAt,
      });

      if (report.roadCondition === 'BLOCKED') {
        warnings.push(
          `IMPASSABLE: Road reported BLOCKED near ${report.locationName} (${distanceToRouteMeters}m from route line).`
        );
      } else if (report.severity === 'HIGH' || report.severity === 'CRITICAL') {
        warnings.push(
          `HAZARD WARNING: Severe waterlogging reported at ${report.locationName}.`
        );
      }
    }
  }

  let safetyStatus: RouteHazardAssessment['safetyStatus'] = 'CLEAR';
  if (intersectingHazards.some((h) => h.roadCondition === 'BLOCKED' || h.severity === 'CRITICAL')) {
    safetyStatus = 'HAZARDOUS';
  } else if (intersectingHazards.length > 0) {
    safetyStatus = 'CAUTION';
  }

  const alternativeAvailable = safetyStatus === 'HAZARDOUS';

  const disclaimer =
    'PUBLIC SAFETY NOTICE: Community reports reflect crowd-sourced observations and cannot guarantee unmonitored roads are flood-free. Never drive into standing water. Follow municipal traffic advisories and police directives.';

  return {
    origin,
    destination,
    distanceKm,
    estimatedDurationMin,
    safetyStatus,
    intersectingHazards,
    warnings,
    alternativeAvailable,
    disclaimer,
  };
}
