import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { isAuthenticated } from './utils/auth';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrolleyList from './pages/TrolleyList';
import TrolleyDetails from './pages/TrolleyDetails';
import ScanTrolley from './pages/ScanTrolley';
import StoreList from './pages/StoreList';
import MaintenanceList from './pages/MaintenanceList';
import AlertList from './pages/AlertList';
import MapView from './pages/MapView';
import RadarView from './pages/RadarView';
import TrolleyKiosk from './pages/TrolleyKiosk';
import KioskDashboard from './pages/KioskDashboard';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/" replace /> : <Login />
        } />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="trolleys" element={<TrolleyList />} />
          <Route path="trolleys/:id" element={<TrolleyDetails />} />
          <Route path="scan" element={<ScanTrolley />} />
          <Route path="kiosk" element={<TrolleyKiosk />} />
          <Route path="kiosk-dashboard" element={<KioskDashboard />} />
          <Route path="stores" element={<StoreList />} />
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="alerts" element={<AlertList />} />
          <Route path="map" element={<MapView />} />
          <Route path="radar" element={<RadarView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
