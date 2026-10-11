import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { EvaluationDashboardMetrics, PredictionEvaluationRecord } from '../../types';
import { api } from '../../services/api';

export const EvaluationDashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvaluationDashboard();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-carto-border gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-forest mb-1 font-semibold">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>PREDICTION VS REALITY HISTORICAL EVALUATION</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-carto-text">
            Forecast Verification & Ground Corroboration
          </h2>
          <p className="text-xs text-carto-muted mt-1 max-w-2xl leading-relaxed">
            Transparently evaluates past risk predictions against subsequent verified citizen flood reports and municipal field outcomes.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 text-xs font-mono bg-paper hover:bg-surface-muted px-3 py-1.5 rounded-lg border border-carto-border text-carto-text transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Evaluation</span>
        </button>
      </div>

      {/* KPI metrics grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-forest-subtle border border-forest/20">
            <span className="text-[10px] text-forest uppercase block font-bold">Accurate Elevated</span>
            <strong className="text-xl text-forest block mt-1">{metrics.accurateElevatedCount}</strong>
            <span className="text-[10px] text-forest/80 mt-0.5 block">Predicted & verified</span>
          </div>

          <div className="p-3 rounded-xl bg-paper border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Accurate Clear</span>
            <strong className="text-xl text-carto-text block mt-1">{metrics.accurateClearCount}</strong>
            <span className="text-[10px] text-carto-muted mt-0.5 block">Predicted dry & remained clear</span>
          </div>

          <div className="p-3 rounded-xl bg-risk-mod-bg/40 border border-risk-mod/20">
            <span className="text-[10px] text-risk-mod uppercase block font-bold">False Alarms</span>
            <strong className="text-xl text-risk-mod block mt-1">{metrics.falseAlarmCount}</strong>
            <span className="text-[10px] text-risk-mod/80 mt-0.5 block">Precipitation absorbed</span>
          </div>

          <div className="p-3 rounded-xl bg-risk-crit-bg/40 border border-risk-crit/20">
            <span className="text-[10px] text-risk-crit uppercase block font-bold">Missed Hazards</span>
            <strong className="text-xl text-risk-crit block mt-1">{metrics.missedHazardCount}</strong>
            <span className="text-[10px] text-risk-crit/80 mt-0.5 block">Unexpected drainage block</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-muted border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Insufficient Data</span>
            <strong className="text-xl text-carto-muted block mt-1">{metrics.insufficientDataCount}</strong>
            <span className="text-[10px] text-carto-muted mt-0.5 block">No ground corroboration</span>
          </div>
        </div>
      )}

      {/* Historical prediction evaluation records list */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-bold text-carto-text">
          Logged Prediction Evaluations Timeline
        </h3>

        {loading && (
          <div className="p-8 text-center text-xs font-mono text-carto-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest" />
            <span>Analyzing historical predictions against ground reports...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-risk-crit-bg text-risk-crit text-xs font-mono rounded-lg">
            {error}
          </div>
        )}

        {!loading && metrics && metrics.evaluationRecords.map((rec) => (
          <div
            key={rec.predictionId}
            className="p-4 rounded-xl bg-paper border border-carto-border text-xs space-y-2 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <strong className="font-display font-bold text-sm text-carto-text">
                  {rec.localityName}
                </strong>
                <div className="text-[11px] font-mono text-carto-muted">
                  Predicted Score: {rec.predictedRiskScore}/100 ({rec.predictedCategory}) • Date:{' '}
                  {new Date(rec.timestamp).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold border ${
                    rec.evaluationResult === 'ACCURATE_ELEVATED'
                      ? 'bg-forest-subtle text-forest border-forest/30'
                      : rec.evaluationResult === 'FALSE_ALARM'
                      ? 'bg-risk-mod-bg text-risk-mod border-risk-mod/30'
                      : rec.evaluationResult === 'MISSED_HAZARD'
                      ? 'bg-risk-crit-bg text-risk-crit border-risk-crit/30'
                      : 'bg-surface-muted text-carto-muted border-carto-border'
                  }`}
                >
                  {rec.evaluationResult.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-carto-text leading-relaxed">
              {rec.notes}
            </p>

            <div className="text-[10px] font-mono text-carto-muted pt-1 border-t border-carto-border/60">
              Inputs: {rec.inputsUsed.rainfallMm}mm rain • Vulnerability: {rec.inputsUsed.terrainVulnerability}% • Reports: {rec.inputsUsed.communityReportsAvailable}
            </div>
          </div>
        ))}
      </div>

      {metrics && (
        <div className="p-3.5 rounded-lg bg-surface-muted text-[11px] font-mono text-carto-muted border border-carto-border leading-relaxed">
          {metrics.scientificValidationDisclaimer}
        </div>
      )}
    </div>
  );
};
