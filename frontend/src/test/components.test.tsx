import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RiskBadge, RoadConditionBadge, VerificationBadge } from '../components/common/RiskBadge';
import { MyLocationIntelligencePanel } from '../components/intelligence/MyLocationIntelligencePanel';
import { MapFloatingControls } from '../components/map/MapFloatingControls';
import { LayerVisibilityState } from '../components/map/FloodMap';
import { MultiHorizonRiskAssessment } from '../types';

describe('Cartographic Intelligence Badges', () => {
  it('renders Low Risk badge with label and icon', () => {
    render(<RiskBadge severity="LOW" />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('renders Critical Hazard badge correctly', () => {
    render(<RiskBadge severity="CRITICAL" />);
    expect(screen.getByText('Critical Hazard')).toBeInTheDocument();
  });

  it('renders Road Blocked condition badge with prominent warning', () => {
    render(<RoadConditionBadge condition="BLOCKED" />);
    expect(screen.getByText('ROAD BLOCKED')).toBeInTheDocument();
  });

  it('renders Verified Field Report badge', () => {
    render(<VerificationBadge status="VERIFIED" />);
    expect(screen.getByText('Verified Field Report')).toBeInTheDocument();
  });

  it('renders Awaiting Review for unverified submissions', () => {
    render(<VerificationBadge status="UNVERIFIED" />);
    expect(screen.getByText('Awaiting Review')).toBeInTheDocument();
  });
});

describe('MyLocationIntelligencePanel', () => {
  const sampleAssessment: MultiHorizonRiskAssessment = {
    location: {
      latitude: 12.9715,
      longitude: 80.218,
      localityName: 'Velachery Lowland Watershed',
      district: 'Chennai',
    },
    currentScore: 65,
    currentCategory: 'HIGH',
    overallConfidence: 'HIGH',
    weatherTelemetry: {
      source: 'Open-Meteo High-Res / IMD Synoptic Grid',
      latitude: 12.9715,
      longitude: 80.218,
      retrievalTime: new Date().toISOString(),
      measurementTime: new Date().toISOString(),
      currentPrecipitationMm: 14.5,
      hourlyForecastMm: [],
      accumulated1hMm: 15.0,
      accumulated3hMm: 45.0,
      accumulated6hMm: 72.0,
      accumulated24hMm: 95.0,
      isLive: true,
      freshness: 'LIVE',
      unit: 'mm',
    },
    terrain: {
      elevationMeters: 6,
      slopeCategory: 'FLAT_LOWLAND',
      distanceToNearestWaterbodyMeters: 350,
      nearestWaterbodyName: 'Velachery Lake Spillway',
      historicalVulnerabilityIndex: 78,
      drainageCapacityCategory: 'CONSTRAINED',
    },
    officialWarnings: [
      {
        warningId: 'warn-imd-01',
        district: 'Chennai',
        state: 'Tamil Nadu',
        severity: 'ORANGE',
        colorCode: '#EA580C',
        headline: 'Heavy to very heavy rainfall forecast over Chennai coastal belt.',
        description: 'Synoptic low pressure causing squally downpours.',
        issuedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        issuingAgency: 'India Meteorological Department (IMD)',
      },
    ],
    horizons: {
      NOW: {
        horizon: 'NOW',
        timeLabel: 'Current Status',
        targetTimestamp: new Date().toISOString(),
        overallScore: 65,
        category: 'HIGH',
        confidence: 'HIGH',
        projectedPrecipitationMm: 14.5,
        accumulatedPrecipitationMm: 14.5,
        factors: [
          { name: 'Observed Rainfall', impact: 'WARNING', weight: 25, description: '14.5mm current precipitation' },
          { name: 'Terrain Basin', impact: 'WARNING', weight: 30, description: 'Elevation 6m (Constrained drainage)' },
        ],
        summary: 'Active rainfall over low elevation basin.',
      },
      '1H': {
        horizon: '1H',
        timeLabel: 'Next 1 Hour',
        targetTimestamp: new Date(Date.now() + 3600000).toISOString(),
        overallScore: 68,
        category: 'HIGH',
        confidence: 'HIGH',
        projectedPrecipitationMm: 15.0,
        accumulatedPrecipitationMm: 15.0,
        factors: [
          { name: 'Forecast 1h', impact: 'WARNING', weight: 28, description: '15mm precipitation expected' },
        ],
        summary: 'Continuing rain over next hour.',
      },
      '3H': {
        horizon: '3H',
        timeLabel: 'Next 3 Hours',
        targetTimestamp: new Date(Date.now() + 10800000).toISOString(),
        overallScore: 78,
        category: 'CRITICAL',
        confidence: 'MEDIUM',
        projectedPrecipitationMm: 45.0,
        accumulatedPrecipitationMm: 45.0,
        factors: [
          { name: 'Forecast 3h', impact: 'CRITICAL', weight: 35, description: '45mm precipitation expected' },
        ],
        summary: 'Accumulation approaches municipal canal drainage thresholds.',
      },
      '6H': {
        horizon: '6H',
        timeLabel: 'Next 6 Hours',
        targetTimestamp: new Date(Date.now() + 21600000).toISOString(),
        overallScore: 85,
        category: 'CRITICAL',
        confidence: 'MEDIUM',
        projectedPrecipitationMm: 72.0,
        accumulatedPrecipitationMm: 72.0,
        factors: [
          { name: 'Forecast 6h', impact: 'CRITICAL', weight: 40, description: '72mm precipitation expected' },
        ],
        summary: 'Extreme inundation risk if rainfall persists.',
      },
      '24H': {
        horizon: '24H',
        timeLabel: 'Next 24 Hours',
        targetTimestamp: new Date(Date.now() + 86400000).toISOString(),
        overallScore: 60,
        category: 'MODERATE',
        confidence: 'LOW',
        projectedPrecipitationMm: 95.0,
        accumulatedPrecipitationMm: 95.0,
        factors: [
          { name: 'Forecast 24h', impact: 'NEUTRAL', weight: 20, description: '95mm aggregate precipitation' },
        ],
        summary: 'Synoptic outlook remains moist.',
      },
    },
    nearbyActiveReports: [],
    aiAnalystExplanation: {
      summary: 'High inundation risk due to prolonged precipitation over low-elevation basin.',
      horizonProgression: 'Risk escalates from High to Critical across the 3H and 6H horizons.',
      communityEvidenceSynthesis: 'No recent field reports logged in 1.5km buffer; assessment grounded in telemetry.',
      missingTelemetry: 'Hyperlocal micro-drainage water level sensor feeds.',
      recommendedPrecautions: [
        'Avoid basement car parks and pedestrian underpasses',
        'Check municipal traffic diversions before traveling',
      ],
      uncertaintyStatement: 'Proactive estimation based on weather and terrain; actual street ponding depends on local drainage maintenance.',
      generatedAt: new Date().toISOString(),
      modelIdentifier: 'anthropic.claude-3-sonnet-20240229-v1:0 (AWS Bedrock)',
      isAiGenerated: true,
    },
    dataFreshness: 'LIVE',
    dataQualityNotes: ['No ground community reports nearby — risk estimated proactively.'],
    safetyGuidance: [
      'Avoid driving through stagnant water above wheel hub level.',
      'Do not park vehicles in underground basements near lakes.',
    ],
    calculatedAt: new Date().toISOString(),
  };

  it('renders location name, coordinates, and weather telemetry', () => {
    render(
      <MyLocationIntelligencePanel
        intelligence={sampleAssessment}
        loading={false}
        onLocateMe={() => {}}
        locating={false}
        selectedHorizon="NOW"
        onSelectHorizon={() => {}}
      />
    );

    expect(screen.getByText('Velachery Lowland Watershed')).toBeInTheDocument();
    expect(screen.getAllByText(/14\.5/).length).toBeGreaterThan(0);
    expect(screen.getByText('CONSTRAINED')).toBeInTheDocument();
  });

  it('allows switching forecast horizon tabs', () => {
    const handleSelectHorizon = vi.fn();
    render(
      <MyLocationIntelligencePanel
        intelligence={sampleAssessment}
        loading={false}
        onLocateMe={() => {}}
        locating={false}
        selectedHorizon="NOW"
        onSelectHorizon={handleSelectHorizon}
      />
    );

    const btn3H = screen.getByRole('button', { name: /^3H/i });
    fireEvent.click(btn3H);
    expect(handleSelectHorizon).toHaveBeenCalledWith('3H');
  });

  it('displays Amazon Bedrock AI Analyst synthesis and precautions', () => {
    render(
      <MyLocationIntelligencePanel
        intelligence={sampleAssessment}
        loading={false}
        onLocateMe={() => {}}
        locating={false}
        selectedHorizon="NOW"
        onSelectHorizon={() => {}}
      />
    );

    expect(screen.getByText('Amazon Bedrock AI Analyst:')).toBeInTheDocument();
    expect(
      screen.getByText(/High inundation risk due to prolonged precipitation over low-elevation basin/i)
    ).toBeInTheDocument();

    // Click Precautions tab
    const precautionsTab = screen.getByRole('button', { name: /Safety Precautions/i });
    fireEvent.click(precautionsTab);
    expect(screen.getByText(/Avoid driving through stagnant water above wheel hub level/i)).toBeInTheDocument();
  });
});

describe('MapFloatingControls', () => {
  const initialLayerVisibility: LayerVisibilityState = {
    reports: true,
    riskZones: true,
    observedRainfall: false,
    forecastRainfall: true,
    historicalHotspots: false,
    officialWarnings: true,
  };

  it('renders layers dropdown and toggles layer checkboxes', () => {
    const handleToggleLayer = vi.fn();
    render(
      <MapFloatingControls
        searchQuery=""
        onSearchChange={() => {}}
        onLocateUser={() => {}}
        locatingUser={false}
        selectedSeverity="ALL"
        onSelectSeverity={() => {}}
        selectedCondition="ALL"
        onSelectCondition={() => {}}
        verifiedOnly={false}
        onToggleVerifiedOnly={() => {}}
        includeDemo={true}
        onToggleIncludeDemo={() => {}}
        reportCount={12}
        layerVisibility={initialLayerVisibility}
        onToggleLayer={handleToggleLayer}
        selectedHorizon="NOW"
        onSelectHorizon={() => {}}
      />
    );

    // Click Layers dropdown button to reveal checkboxes
    const layersDropdownBtn = screen.getByRole('button', { name: /Layers/i });
    fireEvent.click(layersDropdownBtn);

    expect(screen.getByText('Community Reports')).toBeInTheDocument();
    expect(screen.getByText('Estimated Risk Zones')).toBeInTheDocument();
    expect(screen.getByText('Observed Rainfall Stations')).toBeInTheDocument();
    expect(screen.getByText('Forecast Rainfall Zones')).toBeInTheDocument();
    expect(screen.getByText('Historical Flood Hotspots')).toBeInTheDocument();

    const observedRainBtn = screen.getByText('Observed Rainfall Stations');
    fireEvent.click(observedRainBtn);
    expect(handleToggleLayer).toHaveBeenCalledWith('observedRainfall');
  });
});
