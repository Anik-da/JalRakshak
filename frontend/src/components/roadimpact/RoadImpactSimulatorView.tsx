import React, { useState, useEffect } from 'react';
import {
  Route as RouteIcon,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Compass,
} from 'lucide-react';
import { RoadImpactSimulationResult, RoadSegmentImpact } from '../../types';
import { api } from '../../services/api';

export const RoadImpactSimulatorView: React.FC = () => {
  const [rainfallMm, setRainfallMm] = useState<number>(35);
  const [result, setResult] = useState<RoadImpactSimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (rainValue: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runRoadImpactSimulation(rainValue);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Road impact simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(rainfallMm);
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRainfallMm(val);
  };

  const handleApplyScenario = () => {
    runSimulation(rainfallMm);
  };

  return (
    <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-carto-border gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-forest mb-1 font-semibold">
            <RouteIcon className="w-4 h-4 shrink-0" />
            <span>ROAD-LEVEL FLOOD IMPACT SIMULATOR</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-carto-text">
            Arterial Corridor Inundation Modeling
          </h2>
          <p className="text-xs text-carto-muted mt-1 max-w-2xl leading-relaxed">
            Estimates which major urban road segments and underpass carriageways could be affected under escalating rainfall scenarios.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-carto-muted border border-carto-border">
            Interactive Scenario Sandbox
          </span>
        </div>
      </div>

      {/* Interactive Rainfall Slider */}
      <div className="p-4 sm:p-5 rounded-xl bg-paper border border-carto-border space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-forest" />
            <span className="text-xs font-mono font-bold uppercase text-carto-text">
              Simulated 3-Hour Cumulative Downpour
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold font-mono text-forest">{rainfallMm} mm</span>
            <button
              onClick={handleApplyScenario}
              disabled={loading}
              className="bg-forest hover:bg-forest-deep text-white px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition shadow-xs"
            >
              {loading ? 'Evaluating...' : 'Simulate Runoff'}
            </button>
          </div>
        </div>

        <input
          type="range"
          min="5"
          max="80"
          step="5"
          value={rainfallMm}
          onChange={handleSliderChange}
          className="w-full accent-forest cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-carto-muted">
          <span>5mm (Light Showers)</span>
          <span>25mm (Moderate Downpour)</span>
          <span>45mm (Heavy Monsoon)</span>
          <span>80mm (Extreme Squall)</span>
        </div>
      </div>

      {/* Results KPI strip */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-paper rounded-lg border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Corridors Scanned</span>
            <strong className="text-xl text-carto-text block mt-0.5">{result.segments.length}</strong>
          </div>
          <div className="p-3 bg-risk-crit-bg/40 rounded-lg border border-risk-crit/30">
            <span className="text-[10px] text-risk-crit uppercase block font-bold">Affected Segments</span>
            <strong className="text-xl text-risk-crit block mt-0.5">{result.affectedSegmentsCount}</strong>
          </div>
          <div className="p-3 bg-paper rounded-lg border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Confirmed Blockages</span>
            <strong className="text-xl text-carto-text block mt-0.5">{result.blockedConfirmedCount}</strong>
          </div>
          <div className="p-3 bg-paper rounded-lg border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Confidence Level</span>
            <strong className="text-xl text-forest block mt-0.5">High / Calibrated</strong>
          </div>
        </div>
      )}

      {/* Segments table / cards */}
      <div className="space-y-3">
        {loading && (
          <div className="p-8 text-center text-xs font-mono text-carto-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest" />
            <span>Calculating hydrodynamic drainage thresholds...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-risk-crit-bg text-risk-crit text-xs font-mono rounded-lg">
            {error}
          </div>
        )}

        {!loading && result && result.segments.map((seg) => (
          <div
            key={seg.segmentId}
            className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
              seg.status === 'CONFIRMED_HAZARD'
                ? 'bg-risk-crit-bg/20 border-risk-crit/30'
                : seg.status === 'ELEVATED_RISK_ESTIMATED'
                ? 'bg-risk-mod-bg/20 border-risk-mod/30'
                : seg.status === 'INSUFFICIENT_DATA'
                ? 'bg-surface-muted/40 border-carto-border'
                : 'bg-paper border-carto-border'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-display font-bold text-sm text-carto-text">
                    {seg.roadName}
                  </h3>
                  {seg.isKnownUnderpassOrLowPoint && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-risk-crit-bg text-risk-crit font-mono font-bold">
                      LOW-POINT UNDERPASS
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-carto-muted mt-0.5">
                  Corridor: {seg.corridor} • Elev:{' '}
                  {seg.elevationMslMeters > 0 ? `${seg.elevationMslMeters}m MSL` : 'Unmapped'}
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center space-x-1.5 text-[10px] px-2.5 py-1 rounded font-mono font-bold border ${
                    seg.status === 'CONFIRMED_HAZARD'
                      ? 'bg-risk-crit-bg text-risk-crit border-risk-crit/40'
                      : seg.status === 'ELEVATED_RISK_ESTIMATED'
                      ? 'bg-risk-mod-bg text-risk-mod border-risk-mod/40'
                      : seg.status === 'INSUFFICIENT_DATA'
                      ? 'bg-surface-muted text-carto-muted border-carto-border'
                      : 'bg-forest-subtle text-forest border-forest/30'
                  }`}
                >
                  {seg.status === 'CONFIRMED_HAZARD' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  {seg.status === 'ELEVATED_RISK_ESTIMATED' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  {seg.status === 'INSUFFICIENT_DATA' && <HelpCircle className="w-3.5 h-3.5 shrink-0" />}
                  {seg.status === 'PASSABLE_NORMAL' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{seg.status.replace(/_/g, ' ')}</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-carto-text leading-relaxed">
              {seg.primaryRiskReason}
            </p>

            {/* Suggested alternative detour */}
            {seg.suggestedAlternativeRoute && (
              <div className="p-2.5 rounded bg-forest-subtle/80 border border-forest/20 text-[11px] flex items-center space-x-2 text-forest">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Recommended Safer Detour:</strong> {seg.suggestedAlternativeRoute}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {result && (
        <div className="p-3 rounded-lg bg-paper border border-carto-border text-[11px] font-mono text-carto-muted">
          {result.disclaimer}
        </div>
      )}
    </div>
  );
};
