import React from 'react';
import { useRateLimit } from '../context/RateLimitContext';
import { useAuth } from '../context/AuthContext';

const RateLimitModal: React.FC = () => {
    const { rateLimitHit, clearRateLimit } = useRateLimit();
    const { logout } = useAuth();

    if (!rateLimitHit) return null;

    const handleGoToSignIn = () => {
        clearRateLimit();
        logout();
        // Navigate to login — since we're outside the Router in the tree,
        // use window.location for a hard redirect.
        window.location.href = '/login';
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Warning icon */}
                <div style={styles.iconWrapper}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <h2 style={styles.title}>Rate Limit Reached</h2>

                <p style={styles.message}>
                    You've made too many requests. Please sign in again or upgrade your plan to continue using AgriAssist.
                </p>

                <button
                    onClick={handleGoToSignIn}
                    style={styles.button}
                    onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#16a34a';
                        (e.target as HTMLButtonElement).style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#22c55e';
                        (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                >
                    Choose Your Plan
                </button>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        animation: 'rateLimitFadeIn 0.3s ease-out',
    },
    modal: {
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '20px',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center' as const,
        border: '1px solid rgba(34, 197, 94, 0.2)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.1)',
        animation: 'rateLimitSlideUp 0.4s ease-out',
    },
    iconWrapper: {
        marginBottom: '16px',
    },
    title: {
        color: '#ffffff',
        fontSize: '22px',
        fontWeight: 700,
        margin: '0 0 12px 0',
        letterSpacing: '-0.02em',
    },
    message: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '15px',
        lineHeight: 1.6,
        margin: '0 0 28px 0',
    },
    button: {
        width: '100%',
        padding: '14px 24px',
        background: '#22c55e',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        letterSpacing: '0.01em',
    },
};

// Inject keyframe animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes rateLimitFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes rateLimitSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
`;
document.head.appendChild(styleSheet);

export default RateLimitModal;
