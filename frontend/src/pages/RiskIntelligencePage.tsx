import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  MultiHorizonRiskAssessment,
  ForecastHorizon,
  SeverityLevel,
  WhatIfSimulationResult,
  PredictionFeedback,
} from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Droplets,
  Layers,
  ArrowUpRight,
  Sparkles,
  Sliders,
  History,
  CheckCircle2,
  Send,
  HelpCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  EyeOff,
  Route as RouteIcon,
  Building2,
  BarChart3,
} from 'lucide-react';
import { FloodBlindPanel } from '../components/floodblind/FloodBlindPanel';
import { RoadImpactSimulatorView } from '../components/roadimpact/RoadImpactSimulatorView';
import { CriticalInfrastructureView } from '../components/infrastructure/CriticalInfrastructureView';
import { EvaluationDashboardView } from '../components/evaluation/EvaluationDashboardView';

type RiskTab = 'PREDICTIVE' | 'FLOODBLIND' | 'ROAD_IMPACT' | 'INFRASTRUCTURE' | 'EVALUATION' | 'WHAT_IF' | 'HISTORY';

export const RiskIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RiskTab>('PREDICTIVE');
  const [intelligence, setIntelligence] = useState<MultiHorizonRiskAssessment | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>('NOW');
  const [loading, setLoading] = useState(true);

  // What-If Simulation State
  const [rainfallMultiplier, setRainfallMultiplier] = useState<number>(20); // +20%
  const [prolongedHours, setProlongedHours] = useState<number>(2);
  const [simulateBlockage, setSimulateBlockage] = useState<boolean>(true);
  const [excludeReports, setExcludeReports] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Historical Timeline State
  const [historySnapshots, setHistorySnapshots] = useState<any[]>([]);

  // Prediction Feedback State
  const [feedbackList, setFeedbackList] = useState<PredictionFeedback[]>([]);
  const [observedOutcome, setObservedOutcome] = useState<PredictionFeedback['observedOutcome']>('ACTUAL_FLOODING_OCCURRED');
  const [actualDepth, setActualDepth] = useState<string>('35');
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [intRes, histRes, fbRes] = await Promise.all([
          api.getLocationIntelligence(13.0827, 80.2707, 'Chennai Metropolitan River Basin'),
          api.getHistoryIntelligence(13.0827, 80.2707),
          api.getPredictionFeedbackList(),
        ]);
        setIntelligence(intRes);
        setHistorySnapshots(histRes.historySnapshots || []);
        setFeedbackList(fbRes.feedbackList || []);
      } catch (err) {
        console.warn('Failed to load risk intelligence data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Run What-If Simulation
  const handleRunSimulation = async () => {
    if (!intelligence) return;
    setSimulating(true);
    try {
      const res = await api.runRainfallSimulation({
        latitude: intelligence.location.latitude,
        longitude: intelligence.location.longitude,
        localityName: intelligence.location.localityName,
        rainfallMultiplierPercent: rainfallMultiplier,
        prolongedRainHours: prolongedHours,
        simulateRoadBlockage: simulateBlockage,
        excludeCommunityReports: excludeReports,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Submit Prediction Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intelligence) return;
    try {
      const res = await api.submitPredictionFeedback({
        latitude: intelligence.location.latitude,
        longitude: intelligence.location.longitude,
        localityName: intelligence.location.localityName,
        predictedCategory: intelligence.currentCategory,
        observedOutcome,
        actualWaterDepthCm: actualDepth ? Number(actualDepth) : undefined,
        comments: feedbackComments,
      });
      setFeedbackList((prev) => [res.feedback, ...prev]);
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Feedback submit error:', err);
    }
  };

  if (loading || !intelligence) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-xs text-carto-muted">
        Computing deterministic multi-horizon flood risk across active reports and meteorological feeds...
      </div>
    );
  }

  const activeHorizonData = intelligence.horizons[selectedHorizon] || intelligence.horizons.NOW;
  const aiExplanation = intelligence.aiAnalystExplanation;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-carto-muted mb-1">
          <span>Environmental Analytics</span>
          <span>/</span>
          <span className="text-forest">JalRakshak AI 2.0 Predictive Engine</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-carto-text">
          Hyperlocal Predictive Flood Intelligence
        </h1>
        <p className="text-xs text-carto-muted mt-1 max-w-3xl leading-relaxed">
          Proactively estimates localized waterlogging probability across multiple time horizons by synthesizing numerical weather predictions, topographical elevation, watershed drainage capacity, and ground-truth civic reports.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-carto-border pb-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('PREDICTIVE')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'PREDICTIVE'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Multi-Horizon Risk</span>
        </button>

        <button
          onClick={() => setActiveTab('FLOODBLIND')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'FLOODBLIND'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          <span>FloodBlind AI</span>
        </button>

        <button
          onClick={() => setActiveTab('ROAD_IMPACT')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'ROAD_IMPACT'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <RouteIcon className="w-4 h-4" />
          <span>Road Impact Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('INFRASTRUCTURE')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'INFRASTRUCTURE'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Critical Facilities</span>
        </button>

        <button
          onClick={() => setActiveTab('EVALUATION')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'EVALUATION'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Prediction Evaluation</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('WHAT_IF');
            if (!simulationResult) handleRunSimulation();
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'WHAT_IF'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'HISTORY'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface-muted'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historical Timeline</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PREDICTIVE MULTI-HORIZON INTELLIGENCE */}
      {/* ======================================================== */}
      {activeTab === 'PREDICTIVE' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Primary Score & Forecast Horizons (8 cols) */}
            <div className="lg:col-span-8 bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-carto-border pb-4 gap-3">
                <div>
                  <span className="text-xs font-mono uppercase text-carto-muted">
                    Observation Watershed
                  </span>
                  <h2 className="text-xl font-display font-bold text-carto-text mt-0.5">
                    {intelligence.location.localityName}
                  </h2>
                  <p className="text-xs text-carto-muted font-mono mt-0.5">
                    Elev: {intelligence.terrain.elevationMeters}m MSL &bull; Drainage: {intelligence.terrain.drainageCapacityCategory}
                  </p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-carto-muted block">Active Horizon</span>
                    <span className="text-xs font-bold text-forest font-mono">{selectedHorizon}</span>
                  </div>
                  <RiskBadge severity={activeHorizonData.category} size="lg" />
                </div>
              </div>

              {/* Large Numerical Score Visual */}
              <div className="flex items-baseline space-x-4">
                <span className="text-6xl sm:text-7xl font-display font-extrabold text-carto-text tracking-tight">
                  {activeHorizonData.overallScore}
                </span>
                <span className="text-xl font-mono text-carto-muted font-light">/ 100</span>
                <span className="text-xs font-mono px-2 py-1 rounded bg-surface-muted border border-carto-border text-carto-text">
                  Confidence: {activeHorizonData.confidence}
                </span>
              </div>

              {/* Horizon Selector Tabs */}
              <div>
                <label className="text-xs font-mono uppercase text-carto-muted block mb-2 font-semibold">
                  Select Forecast Horizon Outlook:
                </label>
                <div className="grid grid-cols-5 gap-2 bg-paper p-1.5 rounded-xl border border-carto-border">
                  {(['NOW', '1H', '3H', '6H', '24H'] as ForecastHorizon[]).map((h) => {
                    const hData = intelligence.horizons[h];
                    const isSelected = selectedHorizon === h;
                    return (
                      <button
                        key={h}
                        onClick={() => setSelectedHorizon(h)}
                        className={`py-2 px-1 rounded-lg text-center transition ${
                          isSelected
                            ? 'bg-surface text-forest font-bold shadow-sm border border-carto-border'
                            : 'text-carto-text hover:bg-surface/50 text-xs'
                        }`}
                      >
                        <span className="block font-mono text-xs">{h}</span>
                        <span className="block text-[10px] text-carto-muted font-normal mt-0.5">
                          {hData.accumulatedPrecipitationMm}mm
                        </span>
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full mt-1 ${
                            hData.category === 'CRITICAL'
                              ? 'bg-risk-crit'
                              : hData.category === 'HIGH'
                              ? 'bg-risk-high'
                              : hData.category === 'MODERATE'
                              ? 'bg-risk-mod'
                              : 'bg-risk-low'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Physical Summary Paragraph */}
              <p className="text-xs sm:text-sm text-carto-text leading-relaxed bg-surface-muted/60 p-4 rounded-xl border border-carto-border">
                {activeHorizonData.summary}
              </p>

              {/* Threshold Scale Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-carto-muted">
                  <span>0 (Low)</span>
                  <span>25 (Moderate)</span>
                  <span>50 (High)</span>
                  <span>75 (Critical)</span>
                  <span>100</span>
                </div>
                <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden border border-carto-border/60">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      activeHorizonData.category === 'CRITICAL'
                        ? 'bg-risk-crit'
                        : activeHorizonData.category === 'HIGH'
                        ? 'bg-risk-high'
                        : activeHorizonData.category === 'MODERATE'
                        ? 'bg-risk-mod'
                        : 'bg-risk-low'
                    }`}
                    style={{ width: `${activeHorizonData.overallScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Environmental Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Telemetry Box */}
              <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-4">
                <h3 className="font-display font-semibold text-base text-carto-text border-b border-carto-border pb-3">
                  Environmental Telemetry
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-carto-border/60">
                    <span className="text-carto-muted">Current Precipitation:</span>
                    <span className="font-mono font-bold text-forest-deep">
                      {intelligence.weatherTelemetry.currentPrecipitationMm} mm
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-carto-border/60">
                    <span className="text-carto-muted">Forecast Accumulation (6h):</span>
                    <span className="font-mono font-bold text-carto-accent">
                      {intelligence.weatherTelemetry.accumulated6hMm} mm
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-carto-border/60">
                    <span className="text-carto-muted">Nearest Natural Catchment:</span>
                    <span className="font-medium text-forest-deep text-right truncate max-w-[150px]">
                      {intelligence.terrain.nearestWaterbodyName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-carto-border/60">
                    <span className="text-carto-muted">Historical Chokepoint Index:</span>
                    <span className="font-mono font-bold text-forest-deep">
                      {intelligence.terrain.historicalVulnerabilityIndex} / 100
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-carto-muted">Data Freshness:</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-surface-muted text-forest font-semibold text-[11px]">
                      {intelligence.dataFreshness}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Warnings Card */}
              {intelligence.officialWarnings.length > 0 && (
                <div className="bg-surface rounded-2xl border border-carto-border p-5 shadow-carto space-y-3">
                  <div className="flex items-center space-x-2 text-forest-deep">
                    <AlertTriangle className="w-4 h-4 text-risk-high" />
                    <h4 className="font-display font-semibold text-sm">Official Warning</h4>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-forest-deep">
                      {intelligence.officialWarnings[0].headline}
                    </div>
                    <p className="text-carto-muted leading-relaxed text-[11px]">
                      {intelligence.officialWarnings[0].description}
                    </p>
                    <p className="text-[10px] font-mono text-carto-muted pt-1">
                      Issuing Agency: {intelligence.officialWarnings[0].issuingAgency}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amazon Bedrock AI Analyst Explanation */}
          {aiExplanation && (
            <div className="bg-forest-subtle/50 rounded-2xl border border-forest/20 p-6 sm:p-8 space-y-4 shadow-carto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-forest/20 gap-2">
                <div className="flex items-center space-x-2 text-forest font-bold">
                  <Sparkles className="w-5 h-5 text-forest" />
                  <span className="font-display text-lg">Amazon Bedrock AI Analyst Review</span>
                </div>
                <span className="text-xs font-mono text-carto-muted">
                  Model: {aiExplanation.modelIdentifier} &bull; Verified Inference
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-carto-text">
                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-forest-deep block mb-1">Executive Physical Assessment:</span>
                    <p className="bg-surface/70 p-3 rounded-xl border border-carto-border">
                      {aiExplanation.summary}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-forest-deep block mb-1">Horizon Progression Outlook:</span>
                    <p className="bg-surface/70 p-3 rounded-xl border border-carto-border">
                      {aiExplanation.horizonProgression}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-forest-deep block mb-1">Ground Evidence & Missing Telemetry:</span>
                    <p className="bg-surface/70 p-3 rounded-xl border border-carto-border">
                      {aiExplanation.communityEvidenceSynthesis} {aiExplanation.missingTelemetry}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-forest-deep block mb-1">Scientific Uncertainty Caveat:</span>
                    <p className="bg-surface/70 p-3 rounded-xl border border-carto-border italic text-carto-muted">
                      {aiExplanation.uncertaintyStatement}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contributing Physical Factors */}
          <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-4">
            <h3 className="font-display font-bold text-lg text-carto-text border-b border-carto-border pb-3">
              Mathematical Score Breakdown ({selectedHorizon} Horizon)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeHorizonData.factors.map((f, i) => (
                <div key={i} className="p-4 rounded-xl bg-paper border border-carto-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest-deep">{f.name}</span>
                    <span className="font-mono font-bold text-forest">+{f.weight} pts</span>
                  </div>
                  <p className="text-carto-text leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: FLOODBLIND AI (MONITORING GAPS & BLIND SPOTS) */}
      {/* ======================================================== */}
      {activeTab === 'FLOODBLIND' && (
        <div className="space-y-8 animate-fade-in">
          <FloodBlindPanel />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ROAD-LEVEL FLOOD IMPACT SIMULATOR */}
      {/* ======================================================== */}
      {activeTab === 'ROAD_IMPACT' && (
        <div className="space-y-8 animate-fade-in">
          <RoadImpactSimulatorView />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: CRITICAL INFRASTRUCTURE & FACILITY ACCESS */}
      {/* ======================================================== */}
      {activeTab === 'INFRASTRUCTURE' && (
        <div className="space-y-8 animate-fade-in">
          <CriticalInfrastructureView />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: WHAT-IF SCENARIO SIMULATOR */}
      {/* ======================================================== */}
      {activeTab === 'WHAT_IF' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-forest font-semibold text-xs font-mono mb-1">
                <Sliders className="w-4 h-4" />
                <span>Stress-Testing & Emergency Simulation</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-forest-deep">
                Hypothetical Rainfall & Road Blockage Explorer
              </h2>
              <p className="text-xs text-carto-muted mt-1 leading-relaxed max-w-2xl">
                Simulate how the local flood risk score would respond under increased rainfall intensity, prolonged storm duration, or critical road artery closures.
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-paper border border-carto-border">
              {/* Rain Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Precipitation Adjustment:</span>
                  <span className="font-mono font-bold text-forest">
                    {rainfallMultiplier >= 0 ? `+${rainfallMultiplier}%` : `${rainfallMultiplier}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  step="10"
                  value={rainfallMultiplier}
                  onChange={(e) => setRainfallMultiplier(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer"
                />
                <span className="text-[10px] text-carto-muted block">Scales observed & forecast rainfall</span>
              </div>

              {/* Prolonged Rain Hours */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Sustained Storm Duration:</span>
                  <span className="font-mono font-bold text-forest">+{prolongedHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={prolongedHours}
                  onChange={(e) => setProlongedHours(Number(e.target.value))}
                  className="w-full accent-forest cursor-pointer"
                />
                <span className="text-[10px] text-carto-muted block">Simulates continuous cloudburst runoff</span>
              </div>

              {/* Road Blockage Toggle */}
              <div className="space-y-2">
                <span className="text-xs font-medium block">Simulate Arterial Closure:</span>
                <label className="flex items-center space-x-2 text-xs cursor-pointer p-2 rounded bg-surface border border-carto-border">
                  <input
                    type="checkbox"
                    checked={simulateBlockage}
                    onChange={(e) => setSimulateBlockage(e.target.checked)}
                    className="accent-forest"
                  />
                  <span>Critical Underpass Blocked</span>
                </label>
              </div>

              {/* Exclude Reports Toggle */}
              <div className="space-y-2">
                <span className="text-xs font-medium block">Proactive Model-Only:</span>
                <label className="flex items-center space-x-2 text-xs cursor-pointer p-2 rounded bg-surface border border-carto-border">
                  <input
                    type="checkbox"
                    checked={excludeReports}
                    onChange={(e) => setExcludeReports(e.target.checked)}
                    className="accent-forest"
                  />
                  <span>Exclude Ground Reports</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-deep text-white font-semibold text-xs transition flex items-center space-x-2 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                <span>{simulating ? 'Simulating...' : 'Recalculate Scenario'}</span>
              </button>
            </div>

            {/* Simulation Results Display */}
            {simulationResult && (
              <div className="p-6 rounded-2xl bg-surface-muted/60 border border-carto-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-carto-border gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                      Hypothetical Simulation
                    </span>
                    <span className="text-xs text-carto-muted font-mono">
                      ID: {simulationResult.simulationId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span>Score Delta:</span>
                    <span className={`font-bold ${simulationResult.deltaScore >= 0 ? 'text-risk-crit' : 'text-forest'}`}>
                      {simulationResult.deltaScore >= 0 ? `+${simulationResult.deltaScore}` : simulationResult.deltaScore} pts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface border border-carto-border text-center space-y-1">
                    <span className="text-xs font-mono text-carto-muted uppercase">Baseline Risk Score</span>
                    <div className="text-4xl font-display font-bold text-forest-deep">
                      {simulationResult.baselineScore} / 100
                    </div>
                    <RiskBadge severity={simulationResult.baselineCategory} size="sm" />
                  </div>

                  <div className="p-4 rounded-xl bg-surface border border-carto-border text-center space-y-1">
                    <span className="text-xs font-mono text-carto-muted uppercase">Simulated Risk Score</span>
                    <div className="text-4xl font-display font-bold text-risk-crit">
                      {simulationResult.simulatedScore} / 100
                    </div>
                    <RiskBadge severity={simulationResult.simulatedCategory} size="sm" />
                  </div>
                </div>

                {/* Horizon breakdown in simulation */}
                <div>
                  <span className="text-xs font-bold text-forest-deep block mb-2">Simulated Multi-Horizon Projections:</span>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {(['NOW', '1H', '3H', '6H', '24H'] as ForecastHorizon[]).map((h) => {
                      const hSim = simulationResult.horizonForecasts[h];
                      return (
                        <div key={h} className="p-2.5 rounded-lg bg-surface border border-carto-border">
                          <span className="font-mono font-bold block">{h}</span>
                          <span className="text-xs font-mono text-carto-accent">{hSim.precipitationMm}mm</span>
                          <div className="mt-1">
                            <RiskBadge severity={hSim.category} size="sm" showIcon={false} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-carto-muted italic pt-2 border-t border-carto-border">
                  {simulationResult.disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HISTORICAL TIMELINE */}
      {/* ======================================================== */}
      {activeTab === 'HISTORY' && (
        <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-display font-bold text-forest-deep">
              Historical Observation Timeline
            </h2>
            <p className="text-xs text-carto-muted mt-1">
              Archived flood risk snapshots recorded for this geographical sector during preceding observation windows.
            </p>
          </div>

          <div className="relative pl-6 border-l-2 border-forest/30 space-y-6 text-xs">
            {historySnapshots.map((item, idx) => (
              <div key={idx} className="relative space-y-1">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-forest border-2 border-white shadow-xs" />
                <div className="flex items-center space-x-2 text-carto-muted font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                  <span>&bull;</span>
                  <RiskBadge severity={item.category} size="sm" showIcon={false} />
                </div>
                <div className="font-bold text-forest-deep text-sm">{item.event}</div>
                <p className="text-carto-text">
                  Assessed Score: <span className="font-mono font-semibold">{item.score}/100</span> &bull; Telemetry Rainfall: <span className="font-mono font-semibold">{item.rainfallMm}mm</span> &bull; Verified Reports: <span className="font-mono font-semibold">{item.reportCount}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PREDICTION VS REALITY EVALUATION */}
      {/* ======================================================== */}
      {activeTab === 'EVALUATION' && (
        <div className="space-y-8 animate-fade-in">
          <EvaluationDashboardView />
          {/* Submission Form */}
          <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-4">
            <div>
              <h2 className="text-xl font-display font-bold text-forest-deep">
                Contribute Ground-Truth Verification
              </h2>
              <p className="text-xs text-carto-muted mt-1 leading-relaxed">
                Did flooding or severe waterlogging actually occur at your location during the forecast window? Help validate and backtest our risk engine.
              </p>
            </div>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-xl bg-forest-subtle border border-forest/30 text-xs text-forest space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Feedback Recorded Successfully!</span>
                </div>
                <p>Thank you for contributing to ground-truth model evaluation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-forest-deep block mb-1">Observed Outcome:</label>
                    <select
                      value={observedOutcome}
                      onChange={(e) => setObservedOutcome(e.target.value as any)}
                      className="w-full bg-paper border border-carto-border rounded-lg p-2.5 text-xs text-carto-text"
                    >
                      <option value="ACTUAL_FLOODING_OCCURRED">Flooding Occurred (Road Submerged)</option>
                      <option value="MINOR_WATERLOGGING_ONLY">Minor Puddles / Passable Service Lanes</option>
                      <option value="NO_FLOODING_OBSERVED">No Flooding Observed (Clear Carriageway)</option>
                      <option value="UNSURE">Unsure / Left Sector Early</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-forest-deep block mb-1">Water Depth Observed (cm):</label>
                    <input
                      type="number"
                      value={actualDepth}
                      onChange={(e) => setActualDepth(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full bg-paper border border-carto-border rounded-lg p-2.5 text-xs text-carto-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-forest-deep block mb-1">Local Observations / Comments:</label>
                  <textarea
                    rows={2}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Describe specific drainage behavior, pump operations, or underpass clearance..."
                    className="w-full bg-paper border border-carto-border rounded-lg p-2.5 text-xs text-carto-text"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-forest hover:bg-forest-deep text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Ground-Truth Feedback</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Past Feedback Directory */}
          <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-4">
            <h3 className="font-display font-semibold text-base text-forest-deep border-b border-carto-border pb-3">
              Ground-Truth Verification Log
            </h3>
            <div className="divide-y divide-carto-border text-xs">
              {feedbackList.map((item) => (
                <div key={item.feedbackId} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest-deep">{item.localityName}</span>
                    <span className="font-mono text-carto-muted text-[11px]">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-carto-muted">Predicted:</span>
                    <RiskBadge severity={item.predictedCategory} size="sm" showIcon={false} />
                    <span className="text-carto-muted">&bull; Observed:</span>
                    <span className="font-mono font-semibold text-forest">
                      {item.observedOutcome.replace(/_/g, ' ')}
                    </span>
                    {item.actualWaterDepthCm !== undefined && (
                      <span className="font-mono text-carto-muted">({item.actualWaterDepthCm} cm)</span>
                    )}
                  </div>
                  {item.comments && <p className="text-carto-text italic mt-1">"{item.comments}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
