import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserAlertPreference, SeverityLevel } from '../types';
import {
  Shield,
  Lock,
  Eye,
  MapPin,
  Database,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  Bell,
  Clock,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const [alertPrefs, setAlertPrefs] = useState<UserAlertPreference | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New saved location form
  const [newLocLabel, setNewLocLabel] = useState('');
  const [newLocLat, setNewLocLat] = useState('13.0418');
  const [newLocLng, setNewLocLng] = useState('80.2341');
  const [newLocRadius, setNewLocRadius] = useState('5');
  const [newLocSeverity, setNewLocSeverity] = useState<SeverityLevel>('HIGH');

  useEffect(() => {
    api
      .getAlertPreferences()
      .then((prefs) => setAlertPrefs(prefs))
      .catch(() => {});
  }, []);

  const handleSavePreferences = async () => {
    if (!alertPrefs) return;
    setSavingPrefs(true);
    setSaveSuccess(false);
    try {
      const res = await api.updateAlertPreferences(alertPrefs);
      setAlertPrefs(res.preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertPrefs || !newLocLabel.trim()) return;

    const newLoc = {
      id: `loc-${Date.now()}`,
      label: newLocLabel.trim(),
      latitude: parseFloat(newLocLat) || 13.0827,
      longitude: parseFloat(newLocLng) || 80.2707,
      radiusKm: parseInt(newLocRadius, 10) || 5,
      triggerOnSeverity: newLocSeverity,
      notifyOnOfficialWarnings: true,
      notifyOnRoadBlockages: true,
    };

    setAlertPrefs({
      ...alertPrefs,
      savedLocations: [...alertPrefs.savedLocations, newLoc],
    });
    setNewLocLabel('');
  };

  const handleRemoveLocation = (id: string) => {
    if (!alertPrefs) return;
    setAlertPrefs({
      ...alertPrefs,
      savedLocations: alertPrefs.savedLocations.filter((l) => l.id !== id),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-carto-muted mb-1">
          <span>Platform Settings</span>
          <span>/</span>
          <span className="text-forest">Data Governance, Alerts & Privacy</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-carto-text">
          Settings, Alerts & Responsible Disclosure
        </h1>
        <p className="text-xs text-carto-muted mt-1 max-w-2xl leading-relaxed">
          Configure personalized hazard notifications for your home or daily commute, manage quiet hours, and inspect our AWS security posture.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Details */}
        <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-4">
          <h2 className="text-sm font-mono uppercase text-forest font-bold tracking-wider">
            Active Civic Contributor Profile
          </h2>
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div>Email: <strong className="text-carto-text">{user?.email}</strong></div>
                <div>Role: <strong className="text-forest font-bold">{user?.role}</strong></div>
                <div className="text-carto-muted">Amazon Cognito User ID: {user?.userId}</div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-risk-crit/30 text-risk-crit hover:bg-risk-crit-bg text-xs font-mono transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-carto-muted">
              You are browsing in public read-only guest mode. Sign in to submit observations and save personal alert boundaries.
            </p>
          )}
        </div>

        {/* FEATURE 6: PERSONALIZED HAZARD ALERTS CONFIGURATION */}
        {alertPrefs && (
          <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-6">
            <div className="flex items-center justify-between border-b border-carto-border pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-forest" />
                <h3 className="text-lg font-display font-bold text-forest-deep">
                  Personalized Hazard Alerts & Monitoring Zones
                </h3>
              </div>
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="px-4 py-1.5 rounded-lg bg-forest hover:bg-forest-deep text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Save className={`w-3.5 h-3.5 ${savingPrefs ? 'animate-spin' : ''}`} />
                <span>{savingPrefs ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-forest-subtle border border-forest/30 rounded-lg text-xs text-forest flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Alert preferences updated and saved to Amazon DynamoDB!</span>
              </div>
            )}

            {/* Notification Channels */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-forest-deep block">Delivery Channels:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center space-x-2 p-3 rounded-xl bg-paper border border-carto-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertPrefs.enableInApp}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, enableInApp: e.target.checked })}
                    className="accent-forest"
                  />
                  <span>In-App Notifications</span>
                </label>

                <label className="flex items-center space-x-2 p-3 rounded-xl bg-paper border border-carto-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertPrefs.enableEmail}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, enableEmail: e.target.checked })}
                    className="accent-forest"
                  />
                  <span>Email Advisories (Amazon SES)</span>
                </label>

                <label className="flex items-center space-x-2 p-3 rounded-xl bg-paper border border-carto-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertPrefs.enableSns}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, enableSns: e.target.checked })}
                    className="accent-forest"
                  />
                  <span>SMS Push (Amazon SNS)</span>
                </label>
              </div>

              {/* Delivery Destination Inputs & Status Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                {/* Email Destination & SES Sandbox Guidance */}
                <div className="p-3.5 rounded-xl bg-paper border border-carto-border space-y-2">
                  <label className="text-xs font-semibold text-forest-deep block">
                    Advisory Delivery Email:
                  </label>
                  <input
                    type="email"
                    value={alertPrefs.email}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full p-2 rounded bg-surface border border-carto-border text-xs font-mono"
                  />
                  <div className="text-[10px] text-carto-muted leading-relaxed bg-surface-muted p-2 rounded border border-carto-border">
                    <strong className="text-forest">Amazon SES Notice:</strong> While AWS SES is in Sandbox mode, recipient addresses must be verified identities in your AWS SES Console. Production access allows arbitrary public addresses.
                  </div>
                </div>

                {/* SMS Phone Destination & Indian TRAI DLT Notice */}
                <div className="p-3.5 rounded-xl bg-paper border border-carto-border space-y-2">
                  <label className="text-xs font-semibold text-forest-deep block">
                    SMS Destination Number (E.164 format):
                  </label>
                  <input
                    type="tel"
                    value={alertPrefs.phone || ''}
                    onChange={(e) => setAlertPrefs({ ...alertPrefs, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full p-2 rounded bg-surface border border-carto-border text-xs font-mono"
                  />
                  <div className="text-[10px] text-carto-muted leading-relaxed bg-surface-muted p-2 rounded border border-carto-border">
                    <strong className="text-forest">Amazon SNS India (TRAI):</strong> In India (+91), sending commercial/transactional SMS requires Enterprise Entity ID and Template ID registration on telecom DLT portals under TCCCPR 2018.
                  </div>
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="p-4 rounded-xl bg-surface-muted border border-carto-border space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest-deep flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-carto-muted" />
                  <span>Quiet Hours (Suppress Non-Critical Alerts)</span>
                </span>
                <input
                  type="checkbox"
                  checked={alertPrefs.quietHoursEnabled}
                  onChange={(e) => setAlertPrefs({ ...alertPrefs, quietHoursEnabled: e.target.checked })}
                  className="accent-forest"
                />
              </div>

              {alertPrefs.quietHoursEnabled && (
                <div className="flex items-center space-x-4 pt-1">
                  <div>
                    <label className="text-[11px] text-carto-muted block">Start Time:</label>
                    <input
                      type="time"
                      value={alertPrefs.quietHoursStart || '22:00'}
                      onChange={(e) => setAlertPrefs({ ...alertPrefs, quietHoursStart: e.target.value })}
                      className="bg-surface border border-carto-border rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-carto-muted block">End Time:</label>
                    <input
                      type="time"
                      value={alertPrefs.quietHoursEnd || '06:00'}
                      onChange={(e) => setAlertPrefs({ ...alertPrefs, quietHoursEnd: e.target.value })}
                      className="bg-surface border border-carto-border rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <span className="text-[10px] text-carto-muted italic mt-3">
                    Critical road closures and red warnings bypass quiet hours.
                  </span>
                </div>
              )}
            </div>

            {/* Saved Monitoring Locations */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-forest-deep block">Saved Monitoring Localities:</span>
              <div className="space-y-2">
                {alertPrefs.savedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-paper border border-carto-border text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-carto-accent shrink-0" />
                      <div>
                        <span className="font-bold text-forest-deep block">{loc.label}</span>
                        <span className="text-[11px] text-carto-muted font-mono">
                          {loc.latitude}°N, {loc.longitude}°E &bull; Radius: {loc.radiusKm} km &bull; Min Severity: {loc.triggerOnSeverity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLocation(loc.id)}
                      className="p-1.5 text-carto-muted hover:text-risk-crit transition rounded"
                      title="Remove Location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Location Form */}
              <form onSubmit={handleAddLocation} className="p-4 rounded-xl bg-surface border border-carto-border space-y-3 text-xs">
                <span className="font-semibold text-forest-deep block">Add Monitoring Location:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-carto-muted block mb-0.5">Label:</label>
                    <input
                      type="text"
                      required
                      value={newLocLabel}
                      onChange={(e) => setNewLocLabel(e.target.value)}
                      placeholder="e.g. Campus / Work"
                      className="w-full p-2 rounded bg-paper border border-carto-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-carto-muted block mb-0.5">Latitude:</label>
                    <input
                      type="text"
                      required
                      value={newLocLat}
                      onChange={(e) => setNewLocLat(e.target.value)}
                      className="w-full p-2 rounded bg-paper border border-carto-border font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-carto-muted block mb-0.5">Longitude:</label>
                    <input
                      type="text"
                      required
                      value={newLocLng}
                      onChange={(e) => setNewLocLng(e.target.value)}
                      className="w-full p-2 rounded bg-paper border border-carto-border font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-carto-muted block mb-0.5">Alert Radius:</label>
                    <select
                      value={newLocRadius}
                      onChange={(e) => setNewLocRadius(e.target.value)}
                      className="w-full p-2 rounded bg-paper border border-carto-border text-xs"
                    >
                      <option value="3">3 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-forest hover:bg-forest-deep text-white font-medium rounded-lg text-xs transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Location</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Privacy & Public Sanitization Policy */}
        <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-carto-muted font-bold">
            <Eye className="w-4 h-4 text-forest" />
            <span>Public Data Sanitization Protocol</span>
          </div>
          <h3 className="text-lg font-display font-bold text-carto-text">
            What is Publicly Visible vs Privately Shielded
          </h3>
          <p className="text-xs text-carto-muted leading-relaxed">
            When you submit a flood hazard report, only the observed geographic coordinates, road condition, water depth, photograph, and description are exposed on the interactive hazard map. Contributor identities remain strictly protected.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-4 rounded-xl bg-forest-subtle border border-forest/20 space-y-2">
              <div className="flex items-center space-x-1.5 text-forest font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Publicly Shared</span>
              </div>
              <ul className="space-y-1 text-carto-text text-[11px] list-disc list-inside">
                <li>Latitude and longitude coordinates</li>
                <li>Road / locality name</li>
                <li>Observed water depth & passability</li>
                <li>Masked contributor identifier (e.g. c***@community.in)</li>
                <li>Field observation timestamp</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-carto-border space-y-2">
              <div className="flex items-center space-x-1.5 text-carto-muted font-bold">
                <Lock className="w-4 h-4" />
                <span>Strictly Confidential</span>
              </div>
              <ul className="space-y-1 text-carto-muted text-[11px] list-disc list-inside">
                <li>Your phone number (never requested or exposed)</li>
                <li>Full email address (kept private in Cognito)</li>
                <li>Amazon Cognito internal user sub</li>
                <li>Unmoderated private reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Environmental Data Sources & Limitations */}
        <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-carto-muted font-bold">
            <Database className="w-4 h-4 text-water" />
            <span>Telemetry Sources & Scientific Transparency</span>
          </div>
          <h3 className="text-lg font-display font-bold text-carto-text">
            Official Data Integration & Non-Deterministic Boundaries
          </h3>
          <p className="text-xs text-carto-muted leading-relaxed">
            JalRakshak AI utilizes public numerical weather prediction feeds and India Meteorological Department bulletins. Numerical rainfall estimates operate on regional grids and cannot guarantee instantaneous street-level puddle depth.
          </p>

          <div className="p-4 rounded-xl bg-paper border border-carto-border text-xs text-carto-text space-y-2">
            <div className="flex items-center space-x-2 font-bold text-forest-deep">
              <Shield className="w-4 h-4 text-forest" />
              <span>Safety Disclaimer:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Never attempt to traverse deep floodwaters on foot, two-wheelers, or passenger cars. Always heed official sirens and emergency instructions from state disaster response forces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
