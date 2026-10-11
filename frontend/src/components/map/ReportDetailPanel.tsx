import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FloodReport } from '../../types';
import { RiskBadge, RoadConditionBadge, VerificationBadge } from '../common/RiskBadge';
import {
  X,
  MapPin,
  Clock,
  Droplets,
  AlertTriangle,
  Flag,
  ExternalLink,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';

interface ReportDetailPanelProps {
  report: FloodReport;
  onClose: () => void;
}

export const ReportDetailPanel: React.FC<ReportDetailPanelProps> = ({ report, onClose }) => {
  const [flagged, setFlagged] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);

  const handleFlag = async () => {
    if (flagged || flagLoading) return;
    setFlagLoading(true);
    try {
      await api.flagReport(report.reportId);
      setFlagged(true);
    } catch {
      // ignore
    } finally {
      setFlagLoading(false);
    }
  };

  const timeAgo = () => {
    const diffMs = Date.now() - new Date(report.observedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-xl border border-carto-border shadow-carto-modal p-4 text-carto-text pointer-events-auto transition-all animate-in fade-in duration-200 w-full">
      {/* Header */}
      <div className="flex items-start justify-between pb-2.5 border-b border-carto-border">
        <div>
          <span className="text-[10px] font-mono uppercase text-carto-muted">
            Report #{report.reportId.slice(0, 12)}
          </span>
          <h3 className="font-display font-bold text-base text-carto-text leading-tight mt-0.5">
            {report.locationName}
          </h3>
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-carto-muted mt-1">
            <MapPin className="w-3 h-3 text-forest shrink-0" />
            <span>
              {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-carto-muted hover:text-carto-text hover:bg-surface-muted transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-carto-border">
        <RiskBadge severity={report.severity} size="sm" />
        <RoadConditionBadge condition={report.roadCondition} />
        <VerificationBadge status={report.status} />
      </div>

      {/* Observation Meta & Metrics */}
      <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-carto-border text-xs">
        <div>
          <span className="text-[10px] uppercase font-mono text-carto-muted">Observed</span>
          <div className="flex items-center space-x-1 font-mono text-carto-text mt-0.5">
            <Clock className="w-3.5 h-3.5 text-carto-muted" />
            <span>{timeAgo()}</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-carto-muted">Water Depth</span>
          <div className="flex items-center space-x-1 font-mono text-carto-text mt-0.5">
            <Droplets className="w-3.5 h-3.5 text-water" />
            <span>{report.waterDepthCm ? `${report.waterDepthCm} cm (~${(report.waterDepthCm / 30.48).toFixed(1)} ft)` : 'Not recorded'}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-2.5 text-xs text-carto-text leading-relaxed">
        <p className="bg-surface-muted/60 p-2.5 rounded-md border border-carto-border/60">
          "{report.description}"
        </p>
      </div>

      {/* Image Preview if available */}
      {report.imageUrl && (
        <div className="mb-2.5 rounded-lg overflow-hidden border border-carto-border max-h-36">
          <img
            src={report.imageUrl}
            alt={`Flood evidence at ${report.locationName}`}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Verification / Moderation note if verified */}
      {report.verificationNotes && (
        <div className="text-[11px] bg-forest-subtle/70 text-forest p-2 rounded-md mb-2.5 flex items-start space-x-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Note: {report.verificationNotes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex items-center justify-between text-xs">
        <Link
          to={`/reports/${report.reportId}`}
          className="text-forest hover:text-forest-deep font-medium flex items-center space-x-1 hover:underline font-mono"
        >
          <span>Full Analysis</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <button
          onClick={handleFlag}
          disabled={flagged || flagLoading}
          className={`flex items-center space-x-1 text-[11px] font-mono px-2 py-1 rounded transition ${
            flagged
              ? 'bg-surface-muted text-carto-muted'
              : 'text-risk-mod hover:bg-risk-mod-bg'
          }`}
          title="Report inaccurate or suspicious information"
        >
          <Flag className="w-3 h-3" />
          <span>{flagged ? 'Flagged for Review' : 'Flag Inaccuracy'}</span>
        </button>
      </div>
    </div>
  );
};
