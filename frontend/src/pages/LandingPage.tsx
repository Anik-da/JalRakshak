import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  CloudRain,
  Users,
  EyeOff,
  Bell,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { FloodReport } from '../types';
import { FloodMap } from '../components/map/FloodMap';
import { detectLiveLocation } from '../services/liveLocation';
import { Crosshair } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [liveCoords, setLiveCoords] = useState<[number, number] | null>(null);
  const [localityName, setLocalityName] = useState<string>('Detecting Live Location...');
  const [locating, setLocating] = useState(false);

  const fetchLivePos = async () => {
    setLocating(true);
    try {
      const loc = await detectLiveLocation();
      setLiveCoords(loc.coordinates);
      setLocalityName(loc.localityName);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const repRes = await api.getReports({ includeDemo: true });
        if (isMounted) {
          setReports(repRes.reports || []);
        }
      } catch (err) {
        console.warn('Map preview load warning:', err);
      }
    }
    loadData();
    fetchLivePos();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white text-slate-800">
      {/* 1. HERO SECTION: BRIGHT SKY & CLOUD ATMOSPHERE */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/60 via-sky-50/40 to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Subtle, soft atmospheric sky clouds */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-200/25 to-transparent pointer-events-none" />
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[720px] h-[260px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-sky-700 bg-sky-100/80 px-3.5 py-1 rounded-full">
            Environmental Flood Intelligence
          </span>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Know the Risk. <br className="hidden sm:inline" />
            <span className="text-sky-600">Move Safer.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Understand local flood risks, explore weather intelligence, and make better-informed travel decisions with JalRakshak AI.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/map"
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-7 py-3.5 rounded-xl font-medium text-sm transition shadow-sm hover:shadow"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Flood Map</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3.5 rounded-xl font-medium text-sm transition border border-slate-200 shadow-2xs"
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Restored Original JalRakshak AI Hero Landscape Photography */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md group mt-10 max-w-5xl mx-auto">
            <img
              src="/images/hero-monsoon.jpg"
              alt="Aerial view of urban river, sluice infrastructure, and monsoon rainfall over metropolitan roads"
              className="w-full h-[300px] sm:h-[440px] lg:h-[500px] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            {/* Minimalist Cartographic Image Badge Overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-3 text-xs max-w-sm shadow-md text-left">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase pb-1 border-b border-slate-100 mb-1.5">
                <span>Field Telemetry Anchor</span>
                <span className="text-sky-600 font-semibold">Active Basin Watch</span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                Aerial civic drainage canals and traffic corridor watch during peak monsoon surface runoff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: EXPLORE FLOOD RISK (MAP PREVIEW) */}
      <section id="map-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Explore Flood Risk
            </h2>
            <p className="text-base text-slate-600 mt-2 leading-relaxed">
              Interactive geographic intelligence showing real-time road conditions, observed water depth, and weather-driven hazard levels across the region.
            </p>
          </div>

          <div className="h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
            <FloodMap
              reports={reports}
              selectedReport={null}
              onSelectReport={() => {}}
              center={liveCoords || [13.045, 80.210]}
              zoom={liveCoords ? 13 : 12}
              userLocation={liveCoords}
            />

            {/* Quick Locate Me button on top left of preview map */}
            <div className="absolute top-4 right-4 z-10 pointer-events-auto">
              <button
                onClick={fetchLivePos}
                disabled={locating}
                title="Detect My Live Location"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <Crosshair className={`w-3.5 h-3.5 text-sky-600 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Locate Me'}</span>
              </button>
            </div>

            {/* Live Location status pill directing to full map */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-3 shadow-md pointer-events-auto z-10 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                <span className="text-xs text-slate-700 font-semibold">{localityName}</span>
              </div>
              <span className="text-slate-300">|</span>
              <Link
                to="/map"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                <span>Open Full Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="border-slate-100" />
      </div>

      {/* 3. SECTION: UNDERSTAND LOCAL CONDITIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Clear & Transparent Analysis
            </span>
            <h2 className="text-3xl font-display font-bold text-slate-900 leading-tight">
              Understand Local Conditions
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              During heavy rainfall, flood risks change quickly. JalRakshak AI synthesizes two essential inputs to provide trustworthy assessments:
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Real-time synoptic precipitation forecasts and eyewitness reports from residents on the ground. Every assessment explains the underlying factors so you always know what drove the score.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <CloudRain className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Weather Telemetry
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Synoptic rainfall readings and forecast accumulation predict where drainage capacities are likely to be exceeded.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Community Reports
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ground-truth observations with recorded water depths and road passability status submitted by verified citizens.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="border-slate-100" />
      </div>

      {/* 4. SECTION: FLOODBLIND AI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 rounded-3xl border border-sky-100 p-8 sm:p-14 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-sky-700 uppercase tracking-wider">
              <EyeOff className="w-4 h-4 text-sky-600" />
              <span>Proactive Risk Detection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
              FloodBlind AI
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Traditional flood apps only alert commuters after multiple vehicles have already stalled. FloodBlind AI proactively flags areas with elevated risk even before any community reports are submitted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-sky-600 font-mono">01</span>
              <h3 className="font-display font-bold text-base text-slate-900">
                Identifies Gaps
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Detects neighborhoods with heavy precipitation where reporting density is low, highlighting critical monitoring blindspots.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-sky-600 font-mono">02</span>
              <h3 className="font-display font-bold text-base text-slate-900">
                Terrain & Drainage
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Considers natural basin gradients and historical accumulation curves to estimate where water gathers first.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-sky-600 font-mono">03</span>
              <h3 className="font-display font-bold text-base text-slate-900">
                Anticipates Road Impacts
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculates transit vulnerability along critical corridors before underpasses and junctions become impassable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-display font-bold text-slate-900">
            How It Works
          </h2>
          <p className="text-base text-slate-600">
            From environmental observation to safer, informed journeys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-sm">
              1
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Check Local Risk
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Open the interactive map to inspect real-time flood indicators across your route.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-sm">
              2
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Report Hazards
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Citizens submit water depth and road status to keep neighbors informed.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-sm">
              3
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Verify Evidence
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Duplicate detection and moderator verification ensure reliable ground truth.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-sm">
              4
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Travel Safer
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Make confident decisions by avoiding flooded roads and low-lying subways.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION: STAY INFORMED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Personalized Hazard Alerts</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-white">
              Stay Informed Before the Rain Begins
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Sign in with your Google account to configure SMS and email alerts for your home and work neighborhoods.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-xl transition shadow-sm"
            >
              Sign In to JalRakshak
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition border border-slate-700"
            >
              Explore Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
