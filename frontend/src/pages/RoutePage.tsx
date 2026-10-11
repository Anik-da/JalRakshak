import React, { useState } from 'react';
import { api } from '../services/api';
import { RouteHazardAssessment } from '../types';
import { RiskBadge, RoadConditionBadge } from '../components/common/RiskBadge';
import {
  Route as RouteIcon,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Ban,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const RoutePage: React.FC = () => {
  // Common transit checkpoints for fast testing
  const presets = [
    {
      name: 'T. Nagar South ➔ Central Station',
      origin: { lat: 13.0418, lng: 80.2341, name: 'T. Nagar South Usman Road' },
      dest: { lat: 13.0827, lng: 80.2707, name: 'Chennai Central Railway Station' },
    },
    {
      name: 'Velachery ➔ OMR IT Corridor',
      origin: { lat: 12.9815, lng: 80.218, name: 'Velachery Bypass' },
      dest: { lat: 12.9716, lng: 80.2435, name: 'OMR Sholinganallur' },
    },
  ];

  const [originName, setOriginName] = useState(presets[0].origin.name);
  const [originLat, setOriginLat] = useState(presets[0].origin.lat);
  const [originLng, setOriginLng] = useState(presets[0].origin.lng);

  const [destName, setDestName] = useState(presets[0].dest.name);
  const [destLat, setDestLat] = useState(presets[0].dest.lat);
  const [destLng, setDestLng] = useState(presets[0].dest.lng);

  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<RouteHazardAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRouteHazards(
        { lat: originLat, lng: originLng, name: originName },
        { lat: destLat, lng: destLng, name: destName }
      );
      setAssessment(res);
    } catch (err: any) {
      setError(err.message || 'Route corridor evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (idx: number) => {
    const p = presets[idx];
    setOriginName(p.origin.name);
    setOriginLat(p.origin.lat);
    setOriginLng(p.origin.lng);
    setDestName(p.dest.name);
    setDestLat(p.dest.lat);
    setDestLng(p.dest.lng);
    setAssessment(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-carto-muted mb-1">
          <span>Safer Mobility</span>
          <span>/</span>
          <span className="text-forest">Corridor Hazard Inspection</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-carto-text">
          Hazard-Aware Route Assistance
        </h1>
        <p className="text-xs text-carto-muted mt-1 max-w-2xl">
          Evaluate planned transit corridors against active road floodings and blocked intersections before setting out during monsoon storms.
        </p>
      </div>

      {/* Preset selection buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-carto-muted">Quick Corridors:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(idx)}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-muted border border-carto-border text-carto-text transition"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Origin / Destination Input Form */}
      <form
        onSubmit={handleEvaluate}
        className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase text-forest font-bold">
              <MapPin className="w-4 h-4" />
              <span>Origin Checkpoint</span>
            </div>
            <div>
              <label className="block text-xs text-carto-muted mb-1">Location Label</label>
              <input
                type="text"
                required
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-carto-muted">Lat</label>
                <input
                  type="number"
                  step="0.0001"
                  value={originLat}
                  onChange={(e) => setOriginLat(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 rounded border border-carto-border bg-paper"
                />
              </div>
              <div>
                <label className="text-[10px] text-carto-muted">Lng</label>
                <input
                  type="number"
                  step="0.0001"
                  value={originLng}
                  onChange={(e) => setOriginLng(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 rounded border border-carto-border bg-paper"
                />
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase text-water font-bold">
              <Navigation className="w-4 h-4" />
              <span>Destination Checkpoint</span>
            </div>
            <div>
              <label className="block text-xs text-carto-muted mb-1">Location Label</label>
              <input
                type="text"
                required
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-carto-muted">Lat</label>
                <input
                  type="number"
                  step="0.0001"
                  value={destLat}
                  onChange={(e) => setDestLat(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 rounded border border-carto-border bg-paper"
                />
              </div>
              <div>
                <label className="text-[10px] text-carto-muted">Lng</label>
                <input
                  type="number"
                  step="0.0001"
                  value={destLng}
                  onChange={(e) => setDestLng(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 rounded border border-carto-border bg-paper"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-risk-crit-bg text-risk-crit p-3 rounded-lg text-xs font-mono">
            {error}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep text-white px-6 py-2.5 rounded-lg text-xs font-medium font-mono transition shadow-carto"
          >
            {loading ? (
              <span>Inspecting Corridor Buffers...</span>
            ) : (
              <>
                <RouteIcon className="w-4 h-4" />
                <span>Analyze Corridor Hazards</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Assessment Output Display */}
      {assessment && (
        <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-carto-border gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-carto-muted">
                Route Safety Assessment
              </span>
              <h2 className="text-xl font-display font-bold text-carto-text mt-0.5">
                {assessment.origin.name} ➔ {assessment.destination.name}
              </h2>
            </div>
            <div>
              <span
                className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded font-mono font-bold ${
                  assessment.safetyStatus === 'HAZARDOUS'
                    ? 'bg-risk-crit-bg text-risk-crit border border-risk-crit/30'
                    : assessment.safetyStatus === 'CAUTION'
                    ? 'bg-risk-mod-bg text-risk-mod border border-risk-mod/30'
                    : 'bg-risk-low-bg text-risk-low border border-risk-low/30'
                }`}
              >
                {assessment.safetyStatus === 'HAZARDOUS' && <Ban className="w-4 h-4 shrink-0" />}
                {assessment.safetyStatus === 'CAUTION' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                {assessment.safetyStatus === 'CLEAR' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>CORRIDOR STATUS: {assessment.safetyStatus}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-paper rounded-lg border border-carto-border">
              <span className="text-carto-muted block text-[10px] uppercase">Corridor Distance</span>
              <strong className="text-base text-carto-text">{assessment.distanceKm} km</strong>
            </div>
            <div className="p-3 bg-paper rounded-lg border border-carto-border">
              <span className="text-carto-muted block text-[10px] uppercase">Est. Monsoon Transit</span>
              <strong className="text-base text-carto-text">~{assessment.estimatedDurationMin} mins</strong>
            </div>
            <div className="p-3 bg-paper rounded-lg border border-carto-border">
              <span className="text-carto-muted block text-[10px] uppercase">Hazards Within 600m</span>
              <strong className="text-base text-risk-crit">
                {assessment.intersectingHazards.length} flagged
              </strong>
            </div>
          </div>

          {/* Warnings List */}
          {assessment.warnings.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-risk-crit font-bold block">
                Active Transit Advisories
              </span>
              <div className="space-y-1.5">
                {assessment.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-risk-crit-bg/60 border border-risk-crit/20 text-xs font-mono text-risk-crit flex items-start space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intersecting Hazards detail table */}
          {assessment.intersectingHazards.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono uppercase text-carto-text font-bold block">
                Corridor Hazard Observations
              </span>
              <div className="space-y-2">
                {assessment.intersectingHazards.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 bg-paper rounded-lg border border-carto-border flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <RiskBadge severity={h.severity} size="sm" />
                        <RoadConditionBadge condition={h.roadCondition} />
                        <span className="font-semibold text-carto-text font-display">
                          {h.locationName}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-carto-muted">
                        Distance from route centerline: {h.distanceToRouteMeters}m
                      </div>
                    </div>
                    <Link
                      to={`/reports/${h.reportId}`}
                      className="text-xs font-mono text-forest hover:underline shrink-0"
                    >
                      Inspect Hazard Report ➔
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Route Banner */}
          {assessment.alternativeAvailable && (
            <div className="p-4 rounded-xl bg-forest-subtle border border-forest/30 flex items-start space-x-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-forest font-display">
                  Alternative Outer Ring Road Bypass Recommended
                </span>
                <p className="text-carto-text leading-relaxed">
                  Due to critical blockages on the arterial central carriageway, divert via elevated expressway routes. Check municipal traffic police updates before initiating journey.
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-3 bg-surface-muted rounded-lg text-[11px] text-carto-muted border border-carto-border leading-relaxed font-mono">
            {assessment.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
