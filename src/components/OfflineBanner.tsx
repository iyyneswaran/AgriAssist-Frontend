import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep banner visible briefly to show "back online" message
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
        background: isOffline
          ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.4s ease',
        animation: 'slideDown 0.4s ease-out',
      }}
    >
      <span style={{ fontSize: '16px' }}>
        {isOffline ? '⚡' : '✅'}
      </span>
      <span>
        {isOffline
          ? 'You are offline — some features may be limited'
          : 'Back online!'}
      </span>

      {/* Inline keyframes */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}
