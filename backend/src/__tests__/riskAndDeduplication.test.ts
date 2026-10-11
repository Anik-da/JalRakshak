import { describe, it, expect } from 'vitest';
import { calculateFloodRisk, calculateDistanceKm } from '../riskEngine.js';
import { detectDuplicateReport } from '../duplicateDetector.js';
import { evaluateRouteHazards } from '../routeEngine.js';
import { FloodReport } from '../types.js';

describe('Flood Risk Scoring Engine', () => {
  it('returns baseline low risk with transparent explanation when evidence is insufficient', () => {
    const risk = calculateFloodRisk([], {
      recentRainfallMm: 0,
      forecastRainfallMm: 0,
    });

    expect(risk.overallScore).toBe(0);
    expect(risk.category).toBe('LOW');
    expect(risk.confidence).toBe('LOW');
    expect(risk.explanation).toContain('Insufficient recent evidence');
  });

  it('calculates elevated risk for verified high severity report with blocked road', () => {
    const now = new Date().toISOString();
    const reports: FloodReport[] = [
      {
        reportId: 'rep-test-1',
        userId: 'u1',
        userEmailMasked: 't***@test.com',
        latitude: 13.0827,
        longitude: 80.2707,
        locationName: 'Poonamallee High Road',
        severity: 'CRITICAL',
        roadCondition: 'BLOCKED',
        description: 'Road completely submerged under 3ft water',
        observedAt: now,
        submittedAt: now,
        status: 'VERIFIED',
        flagCount: 0,
      },
    ];

    const risk = calculateFloodRisk(reports, {
      centerLat: 13.0827,
      centerLng: 80.2707,
      recentRainfallMm: 45,
    });

    expect(risk.overallScore).toBeGreaterThanOrEqual(75);
    expect(risk.category).toBe('CRITICAL');
    expect(risk.blockedRoadCount).toBe(1);
    expect(risk.factors.length).toBeGreaterThan(0);
    expect(risk.factors.some((f) => f.name.includes('Road Inundation'))).toBe(true);
  });

  it('applies freshness decay to older reports', () => {
    const staleTime = new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(); // 14 hours old
    const freshTime = new Date().toISOString();

    const staleReport: FloodReport = {
      reportId: 'rep-stale',
      userId: 'u1',
      userEmailMasked: 's***@test.com',
      latitude: 13.08,
      longitude: 80.27,
      locationName: 'Test Junction',
      severity: 'HIGH',
      roadCondition: 'PASSABLE',
      description: 'Water receding',
      observedAt: staleTime,
      submittedAt: staleTime,
      status: 'VERIFIED',
      flagCount: 0,
    };

    const freshReport: FloodReport = {
      ...staleReport,
      reportId: 'rep-fresh',
      observedAt: freshTime,
      submittedAt: freshTime,
    };

    const staleRisk = calculateFloodRisk([staleReport]);
    const freshRisk = calculateFloodRisk([freshReport]);

    expect(freshRisk.overallScore).toBeGreaterThan(staleRisk.overallScore);
  });
});

describe('Duplicate Detection Engine', () => {
  const baseTime = new Date().toISOString();
  const existingReports: FloodReport[] = [
    {
      reportId: 'existing-rep-01',
      userId: 'u1',
      userEmailMasked: 'u***@test.org',
      latitude: 13.0418,
      longitude: 80.2341,
      locationName: 'Usman Road',
      severity: 'HIGH',
      roadCondition: 'BLOCKED',
      description: 'Submerged',
      observedAt: baseTime,
      submittedAt: baseTime,
      status: 'UNVERIFIED',
      flagCount: 0,
    },
  ];

  it('identifies duplicate candidate within 200m and 30 minutes', () => {
    // 0.001 degree lat is approx 111 meters
    const newReport = {
      latitude: 13.0425,
      longitude: 80.2345,
      observedAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    const result = detectDuplicateReport(newReport, existingReports, {
      maxDistanceMeters: 350,
      maxTimeWindowMinutes: 240,
    });

    expect(result.isDuplicateCandidate).toBe(true);
    expect(result.duplicateOfReportId).toBe('existing-rep-01');
    expect(result.distanceMeters).toBeLessThan(350);
  });

  it('does not flag reports that are far apart geographically', () => {
    const farReport = {
      latitude: 13.12, // ~8 km away
      longitude: 80.23,
      observedAt: baseTime,
    };

    const result = detectDuplicateReport(farReport, existingReports);
    expect(result.isDuplicateCandidate).toBe(false);
  });
});

describe('Route Hazard Corridor Assistance', () => {
  it('detects intersecting hazards and blocked roads near transit line', () => {
    const origin = { lat: 13.03, lng: 80.23, name: 'T. Nagar South' };
    const destination = { lat: 13.06, lng: 80.24, name: 'Nungambakkam' };

    const reports: FloodReport[] = [
      {
        reportId: 'hazard-rep-1',
        userId: 'u1',
        userEmailMasked: 'u***@test.org',
        latitude: 13.045,
        longitude: 80.235, // Right on the transit corridor
        locationName: 'Kodambakkam Bridge',
        severity: 'CRITICAL',
        roadCondition: 'BLOCKED',
        description: 'Bridge underpass blocked',
        observedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'VERIFIED',
        flagCount: 0,
      },
    ];

    const assessment = evaluateRouteHazards(origin, destination, reports);

    expect(assessment.safetyStatus).toBe('HAZARDOUS');
    expect(assessment.intersectingHazards.length).toBe(1);
    expect(assessment.warnings.length).toBeGreaterThan(0);
    expect(assessment.warnings[0]).toContain('IMPASSABLE');
    expect(assessment.alternativeAvailable).toBe(true);
    expect(assessment.disclaimer).toContain('PUBLIC SAFETY NOTICE');
  });
});
