import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import {
  getPushSupportStatus,
  requestNotificationPermission,
  registerBrowserPushSubscription,
} from '../services/notificationService';

const DISMISS_KEY = 'agriassist-notif-prompt-dismissed';
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type PromptState = 'idle' | 'visible' | 'loading' | 'success' | 'denied' | 'hidden';

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function persistDismissal(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* no-op */
  }
}

export default function NotificationPrompt() {
  const [state, setState] = useState<PromptState>('idle');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const support = getPushSupportStatus();
    if (
      !support.supported ||
      support.permission !== 'default' ||
      wasDismissedRecently()
    ) {
      setState('hidden');
      return;
    }

    // Small delay so the prompt doesn't flash immediately on page load
    const timer = setTimeout(() => setState('visible'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const animateOut = useCallback((nextState: PromptState) => {
    setIsExiting(true);
    setTimeout(() => setState(nextState), 400);
  }, []);

  const handleEnable = useCallback(async () => {
    setState('loading');
    try {
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        setState('success');
        // Also register push subscription in the background
        void registerBrowserPushSubscription().catch(() => undefined);
        setTimeout(() => animateOut('hidden'), 1800);
      } else if (permission === 'denied') {
        setState('denied');
        setTimeout(() => animateOut('hidden'), 2500);
      } else {
        // User closed the dialog without deciding
        setState('visible');
      }
    } catch {
      setState('visible');
    }
  }, [animateOut]);

  const handleDismiss = useCallback(() => {
    persistDismissal();
    animateOut('hidden');
  }, [animateOut]);

  if (state === 'idle' || state === 'hidden') {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: `translateX(-50%) ${isExiting ? 'translateY(120%)' : 'translateY(0)'}`,
          zIndex: 9998,
          width: '92%',
          maxWidth: '400px',
          padding: '20px',
          borderRadius: '20px',
          background: 'linear-gradient(145deg, rgba(30, 41, 35, 0.97) 0%, rgba(22, 36, 28, 0.97) 100%)',
          border: '1px solid rgba(161, 229, 51, 0.2)',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(161, 229, 51, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          fontFamily: "'Inter', sans-serif",
          animation: isExiting ? 'np-slideOut 0.4s ease-in forwards' : 'np-slideIn 0.5s ease-out',
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.3s ease, transform 0.4s ease',
        }}
      >
        {/* Close button */}
        {(state === 'visible' || state === 'loading') && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification prompt"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
            }}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}

        {/* Icon */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background:
              state === 'success'
                ? 'linear-gradient(135deg, #A1E533 0%, #7bc62d 100%)'
                : state === 'denied'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, rgba(161, 229, 51, 0.15) 0%, rgba(161, 229, 51, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            animation: state === 'visible' ? 'np-bellRing 2.5s ease-in-out infinite' : 'none',
            boxShadow:
              state === 'success'
                ? '0 8px 24px rgba(161, 229, 51, 0.3)'
                : state === 'denied'
                ? '0 8px 24px rgba(239, 68, 68, 0.3)'
                : '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
          }}
        >
          {state === 'loading' ? (
            <Loader2 size={24} color="#A1E533" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Bell
              size={24}
              color={state === 'success' || state === 'denied' ? '#1E2923' : '#A1E533'}
              fill={state === 'success' ? '#1E2923' : 'none'}
            />
          )}
        </div>

        {/* Text */}
        <h3
          style={{
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 6px',
            letterSpacing: '-0.01em',
          }}
        >
          {state === 'success'
            ? 'Notifications enabled!'
            : state === 'denied'
            ? 'Notifications blocked'
            : 'Stay updated on your farm'}
        </h3>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '13px',
            lineHeight: 1.5,
            margin: '0 0 18px',
            paddingRight: '24px',
          }}
        >
          {state === 'success'
            ? "You'll receive real-time alerts for irrigation, weather, and crop health."
            : state === 'denied'
            ? 'You can enable them later from your browser settings.'
            : 'Get instant alerts for irrigation schedules, disease warnings, and weather changes.'}
        </p>

        {/* Buttons */}
        {(state === 'visible' || state === 'loading') && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => void handleEnable()}
              disabled={state === 'loading'}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #A1E533 0%, #7bc62d 100%)',
                color: '#1E2923',
                fontSize: '14px',
                fontWeight: 600,
                cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(161, 229, 51, 0.25)',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: state === 'loading' ? 0.85 : 1,
              }}
            >
              {state === 'loading' ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell size={15} />
                  Enable Notifications
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              disabled={state === 'loading'}
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Later
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes np-slideIn {
          from {
            transform: translateX(-50%) translateY(120%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        @keyframes np-slideOut {
          from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(-50%) translateY(120%);
            opacity: 0;
          }
        }
        @keyframes np-bellRing {
          0%, 100% { transform: rotate(0deg); }
          5% { transform: rotate(14deg); }
          10% { transform: rotate(-12deg); }
          15% { transform: rotate(10deg); }
          20% { transform: rotate(-8deg); }
          25% { transform: rotate(4deg); }
          30% { transform: rotate(0deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
