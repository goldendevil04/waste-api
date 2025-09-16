import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import CitizenManagement from './components/citizens/CitizenManagement';
import WorkerManagement from './components/workers/WorkerManagement';
import GreenChampions from './components/champions/GreenChampions';
import WasteManagement from './components/waste/WasteManagement';
import CollectionManagement from './components/collection/CollectionManagement';
import FacilityManagement from './components/facilities/FacilityManagement';
import MonitoringSystem from './components/monitoring/MonitoringSystem';
import IncentivesAndPenalties from './components/incentives/IncentivesAndPenalties';
import CommunityEngagement from './components/community/CommunityEngagement';
import ULBManagement from './components/ulb/ULBManagement';
import ShopAndMarketplace from './components/shop/ShopAndMarketplace';
import AnalyticsReports from './components/analytics/AnalyticsReports';
import Layout from './components/layout/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/citizens" element={<CitizenManagement />} />
                      <Route path="/workers" element={<WorkerManagement />} />
                      <Route path="/champions" element={<GreenChampions />} />
                      <Route path="/waste" element={<WasteManagement />} />
                      <Route path="/collection" element={<CollectionManagement />} />
                      <Route path="/facilities" element={<FacilityManagement />} />
                      <Route path="/monitoring" element={<MonitoringSystem />} />
                      <Route path="/incentives" element={<IncentivesAndPenalties />} />
                      <Route path="/community" element={<CommunityEngagement />} />
                      <Route path="/ulb" element={<ULBManagement />} />
                      <Route path="/shop" element={<ShopAndMarketplace />} />
                      <Route path="/analytics" element={<AnalyticsReports />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;