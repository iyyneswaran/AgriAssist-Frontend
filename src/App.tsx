import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Chat from "./pages/Chat";
import FarmDetails from "./pages/FarmDetails";
import Forecast from "./pages/Forecast";
import ScanCrop from "./pages/ScanCrop";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { RateLimitProvider } from './context/RateLimitContext';
import OfflineBanner from './components/OfflineBanner';
import RateLimitModal from './components/RateLimitModal';

// Protected route wrapper — includes OfflineBanner & RateLimitModal so they only
// appear inside the authenticated app (not on landing page, login, or signup).
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <OfflineBanner />
      <RateLimitModal />
      {children}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RateLimitProvider>
        <AppDataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forecast"
                element={
                  <ProtectedRoute>
                    <Forecast />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farm-details"
                element={
                  <ProtectedRoute>
                    <FarmDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scan-crop"
                element={
                  <ProtectedRoute>
                    <ScanCrop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AppDataProvider>
      </RateLimitProvider>
    </AuthProvider>
  );
}