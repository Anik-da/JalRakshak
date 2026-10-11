import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  BarChart3,
  PlusCircle,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { AlertsDrawer } from '../intelligence/AlertsDrawer';
import { AskJalrakshakDrawer } from '../intelligence/AskJalrakshakDrawer';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand Name */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <svg viewBox="0 0 32 32" className="w-4 h-4 fill-none stroke-current" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 10 C14 10, 12 24, 26 24" />
                  <path d="M6 17 C12 17, 18 20, 20 26" strokeWidth="2.2" />
                  <circle cx="6" cy="10" r="2.5" fill="white" />
                  <circle cx="26" cy="24" r="2.5" fill="white" />
                </svg>
              </div>
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight">
                JalRakshak <span className="text-sky-600 font-semibold">AI</span>
              </span>
            </Link>

            {/* ============================================================== */}
            {/* STATE A: PUBLIC NAVIGATION — BEFORE LOGIN                       */}
            {/* ============================================================== */}
            {!isAuthenticated ? (
              <>
                {/* Desktop Public Nav */}
                <nav className="hidden md:flex items-center space-x-8">
                  <Link
                    to="/"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/') ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Home
                  </Link>
                  <a
                    href="/#about"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="/#how-it-works"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    How It Works
                  </a>
                </nav>

                {/* Desktop Public Actions: Explore Flood Map & Sign In */}
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    to="/map"
                    className="inline-flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore Flood Map</span>
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Sign In
                  </Link>
                </div>

                {/* Mobile Public Hamburger Button */}
                <div className="flex md:hidden items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              /* ============================================================== */
              /* STATE B: AUTHENTICATED NAVIGATION — AFTER LOGIN                */
              /* ============================================================== */
              <>
                {/* Desktop Authenticated Nav */}
                <nav className="hidden lg:flex items-center space-x-1">
                  <Link
                    to="/map"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      isActive('/map')
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span>Live Map</span>
                  </Link>

                  <Link
                    to="/risk"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      isActive('/risk')
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    <span>Flood Intelligence</span>
                  </Link>

                  <Link
                    to="/report"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      isActive('/report')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Report a Flood</span>
                  </Link>

                  <button
                    onClick={() => setAlertsOpen(true)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 relative"
                  >
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>Alerts</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </button>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/admin')
                          ? 'bg-rose-50 text-rose-700 font-semibold'
                          : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Admin</span>
                    </Link>
                  )}
                </nav>

                {/* Desktop Authenticated Actions: Ask JalRakshak + Profile + Sign Out */}
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={() => setAssistantOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ask JalRakshak</span>
                  </button>

                  <Link
                    to="/settings"
                    className="flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                    title="User Profile and Settings"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium max-w-[110px] truncate">
                      {user?.name || user?.email}
                    </span>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Authenticated Menu Controls */}
                <div className="flex lg:hidden items-center space-x-2">
                  <button
                    onClick={() => setAssistantOpen(true)}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200"
                    title="Ask JalRakshak"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAlertsOpen(true)}
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 relative"
                    title="Alerts"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE DRAWER ACCORDING TO AUTH STATE                           */}
        {/* ============================================================== */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
            {!isAuthenticated ? (
              /* Public Mobile Menu */
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Home
                </Link>
                <a
                  href="/#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
                >
                  About
                </a>
                <a
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
                >
                  How It Works
                </a>
                <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                  <Link
                    to="/map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full py-2 px-3 bg-sky-600 text-white rounded-lg text-sm font-medium shadow-2xs"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Flood Map</span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full py-2 px-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                  >
                    <span>Sign In</span>
                  </Link>
                </div>
              </>
            ) : (
              /* Authenticated Mobile Menu */
              <>
                <Link
                  to="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>Live Map</span>
                </Link>
                <Link
                  to="/risk"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <span>Flood Intelligence</span>
                </Link>
                <Link
                  to="/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Report a Flood</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAlertsOpen(true);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 text-left"
                >
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Active Alerts</span>
                </button>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-rose-700 hover:bg-rose-50"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Admin Moderation</span>
                  </Link>
                )}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile & Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Global Modals for Assistant and Alerts */}
      <AskJalrakshakDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        currentAssessment={null}
      />
      <AlertsDrawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
      />
    </>
  );
};
