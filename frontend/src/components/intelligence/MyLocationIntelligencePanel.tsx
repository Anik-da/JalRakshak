import React, { useState } from 'react';
import {
  MultiHorizonRiskAssessment,
  ForecastHorizon,
  SeverityLevel,
} from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import {
  CloudRain,
  Crosshair,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  Compass,
  ChevronRight,
  Droplets,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface MyLocationIntelligencePanelProps {
  intelligence: MultiHorizonRiskAssessment | null;
  loading: boolean;
  onLocateMe: () => void;
  locating: boolean;
  selectedHorizon: ForecastHorizon;
  onSelectHorizon: (h: ForecastHorizon) => void;
  onOpenAssistant?: () => void;
  className?: string;
}

export const MyLocationIntelligencePanel: React.FC<MyLocationIntelligencePanelProps> = ({
  intelligence,
  loading,
  onLocateMe,
  locating,
  selectedHorizon,
  onSelectHorizon,
  onOpenAssistant,
  className = '',
}) => {
  const [expandedSection, setExpandedSection] = useState<'FACTORS' | 'PRECAUTIONS' | 'DETAILS'>('FACTORS');

  if (loading) {
    return (
      <div className={`bg-surface/95 backdrop-blur-md rounded-lg border border-carto-border p-4 shadow-carto animate-pulse ${className}`}>
        <div className="flex items-center justify-between pb-3 border-b border-carto-border">
          <div className="h-5 bg-surface-muted rounded w-48" />
          <div className="h-5 bg-surface-muted rounded w-20" />
        </div>
        <div className="py-4 space-y-2">
          <div className="h-4 bg-surface-muted rounded w-full" />
          <div className="h-4 bg-surface-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className={`bg-surface/95 backdrop-blur-md rounded-lg border border-carto-border p-4 shadow-carto ${className}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-forest" />
              <h3 className="font-display font-semibold text-sm text-forest-deep">
                My Location Intelligence
              </h3>
            </div>
            <p className="text-xs text-carto-muted mt-1">
              Proactive flood risk and meteorological telemetry calculated for your immediate coordinates.
            </p>
          </div>
          <button
            onClick={onLocateMe}
            disabled={locating}
            className="inline-flex items-center space-x-1.5 bg-forest hover:bg-forest-deep text-white text-xs px-3 py-1.5 rounded-md transition font-medium shadow-carto-sm shrink-0"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Acquiring...' : 'Locate Me'}</span>
          </button>
        </div>
      </div>
    );
  }

  const activeHorizonData = intelligence.horizons[selectedHorizon] || intelligence.horizons.NOW;
  const warnings = intelligence.officialWarnings || [];
  const primaryWarning = warnings[0];
  const aiExplanation = intelligence.aiAnalystExplanation;

  return (
    <div className={`bg-surface/95 backdrop-blur-md rounded-xl border border-carto-border shadow-carto overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="bg-surface-muted/60 px-4 py-2.5 border-b border-carto-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-carto-muted font-semibold">
            Location Intelligence Active
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-carto-border font-mono text-forest">
            {intelligence.dataFreshness}
          </span>
        </div>
        <button
          onClick={onLocateMe}
          disabled={locating}
          className="text-xs text-forest hover:text-forest-deep font-medium flex items-center space-x-1"
        >
          <Crosshair className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Updating...' : 'Re-center'}</span>
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Locality & Main Score */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-carto-accent shrink-0" />
              <h2 className="font-display font-bold text-base text-forest-deep truncate max-w-[240px]">
                {intelligence.location.localityName}
              </h2>
            </div>
            <p className="text-[11px] font-mono text-carto-muted mt-0.5">
              {intelligence.location.latitude.toFixed(3)}°N, {intelligence.location.longitude.toFixed(3)}°E • Elev: {intelligence.terrain.elevationMeters}m MSL
            </p>
          </div>

          <div className="text-right">
            <RiskBadge severity={activeHorizonData.category} size="sm" />
            <div className="text-[10px] font-mono text-carto-muted mt-0.5">
              Score: {activeHorizonData.overallScore}/100
            </div>
          </div>
        </div>

        {/* Official Meteorological Warning Banner if present */}
        {primaryWarning && (
          <div
            className="rounded-lg p-2.5 border text-xs flex items-start space-x-2"
            style={{
              backgroundColor: `${primaryWarning.colorCode}15`,
              borderColor: `${primaryWarning.colorCode}40`,
            }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primaryWarning.colorCode }} />
            <div>
              <div className="font-semibold text-forest-deep flex items-center space-x-1.5">
                <span style={{ color: primaryWarning.colorCode }}>{primaryWarning.severity} ALERT:</span>
                <span>{primaryWarning.headline}</span>
              </div>
              <p className="text-[11px] text-carto-text mt-0.5 leading-relaxed">
                {primaryWarning.description}
              </p>
              <p className="text-[10px] font-mono text-carto-muted mt-1">
                Issued by {primaryWarning.issuingAgency}
              </p>
            </div>
          </div>
        )}

        {/* Weather Telemetry Snapshot */}
        <div className="grid grid-cols-3 gap-2 bg-paper/80 rounded-lg p-2.5 border border-carto-border text-center">
          <div>
            <span className="text-[10px] font-mono uppercase text-carto-muted block">Observed Rain</span>
            <span className="text-sm font-bold text-forest-deep font-mono">
              {intelligence.weatherTelemetry.currentPrecipitationMm} <span className="text-xs font-normal">mm</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-carto-muted block">Drainage Basin</span>
            <span className="text-xs font-semibold text-carto-text truncate block mt-0.5">
              {intelligence.terrain.drainageCapacityCategory}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-carto-muted block">Ground Reports</span>
            <span className="text-sm font-bold text-forest-deep font-mono">
              {intelligence.nearbyActiveReports.length} <span className="text-xs font-normal">nearby</span>
            </span>
          </div>
        </div>

        {/* Forecast Horizon Tabs (Now / 1h / 3h / 6h / 24h) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-forest-deep flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-forest" />
              <span>Forecast Horizon Assessment:</span>
            </span>
            <span className="text-[10px] font-mono text-carto-muted">
              {activeHorizonData.timeLabel}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 bg-surface-muted p-1 rounded-lg border border-carto-border">
            {(['NOW', '1H', '3H', '6H', '24H'] as ForecastHorizon[]).map((h) => {
              const hData = intelligence.horizons[h];
              const isSelected = selectedHorizon === h;
              return (
                <button
                  key={h}
                  onClick={() => onSelectHorizon(h)}
                  className={`py-1.5 px-1 rounded text-center transition ${
                    isSelected
                      ? 'bg-surface text-forest font-bold shadow-sm border border-carto-border'
                      : 'text-carto-text hover:bg-surface/50 text-xs'
                  }`}
                >
                  <span className="block text-[11px] font-mono">{h}</span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full mt-0.5 ${
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

          {/* Active Horizon Card */}
          <div className="mt-2 p-2.5 rounded-lg bg-surface border border-carto-border text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-forest-deep">
                Projected Precipitation:
              </span>
              <span className="font-mono font-bold text-carto-accent">
                {activeHorizonData.accumulatedPrecipitationMm} mm total
              </span>
            </div>
            <p className="text-[11px] text-carto-text leading-relaxed">
              {activeHorizonData.summary}
            </p>
          </div>
        </div>

        {/* Amazon Bedrock AI Analyst Summary */}
        {aiExplanation && (
          <div className="bg-forest-subtle/50 rounded-lg p-3 border border-forest/20 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-forest font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-forest" />
                <span>Amazon Bedrock AI Analyst:</span>
              </div>
              <span className="text-[10px] font-mono text-carto-muted">
                {aiExplanation.modelIdentifier}
              </span>
            </div>

            <p className="text-xs text-carto-text leading-relaxed">
              {aiExplanation.summary}
            </p>

            <div className="text-[11px] text-carto-muted italic pt-1 border-t border-forest/10">
              {aiExplanation.uncertaintyStatement}
            </div>
          </div>
        )}

        {/* Interactive Accordion for Factors, Precautions, and Missing Evidence */}
        <div className="border-t border-carto-border pt-2 space-y-2">
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setExpandedSection('FACTORS')}
              className={`pb-1 border-b-2 font-medium transition ${
                expandedSection === 'FACTORS'
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-carto-muted hover:text-carto-text'
              }`}
            >
              Contributing Factors ({activeHorizonData.factors.length})
            </button>
            <button
              onClick={() => setExpandedSection('PRECAUTIONS')}
              className={`pb-1 border-b-2 font-medium transition ${
                expandedSection === 'PRECAUTIONS'
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-carto-muted hover:text-carto-text'
              }`}
            >
              Safety Precautions ({intelligence.safetyGuidance.length})
            </button>
            <button
              onClick={() => setExpandedSection('DETAILS')}
              className={`pb-1 border-b-2 font-medium transition ${
                expandedSection === 'DETAILS'
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-carto-muted hover:text-carto-text'
              }`}
            >
              Caveats & Quality
            </button>
          </div>

          {expandedSection === 'FACTORS' && (
            <div className="space-y-1.5 pt-1">
              {activeHorizonData.factors.map((f, i) => (
                <div key={i} className="flex items-start justify-between text-xs p-2 rounded bg-paper border border-carto-border/60">
                  <div className="pr-2">
                    <span className="font-semibold text-forest-deep block">{f.name}</span>
                    <span className="text-[11px] text-carto-text">{f.description}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-forest shrink-0">
                    +{f.weight} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          {expandedSection === 'PRECAUTIONS' && (
            <ul className="space-y-1.5 pt-1 text-xs">
              {intelligence.safetyGuidance.map((p, i) => (
                <li key={i} className="flex items-start space-x-2 p-2 rounded bg-paper border border-carto-border/60">
                  <ChevronRight className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                  <span className="text-carto-text">{p}</span>
                </li>
              ))}
            </ul>
          )}

          {expandedSection === 'DETAILS' && (
            <div className="space-y-2 pt-1 text-xs text-carto-muted">
              {intelligence.dataQualityNotes.map((note, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <Info className="w-3.5 h-3.5 text-carto-muted shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
              <div className="text-[10px] font-mono pt-1 border-t border-carto-border/60">
                Data Source: {intelligence.weatherTelemetry.source}
              </div>
            </div>
          )}
        </div>

        {/* Ask JalRakshak Assistant CTA Button */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-surface border border-forest/30 text-forest hover:bg-forest hover:text-white transition flex items-center justify-center space-x-2 text-xs font-semibold shadow-sm group"
          >
            <Sparkles className="w-4 h-4 text-carto-accent group-hover:text-white" />
            <span>Ask JalRakshak AI About This Sector</span>
          </button>
        )}
      </div>
    </div>
  );
};
