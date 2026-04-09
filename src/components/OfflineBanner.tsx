import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDirectAICallUrl, triggerAICall } from '../services/networkFallbackService';

const PING_INTERVAL_MS = 5_000;
const OFFLINE_THRESHOLD_MS = 30_000;
const PING_TIMEOUT_MS = 4_000;
const PING_URL = 'https://www.google.com/favicon.ico';

export default function OfflineBanner() {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const directCallUrl = getDirectAICallUrl();
  const useDirectDial = isOffline && !!directCallUrl;

  const offlineStartRef = useRef<number | null>(null);
  const modalShownRef = useRef(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    setShowCallModal(false);
    setCallError(null);
    setIsCalling(false);
  }, []);

  const handleCloseBanner = useCallback(() => {
    setShowBanner(false);
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
  }, []);

  const markOffline = useCallback(() => {
    const now = Date.now();

    if (!isOffline) {
      setIsOffline(true);
      setShowBanner(true);
      offlineStartRef.current = now;
    } else if (!offlineStartRef.current) {
      offlineStartRef.current = now;
    }

    if (
      offlineStartRef.current &&
      !modalShownRef.current &&
      now - offlineStartRef.current >= OFFLINE_THRESHOLD_MS
    ) {
      setShowCallModal(true);
      modalShownRef.current = true;
    }
  }, [isOffline]);

  const markOnline = useCallback(() => {
    if (isOffline) {
      setIsOffline(false);
      setShowCallModal(false);
      setShowBanner(true);
      bannerTimeoutRef.current = setTimeout(() => setShowBanner(false), 3000);
    }

    offlineStartRef.current = null;
    modalShownRef.current = false;
    setCallError(null);
    setIsCalling(false);
  }, [isOffline]);

  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

      const response = await fetch(`${PING_URL}?_=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.type === 'opaque' || response.ok) {
        markOnline();
        return;
      }

      markOffline();
    } catch {
      markOffline();
    }
  }, [markOffline, markOnline]);

  const handleRequestCall = useCallback(async () => {
    setCallError(null);
    setIsCalling(true);

    if (!navigator.onLine && directCallUrl) {
      window.location.href = directCallUrl;
      handleDismiss();
      return;
    }

    try {
      // Best-effort trigger without showing errors to the user
      await triggerAICall(user?.phoneNumber);
    } catch (error) {
      console.error('Failed to trigger AI call', error);
    } finally {
      // Let the user see "Initiating Call..." for a brief moment before dismissing
      setTimeout(() => {
        handleDismiss();
      }, 1500);
    }
  }, [directCallUrl, handleDismiss, user?.phoneNumber]);

  useEffect(() => {
    if (!navigator.onLine) {
      offlineStartRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => markOffline();
    const handleOnline = () => {
      void checkConnectivity();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    void checkConnectivity();
    pingIntervalRef.current = setInterval(() => {
      void checkConnectivity();
    }, PING_INTERVAL_MS);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, [checkConnectivity, markOffline]);

  if (!showBanner && !showCallModal) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <div style={{
          position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 20px', fontSize: '14px', fontWeight: 500,
          fontFamily: "'Inter', sans-serif", color: '#fff',
          borderRadius: '14px',
          background: isOffline
            ? 'linear-gradient(135deg, #1E2923 0%, #2d3b32 100%)'
            : 'linear-gradient(135deg, #1E2923 0%, #2d4a33 100%)',
          border: isOffline
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(161, 229, 51, 0.4)',
          boxShadow: isOffline
            ? '0 8px 32px rgba(239, 68, 68, 0.2), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 8px 32px rgba(161, 229, 51, 0.2), 0 2px 8px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          animation: 'ob-slideDown 0.4s ease-out',
          minWidth: '280px', maxWidth: '420px',
        }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
            background: isOffline ? '#ef4444' : '#A1E533',
            boxShadow: isOffline
              ? '0 0 8px rgba(239, 68, 68, 0.6)'
              : '0 0 8px rgba(161, 229, 51, 0.6)',
            animation: isOffline ? 'ob-pulse-dot 2s ease-in-out infinite' : 'none',
          }} />

          <span style={{ flex: 1 }}>
            {isOffline ? 'You are offline - features may be limited' : 'Back online!'}
          </span>

          <button
            onClick={handleCloseBanner}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
            aria-label="Dismiss notification"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {showCallModal && isOffline && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          animation: 'ob-fadeIn 0.3s ease-out',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1E2923 0%, #2d3b32 50%, #1a2e22 100%)',
            borderRadius: '20px', padding: '32px 28px', maxWidth: '360px', width: '90%',
            border: '1px solid rgba(161, 229, 51, 0.2)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(161, 229, 51, 0.08)',
            textAlign: 'center', fontFamily: "'Inter', sans-serif",
            animation: 'ob-scaleIn 0.3s ease-out',
          }}>
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
              animation: 'ob-pulse 2s ease-in-out infinite',
            }}>CALL</div>

            <h2 style={{
              color: '#fff', fontSize: '20px', fontWeight: 700,
              margin: '0 0 8px', letterSpacing: '-0.02em',
            }}>Connection Lost</h2>

            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '14px',
              lineHeight: 1.5, margin: '0 0 24px',
            }}>
              {useDirectDial
                ? 'You are offline. Open the phone dialer and call the AI assistant directly.'
                : 'You have been offline for a while. A server-triggered AI callback needs internet access from the backend.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => void handleRequestCall()}
                disabled={isCalling}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #A1E533 0%, #7bc62d 100%)',
                  color: '#1E2923', fontSize: '16px', fontWeight: 600,
                  cursor: isCalling ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(161, 229, 51, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: "'Inter', sans-serif", textDecoration: 'none', boxSizing: 'border-box',
                  opacity: isCalling ? 0.8 : 1,
                }}
              >
                {isCalling ? 'Initiating Call...' : useDirectDial ? 'Open Phone Dialer' : 'Request AI Assistant Call'}
              </button>

              {callError && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#fca5a5',
                  fontSize: '12px',
                  lineHeight: 1.4,
                }}>
                  {callError}
                </div>
              )}

              <button
                onClick={handleDismiss}
                style={{
                  width: '100%', padding: '12px 20px', borderRadius: '14px',
                  border: '1px solid rgba(161, 229, 51, 0.2)', background: 'rgba(161, 229, 51, 0.05)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: "'Inter', sans-serif",
                }}
              >Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ob-slideDown { from { transform: translateX(-50%) translateY(-120%); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes ob-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ob-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes ob-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
