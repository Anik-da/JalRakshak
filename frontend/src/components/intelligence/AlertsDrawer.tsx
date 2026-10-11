import React, { useEffect, useState } from 'react';
import { UserAlertNotification, AlertDispatchResult } from '../../types';
import { api } from '../../services/api';
import { RiskBadge } from '../common/RiskBadge';
import { Link } from 'react-router-dom';
import {
  Bell,
  X,
  ShieldAlert,
  MapPin,
  Clock,
  Settings,
  CheckCircle2,
  Mail,
  Smartphone,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReportLocation?: (lat: number, lng: number) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectReportLocation,
}) => {
  const [notifications, setNotifications] = useState<UserAlertNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [testDispatching, setTestDispatching] = useState(false);
  const [testResult, setTestResult] = useState<AlertDispatchResult | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getInAppNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      // Fallback to legacy history endpoint
      try {
        const hist = await api.getAlertHistory();
        if (hist && hist.notifications) {
          setNotifications(
            hist.notifications.map((n) => ({
              notificationId: n.notificationId,
              userId: 'guest',
              title: n.title,
              message: n.body,
              severity: n.severity,
              locationName: n.locationName,
              coordinates: [n.latitude || 13.0827, n.longitude || 80.2707],
              isRead: n.isRead,
              createdAt: n.timestamp,
              deliveryLogs: [
                {
                  channel: 'IN_APP',
                  recipient: 'guest',
                  status: 'CONFIRMED_DELIVERED',
                  timestamp: n.timestamp,
                },
              ],
            }))
          );
        }
      } catch (e) {
        console.warn('Could not load notifications:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Could not mark notification read:', err);
    }
  };

  const handleTestDispatch = async () => {
    setTestDispatching(true);
    setTestResult(null);
    try {
      const res = await api.testDispatchAlert();
      setTestResult(res.result);
      await loadNotifications();
    } catch (err) {
      console.error('Test dispatch failed:', err);
    } finally {
      setTestDispatching(false);
    }
  };

  if (!isOpen) return null;

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed top-16 bottom-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col pointer-events-auto">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-carto-border bg-surface-muted/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-risk-high-bg border border-risk-high/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-risk-high" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-sm text-forest-deep">
                  AWS Hazard Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-risk-high text-white text-[10px] font-mono font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-carto-muted">
                Amazon SES, SNS & In-App Multi-Channel Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-carto-muted hover:text-carto-text hover:bg-surface-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Test Dispatch Bar */}
        <div className="px-4 py-2 border-b border-carto-border bg-paper flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFilterUnread(false)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                !filterUnread ? 'bg-surface text-forest font-bold shadow-xs' : 'text-carto-muted'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                filterUnread ? 'bg-surface text-forest font-bold shadow-xs' : 'text-carto-muted'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <button
            onClick={handleTestDispatch}
            disabled={testDispatching}
            className="inline-flex items-center space-x-1 text-[11px] text-forest font-semibold hover:underline"
            title="Safe test mode: evaluates rules and creates a test in-app alert"
          >
            <RefreshCw className={`w-3 h-3 ${testDispatching ? 'animate-spin' : ''}`} />
            <span>{testDispatching ? 'Dispatching...' : 'Test Alert'}</span>
          </button>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className="m-3 p-3 rounded-xl bg-forest-subtle border border-forest/30 text-xs text-forest space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>Test Alert Dispatched</span>
              <button onClick={() => setTestResult(null)} className="text-carto-muted hover:text-carto-text">
                &times;
              </button>
            </div>
            <p className="text-[11px] leading-relaxed">
              Users Evaluated: {testResult.evaluatedUsersCount} &bull; Notifications Created: {testResult.notificationsCreated}
            </p>
            <p className="text-[10px] font-mono text-carto-muted">
              SES Emails: {testResult.emailsAttempted} &bull; SNS SMS: {testResult.smsAttempted} &bull; Quiet Suppressed: {testResult.suppressedQuietHours}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-carto-muted animate-pulse">
              Retrieving notification telemetry from Amazon DynamoDB...
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-carto-muted space-y-2">
              <CheckCircle2 className="w-8 h-8 text-forest mx-auto opacity-70" />
              <p className="font-semibold text-forest-deep">No Active Hazard Alerts</p>
              <p>No critical weather warnings or road blockages have triggered your criteria.</p>
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <div
                key={notif.notificationId}
                className={`p-3 rounded-xl border text-xs transition ${
                  notif.isRead
                    ? 'bg-paper border-carto-border opacity-85'
                    : 'bg-surface border-forest/40 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <ShieldAlert
                      className={`w-3.5 h-3.5 shrink-0 ${
                        notif.severity === 'CRITICAL' ? 'text-risk-crit' : 'text-risk-high'
                      }`}
                    />
                    <h4 className="font-semibold text-forest-deep">{notif.title}</h4>
                  </div>
                  <RiskBadge severity={notif.severity} size="sm" showIcon={false} />
                </div>

                <p className="text-carto-text mt-1.5 leading-relaxed">{notif.message}</p>

                {/* Delivery Channels Badges */}
                {notif.deliveryLogs && notif.deliveryLogs.length > 0 && (
                  <div className="mt-2 flex items-center space-x-1.5">
                    {notif.deliveryLogs.map((log, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-surface-muted text-[10px] font-mono text-carto-muted border border-carto-border"
                      >
                        {log.channel === 'EMAIL_SES' && <Mail className="w-2.5 h-2.5 mr-0.5 text-carto-accent" />}
                        {log.channel === 'SMS_SNS' && <Smartphone className="w-2.5 h-2.5 mr-0.5 text-forest" />}
                        {log.channel === 'IN_APP' && <Bell className="w-2.5 h-2.5 mr-0.5 text-amber-600" />}
                        <span>{log.channel}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2.5 pt-2 border-t border-carto-border/60 flex items-center justify-between text-[11px] text-carto-muted">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-carto-accent" />
                    <span>{notif.locationName}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.notificationId)}
                        className="text-[10px] text-forest hover:underline font-medium"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>

                {onSelectReportLocation && notif.coordinates && (
                  <button
                    onClick={() => {
                      onSelectReportLocation(notif.coordinates[0], notif.coordinates[1]);
                      onClose();
                    }}
                    className="w-full mt-2 py-1 text-center text-[11px] text-forest hover:underline font-medium"
                  >
                    View on Map →
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Link to Settings */}
        <div className="p-3 border-t border-carto-border bg-surface-muted/40 flex items-center justify-between text-xs">
          <span className="text-carto-muted">Amazon SNS/SES preferences:</span>
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center space-x-1 font-semibold text-forest hover:text-forest-deep"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Alert Preferences</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

