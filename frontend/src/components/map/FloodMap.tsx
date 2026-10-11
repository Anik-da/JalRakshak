import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  FloodReport,
  SeverityLevel,
  RiskZoneLayer,
  RainfallObservationPoint,
  HistoricalHotspot,
  WeatherWarning,
  ForecastHorizon,
} from '../../types';

export interface LayerVisibilityState {
  reports: boolean;
  riskZones: boolean;
  observedRainfall: boolean;
  forecastRainfall: boolean;
  historicalHotspots: boolean;
  officialWarnings: boolean;
}

interface FloodMapProps {
  reports: FloodReport[];
  selectedReport: FloodReport | null;
  onSelectReport: (report: FloodReport | null) => void;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  layers?: {
    riskZones?: RiskZoneLayer[];
    observedRainfall?: RainfallObservationPoint[];
    forecastRainfall?: Array<{ coordinates: [number, number]; areaName: string; forecast1hMm: number; forecast6hMm: number; forecast24hMm: number }>;
    historicalHotspots?: HistoricalHotspot[];
    officialWarnings?: WeatherWarning[];
  };
  layerVisibility?: LayerVisibilityState;
  selectedHorizon?: ForecastHorizon;
  interactive?: boolean;
  className?: string;
}

// Balanced Chennai Metropolitan geographical center (covers inland basins, reservoirs, & urban corridors)
const DEFAULT_CHENNAI_CENTER: [number, number] = [13.045, 80.210];

