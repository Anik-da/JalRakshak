import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FloodReport,
  SeverityLevel,
  RoadCondition,
  MultiHorizonRiskAssessment,
  ForecastHorizon,
  MapRiskLayersResponse,
} from '../types';
import { FloodMap, LayerVisibilityState } from '../components/map/FloodMap';
import { MapFloatingControls } from '../components/map/MapFloatingControls';
import { ReportDetailPanel } from '../components/map/ReportDetailPanel';
import { MyLocationIntelligencePanel } from '../components/intelligence/MyLocationIntelligencePanel';
import { AskJalrakshakDrawer } from '../components/intelligence/AskJalrakshakDrawer';
import { AlertsDrawer } from '../components/intelligence/AlertsDrawer';
import { RiskBadge, RoadConditionBadge, VerificationBadge } from '../components/common/RiskBadge';
import {
  Map,
  List,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Sparkles,
  Compass,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { detectLiveLocation } from '../services/liveLocation';

export const MapPage: React.FC = () => {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layers data
  const [layersData, setLayersData] = useState<MapRiskLayersResponse | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>({
    reports: true,
    riskZones: true,
    observedRainfall: true,
    forecastRainfall: true,
    historicalHotspots: true,
    officialWarnings: true,
  });

  // Selected forecast horizon for predictive layers (Now, 1h, 3h, 6h, 24h)
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>('NOW');

  // Location intelligence state
  const [locationIntelligence, setLocationIntelligence] = useState<MultiHorizonRiskAssessment | null>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(true);

  // Assistant & Alerts Drawers
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Filters & Report Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'ALL'>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<RoadCondition | 'ALL'>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);

  // Geolocation
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.045, 80.210]);
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  // View mode: Map vs Accessible List View
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

  const fetchInitialData = async (lat: number = 13.045, lng: number = 80.210) => {
    setLoading(true);
    setError(null);
    try {
      const [repRes, layersRes] = await Promise.all([
        api.getReports({
          severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
          roadCondition: selectedCondition !== 'ALL' ? selectedCondition : undefined,
          includeDemo,
        }),
        api.getMapRiskLayers(lat, lng),
      ]);
      setReports(repRes.reports);
      setLayersData(layersRes);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to flood intelligence service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationIntelligence = async (lat: number, lng: number, locality?: string) => {
    setLoadingIntelligence(true);
    try {
      const res = await api.getLocationIntelligence(lat, lng, locality);
      setLocationIntelligence(res);
    } catch {
      // Fallback: silent failure on location intelligence
    } finally {
      setLoadingIntelligence(false);
    }
  };

  useEffect(() => {
    fetchInitialData(mapCenter[0], mapCenter[1]);
  }, [selectedSeverity, selectedCondition, includeDemo]);

  // Initial mount: automatically detect and center on user's live position (GPS or network IP)
  useEffect(() => {
    detectLiveLocation().then((loc) => {
      setUserCoordinates(loc.coordinates);
      setMapCenter(loc.coordinates);
      fetchLocationIntelligence(loc.coordinates[0], loc.coordinates[1], loc.localityName);
    });
  }, []);

  // Handle User Clicking "Locate Me" or Crosshair
  const handleLocateUser = async () => {
    setLocatingUser(true);
    try {
      const loc = await detectLiveLocation();
      setUserCoordinates(loc.coordinates);
      setMapCenter(loc.coordinates);
      await fetchLocationIntelligence(loc.coordinates[0], loc.coordinates[1], loc.localityName);
      setShowLocationPanel(true);
    } catch (err) {
      console.warn('Locate user error:', err);
    } finally {
      setLocatingUser(false);
    }
  };

  const handleToggleLayer = (layerKey: keyof LayerVisibilityState) => {
    setLayerVisibility((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Client-side search and verified-only filtering
  const filteredReports = reports.filter((r) => {
    if (verifiedOnly && r.status !== 'VERIFIED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.locationName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-paper overflow-hidden">
      {/* View Switcher Strip (Top Sub-bar) */}
      <div className="bg-surface/85 backdrop-blur-md border-b border-carto-border px-4 py-2 flex items-center justify-between text-xs font-mono z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-carto-muted">Active Sector:</span>
          <span className="text-forest font-semibold truncate max-w-[180px]">
            {locationIntelligence?.location.localityName || 'Locating Live Position...'}
          </span>
          <span className="text-carto-border hidden sm:inline">|</span>
          <button
            onClick={() => {
              setMapCenter([13.045, 80.210]);
              fetchLocationIntelligence(13.045, 80.210, 'Chennai Metropolitan River Basin');
            }}
            className="text-[10px] text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded transition hidden sm:inline"
            title="Focus map on Chennai Demonstration Basin"
          >
            Chennai Basin
          </button>
          {userCoordinates && (
            <button
              onClick={() => {
                setMapCenter(userCoordinates);
                fetchLocationIntelligence(userCoordinates[0], userCoordinates[1], 'My Live Position');
              }}
              className="text-[10px] text-forest-deep hover:text-forest bg-forest-subtle hover:bg-forest/20 border border-forest/30 px-2 py-0.5 rounded transition hidden sm:inline"
              title="Focus map on My Live Location"
            >
              My Live Location
            </button>
          )}
          <span className="text-carto-border hidden md:inline">|</span>
          <span className="text-carto-muted hidden md:inline">{filteredReports.length} reports</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Ask AI quick button */}
          <button
            onClick={() => setAssistantOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-forest-subtle hover:bg-forest hover:text-white text-forest border border-forest/30 transition text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Alerts quick button */}
          <button
            onClick={() => setAlertsOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-surface hover:bg-surface-muted border border-carto-border text-carto-text transition text-xs"
            title="Personalized Alerts"
          >
            <Bell className="w-3.5 h-3.5 text-risk-high" />
            <span className="hidden sm:inline">Alerts</span>
          </button>

          {/* Toggle Location Intelligence Panel */}
          <button
            onClick={() => setShowLocationPanel(!showLocationPanel)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-surface hover:bg-surface-muted border border-carto-border text-carto-text transition text-xs"
            title="Toggle Location Intelligence Panel"
          >
            <Compass className="w-3.5 h-3.5 text-forest" />
            <span className="hidden md:inline">Intelligence</span>
            {showLocationPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'MAP' ? 'LIST' : 'MAP')}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-muted hover:bg-surface border border-carto-border text-carto-text transition"
            title="Toggle between Map and Accessible List view"
          >
            {viewMode === 'MAP' ? (
              <>
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List View</span>
              </>
            ) : (
              <>
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Map or List View Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {viewMode === 'MAP' ? (
          <>
            <FloodMap
              reports={filteredReports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              center={mapCenter}
              zoom={13}
              userLocation={userCoordinates}
              layers={layersData ? {
                riskZones: layersData.riskZonesLayer,
                observedRainfall: layersData.observedRainfallLayer,
                forecastRainfall: layersData.forecastRainfallLayer,
                historicalHotspots: layersData.historicalHotspotsLayer,
                officialWarnings: layersData.officialWarningsLayer,
              } : undefined}
              layerVisibility={layerVisibility}
              selectedHorizon={selectedHorizon}
              className="w-full h-full"
            />

            {/* Map Floating Controls (Top Left & Top Right) */}
            <MapFloatingControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onLocateUser={handleLocateUser}
              locatingUser={locatingUser}
              selectedSeverity={selectedSeverity}
              onSelectSeverity={setSelectedSeverity}
              selectedCondition={selectedCondition}
              onSelectCondition={setSelectedCondition}
              verifiedOnly={verifiedOnly}
              onToggleVerifiedOnly={() => setVerifiedOnly(!verifiedOnly)}
              includeDemo={includeDemo}
              onToggleIncludeDemo={() => setIncludeDemo(!includeDemo)}
              reportCount={filteredReports.length}
              layerVisibility={layerVisibility}
              onToggleLayer={handleToggleLayer}
              selectedHorizon={selectedHorizon}
              onSelectHorizon={setSelectedHorizon}
              onOpenAssistant={() => setAssistantOpen(true)}
            />

            {/* FEATURE 1: Prominent "My Location Intelligence" Panel */}
            {showLocationPanel && (
              <div className="absolute bottom-4 left-4 z-[1000] max-w-sm sm:max-w-md w-full pointer-events-auto animate-fade-in max-h-[calc(100vh-12rem)] overflow-y-auto">
                <MyLocationIntelligencePanel
                  intelligence={locationIntelligence}
                  loading={loadingIntelligence}
                  onLocateMe={handleLocateUser}
                  locating={locatingUser}
                  selectedHorizon={selectedHorizon}
                  onSelectHorizon={setSelectedHorizon}
                  onOpenAssistant={() => setAssistantOpen(true)}
                />
              </div>
            )}

            {/* Report Detail Side-Panel (Floating Bottom/Right) */}
            {selectedReport && (
              <div className="absolute bottom-4 right-4 z-[1000] max-w-sm w-full pointer-events-auto">
                <ReportDetailPanel
                  report={selectedReport}
                  onClose={() => setSelectedReport(null)}
                />
              </div>
            )}
          </>
        ) : (
          /* Accessible Table/List View */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-forest-deep">
                  Active Flood Observations & Hazards
                </h2>
                <p className="text-xs text-carto-muted">
                  Accessible tabular directory of crowd-sourced hazard telemetry
                </p>
              </div>
              <Link
                to="/report"
                className="inline-flex items-center space-x-1.5 bg-forest text-white px-3 py-1.5 rounded-md text-xs font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Report</span>
              </Link>
            </div>

            <div className="bg-surface rounded-xl border border-carto-border overflow-hidden shadow-carto">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted border-b border-carto-border text-carto-muted font-mono uppercase">
                    <tr>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Road Passage</th>
                      <th className="px-4 py-3">Water Depth</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Observed</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carto-border">
                    {filteredReports.map((r) => (
                      <tr key={r.reportId} className="hover:bg-surface-muted/50 transition">
                        <td className="px-4 py-3 font-medium text-forest-deep">
                          <div>{r.locationName}</div>
                          <div className="text-[11px] text-carto-muted truncate max-w-xs">{r.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge severity={r.severity} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <RoadConditionBadge condition={r.roadCondition} />
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {r.waterDepthCm ? `${r.waterDepthCm} cm` : 'Not recorded'}
                        </td>
                        <td className="px-4 py-3">
                          <VerificationBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-carto-muted font-mono">
                          {new Date(r.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setMapCenter([r.latitude, r.longitude]);
                              setViewMode('MAP');
                            }}
                            className="text-forest hover:text-forest-deep font-medium"
                          >
                            Locate on Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ask JalRakshak Assistant Drawer */}
      <AskJalrakshakDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        currentAssessment={locationIntelligence}
      />

      {/* Personalized Alerts Drawer */}
      <AlertsDrawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        onSelectReportLocation={(lat, lng) => {
          setMapCenter([lat, lng]);
          fetchLocationIntelligence(lat, lng);
        }}
      />
    </div>
  );
};
