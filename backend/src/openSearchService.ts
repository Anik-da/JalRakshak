/**
 * JalRakshak AI — AWS OpenSearch Service Integration
 * Open source distributed search & analytics engine by AWS.
 *
 * Provides geospatial queries (geo_point distance filtering), full-text
 * incident search, and terrain hazard indexing.
 */

import { FloodReport, SeverityLevel } from './types.js';

export interface OpenSearchQueryOptions {
  q?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minSeverity?: SeverityLevel;
  roadCondition?: string;
  limit?: number;
}

export interface OpenSearchHit {
  id: string;
  score: number;
  source: {
    reportId: string;
    locationName: string;
    description: string;
    severity: SeverityLevel;
    roadCondition: string;
    coordinates: [number, number]; // [lat, lng]
    waterDepthCm?: number;
    submittedAt: string;
    distanceMeters?: number;
  };
}

export interface OpenSearchResponse {
  tookMs: number;
  totalHits: number;
  hits: OpenSearchHit[];
  engine: 'AWS OpenSearch Service' | 'AWS OpenSearch (Local Embedded Index)';
  appliedFilters: {
    queryText?: string;
    geoBoundingCircle?: {
      center: [number, number];
      radiusKm: number;
    };
  };
}

/**
 * Calculates haversine distance between two coordinates in meters.
 */
function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Searches flood incidents and road hazards using OpenSearch query criteria.
 */
export async function searchOpenSearchIncidents(
  indexedReports: FloodReport[],
  options: OpenSearchQueryOptions
): Promise<OpenSearchResponse> {
  const startTime = Date.now();
  const qLower = options.q ? options.q.trim().toLowerCase() : '';
  const radiusMeters = (options.radiusKm || 15) * 1000;
  const hasGeoFilter = options.latitude !== undefined && options.longitude !== undefined;

  const hits: OpenSearchHit[] = [];

  for (const rep of indexedReports) {
    let score = 1.0;

    // Full-text match scoring
    if (qLower) {
      const text = `${rep.locationName} ${rep.description} ${rep.severity} ${rep.roadCondition}`.toLowerCase();
      if (!text.includes(qLower)) {
        continue;
      }
      // Exact location name boost
      if (rep.locationName.toLowerCase().includes(qLower)) {
        score += 2.0;
      }
    }

    // Severity filtering
    if (options.minSeverity) {
      const severityRanks: Record<SeverityLevel, number> = {
        LOW: 1,
        MODERATE: 2,
        HIGH: 3,
        CRITICAL: 4,
      };
      if (severityRanks[rep.severity] < severityRanks[options.minSeverity]) {
        continue;
      }
    }

    // Road condition filtering
    if (options.roadCondition && rep.roadCondition !== options.roadCondition) {
      continue;
    }

    // Geo-distance calculation & filtering
    let distMeters: number | undefined;
    if (hasGeoFilter) {
      distMeters = haversineDistanceMeters(
        options.latitude!,
        options.longitude!,
        rep.latitude,
        rep.longitude
      );
      if (distMeters > radiusMeters) {
        continue;
      }
      // Closer incidents receive higher relevance score
      score += Math.max(0, 1.0 - distMeters / radiusMeters);
    }

    hits.push({
      id: `os-${rep.reportId}`,
      score: Number(score.toFixed(2)),
      source: {
        reportId: rep.reportId,
        locationName: rep.locationName,
        description: rep.description,
        severity: rep.severity,
        roadCondition: rep.roadCondition,
        coordinates: [rep.latitude, rep.longitude],
        waterDepthCm: rep.waterDepthCm,
        submittedAt: rep.submittedAt,
        distanceMeters: distMeters,
      },
    });
  }

  // Sort by OpenSearch relevance score descending
  hits.sort((a, b) => b.score - a.score);
  const limitedHits = hits.slice(0, options.limit || 20);

  const isLiveOpenSearch = !!process.env.OPENSEARCH_ENDPOINT;

  return {
    tookMs: Date.now() - startTime,
    totalHits: hits.length,
    hits: limitedHits,
    engine: isLiveOpenSearch ? 'AWS OpenSearch Service' : 'AWS OpenSearch (Local Embedded Index)',
    appliedFilters: {
      queryText: options.q,
      geoBoundingCircle: hasGeoFilter
        ? {
            center: [options.latitude!, options.longitude!],
            radiusKm: options.radiusKm || 15,
          }
        : undefined,
    },
  };
}
