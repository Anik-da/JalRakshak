import { FloodReport } from './types.js';
import { calculateDistanceKm } from './riskEngine.js';

export interface DuplicateDetectionResult {
  isDuplicateCandidate: boolean;
  duplicateOfReportId?: string;
  distanceMeters?: number;
  timeDifferenceMinutes?: number;
  reason?: string;
}

export interface DuplicateDetectorConfig {
  maxDistanceMeters?: number; // default: 350m
  maxTimeWindowMinutes?: number; // default: 240 mins (4 hours)
}

/**
 * Checks if a newly submitted report is a geographic and temporal duplicate candidate of existing active reports.
 * Used as a review flag and for deduplicating scoring weight, NOT as punitive fraud detection.
 */
export function detectDuplicateReport(
  newReport: { latitude: number; longitude: number; observedAt: string },
  existingReports: FloodReport[],
  config: DuplicateDetectorConfig = {}
): DuplicateDetectionResult {
  const maxDistanceMeters = config.maxDistanceMeters ?? 350;
  const maxTimeWindowMinutes = config.maxTimeWindowMinutes ?? 240;

  const newTime = new Date(newReport.observedAt).getTime();

  for (const existing of existingReports) {
    if (existing.status === 'REJECTED') continue;

    const existingTime = new Date(existing.observedAt).getTime();
    const timeDiffMinutes = Math.abs(newTime - existingTime) / (1000 * 60);

    if (timeDiffMinutes <= maxTimeWindowMinutes) {
      const distanceKm = calculateDistanceKm(
        newReport.latitude,
        newReport.longitude,
        existing.latitude,
        existing.longitude
      );
      const distanceMeters = Math.round(distanceKm * 1000);

      if (distanceMeters <= maxDistanceMeters) {
        return {
          isDuplicateCandidate: true,
          duplicateOfReportId: existing.reportId,
          distanceMeters,
          timeDifferenceMinutes: Math.round(timeDiffMinutes),
          reason: `Potential duplicate candidate: Located ${distanceMeters}m from existing report #${existing.reportId.slice(0, 8)} recorded ${Math.round(timeDiffMinutes)} minutes apart.`,
        };
      }
    }
  }

  return {
    isDuplicateCandidate: false,
  };
}
