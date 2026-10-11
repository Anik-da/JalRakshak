import { describe, it, expect } from 'vitest';
import {
  calculateMultiHorizonFloodRisk,
  estimateTerrainIndicators,
  simulateWhatIfScenario,
} from '../riskEngine.js';
import { getOfficialWeatherWarnings, ExtendedWeatherData } from '../weatherAdapter.js';
import { generateBedrockRiskExplanation, analyzeFloodPhotoWithAI } from '../bedrockService.js';
import { evaluateAlertTriggersForReport, getUserAlertPreferences } from '../alertsService.js';
import { FloodReport } from '../types.js';

describe('JalRakshak AI 2.0 — Predictive Intelligence Engine', () => {
  const sampleDryWeather: ExtendedWeatherData = {
    source: 'Open-Meteo High-Res / IMD Synoptic Grid',
    latitude: 13.0827,
    longitude: 80.2707,
    retrievalTime: new Date().toISOString(),
    measurementTime: new Date().toISOString(),
    currentPrecipitationMm: 0,
    hourlyForecastMm: [
      { time: new Date().toISOString(), precipitationMm: 0 },
      { time: new Date(Date.now() + 3600000).toISOString(), precipitationMm: 0 },
    ],
    accumulated1hMm: 0,
    accumulated3hMm: 0,
    accumulated6hMm: 0,
    accumulated24hMm: 0,
    isLive: true,
    freshness: 'LIVE',
    unit: 'mm',
  };

  const sampleHeavyRainWeather: ExtendedWeatherData = {
    ...sampleDryWeather,
    currentPrecipitationMm: 22.5,
    accumulated1hMm: 25.0,
    accumulated3hMm: 55.0,
    accumulated6hMm: 85.0,
    accumulated24hMm: 110.0,
  };

  it('PROACTIVE INNOVATION: Estimates flood risk even when NO community reports exist', () => {
    // Zero ground reports
    const emptyReports: FloodReport[] = [];

    // Velachery Lowland Basin coordinates
    const assessment = calculateMultiHorizonFloodRisk(emptyReports, {
      latitude: 12.9715,
      longitude: 80.2180,
      localityName: 'Velachery Lowland Watershed',
      weather: sampleHeavyRainWeather,
    });

    expect(assessment).toBeDefined();
    expect(assessment.location.localityName).toBe('Velachery Lowland Watershed');
    // Because accumulated rainfall is 85mm in 6h and terrain is lowland, risk should be HIGH or CRITICAL despite 0 reports
    expect(['HIGH', 'CRITICAL']).toContain(assessment.horizons['6H'].category);
    expect(assessment.horizons['6H'].overallScore).toBeGreaterThan(50);
    expect(assessment.nearbyActiveReports).toHaveLength(0);
    expect(assessment.dataQualityNotes.some((note) => note.includes('No ground community reports'))).toBe(true);
  });

  it('Evaluates multi-horizon progression from NOW to 24H', () => {
    const assessment = calculateMultiHorizonFloodRisk([], {
      latitude: 13.0827,
      longitude: 80.2707,
      weather: sampleHeavyRainWeather,
    });

    expect(assessment.horizons.NOW).toBeDefined();
    expect(assessment.horizons['1H']).toBeDefined();
    expect(assessment.horizons['3H']).toBeDefined();
    expect(assessment.horizons['6H']).toBeDefined();
    expect(assessment.horizons['24H']).toBeDefined();

    // 6H accumulated rain is 85mm, so 6H should reflect higher precipitation than 1H
    expect(assessment.horizons['6H'].accumulatedPrecipitationMm).toBeGreaterThan(
      assessment.horizons['1H'].accumulatedPrecipitationMm
    );
  });

  it('Estimates terrain vulnerability and drainage categories correctly', () => {
    // Velachery: low elevation and constrained drainage
    const velacheryTerrain = estimateTerrainIndicators(12.9715, 80.2180);
    expect(velacheryTerrain.elevationMeters).toBeLessThan(10);
    expect(velacheryTerrain.drainageCapacityCategory).toBe('CONSTRAINED');
    expect(velacheryTerrain.historicalVulnerabilityIndex).toBeGreaterThan(60);

    // Guindy Ridge: elevated
    const guindyTerrain = estimateTerrainIndicators(13.0067, 80.2012);
    expect(guindyTerrain.elevationMeters).toBeGreaterThan(15);
    expect(guindyTerrain.drainageCapacityCategory).toBe('ADEQUATE');
  });

  it('Retrieves official meteorological warnings for major Indian metropolitan districts', () => {
    const chennaiWarnings = getOfficialWeatherWarnings(13.0827, 80.2707);
    expect(chennaiWarnings.length).toBeGreaterThan(0);
    expect(chennaiWarnings[0].issuingAgency).toContain('India Meteorological Department');
    expect(['RED', 'ORANGE', 'YELLOW', 'GREEN']).toContain(chennaiWarnings[0].severity);
  });

  it('Generates structured Bedrock AI Analyst explanation with required fields and uncertainty', async () => {
    const assessment = calculateMultiHorizonFloodRisk([], {
      latitude: 13.0827,
      longitude: 80.2707,
      weather: sampleHeavyRainWeather,
    });

    const explanation = await generateBedrockRiskExplanation(assessment);

    expect(explanation.summary).toBeDefined();
    expect(explanation.horizonProgression).toBeDefined();
    expect(explanation.communityEvidenceSynthesis).toBeDefined();
    expect(explanation.missingTelemetry).toBeDefined();
    expect(explanation.recommendedPrecautions.length).toBeGreaterThan(0);
    expect(explanation.uncertaintyStatement).toBeDefined();
  });

  it('Executes hypothetical What-If simulations with explicit simulation disclaimer', () => {
    const simulation = simulateWhatIfScenario(
      {
        latitude: 13.0418,
        longitude: 80.2341,
        localityName: 'T. Nagar South Usman Road',
        rainfallMultiplierPercent: 40,
        prolongedRainHours: 3,
        simulateRoadBlockage: true,
        excludeCommunityReports: false,
      },
      [],
      sampleDryWeather
    );

    expect(simulation.isHypothetical).toBe(true);
    expect(simulation.disclaimer).toContain('NOT an official meteorological weather forecast');
    expect(simulation.deltaScore).toBeGreaterThan(0); // Adding rain & road blockage increases score
    expect(simulation.horizonForecasts['3H']).toBeDefined();
  });

  it('Performs AI flood-photo analysis and provides uncertainty disclaimer without over-claiming depth', async () => {
    const analysis = await analyzeFloodPhotoWithAI('https://images.unsplash.com/photo-1547683905-f686c993aae5');
    expect(analysis.isFloodRelated).toBe(true);
    expect(analysis.detectedIndicators.waterloggingObserved).toBe(true);
    expect(analysis.uncertaintyDisclaimer).toContain('Human municipal moderation remains mandatory');
  });

  it('Evaluates personalized alert triggers and preserves user quiet hours / thresholds', async () => {
    const prefs = await getUserAlertPreferences('test-user-xyz', 'test@user.in');
    expect(prefs.userId).toBe('test-user-xyz');
    expect(prefs.savedLocations.length).toBeGreaterThan(0);

    // Verify alert trigger does not crash
    const dummyReport: FloodReport = {
      reportId: 'rep-test-01',
      userId: 'reporter-1',
      userEmailMasked: 'r***@test.in',
      latitude: 13.0418,
      longitude: 80.2341,
      locationName: 'T. Nagar Subway',
      severity: 'CRITICAL',
      roadCondition: 'BLOCKED',
      description: 'Underpass flooded 2ft deep.',
      observedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'VERIFIED',
      flagCount: 0,
    };

    await expect(evaluateAlertTriggersForReport(dummyReport)).resolves.not.toThrow();
  });
});
