import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MapPage } from './pages/MapPage';
import { ReportPage } from './pages/ReportPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { RiskIntelligencePage } from './pages/RiskIntelligencePage';
import { RoutePage } from './pages/RoutePage';
import { MyReportsPage } from './pages/MyReportsPage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-paper text-carto-text font-sans">
          <Header />
          <OfflineBanner />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/reports/:reportId" element={<ReportDetailPage />} />
              <Route path="/risk" element={<RiskIntelligencePage />} />
              <Route path="/routes" element={<RoutePage />} />
              <Route path="/my-reports" element={<MyReportsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<AuthPage initialMode="login" />} />
              <Route path="/register" element={<AuthPage initialMode="register" />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
