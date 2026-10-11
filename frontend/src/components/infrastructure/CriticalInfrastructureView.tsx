import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Hospital,
  GraduationCap,
  Flame,
  Bus,
  RefreshCw,
} from 'lucide-react';
import { CriticalInfrastructureResponse, CriticalFacility } from '../../types';
import { api } from '../../services/api';

export const CriticalInfrastructureView: React.FC = () => {
  const [data, setData] = useState<CriticalInfrastructureResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadInfrastructure = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCriticalInfrastructure();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate critical facilities accessibility.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfrastructure();
  }, []);

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'HOSPITAL':
        return <Hospital className="w-4 h-4 text-risk-crit" />;
      case 'SCHOOL':
        return <GraduationCap className="w-4 h-4 text-water" />;
      case 'EMERGENCY_FIRE':
        return <Flame className="w-4 h-4 text-risk-mod" />;
      case 'TRANSIT_STATION':
        return <Bus className="w-4 h-4 text-forest" />;
      default:
        return <Building2 className="w-4 h-4 text-carto-muted" />;
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-carto-border gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-forest mb-1 font-semibold">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>CRITICAL INFRASTRUCTURE ACCESSIBILITY</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-carto-text">
            Emergency Facilities Approach Road Status
          </h2>
          <p className="text-xs text-carto-muted mt-1 max-w-2xl leading-relaxed">
            Monitors road corridors accessing hospitals, emergency stations, and civic shelters during monsoon inundations.
          </p>
        </div>

        <button
          onClick={loadInfrastructure}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 text-xs font-mono bg-paper hover:bg-surface-muted px-3 py-1.5 rounded-lg border border-carto-border text-carto-text transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* KPI status cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-paper border border-carto-border">
            <span className="text-[10px] text-carto-muted uppercase block">Monitored Facilities</span>
            <strong className="text-2xl text-carto-text font-bold mt-1 block">
              {data.totalFacilities} Facilities
            </strong>
            <span className="text-[11px] text-carto-muted mt-0.5 block">
              Hospitals, Fire & Rescue, Transit
            </span>
          </div>

          <div className="p-4 rounded-xl bg-risk-mod-bg/40 border border-risk-mod/20">
            <span className="text-[10px] text-risk-mod uppercase block font-bold">Approach Impeded</span>
            <strong className="text-2xl text-risk-mod font-bold mt-1 block">
              {data.impededCount} Approach Roads
            </strong>
            <span className="text-[11px] text-risk-mod/80 mt-0.5 block">
              Water accumulation on slipway
            </span>
          </div>

          <div className="p-4 rounded-xl bg-risk-crit-bg/40 border border-risk-crit/20">
            <span className="text-[10px] text-risk-crit uppercase block font-bold">Access Blocked</span>
            <strong className="text-2xl text-risk-crit font-bold mt-1 block">
              {data.blockedCount} Blocked Roads
            </strong>
            <span className="text-[11px] text-risk-crit/80 mt-0.5 block">
              Alternate emergency route required
            </span>
          </div>
        </div>
      )}

      {/* Facilities list */}
      <div className="space-y-3">
        {loading && (
          <div className="p-8 text-center text-xs font-mono text-carto-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest" />
            <span>Assessing approach corridors to hospitals and emergency hubs...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-risk-crit-bg text-risk-crit text-xs font-mono rounded-lg">
            {error}
          </div>
        )}

        {!loading && data && data.facilities.map((fac) => (
          <div
            key={fac.facilityId}
            className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              fac.accessStatus === 'ACCESS_BLOCKED_CONFIRMED'
                ? 'bg-risk-crit-bg/20 border-risk-crit/40'
                : fac.accessStatus === 'ACCESS_IMPEDED_ESTIMATED'
                ? 'bg-risk-mod-bg/20 border-risk-mod/40'
                : 'bg-paper border-carto-border'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {getFacilityIcon(fac.type)}
                <div>
                  <h3 className="font-display font-bold text-sm text-carto-text">
                    {fac.name}
                  </h3>
                  <div className="text-[11px] font-mono text-carto-muted">
                    Access Via: {fac.accessRoadName}
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center space-x-1 text-[10px] px-2.5 py-1 rounded font-mono font-bold border ${
                    fac.accessStatus === 'ACCESS_BLOCKED_CONFIRMED'
                      ? 'bg-risk-crit-bg text-risk-crit border-risk-crit/40'
                      : fac.accessStatus === 'ACCESS_IMPEDED_ESTIMATED'
                      ? 'bg-risk-mod-bg text-risk-mod border-risk-mod/40'
                      : fac.accessStatus === 'INSUFFICIENT_DATA'
                      ? 'bg-surface-muted text-carto-muted border-carto-border'
                      : 'bg-forest-subtle text-forest border-forest/30'
                  }`}
                >
                  {fac.accessStatus === 'ACCESS_BLOCKED_CONFIRMED' && <ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
                  {fac.accessStatus === 'ACCESS_IMPEDED_ESTIMATED' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  {fac.accessStatus === 'ACCESSIBLE' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{fac.accessStatus.replace(/_/g, ' ')}</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-carto-text leading-relaxed">
              {fac.supportingEvidence}
            </p>

            <div className="text-[10px] font-mono text-carto-muted pt-1 border-t border-carto-border/60 flex items-center justify-between">
              <span>Nearest ground hazard: {fac.distanceToNearestHazardMeters}m</span>
              <span>Classification: {fac.isEstimate ? 'Model Estimate' : 'Confirmed Observation'}</span>
            </div>
          </div>
        ))}
      </div>

      {data && (
        <div className="p-3 rounded-lg bg-paper border border-carto-border text-[11px] font-mono text-carto-muted">
          {data.disclaimer}
        </div>
      )}
    </div>
  );
};
