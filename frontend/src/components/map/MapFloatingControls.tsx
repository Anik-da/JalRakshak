import React, { useState } from 'react';
import {
  Search,
  Crosshair,
  Filter,
  Layers,
  Info,
  Check,
  Ban,
  Clock,
  Sparkles,
  ChevronDown,
  Eye,
  EyeOff,
  CloudRain,
  ShieldAlert,
} from 'lucide-react';
import { SeverityLevel, RoadCondition, ForecastHorizon } from '../../types';
import { LayerVisibilityState } from './FloodMap';

interface MapFloatingControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLocateUser: () => void;
  locatingUser: boolean;
  selectedSeverity: SeverityLevel | 'ALL';
  onSelectSeverity: (sev: SeverityLevel | 'ALL') => void;
  selectedCondition: RoadCondition | 'ALL';
  onSelectCondition: (cond: RoadCondition | 'ALL') => void;
  verifiedOnly: boolean;
  onToggleVerifiedOnly: () => void;
  includeDemo: boolean;
  onToggleIncludeDemo: () => void;
  reportCount: number;
  layerVisibility: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  selectedHorizon: ForecastHorizon;
  onSelectHorizon: (h: ForecastHorizon) => void;
  onOpenAssistant?: () => void;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  searchQuery,
  onSearchChange,
  onLocateUser,
  locatingUser,
  selectedSeverity,
  onSelectSeverity,
  selectedCondition,
  onSelectCondition,
  verifiedOnly,
  onToggleVerifiedOnly,
  includeDemo,
  onToggleIncludeDemo,
  reportCount,
  layerVisibility,
  onToggleLayer,
  selectedHorizon,
  onSelectHorizon,
  onOpenAssistant,
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <>
      {/* Top Left: Search & Filter Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-2 max-w-sm w-full pointer-events-auto">
        <div className="bg-surface/95 backdrop-blur-md rounded-xl border border-carto-border shadow-carto p-1.5 flex items-center space-x-2">
          <div className="pl-2 text-carto-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search locality, underpass, or river basin..."
            className="w-full bg-transparent text-xs text-carto-text placeholder-carto-muted focus:outline-none py-1"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-carto-muted hover:text-carto-text pr-2"
            >
              ✕
            </button>
          )}
          <button
            onClick={onLocateUser}
            disabled={locatingUser}
            title="Locate my position & compute risk"
            className="p-1.5 rounded-lg hover:bg-surface-muted text-carto-text hover:text-forest transition shrink-0"
          >
            <Crosshair className={`w-4 h-4 ${locatingUser ? 'animate-spin text-forest' : ''}`} />
          </button>
        </div>

        {/* Quick Horizon & Layer Control Row */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Horizon Pills */}
          <div className="bg-surface/95 backdrop-blur-md border border-carto-border rounded-full p-0.5 flex items-center shadow-xs">
            {(['NOW', '1H', '3H', '6H', '24H'] as ForecastHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => onSelectHorizon(h)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full transition ${
                  selectedHorizon === h
                    ? 'bg-forest text-white font-bold shadow-xs'
                    : 'text-carto-muted hover:text-carto-text'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Layer Selector Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLayerDropdown(!showLayerDropdown);
                setShowFilterDropdown(false);
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition flex items-center space-x-1 shadow-xs ${
                showLayerDropdown
                  ? 'bg-forest text-white border-forest'
                  : 'bg-surface/95 text-carto-text border-carto-border hover:bg-surface-muted'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showLayerDropdown && (
              <div className="absolute top-8 left-0 w-60 bg-surface rounded-xl border border-carto-border shadow-2xl p-2.5 z-30 space-y-1.5 text-xs animate-fade-in">
                <div className="font-semibold text-forest-deep text-[11px] font-mono uppercase pb-1 border-b border-carto-border flex items-center justify-between">
                  <span>Map Layers (6)</span>
                  <span className="text-[10px] text-carto-muted font-normal">Toggle Visibility</span>
                </div>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-surface-muted cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest" />
                    <span>Community Reports</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.reports}
                    onChange={() => onToggleLayer('reports')}
                    className="accent-forest"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-surface-muted cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-risk-crit" />
                    <span>Estimated Risk Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.riskZones}
                    onChange={() => onToggleLayer('riskZones')}
                    className="accent-forest"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-surface-muted cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                    <span>Observed Rainfall Stations</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.observedRainfall}
                    onChange={() => onToggleLayer('observedRainfall')}
                    className="accent-forest"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-surface-muted cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span>Forecast Rainfall Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.forecastRainfall}
                    onChange={() => onToggleLayer('forecastRainfall')}
                    className="accent-forest"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-surface-muted cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                    <span>Historical Flood Hotspots</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.historicalHotspots}
                    onChange={() => onToggleLayer('historicalHotspots')}
                    className="accent-forest"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Ask AI Pill Button */}
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="text-xs px-2.5 py-1 rounded-full bg-forest-subtle hover:bg-forest hover:text-white text-forest border border-forest/30 transition flex items-center space-x-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Right: Map Status & Legend Toggle */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center space-x-2 pointer-events-auto">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-2 rounded-xl border shadow-carto backdrop-blur-md transition ${
            showLegend ? 'bg-forest text-white border-forest' : 'bg-surface/95 text-carto-text border-carto-border hover:bg-surface-muted'
          }`}
          title="Map Legend"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute top-16 right-4 z-[1000] w-64 bg-surface/95 backdrop-blur-md rounded-xl border border-carto-border shadow-2xl p-3 text-xs pointer-events-auto animate-fade-in space-y-2.5">
          <div className="flex items-center justify-between border-b border-carto-border pb-1.5">
            <span className="font-semibold text-forest-deep font-display text-xs">Cartographic Legend</span>
            <button onClick={() => setShowLegend(false)} className="text-carto-muted hover:text-carto-text text-xs">
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-carto-muted">Risk Severity Categories</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-low" />
                <span>Low Risk (0-24)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-mod" />
                <span>Moderate (25-49)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-high" />
                <span>High (50-74)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-crit" />
                <span>Critical (75-100)</span>
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-carto-border space-y-1">
            <div className="text-[10px] font-mono uppercase text-carto-muted">Map Symbols</div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-risk-crit text-white flex items-center justify-center text-[9px] font-bold">✕</span>
              <span>Road Completely Blocked</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-forest border border-white" />
              <span>Verified Civic Report</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-[#D97706]" />
              <span>Historical Inundation Hotspot</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
              <span>Telemetry Rain Gauge (mm)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
