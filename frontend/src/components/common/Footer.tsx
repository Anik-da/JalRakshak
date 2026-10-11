import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white mt-auto text-slate-600">
      {/* Subtle Civic Safety Reminder */}
      <div className="bg-amber-50/80 border-b border-amber-100 py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>
            <strong>CIVIC SAFETY NOTICE:</strong> Crowd-sourced flood observations. In immediate emergencies, call 112 / Disaster Helpline 1070. Never attempt to cross flooded roads.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-lg text-slate-900">
                JalRakshak <span className="text-sky-600 font-semibold">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                AI 2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
              Predictive flood intelligence and safer mobility platform built for the WeMakeDevs Environmental Hacks 2026 hackathon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <a href="/#about" className="hover:text-slate-900 transition">About</a>
            <a href="/#how-it-works" className="hover:text-slate-900 transition">How It Works</a>
            <Link to="/map" className="hover:text-slate-900 transition">Live Flood Map</Link>
            <Link to="/settings" className="hover:text-slate-900 transition">Privacy & Preferences</Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono text-[11px]">Helplines: 112 / 1070</span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 JalRakshak AI. Built for WeMakeDevs Environmental Hacks 2026.</p>
          <div className="flex items-center space-x-3 font-mono text-[11px] mt-2 sm:mt-0">
            <span>AWS Cloud ap-south-1</span>
            <span className="text-slate-300">|</span>
            <span>Open-Meteo Synoptic</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
