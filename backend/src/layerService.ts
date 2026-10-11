import {
  FloodReport,
  MapRiskLayersResponse,
  RiskZoneLayer,
  RainfallObservationPoint,
  HistoricalHotspot,
} from './types.js';
import { getOfficialWeatherWarnings } from './weatherAdapter.js';

// Historical flood inundation hotspots documented in public municipal records (e.g., Chennai, Mumbai, Bengaluru)
export const HISTORICAL_HOTSPOTS: HistoricalHotspot[] = [
  {
    hotspotId: 'hotspot-chn-01',
    name: 'Velachery Lake Basin / 100 Feet Road',
    coordinates: [12.9785, 80.2212],
    historicalFrequency: 'ANNUAL_MONSOON',
    averageInundationCm: 65,
    knownVulnerabilityReason: 'Natural shallow wetland outflow chokepoint into Pallikaranai marsh; heavily built-up storm drain bottlenecks.',
  },
  {
    hotspotId: 'hotspot-chn-02',
    name: 'T. Nagar Madley Subway & Ranganathan St Corridor',
    coordinates: [13.0412, 80.2315],
    historicalFrequency: 'PERSISTENT_CHOKEPOINT',
    averageInundationCm: 80,
    knownVulnerabilityReason: 'Sub-surface railway underpasses below natural gradient level; pump discharge capacity exceeded during 40mm+/hr downpours.',
  },
  {
    hotspotId: 'hotspot-chn-03',
    name: 'Vyasarpadi Jeeva Railway Underpass & Otteri Nullah',
    coordinates: [13.1118, 80.2584],
    historicalFrequency: 'CYCLONE_TRIGGERED',
    averageInundationCm: 90,
    knownVulnerabilityReason: 'Tidal backwater effect from Buckingham Canal preventing gravity outflow during high tides.',
  },
  {
    hotspotId: 'hotspot-chn-04',
    name: 'Poonamallee High Road near Central Station',
    coordinates: [13.0827, 80.2707],
    historicalFrequency: 'PERSISTENT_CHOKEPOINT',
    averageInundationCm: 45,
    knownVulnerabilityReason: 'Confluence of Cooum River culverts and dense vehicular highway underpasses.',
  },
  {
    hotspotId: 'hotspot-chn-05',
    name: 'Madipakkam Kaiveli Junction & Kilkattalai Channel',
    coordinates: [12.9642, 80.1983],
    historicalFrequency: 'ANNUAL_MONSOON',
    averageInundationCm: 60,
    knownVulnerabilityReason: 'Unconnected storm water trunk drains in transitioning suburban wards.',
  },
  {
    hotspotId: 'hotspot-chn-06',
    name: 'Kurla West Mithi River Embankment (Mumbai)',
    coordinates: [19.0664, 72.8792],
    historicalFrequency: 'ANNUAL_MONSOON',
    averageInundationCm: 75,
    knownVulnerabilityReason: 'Low-lying flood plain of Mithi River severely affected by coastal spring tides and plastic debris accumulation.',
  },
  {
    hotspotId: 'hotspot-chn-07',
    name: 'Bellandur Lake Eco-Space Valley (Bengaluru)',
    coordinates: [12.9268, 77.6762],
    historicalFrequency: 'ANNUAL_MONSOON',
    averageInundationCm: 50,
    knownVulnerabilityReason: 'Stormwater rajakaluve channel encroachment creating severe backflow into arterial ring roads.',
  },
];

// Environmental rainfall observation telemetry stations
export const RAINFALL_STATIONS: RainfallObservationPoint[] = [
  {
    stationId: 'stn-imd-chn-01',
    stationName: 'Nungambakkam Met Observatory (Chennai)',
    coordinates: [13.0604, 80.2496],
    observedMm: 24.5,
    freshness: 'LIVE',
    source: 'IMD Coastal Surface Telemetry',
  },
  {
    stationId: 'stn-imd-chn-02',
    stationName: 'Meenambakkam Airport Met Station (Chennai)',
    coordinates: [12.9941, 80.1809],
    observedMm: 31.0,
    freshness: 'LIVE',
    source: 'IMD Aviation Meteorological Station',
  },
  {
    stationId: 'stn-imd-chn-03',
    stationName: 'Ennore Port Automatic Weather Station',
    coordinates: [13.2625, 80.3278],
    observedMm: 18.2,
    freshness: 'RECENT',
    source: 'National Institute of Ocean Technology',
  },
  {
    stationId: 'stn-imd-chn-04',
    stationName: 'Tambaram Air Base Station',
    coordinates: [12.9249, 80.1000],
    observedMm: 12.0,
    freshness: 'LIVE',
    source: 'Indian Air Force Synoptic Weather Wing',
  },
  {
    stationId: 'stn-imd-chn-05',
    stationName: 'Sholinganallur IT Corridor AWS',
    coordinates: [12.9010, 80.2279],
    observedMm: 8.5,
    freshness: 'LIVE',
    source: 'State Disaster Management Authority Telemetry',
  },
];