export const FloodMap: React.FC<FloodMapProps> = ({
  reports,
  selectedReport,
  onSelectReport,
  center = DEFAULT_CHENNAI_CENTER,
  zoom = 12,
  userLocation,
  layers,
  layerVisibility = {
    reports: true,
    riskZones: true,
    observedRainfall: true,
    forecastRainfall: true,
    historicalHotspots: true,
    officialWarnings: true,
  },
  selectedHorizon = 'NOW',
  interactive = true,
  className = 'w-full h-full min-h-[420px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const reportsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const riskZonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rainfallLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const forecastLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        attributionControl: false,
      });

      // Cartographic Base Map (OpenStreetMap with clean aesthetic)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &bull; JalRakshak AI',
      }).addTo(map);

      // Initialize groups in layer order
      riskZonesLayerGroupRef.current = L.layerGroup().addTo(map);
      hotspotsLayerGroupRef.current = L.layerGroup().addTo(map);
      forecastLayerGroupRef.current = L.layerGroup().addTo(map);
      rainfallLayerGroupRef.current = L.layerGroup().addTo(map);
      reportsLayerGroupRef.current = L.layerGroup().addTo(map);
      userLocLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size on initial mount across multiple ticks to guarantee tiles fill container
      const t1 = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 200);
      const t3 = setTimeout(() => map.invalidateSize(), 500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ResizeObserver: Automatically resize Leaflet when container dimensions change (e.g. drawer toggling or screen resize)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update center when changed with smooth animation
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center[0], center[1], zoom]);

  // User location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocLayerGroupRef.current) return;
    userLocLayerGroupRef.current.clearLayers();

    if (userLocation) {
      const userMarkerHtml = `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background-color: rgba(2, 132, 199, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 3px; border-radius: 50%; background-color: #0284C7; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'user-loc-icon',
        html: userMarkerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(userLocation, { icon }).bindPopup(
        `<div style="font-family: inherit; font-size: 12px; font-weight: 600; color: #0F172A;">Your Active Position</div>`
      );

      userLocLayerGroupRef.current.addLayer(marker);
    }
  }, [userLocation]);

  // Render Flood Reports Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !reportsLayerGroupRef.current) return;
    reportsLayerGroupRef.current.clearLayers();

    if (!layerVisibility.reports) return;

    reports.forEach((report) => {
      const isSelected = selectedReport?.reportId === report.reportId;
      const isBlocked = report.roadCondition === 'BLOCKED';

      let bg = '#0284C7';
      if (report.severity === 'CRITICAL') bg = '#E11D48';
      else if (report.severity === 'HIGH') bg = '#EA580C';
      else if (report.severity === 'MODERATE') bg = '#D97706';

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; cursor: pointer;">
          ${isSelected ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px dashed ${bg}; animation: spin 4s linear infinite;"></div>` : ''}
          <div style="width: 28px; height: 28px; border-radius: 50%; background-color: ${bg}; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 11px; font-weight: bold;">
            ${isBlocked ? '✕' : (report.waterDepthCm ? `${report.waterDepthCm}` : '●')}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'flood-report-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([report.latitude, report.longitude], { icon });

      marker.on('click', () => {
        onSelectReport(report);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0F172A; max-width: 220px;">
          <div style="font-weight: 700; color: ${bg}; font-size: 13px;">${report.locationName}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${report.description}</div>
          <div style="margin-top: 6px; display: flex; gap: 6px; font-size: 10px; font-family: monospace;">
            <span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${report.severity}</span>
            <span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px;">${report.roadCondition}</span>
          </div>
        </div>
      `);

      reportsLayerGroupRef.current?.addLayer(marker);
    });
  }, [reports, selectedReport, layerVisibility.reports]);

  // Render Risk Zones (Polygons / Circles)
  useEffect(() => {
    if (!mapInstanceRef.current || !riskZonesLayerGroupRef.current) return;
    riskZonesLayerGroupRef.current.clearLayers();

    if (!layerVisibility.riskZones || !layers?.riskZones) return;

    layers.riskZones.forEach((zone) => {
      const zoneCat = zone.horizons?.[selectedHorizon] || zone.category;
      let color = '#0284C7';
      if (zoneCat === 'CRITICAL') color = '#E11D48';
      else if (zoneCat === 'HIGH') color = '#EA580C';
      else if (zoneCat === 'MODERATE') color = '#D97706';

      const circle = L.circle(zone.center, {
        radius: zone.radiusMeters,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 1.5,
      });

      circle.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
          <div style="font-weight: 700; color: ${color};">${zone.zoneName}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Risk Index: ${zone.currentRiskScore}/100 (${zoneCat})</div>
          <div style="font-size: 10px; color: #475569; margin-top: 4px;"><strong>Factor:</strong> ${zone.dominantFactor}</div>
        </div>
      `);

      riskZonesLayerGroupRef.current?.addLayer(circle);
    });
  }, [layers?.riskZones, layerVisibility.riskZones, selectedHorizon]);

  // Render Observed Rainfall Points
  useEffect(() => {
    if (!mapInstanceRef.current || !rainfallLayerGroupRef.current) return;
    rainfallLayerGroupRef.current.clearLayers();

    if (!layerVisibility.observedRainfall || !layers?.observedRainfall) return;

    layers.observedRainfall.forEach((pt) => {
      const rainMarkerHtml = `
        <div style="background-color: #0284C7; color: #FFFFFF; font-size: 9px; font-family: monospace; font-weight: bold; padding: 2px 5px; border-radius: 6px; border: 1.5px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.2); white-space: nowrap;">
          ${pt.observedMm} mm
        </div>
      `;

      const icon = L.divIcon({
        className: 'rainfall-badge',
        html: rainMarkerHtml,
        iconSize: [40, 18],
        iconAnchor: [20, 9],
      });

      const marker = L.marker(pt.coordinates, { icon }).bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
          <div style="font-weight: 700; color: #0284C7;">${pt.stationName}</div>
          <div style="font-size: 11px; margin-top: 2px;">Observed Rain: ${pt.observedMm} mm</div>
          <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Status: ${pt.freshness} &bull; ${pt.source}</div>
        </div>
      `);

      rainfallLayerGroupRef.current?.addLayer(marker);
    });
  }, [layers?.observedRainfall, layerVisibility.observedRainfall]);

  // Render Historical Hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerGroupRef.current) return;
    hotspotsLayerGroupRef.current.clearLayers();

    if (!layerVisibility.historicalHotspots || !layers?.historicalHotspots) return;

    layers.historicalHotspots.forEach((spot) => {
      const spotHtml = `
        <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #D97706; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">
          H
        </div>
      `;

      const icon = L.divIcon({
        className: 'hotspot-icon',
        html: spotHtml,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker(spot.coordinates, { icon }).bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0F172A;">
          <div style="font-weight: 700; color: #D97706;">Historical Inundation Hotspot</div>
          <div style="font-weight: 600; margin-top: 2px;">${spot.name}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${spot.knownVulnerabilityReason}</div>
          <div style="font-size: 10px; font-family: monospace; color: #B45309; margin-top: 4px;">
            Inundation Avg: ~${spot.averageInundationCm} cm &bull; Frequency: ${spot.historicalFrequency}
          </div>
        </div>
      `);

      hotspotsLayerGroupRef.current?.addLayer(marker);
    });
  }, [layers?.historicalHotspots, layerVisibility.historicalHotspots]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0" />
    </div>
  );
};
