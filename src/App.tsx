import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { RateLimitProvider } from './context/RateLimitContext';
import OfflineBanner from './components/OfflineBanner';
import NotificationPrompt from './components/NotificationPrompt';
import RateLimitModal from './components/RateLimitModal';
import { initNotificationListener, trackNotificationClick } from './services/notificationService';

const Home = lazy(() => import('./pages/Home'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Chat = lazy(() => import('./pages/Chat'));
const FarmDetails = lazy(() => import('./pages/FarmDetails'));
const Forecast = lazy(() => import('./pages/Forecast'));
const ScanCrop = lazy(() => import('./pages/ScanCrop'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));

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
      <NotificationBridge />
      <OfflineBanner />
      <NotificationPrompt />
      <RateLimitModal />
      <Outlet />
    </AppDataProvider>
  );
};

const NotificationBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return initNotificationListener((data) => {
      navigate(data.url || '/home');
    });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('from_push') !== '1') {
      return;
    }

    const notificationId = params.get('notification_id');
    const historyId = params.get('history_id');
    void trackNotificationClick({
      notification_id: notificationId,
      history_id: historyId,
      action: 'open',
    }).catch(() => undefined);

    params.delete('from_push');
    params.delete('notification_id');
    params.delete('history_id');
    params.delete('event_type');

    const search = params.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ''}${location.hash}`, {
      replace: true,
    });
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
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
                <Route path="/alerts/disease/:alertId" element={<ScanCrop />} />
                <Route path="/alerts/:eventType/:alertId" element={<Forecast />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </RateLimitProvider>
    </AuthProvider>
  );
}
