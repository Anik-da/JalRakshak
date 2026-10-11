import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { UserAlertNotification, AlertDispatchResult } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  Clock,
  MapPin,
  Mail,
  Smartphone,
  RefreshCw,
  Settings,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<UserAlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('ALL');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<AlertDispatchResult | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getInAppNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleTestDispatch = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.testDispatchAlert();
      setDispatchResult(res.result);
      await fetchNotifications();
    } catch (err) {
      console.error('Test dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'CRITICAL') return n.severity === 'CRITICAL';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter((n) => n.severity === 'CRITICAL').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-carto-border pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-carto-muted mb-1">
            <span>AWS Messaging System</span>
            <span>/</span>
            <span className="text-forest">Amazon SES & SNS Notification Center</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-carto-text">
            Hazard Advisories & Notification History
          </h1>
          <p className="text-xs text-carto-muted mt-1 max-w-2xl leading-relaxed">
            Targeted flood bulletins dispatched for your monitoring boundaries via In-App notifications, Amazon SES email, and Amazon SNS SMS.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleTestDispatch}
            disabled={dispatching}
            className="px-3.5 py-2 rounded-xl bg-forest hover:bg-forest-deep text-white font-medium text-xs transition flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dispatching ? 'animate-spin' : ''}`} />
            <span>{dispatching ? 'Dispatching...' : 'Trigger Test Dispatch'}</span>
          </button>

          <Link
            to="/settings"
            className="p-2 rounded-xl border border-carto-border bg-surface hover:bg-paper text-carto-muted hover:text-carto-text transition"
            title="Configure Alert Preferences"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto text-center space-y-1">
          <span className="text-xs font-mono uppercase text-carto-muted">Total Bulletins</span>
          <div className="text-3xl font-display font-bold text-carto-text">{notifications.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto text-center space-y-1">
          <span className="text-xs font-mono uppercase text-carto-muted">Unread Alerts</span>
          <div className="text-3xl font-display font-bold text-forest">{unreadCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto text-center space-y-1">
          <span className="text-xs font-mono uppercase text-carto-muted">Critical Inundations</span>
          <div className="text-3xl font-display font-bold text-risk-crit">{criticalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-carto-border shadow-carto text-center space-y-1">
          <span className="text-xs font-mono uppercase text-carto-muted">AWS Channels</span>
          <div className="text-xs font-mono font-semibold text-carto-text mt-2 flex justify-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-surface-muted border border-carto-border">SES</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-muted border border-carto-border">SNS</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-muted border border-carto-border">IN-APP</span>
          </div>
        </div>
      </div>

      {/* Test Dispatch Result Banner */}
      {dispatchResult && (
        <div className="p-4 rounded-2xl bg-forest-subtle border border-forest/30 text-xs text-forest space-y-2 animate-fade-in">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>EventBridge Scheduled Check Completed (Dispatch ID: {dispatchResult.dispatchId})</span>
            </span>
            <button
              onClick={() => setDispatchResult(null)}
              className="text-carto-muted hover:text-carto-text font-bold"
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div>Users Evaluated: <strong>{dispatchResult.evaluatedUsersCount}</strong></div>
            <div>New Notifications: <strong>{dispatchResult.notificationsCreated}</strong></div>
            <div>SES Emails: <strong>{dispatchResult.emailsAttempted}</strong></div>
            <div>SNS SMS: <strong>{dispatchResult.smsAttempted}</strong></div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-carto-border pb-3 text-xs">
        <span className="text-carto-muted font-mono flex items-center space-x-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </span>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filter === 'ALL'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filter === 'UNREAD'
              ? 'bg-forest text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('CRITICAL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filter === 'CRITICAL'
              ? 'bg-risk-crit text-white font-semibold shadow-xs'
              : 'text-carto-muted hover:text-carto-text hover:bg-surface'
          }`}
        >
          Critical Only ({criticalCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-carto-muted animate-pulse">
            Retrieving notification telemetry from Amazon DynamoDB...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-carto-muted bg-surface rounded-2xl border border-carto-border p-8 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-forest mx-auto opacity-70" />
            <h3 className="font-semibold text-carto-text text-sm">No Advisories in Selected Filter</h3>
            <p>You have no notifications matching your current filter criteria.</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.notificationId}
              className={`p-4 sm:p-5 rounded-2xl border text-xs transition ${
                notif.isRead
                  ? 'bg-surface border-carto-border opacity-90'
                  : 'bg-surface border-forest/40 shadow-carto'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carto-border/60 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert
                    className={`w-4 h-4 shrink-0 ${
                      notif.severity === 'CRITICAL' ? 'text-risk-crit' : 'text-risk-high'
                    }`}
                  />
                  <h3 className="font-display font-bold text-sm text-forest-deep">
                    {notif.title}
                  </h3>
                  {!notif.isRead && (
                    <span className="px-1.5 py-0.5 rounded-full bg-forest text-white text-[9px] font-mono font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[11px] font-mono text-carto-muted flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </span>
                  <RiskBadge severity={notif.severity} size="sm" showIcon={false} />
                </div>
              </div>

              <p className="text-carto-text text-xs leading-relaxed my-3">{notif.message}</p>

              {/* Delivery Channels Badges & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-carto-border/60 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="text-carto-muted flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-carto-accent" />
                    <span>{notif.locationName}</span>
                  </span>
                  <span className="text-carto-muted">&bull;</span>
                  <div className="flex items-center space-x-1">
                    {notif.deliveryLogs &&
                      notif.deliveryLogs.map((log, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-surface-muted text-[10px] font-mono text-carto-muted border border-carto-border"
                        >
                          {log.channel === 'EMAIL_SES' && <Mail className="w-2.5 h-2.5 mr-0.5 text-carto-accent" />}
                          {log.channel === 'SMS_SNS' && <Smartphone className="w-2.5 h-2.5 mr-0.5 text-forest" />}
                          {log.channel === 'IN_APP' && <Bell className="w-2.5 h-2.5 mr-0.5 text-amber-600" />}
                          <span>{log.channel}</span>
                        </span>
                      ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {notif.coordinates && (
                    <Link
                      to={`/map?lat=${notif.coordinates[0]}&lng=${notif.coordinates[1]}`}
                      className="text-forest hover:text-forest-deep font-semibold"
                    >
                      View on Interactive Map →
                    </Link>
                  )}
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.notificationId)}
                      className="text-carto-muted hover:text-carto-text font-medium underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
