import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { RATE_LIMIT_EVENT } from '../services/apiFetch';

interface RateLimitContextType {
    rateLimitHit: boolean;
    triggerRateLimit: () => void;
    clearRateLimit: () => void;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export const RateLimitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rateLimitHit, setRateLimitHit] = useState(false);

    const triggerRateLimit = useCallback(() => {
        setRateLimitHit(true);
    }, []);

    const clearRateLimit = useCallback(() => {
        setRateLimitHit(false);
    }, []);

    // Listen for the custom DOM event dispatched by apiFetch
    useEffect(() => {
        const handler = () => triggerRateLimit();
        window.addEventListener(RATE_LIMIT_EVENT, handler);
        return () => window.removeEventListener(RATE_LIMIT_EVENT, handler);
    }, [triggerRateLimit]);

    return (
        <RateLimitContext.Provider value={{ rateLimitHit, triggerRateLimit, clearRateLimit }}>
            {children}
        </RateLimitContext.Provider>
    );
};

export const useRateLimit = () => {
    const context = useContext(RateLimitContext);
    if (context === undefined) {
        throw new Error('useRateLimit must be used within a RateLimitProvider');
    }
    return context;
};
