import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FloodReport, AdminMetrics, AuditRecord } from '../types';
import { RiskBadge, RoadConditionBadge, VerificationBadge } from '../components/common/RiskBadge';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Ban,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [reports, setReports] = useState<FloodReport[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation Action Modal state
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);
  const [actionType, setActionType] = useState<'VERIFY' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [repsRes, metsRes, audsRes] = await Promise.all([
        api.getAdminReports(),
        api.getAdminMetrics(),
        api.getAdminAudits(),
      ]);
      setReports(repsRes.reports);
      setMetrics(metsRes);
      setAudits(audsRes.audits);
    } catch (err) {
      console.warn('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !actionType) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (actionType === 'VERIFY') {
        await api.adminVerify(selectedReport.reportId, reason || 'Verified by municipal warden');
      } else {
        if (!reason || reason.trim().length < 5) {
          throw new Error('A specific moderation reason (min 5 characters) is required to reject a report.');
        }
        await api.adminReject(selectedReport.reportId, reason);
      }

      // Close modal and refresh
      setSelectedReport(null);
      setActionType(null);
      setReason('');
      await loadAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Moderation action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const unverifiedReports = reports.filter((r) => r.status === 'UNVERIFIED');

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-carto-border gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-risk-high mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-bold">MUNICIPAL INCIDENT MODERATION CONSOLE</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-carto-text">
            Civic Moderation & Verification
          </h1>
          <p className="text-xs text-carto-muted mt-1 font-mono">
            Audited Console • Authenticated Admin: {user?.email || 'admin@jalrakshak.org'}
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="text-xs font-mono bg-surface hover:bg-surface-muted px-3.5 py-2 rounded-lg border border-carto-border text-carto-text transition"
        >
          Refresh Queues
        </button>
      </div>

      {/* Operational Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto-sm">
            <span className="text-[10px] text-carto-muted uppercase">Total Logged</span>
            <p className="text-2xl font-bold text-carto-text mt-1">{metrics.totalReports}</p>
          </div>
          <div className="p-4 rounded-xl bg-risk-mod-bg/60 border border-risk-mod/30 shadow-carto-sm">
            <span className="text-[10px] text-risk-mod uppercase font-bold">Needs Review</span>
            <p className="text-2xl font-bold text-risk-mod mt-1">{metrics.unverifiedCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-forest-subtle border border-forest/30 shadow-carto-sm">
            <span className="text-[10px] text-forest uppercase font-bold">Verified</span>
            <p className="text-2xl font-bold text-forest mt-1">{metrics.verifiedCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-risk-crit-bg/60 border border-risk-crit/30 shadow-carto-sm">
            <span className="text-[10px] text-risk-crit uppercase font-bold">Blocked Roads</span>
            <p className="text-2xl font-bold text-risk-crit mt-1">{metrics.blockedRoadCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto-sm">
            <span className="text-[10px] text-carto-muted uppercase">Duplicates</span>
            <p className="text-2xl font-bold text-carto-text mt-1">{metrics.duplicateCandidatesCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto-sm">
            <span className="text-[10px] text-carto-muted uppercase">Flagged by Public</span>
            <p className="text-2xl font-bold text-risk-high mt-1">{metrics.flaggedCount}</p>
          </div>
        </div>
      )}

      {/* Moderation Queue */}
      <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6">
        <div>
          <span className="text-xs font-mono uppercase text-forest font-bold tracking-wider">
            Active Review Queue ({unverifiedReports.length})
          </span>
          <h2 className="text-xl font-display font-bold text-carto-text mt-0.5">
            Observations Awaiting Field Corroboration
          </h2>
          <p className="text-xs text-carto-muted mt-1">
            Carefully review citizen evidence, duplicate warnings, and descriptions before confirming or rejecting.
          </p>
        </div>

        {unverifiedReports.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-carto-muted bg-paper rounded-xl border border-carto-border">
            ✓ All active citizen reports have been reviewed. Queue is clear.
          </div>
        ) : (
          <div className="space-y-3">
            {unverifiedReports.map((report) => (
              <div
                key={report.reportId}
                className="p-5 rounded-xl bg-paper border border-carto-border hover:border-carto-muted/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge severity={report.severity} size="sm" />
                    <RoadConditionBadge condition={report.roadCondition} />
                    {report.duplicateOf && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-risk-mod-bg text-risk-mod border border-risk-mod/30">
                        Duplicate Candidate
                      </span>
                    )}
                    {report.flagCount > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-risk-crit-bg text-risk-crit border border-risk-crit/30">
                        {report.flagCount} Public Flags
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-base text-carto-text">
                    {report.locationName}
                  </h3>
                  <p className="text-xs text-carto-text">
                    "{report.description}"
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] font-mono text-carto-muted pt-1">
                    <span>Observed: {new Date(report.observedAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span>Water: {report.waterDepthCm ? `${report.waterDepthCm}cm` : 'Unspecified'}</span>
                    <span>•</span>
                    <span>Coord: {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setActionType('VERIFY');
                      setReason('Verified via municipal CCTV feed and ward volunteer check.');
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-forest text-white hover:bg-forest-deep text-xs font-mono font-medium transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setActionType('REJECT');
                      setReason('');
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-risk-crit-bg text-risk-crit hover:bg-risk-crit hover:text-white border border-risk-crit/30 text-xs font-mono font-medium transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <Link
                    to={`/reports/${report.reportId}`}
                    className="p-1.5 rounded text-carto-muted hover:text-carto-text"
                    title="View report detail"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Trail */}
      <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6">
        <div>
          <span className="text-xs font-mono uppercase text-carto-muted font-bold tracking-wider">
            DynamoDB Audit Ledger
          </span>
          <h2 className="text-xl font-display font-bold text-carto-text mt-0.5">
            Immutable Administrative Audit Trail
          </h2>
          <p className="text-xs text-carto-muted mt-1">
            Every moderation action is recorded with moderator identity, timestamp, and justification reason.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border border-carto-border rounded-lg overflow-hidden">
            <thead className="bg-surface-muted border-b border-carto-border text-carto-muted">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">Report ID</th>
                <th className="p-3">Moderator</th>
                <th className="p-3">Reason / Justification</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carto-border">
              {audits.map((a) => (
                <tr key={a.auditId} className="hover:bg-paper">
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        a.action === 'VERIFY'
                          ? 'bg-forest-subtle text-forest'
                          : 'bg-risk-crit-bg text-risk-crit'
                      }`}
                    >
                      {a.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-carto-text">{a.reportId.slice(0, 14)}</td>
                  <td className="p-3 text-carto-muted">{a.adminEmail}</td>
                  <td className="p-3 text-carto-text">{a.reason}</td>
                  <td className="p-3 text-carto-muted">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Confirmation Modal */}
      {selectedReport && actionType && (
        <div className="fixed inset-0 z-50 bg-carto-text/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-carto-border shadow-carto-modal max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase text-forest font-bold mb-1">
                <span>Action Confirmation</span>
              </div>
              <h3 className="text-xl font-display font-bold text-carto-text">
                {actionType === 'VERIFY' ? 'Verify Field Report' : 'Reject Report from Map'}
              </h3>
              <p className="text-xs text-carto-muted mt-1">
                Report: <strong>{selectedReport.locationName}</strong> (#{selectedReport.reportId.slice(0, 10)})
              </p>
            </div>

            {actionError && (
              <div className="bg-risk-crit-bg text-risk-crit p-3 rounded-lg text-xs font-mono">
                {actionError}
              </div>
            )}

            <form onSubmit={handleModerationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-carto-text mb-1">
                  Moderator Reason / Corroboration Note <span className="text-risk-crit">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    actionType === 'VERIFY'
                      ? 'e.g. Verified via municipal traffic camera observation feed.'
                      : 'e.g. Duplicate report already resolved; road is currently clear.'
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-carto-border">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-carto-border text-xs font-mono text-carto-muted hover:text-carto-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 rounded-lg text-xs font-mono font-medium text-white shadow-sm transition ${
                    actionType === 'VERIFY'
                      ? 'bg-forest hover:bg-forest-deep'
                      : 'bg-risk-crit hover:bg-risk-crit/90'
                  }`}
                >
                  {actionLoading ? 'Writing Audit...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
