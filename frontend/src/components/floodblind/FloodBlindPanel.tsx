import React, { useState, useEffect } from 'react';
import {
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { FloodBlindSummary, FloodBlindZone } from '../../types';
import { api } from '../../services/api';
import { RiskBadge } from '../common/RiskBadge';

interface FloodBlindPanelProps {
  onSelectZone?: (zone: FloodBlindZone) => void;
  className?: string;
}

export const FloodBlindPanel: React.FC<FloodBlindPanelProps> = ({
  onSelectZone,
  className = '',
}) => {
  const [summary, setSummary] = useState<FloodBlindSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<'ALL' | 'URGENT' | 'SUGGESTED'>('ALL');

  const loadFloodBlindData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFloodBlindSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate FloodBlind AI monitoring gaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFloodBlindData();
  }, []);

  const filteredZones = summary
    ? summary.activeGapZones.filter((z) => {
        if (selectedPriorityFilter === 'URGENT') return z.verificationPriority === 'URGENT_GROUND_CHECK';
        if (selectedPriorityFilter === 'SUGGESTED') return z.verificationPriority === 'MONITORING_SUGGESTED';
        return true;
      })
    : [];

  return (
    <div className={`bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-carto-border gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-risk-crit mb-1 font-semibold">
            <EyeOff className="w-4 h-4 shrink-0" />
            <span>FLOODBLIND AI • PROACTIVE RISK DETECTION WITHOUT CITIZEN REPORTS</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-carto-text">
            Monitoring-Gap & Blindspot Identification
          </h2>
          <p className="text-xs text-carto-muted mt-1 max-w-2xl leading-relaxed">
            Identifies urban drainage sectors with elevated estimated inundation risk where few or zero ground community reports exist. Flagged as <strong className="text-carto-text">Potential Risk — Needs Verification</strong>.
          </p>
        </div>

        <button
          onClick={loadFloodBlindData}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 text-xs font-mono bg-paper hover:bg-surface-muted px-3 py-1.5 rounded-lg border border-carto-border text-carto-text transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Critical Rule Banner */}
      <div className="p-3.5 rounded-xl bg-risk-mod-bg/60 border border-risk-mod/30 text-xs text-carto-text flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-risk-mod shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-risk-mod block font-display">
            Critical Safety Principle: Absence of Ground Reports Does Not Mean Safety
          </strong>
          <p className="text-[11px] text-carto-muted leading-relaxed">
            Unreported sectors with low-lying elevation, saturated soils, and heavy forecast precipitation carry high waterlogging probability. Never assume a route or locality is safe merely because no resident has logged a report.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-paper border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Monitored Sectors</span>
            <strong className="text-2xl text-carto-text font-bold mt-1 block">
              {summary.totalMonitoredZones} Sectors
            </strong>
            <span className="text-[11px] text-carto-muted mt-0.5 block">
              Continuous meteorological scan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-risk-crit-bg/40 border border-risk-crit/20">
            <span className="text-[10px] text-risk-crit uppercase block font-bold">Unreported Blindspots</span>
            <strong className="text-2xl text-risk-crit font-bold mt-1 block">
              {summary.blindSpotsCount} Basins
            </strong>
            <span className="text-[11px] text-risk-crit/80 mt-0.5 block">
              Elevated risk with 0 ground reports
            </span>
          </div>

          <div className="p-4 rounded-xl bg-forest-subtle border border-forest/20">
            <span className="text-[10px] text-forest uppercase block font-bold">Urgent Verification</span>
            <strong className="text-2xl text-forest font-bold mt-1 block">
              {summary.urgentVerificationCount} Priority
            </strong>
            <span className="text-[11px] text-forest/80 mt-0.5 block">
              Warden check recommended
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs font-mono">
        <span className="text-carto-muted">Filter Priority:</span>
        <button
          onClick={() => setSelectedPriorityFilter('ALL')}
          className={`px-2.5 py-1 rounded transition ${
            selectedPriorityFilter === 'ALL'
              ? 'bg-forest text-white font-bold'
              : 'bg-paper text-carto-text border border-carto-border hover:bg-surface-muted'
          }`}
        >
          All Monitored ({summary?.activeGapZones.length || 0})
        </button>
        <button
          onClick={() => setSelectedPriorityFilter('URGENT')}
          className={`px-2.5 py-1 rounded transition ${
            selectedPriorityFilter === 'URGENT'
              ? 'bg-risk-crit text-white font-bold'
              : 'bg-paper text-carto-text border border-carto-border hover:bg-surface-muted'
          }`}
        >
          Urgent Ground Check ({summary?.urgentVerificationCount || 0})
        </button>
        <button
          onClick={() => setSelectedPriorityFilter('SUGGESTED')}
          className={`px-2.5 py-1 rounded transition ${
            selectedPriorityFilter === 'SUGGESTED'
              ? 'bg-risk-mod text-white font-bold'
              : 'bg-paper text-carto-text border border-carto-border hover:bg-surface-muted'
          }`}
        >
          Monitoring Suggested
        </button>
      </div>

      {/* Gap Zones List */}
      <div className="space-y-3">
        {loading && (
          <div className="p-8 text-center text-xs font-mono text-carto-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest" />
            <span>Scanning urban sectors for unmonitored flood risk...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-risk-crit-bg text-risk-crit text-xs font-mono">
            {error}
          </div>
        )}

        {!loading && filteredZones.map((zone) => (
          <div
            key={zone.zoneId}
            className="p-4 rounded-xl bg-paper border border-carto-border hover:border-forest/40 transition space-y-3 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-forest shrink-0" />
                  <h3 className="font-display font-bold text-base text-carto-text">
                    {zone.name}
                  </h3>
                  {zone.isHistoricalChokepoint && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-risk-mod-bg text-risk-mod border border-risk-mod/30 font-mono font-bold">
                      HISTORICAL CHOKEPOINT
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-carto-muted">
                  {zone.center[0].toFixed(4)}°N, {zone.center[1].toFixed(4)}°E • Telemetry:{' '}
                  <span className="text-forest font-bold">{zone.dataFreshness}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold border ${
                    zone.verificationPriority === 'URGENT_GROUND_CHECK'
                      ? 'bg-risk-crit-bg text-risk-crit border-risk-crit/40'
                      : zone.verificationPriority === 'MONITORING_SUGGESTED'
                      ? 'bg-risk-mod-bg text-risk-mod border-risk-mod/40'
                      : 'bg-forest-subtle text-forest border-forest/30'
                  }`}
                >
                  {zone.verificationPriority.replace(/_/g, ' ')}
                </span>
                <RiskBadge severity={zone.estimatedCategory} size="sm" />
              </div>
            </div>

            {/* Metrics strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded bg-surface border border-carto-border">
                <span className="text-[10px] text-carto-muted block">Monitoring Gap Index</span>
                <strong className="text-forest font-bold">{zone.monitoringGapIndex} / 100</strong>
              </div>
              <div className="p-2 rounded bg-surface border border-carto-border">
                <span className="text-[10px] text-carto-muted block">Ground Reports</span>
                <strong className={zone.groundReportCount === 0 ? 'text-risk-crit font-bold' : 'text-carto-text'}>
                  {zone.groundReportCount} reports logged
                </strong>
              </div>
              <div className="p-2 rounded bg-surface border border-carto-border">
                <span className="text-[10px] text-carto-muted block">Status Flag</span>
                <strong className="text-risk-mod text-[11px] truncate block">
                  NEEDS VERIFICATION
                </strong>
              </div>
              <div className="p-2 rounded bg-surface border border-carto-border">
                <span className="text-[10px] text-carto-muted block">Estimated Score</span>
                <strong className="text-carto-text font-bold">{zone.estimatedRiskScore} / 100</strong>
              </div>
            </div>

            {/* Influencing factors & missing telemetry */}
            <div className="text-xs space-y-1.5 pt-1 border-t border-carto-border">
              <div>
                <span className="text-[11px] font-mono text-carto-muted uppercase block font-semibold">
                  Influencing Evidence:
                </span>
                <ul className="list-disc list-inside text-carto-text text-[11px] space-y-0.5">
                  {zone.influencingFactors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {zone.missingTelemetry.length > 0 && (
                <div className="text-[11px] text-carto-muted italic">
                  Missing Telemetry: {zone.missingTelemetry.join(' • ')}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {onSelectZone && (
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => onSelectZone(zone)}
                  className="text-xs font-mono text-forest hover:underline flex items-center space-x-1"
                >
                  <span>Focus on Map</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
