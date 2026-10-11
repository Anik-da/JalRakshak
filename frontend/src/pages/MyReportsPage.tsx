import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FloodReport } from '../types';
import { RiskBadge, RoadConditionBadge, VerificationBadge } from '../components/common/RiskBadge';
import {
  FileText,
  PlusCircle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserReports() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const res = await api.getMyReports();
        setReports(res.reports);
      } catch (err) {
        console.warn('Failed to load user reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserReports();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-forest-subtle text-forest flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-display font-bold text-carto-text">
          Sign In to View Your Observations
        </h2>
        <p className="text-xs text-carto-muted">
          Your personal report history is securely partitioned in Amazon DynamoDB under your Amazon Cognito account ID.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center space-x-1.5 bg-forest hover:bg-forest-deep text-white px-5 py-2.5 rounded-lg text-xs font-mono font-medium transition shadow-carto"
        >
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-carto-border gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-forest font-semibold">
            Civic Contributor Ledger
          </span>
          <h1 className="text-3xl font-display font-bold text-carto-text mt-0.5">
            My Flood Hazard Reports
          </h1>
          <p className="text-xs text-carto-muted mt-1 font-mono">
            Authenticated as: <span className="text-carto-text">{user?.email}</span>
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep text-white px-4 py-2.5 rounded-lg text-xs font-medium font-mono transition shadow-carto-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Hazard Report</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-carto-muted">
          Querying DynamoDB UserIdIndex for your reports...
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div className="bg-surface rounded-2xl border border-carto-border p-12 text-center space-y-4 shadow-carto">
          <div className="w-12 h-12 rounded-full bg-surface-muted text-carto-muted flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-carto-text">
            No Flood Hazards Submitted Yet
          </h3>
          <p className="text-xs text-carto-muted max-w-sm mx-auto leading-relaxed">
            When you observe flooded roads, underpass waterlogging, or fallen obstacles during rainfall, report them here to alert other commuters.
          </p>
          <div className="pt-2">
            <Link
              to="/report"
              className="inline-flex items-center space-x-1.5 bg-forest hover:bg-forest-deep text-white px-5 py-2.5 rounded-lg text-xs font-mono transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit First Report</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Reports Table / List */
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.reportId}
              className="bg-surface rounded-xl border border-carto-border p-5 shadow-carto-sm hover:border-forest/40 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <RiskBadge severity={report.severity} size="sm" />
                  <RoadConditionBadge condition={report.roadCondition} />
                  <VerificationBadge status={report.status} />
                </div>
                <span className="text-[11px] font-mono text-carto-muted">
                  ID: #{report.reportId.slice(0, 10)}
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-carto-text">
                  {report.locationName}
                </h3>
                <p className="text-xs text-carto-muted mt-1 leading-relaxed">
                  "{report.description}"
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-carto-border/60 text-xs font-mono text-carto-muted gap-2">
                <div className="flex items-center space-x-3 text-[11px]">
                  <span>Observed: {new Date(report.observedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Water: {report.waterDepthCm ? `${report.waterDepthCm}cm` : 'Not recorded'}</span>
                </div>

                <Link
                  to={`/reports/${report.reportId}`}
                  className="text-forest hover:underline flex items-center space-x-1 text-xs"
                >
                  <span>Inspection Record</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
