import React from 'react';
import { SeverityLevel, RoadCondition, VerificationStatus } from '../../types';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Car,
} from 'lucide-react';

interface RiskBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    LOW: {
      label: 'Low Risk',
      bg: 'bg-risk-low-bg',
      text: 'text-risk-low',
      border: 'border-risk-low/30',
      icon: ShieldCheck,
    },
    MODERATE: {
      label: 'Moderate Risk',
      bg: 'bg-risk-mod-bg',
      text: 'text-risk-mod',
      border: 'border-risk-mod/30',
      icon: AlertCircle,
    },
    HIGH: {
      label: 'High Risk',
      bg: 'bg-risk-high-bg',
      text: 'text-risk-high',
      border: 'border-risk-high/30',
      icon: AlertTriangle,
    },
    CRITICAL: {
      label: 'Critical Hazard',
      bg: 'bg-risk-crit-bg',
      text: 'text-risk-crit',
      border: 'border-risk-crit/30',
      icon: AlertOctagon,
    },
  };

  const config = configs[severity] || configs.LOW;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded border font-medium font-mono ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
};

export const RoadConditionBadge: React.FC<{ condition: RoadCondition }> = ({ condition }) => {
  const configs = {
    PASSABLE: {
      label: 'Passable',
      bg: 'bg-surface-muted',
      text: 'text-forest',
      border: 'border-carto-border',
      icon: Car,
    },
    DIFFICULT: {
      label: 'Slow / Difficult',
      bg: 'bg-risk-mod-bg',
      text: 'text-risk-mod',
      border: 'border-risk-mod/30',
      icon: AlertCircle,
    },
    BLOCKED: {
      label: 'ROAD BLOCKED',
      bg: 'bg-risk-crit-bg',
      text: 'text-risk-crit font-bold',
      border: 'border-risk-crit/40',
      icon: Ban,
    },
    UNKNOWN: {
      label: 'Status Unknown',
      bg: 'bg-surface-muted',
      text: 'text-carto-muted',
      border: 'border-carto-border',
      icon: Car,
    },
  };

  const config = configs[condition] || configs.UNKNOWN;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded border font-mono ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export const VerificationBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-forest-subtle text-forest font-medium border border-forest/30 font-mono">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Verified Field Report</span>
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-risk-crit-bg text-risk-crit font-medium border border-risk-crit/30 font-mono">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-surface-muted text-carto-muted font-medium border border-carto-border font-mono">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Awaiting Review</span>
    </span>
  );
};
