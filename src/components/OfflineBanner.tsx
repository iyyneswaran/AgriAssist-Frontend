import { useState, useEffect, useRef, useCallback } from 'react';

const PING_INTERVAL_MS = 5_000;       // Check connectivity every 5 seconds
const OFFLINE_THRESHOLD_MS = 30_000;  // Show call modal after 30s offline
const PING_TIMEOUT_MS = 4_000;        // Consider offline if ping takes > 4s
// Using a highly reliable tiny icon for pinging that won't have CORS issues
const PING_URL = 'https://www.google.com/favicon.ico';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [showCallModal, setShowCallModal] = useState(false);

  const offlineStartRef = useRef<number | null>(navigator.onLine ? null : Date.now());
  const modalShownRef = useRef(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Connectivity check via actual HTTP ping ──
  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

      // Ping a reliable external URL to bypass local API/CORS quirks
      // Adding a random query param prevents the browser from using a cached response
      const response = await fetch(`${PING_URL}?_=${Date.now()}`, {
        method: 'HEAD', // HEAD request is faster than GET
        mode: 'no-cors', // Crucial to avoid CORS errors when pinging external domains
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // With no-cors, the response is "opaque" (status usually 0), but if it didn't throw an error,
      // it means the network request succeeded and we have internet.
      if (response.type === 'opaque' || response.ok) {
        // ── ONLINE ──
        if (isOffline) {
          setIsOffline(false);
          offlineStartRef.current = null;
          modalShownRef.current = false;
          setShowCallModal(false);
          // Show "back online" banner briefly
          setShowBanner(true);
          bannerTimeoutRef.current = setTimeout(() => setShowBanner(false), 3000);
        }
        return;
      }
      
      // If we somehow get a non-opaque error back from HEAD
      markOffline();
    } catch {
      // Fetch failed (no network, DNS resolution failed, timeout, abort) = offline
      markOffline();
    }
  }, [isOffline]);

  const markOffline = useCallback(() => {
    if (!isOffline) {
      setIsOffline(true);
      setShowBanner(true);
      offlineStartRef.current = Date.now();
    }

    // Check if we've been offline long enough for the modal
    if (
      offlineStartRef.current &&
      !modalShownRef.current &&
      Date.now() - offlineStartRef.current >= OFFLINE_THRESHOLD_MS
    ) {
      setShowCallModal(true);
      modalShownRef.current = true;
    }
  }, [isOffline]);

  // ── Start polling on mount ──
  useEffect(() => {
    // Also listen to browser events as a quick trigger
    const handleOffline = () => markOffline();
    const handleOnline = () => checkConnectivity();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check and start polling
    checkConnectivity();
    pingIntervalRef.current = setInterval(checkConnectivity, PING_INTERVAL_MS);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [checkConnectivity, markOffline]);

  // ── Call handler ──
  // Instead of an HTTP request (which fails if the internet is actually down), 
  // we open the device's native phone dialer targeting our Twilio AI webhook number.
  // This uses standard cellular networks instead of data/internet!
  const TWILIO_NUMBER = '+14195154083';

  const handleDismiss = () => {
    setShowCallModal(false);
  };

  // ─── Render ──────────────────────────────────

  if (!showBanner && !showCallModal) return null;

  return (
    <>
      {/* ── Small banner at top ── */}
      {showBanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 500,
          fontFamily: "'Inter', sans-serif", color: '#fff',
          background: isOffline
            ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.4s ease',
          animation: 'slideDown 0.4s ease-out',
        }}>
          <span style={{ fontSize: '16px' }}>{isOffline ? '⚡' : '✅'}</span>
          <span>
            {isOffline ? 'You are offline — some features may be limited' : 'Back online!'}
          </span>
        </div>
      )}

      {/* ── Call Modal (shows after 30s offline) ── */}
      {showCallModal && isOffline && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: '20px', padding: '32px 28px', maxWidth: '360px', width: '90%',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.1)',
            textAlign: 'center', fontFamily: "'Inter', sans-serif",
            animation: 'scaleIn 0.3s ease-out',
          }}>
            {/* Icon */}
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
              boxShadow: '0 8px 24px rgba(220,38,38,0.3)', animation: 'pulse 2s ease-in-out infinite',
            }}>📡</div>

            <h2 style={{
              color: '#fff', fontSize: '20px', fontWeight: 700,
              margin: '0 0 8px', letterSpacing: '-0.02em',
            }}>Connection Lost</h2>

            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '14px',
              lineHeight: 1.5, margin: '0 0 24px',
            }}>
              You've been offline for a while. Connect instantly via standard phone call to our AI assistant.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`tel:${TWILIO_NUMBER}`}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#fff', fontSize: '16px', fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                📞 Call AI Assistant
              </a>

              <button
                onClick={handleDismiss}
                style={{
                  width: '100%', padding: '12px 20px', borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: "'Inter', sans-serif",
                }}
              >Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
