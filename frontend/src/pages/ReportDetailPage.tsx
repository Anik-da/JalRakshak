import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { FloodReport } from '../types';
import { RiskBadge, RoadConditionBadge, VerificationBadge } from '../components/common/RiskBadge';
import { FloodMap } from '../components/map/FloodMap';
import {
  MapPin,
  Clock,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Flag,
  Share2,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<FloodReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReport() {
      if (!reportId) return;
      setLoading(true);
      try {
        const data = await api.getReportById(reportId);
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Report not found.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  const handleFlag = async () => {
    if (!report || flagged) return;
    try {
      await api.flagReport(report.reportId);
      setFlagged(true);
    } catch {
      // ignore
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-xs text-carto-muted">
        Loading inspection records from Amazon DynamoDB...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-risk-crit-bg text-risk-crit flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-display font-bold text-carto-text">Report Record Not Found</h2>
        <p className="text-xs text-carto-muted">
          The requested hazard record ID may have expired or been withdrawn under privacy retention protocols.
        </p>
        <Link
          to="/map"
          className="inline-flex items-center space-x-1.5 text-xs font-mono text-forest hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Hazard Map</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Back button & Actions strip */}
      <div className="flex items-center justify-between text-xs font-mono">
        <Link
          to="/map"
          className="inline-flex items-center space-x-1.5 text-carto-muted hover:text-forest transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hazard Map</span>
        </Link>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-surface border border-carto-border text-carto-text hover:bg-surface-muted transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
          <button
            onClick={handleFlag}
            disabled={flagged}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border transition ${
              flagged
                ? 'bg-surface-muted text-carto-muted border-carto-border'
                : 'border-risk-mod/40 text-risk-mod hover:bg-risk-mod-bg'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagged ? 'Flagged' : 'Flag Inaccuracy'}</span>
          </button>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="bg-surface rounded-2xl border border-carto-border overflow-hidden shadow-carto">
        {/* Header Strip */}
        <div className="p-6 sm:p-8 border-b border-carto-border space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge severity={report.severity} size="lg" />
            <RoadConditionBadge condition={report.roadCondition} />
            <VerificationBadge status={report.status} />
            {report.isDemonstration && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-water-pale text-water font-semibold border border-water/30">
                Demonstration Record
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-mono uppercase text-carto-muted">
              Report ID: {report.reportId}
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-carto-text mt-1">
              {report.locationName}
            </h1>
            <div className="flex items-center space-x-2 text-xs font-mono text-carto-muted mt-2">
              <MapPin className="w-3.5 h-3.5 text-forest" />
              <span>
                {report.latitude.toFixed(5)}°N, {report.longitude.toFixed(5)}°E
              </span>
            </div>
          </div>
        </div>

        {/* Embedded Map Section */}
        <div className="h-64 border-b border-carto-border">
          <FloodMap
            reports={[report]}
            selectedReport={report}
            onSelectReport={() => {}}
            center={[report.latitude, report.longitude]}
            zoom={14}
            className="w-full h-full"
          />
        </div>

        {/* Audit & Attribute Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Tripartite Audit Separation: Resident vs Engine vs Moderator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. What Resident Reported */}
            <div className="p-4 rounded-xl bg-surface-muted/60 border border-carto-border space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-carto-muted font-bold block">
                01. Community Observation
              </span>
              <div className="text-xs space-y-1 text-carto-text font-mono">
                <div>Observed: {new Date(report.observedAt).toLocaleString()}</div>
                <div>Water Depth: {report.waterDepthCm ? `${report.waterDepthCm} cm` : 'Not recorded'}</div>
                <div>Reported by: {report.userEmailMasked || 'c***@community.in'}</div>
              </div>
            </div>

            {/* 2. What Engine Calculated */}
            <div className="p-4 rounded-xl bg-surface-muted/60 border border-carto-border space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-forest font-bold block">
                02. Mathematical Freshness
              </span>
              <div className="text-xs space-y-1 text-carto-text font-mono">
                <div>Server Registered: {new Date(report.submittedAt).toLocaleTimeString()}</div>
                <div>Duplicate Candidates: {report.duplicateOf ? 'Flagged (1 candidate)' : 'None detected'}</div>
                <div>Scoring Weight: {report.status === 'VERIFIED' ? '1.0 (Full)' : '0.8 (Unverified)'}</div>
              </div>
            </div>

            {/* 3. Moderator Verification */}
            <div className="p-4 rounded-xl bg-surface-muted/60 border border-carto-border space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-carto-muted font-bold block">
                03. Civic Ward Verification
              </span>
              <div className="text-xs space-y-1 text-carto-text font-mono">
                <div>Status: <strong>{report.status}</strong></div>
                <div>Verified By: {report.verifiedBy || 'Pending assignment'}</div>
                <div>Timestamp: {report.verificationTimestamp ? new Date(report.verificationTimestamp).toLocaleTimeString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-mono uppercase text-carto-muted font-bold mb-2">
              Field Hazard Description
            </h3>
            <div className="p-4 rounded-xl bg-paper border border-carto-border text-sm text-carto-text leading-relaxed">
              "{report.description}"
            </div>
          </div>

          {/* Photograph if available */}
          {report.imageUrl && (
            <div>
              <h3 className="text-xs font-mono uppercase text-carto-muted font-bold mb-2">
                Attached Field Evidence
              </h3>
              <div className="rounded-xl overflow-hidden border border-carto-border max-w-lg">
                <img
                  src={report.imageUrl}
                  alt={`Flood photograph at ${report.locationName}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          )}

          {/* Verification Notes */}
          {report.verificationNotes && (
            <div className="p-4 rounded-xl bg-forest-subtle border border-forest/20 text-xs font-mono text-forest flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Official Moderator Note:</strong> {report.verificationNotes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