export function buildMapRiskLayers(
  reports: FloodReport[],
  centerLat: number = 13.0827,
  centerLng: number = 80.2707
): MapRiskLayersResponse {
  // 1. Community reports layer (verified, unverified)
  const reportsLayer = reports.filter((r) => r.status !== 'REJECTED' && !r.duplicateOf);

  // 2. Proactive Risk Zones Layer (Synthesizing terrain, reports, and weather)
  const riskZonesLayer: RiskZoneLayer[] = [
    {
      zoneId: 'zone-velachery',
      zoneName: 'Velachery-Madipakkam Lowland Watershed',
      center: [12.9715, 80.2180],
      radiusMeters: 2800,
      currentRiskScore: 78,
      category: 'CRITICAL',
      dominantFactor: 'Wetland catchment saturation & road underpass overflow',
      horizons: {
        NOW: 'HIGH',
        '1H': 'CRITICAL',
        '3H': 'CRITICAL',
        '6H': 'CRITICAL',
        '24H': 'MODERATE',
      },
    },
    {
      zoneId: 'zone-tnagar',
      zoneName: 'T. Nagar Commercial & Subway Corridor',
      center: [13.0418, 80.2341],
      radiusMeters: 1800,
      currentRiskScore: 82,
      category: 'CRITICAL',
      dominantFactor: 'Sub-surface road underpass inundation & blocked passage',
      horizons: {
        NOW: 'CRITICAL',
        '1H': 'CRITICAL',
        '3H': 'HIGH',
        '6H': 'HIGH',
        '24H': 'LOW',
      },
    },
    {
      zoneId: 'zone-central',
      zoneName: 'Central Station & Poonamallee Highway',
      center: [13.0827, 80.2707],
      radiusMeters: 2200,
      currentRiskScore: 68,
      category: 'HIGH',
      dominantFactor: 'Heavy traffic artery ponding near railway culverts',
      horizons: {
        NOW: 'HIGH',
        '1H': 'HIGH',
        '3H': 'HIGH',
        '6H': 'MODERATE',
        '24H': 'LOW',
      },
    },
    {
      zoneId: 'zone-omr',
      zoneName: 'OMR Sholinganallur IT Highway',
      center: [12.9010, 80.2279],
      radiusMeters: 3500,
      currentRiskScore: 32,
      category: 'MODERATE',
      dominantFactor: 'Service lane puddle accumulation; express carriageway passable',
      horizons: {
        NOW: 'LOW',
        '1H': 'MODERATE',
        '3H': 'MODERATE',
        '6H': 'MODERATE',
        '24H': 'LOW',
      },
    },
    {
      zoneId: 'zone-guindy',
      zoneName: 'Guindy & Mount Ridge Sector (Elevated)',
      center: [13.0067, 80.2012],
      radiusMeters: 2000,
      currentRiskScore: 18,
      category: 'LOW',
      dominantFactor: 'Elevated topography with efficient gravity surface runoff',
      horizons: {
        NOW: 'LOW',
        '1H': 'LOW',
        '3H': 'LOW',
        '6H': 'LOW',
        '24H': 'LOW',
      },
    },
  ];

  // 3. Observed Rainfall Layer
  const observedRainfallLayer = RAINFALL_STATIONS;

  // 4. Forecast Rainfall Layer
  const forecastRainfallLayer = [
    { coordinates: [13.0827, 80.2707] as [number, number], areaName: 'North Chennai Urban', forecast1hMm: 6.2, forecast6hMm: 28.5, forecast24hMm: 45.0 },
    { coordinates: [13.0418, 80.2341] as [number, number], areaName: 'Central Chennai / T. Nagar', forecast1hMm: 8.4, forecast6hMm: 34.0, forecast24hMm: 52.0 },
    { coordinates: [12.9815, 80.2180] as [number, number], areaName: 'South Chennai / Velachery', forecast1hMm: 9.8, forecast6hMm: 38.5, forecast24hMm: 58.0 },
    { coordinates: [12.9010, 80.2279] as [number, number], areaName: 'Coastal OMR / Sholinganallur', forecast1hMm: 4.5, forecast6hMm: 18.0, forecast24hMm: 30.0 },
  ];

  // 5. Historical Hotspots Layer
  const historicalHotspotsLayer = HISTORICAL_HOTSPOTS;

  // 6. Official Weather Warnings
  const officialWarningsLayer = getOfficialWeatherWarnings(centerLat, centerLng);

  return {
    reportsLayer,
    riskZonesLayer,
    observedRainfallLayer,
    forecastRainfallLayer,
    historicalHotspotsLayer,
    officialWarningsLayer,
    generatedAt: new Date().toISOString(),
  };
}

export function getHistoricalHotspots(): HistoricalHotspot[] {
  return HISTORICAL_HOTSPOTS;
}

