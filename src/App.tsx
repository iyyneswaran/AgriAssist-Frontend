import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { RateLimitProvider } from './context/RateLimitContext';
import OfflineBanner from './components/OfflineBanner';
import RateLimitModal from './components/RateLimitModal';

const Home = lazy(() => import('./pages/Home'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Chat = lazy(() => import('./pages/Chat'));
const FarmDetails = lazy(() => import('./pages/FarmDetails'));
const Forecast = lazy(() => import('./pages/Forecast'));
const ScanCrop = lazy(() => import('./pages/ScanCrop'));
const Profile = lazy(() => import('./pages/Profile'));

const AppLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppDataProvider>
      <OfflineBanner />
      <RateLimitModal />
      <Outlet />
    </AppDataProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RateLimitProvider>
        <Router>
          <Suspense fallback={<AppLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={<LandingPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/farm-details" element={<FarmDetails />} />
                <Route path="/scan-crop" element={<ScanCrop />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </RateLimitProvider>
    </AuthProvider>
  );
}
