import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Import services
import { getMyLand } from '../services/landService';
import type { LandDetails } from '../services/landService';
import { getWeather } from '../services/weatherService';
import type { WeatherData } from '../services/weatherService';
import { getActiveCrops } from '../services/cropService';
import type { CropAssignment } from '../services/cropService';
import { getMyFields } from '../services/fieldService';
import type { Field } from '../services/fieldService';
import { analyzeGeo } from '../services/geoService';
import type { GeoAnalysisData } from '../services/geoService';
import { getMyConversations } from '../services/chatService';
import type { ChatHistoryItem } from '../components/ChatSidebar';
import { getSchemeRecommendations } from '../services/schemeService';
import type { SchemeRecommendation } from '../services/schemeService';

interface AppDataContextType {
    // Land
    land: LandDetails | null;
    landLoading: boolean;

    // Weather
    weather: WeatherData | null;
    weatherLoading: boolean;

    // Active Crops
    activeCrops: CropAssignment[];
    cropsLoading: boolean;

    // Fields
    fields: Field[];
    fieldsLoading: boolean;

    // Geo/Forecast
    geoData: GeoAnalysisData | null;
    geoLoading: boolean;
    geoError: string | null;

    // Chat conversations
    conversations: ChatHistoryItem[];
    conversationsLoading: boolean;
    setConversations: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;

    // Scheme recommendations
    schemes: SchemeRecommendation[];
    schemesLoading: boolean;
    schemesError: string | null;

    // Global loading (land + weather + crops + fields)
    isDataReady: boolean;

    // Refresh functions
    refreshAll: () => Promise<void>;
    refreshGeo: () => Promise<void>;
    refreshConversations: () => Promise<void>;
    refreshSchemes: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Max retry attempts for failed fetches
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { token } = useAuth();

    // Land
    const [land, setLand] = useState<LandDetails | null>(null);
    const [landLoading, setLandLoading] = useState(true);

    // Weather
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);

    // Active Crops
    const [activeCrops, setActiveCrops] = useState<CropAssignment[]>([]);
    const [cropsLoading, setCropsLoading] = useState(true);

    // Fields
    const [fields, setFields] = useState<Field[]>([]);
    const [fieldsLoading, setFieldsLoading] = useState(true);

    // Geo/Forecast
    const [geoData, setGeoData] = useState<GeoAnalysisData | null>(null);
    const [geoLoading, setGeoLoading] = useState(true);
    const [geoError, setGeoError] = useState<string | null>(null);

    // Chat conversations
    const [conversations, setConversations] = useState<ChatHistoryItem[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);

    // Scheme recommendations
    const [schemes, setSchemes] = useState<SchemeRecommendation[]>([]);
    const [schemesLoading, setSchemesLoading] = useState(false);
    const [schemesError, setSchemesError] = useState<string | null>(null);

    // Ref-based guard to prevent the initial useEffect from re-firing
    // due to callback identity changes (which caused the infinite loop).
    const hasFetchedRef = useRef(false);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Keep a ref to the latest land so fetchGeoData and fetchSchemes can
    // read it without including `land` in their dependency arrays.
    const landRef = useRef<LandDetails | null>(null);

    // Sync landRef whenever land state changes
    useEffect(() => {
        landRef.current = land;
    }, [land]);

    const fetchCoreData = useCallback(async (): Promise<boolean> => {
        if (!token) return false;

        setLandLoading(true);
        setWeatherLoading(true);
        setCropsLoading(true);
        setFieldsLoading(true);

        try {
            // Fetch land, crops, and fields in parallel
            const [landData, cropsData, fieldsData] = await Promise.all([
                getMyLand(token).catch(() => null),
                getActiveCrops(token).catch(() => [] as CropAssignment[]),
                getMyFields(token).catch(() => [] as Field[]),
            ]);

            setLand(landData);
            setLandLoading(false);

            setActiveCrops(cropsData);
            setCropsLoading(false);

            setFields(fieldsData);
            setFieldsLoading(false);

            // Fetch weather if land exists (depends on land coordinates)
            if (landData) {
                try {
                    const weatherData = await getWeather(landData.latitude, landData.longitude);
                    setWeather(weatherData);
                } catch {
                    setWeather(null);
                }
            }
            setWeatherLoading(false);
            return true; // success
        } catch (err) {
            console.error('[AppData] Failed to fetch core data:', err);
            setLandLoading(false);
            setWeatherLoading(false);
            setCropsLoading(false);
            setFieldsLoading(false);
            return false; // failed
        }
    }, [token]);

    // Read land from the ref so the callback identity is stable (only depends on token).
    const fetchGeoData = useCallback(async () => {
        if (!token) return;

        setGeoLoading(true);
        setGeoError(null);

        try {
            const landData = landRef.current ?? await getMyLand(token).catch(() => null);
            if (!landData) {
                setGeoError('no_land');
                setGeoLoading(false);
                return;
            }

            const result = await analyzeGeo(landData.latitude, landData.longitude);
            setGeoData(result);
        } catch (err: any) {
            console.error('[AppData] Geo fetch error:', err);
            setGeoError(err.message || 'Failed to load forecast data');
        } finally {
            setGeoLoading(false);
        }
    }, [token]);

    const fetchConversations = useCallback(async () => {
        if (!token) return;

        setConversationsLoading(true);
        try {
            const res = await getMyConversations(token, 1, 50);
            setConversations(res.data);
        } catch (err) {
            console.error('[AppData] Failed to load conversations:', err);
        } finally {
            setConversationsLoading(false);
        }
    }, [token]);

    // Fetch scheme recommendations — uses landRef for stable identity
    const fetchSchemes = useCallback(async () => {
        if (!token) return;

        const landData = landRef.current;
        if (!landData) return;

        setSchemesLoading(true);
        setSchemesError(null);

        try {
            const response = await getSchemeRecommendations(token, {
                crop: landData.plantedCropManual || '',
                soil_type: landData.soilType || '',
                area_acres: landData.totalArea || 0,
                state: landData.state || '',
                district: landData.district || '',
                top_k: 8,
            });

            if (response.status === 'success' && response.data?.source_documents) {
                setSchemes(response.data.source_documents);
            } else {
                setSchemes([]);
            }
        } catch (err: unknown) {
            console.error('[AppData] Scheme fetch error:', err);
            const msg = err instanceof Error ? err.message : 'Failed to load scheme recommendations';
            setSchemesError(msg);
        } finally {
            setSchemesLoading(false);
        }
    }, [token]);

    // Initial fetch with retry — runs once when token becomes available.
    // Uses a ref guard so it cannot re-fire from callback identity changes.
    useEffect(() => {
        if (!token || hasFetchedRef.current) return;

        let cancelled = false;

        const initAll = async () => {
            const coreSuccess = await fetchCoreData();

            if (cancelled) return;

            // Fire geo, conversations, and schemes in parallel
            await Promise.all([
                fetchGeoData(),
                fetchConversations(),
                fetchSchemes(),
            ]);

            if (cancelled) return;

            if (coreSuccess) {
                // Data loaded successfully — mark as done, reset retry counter
                hasFetchedRef.current = true;
                retryCountRef.current = 0;
            } else if (retryCountRef.current < MAX_RETRIES) {
                // Core fetch failed — schedule a retry
                retryCountRef.current += 1;
                console.warn(`[AppData] Core fetch failed. Retrying (${retryCountRef.current}/${MAX_RETRIES}) in ${RETRY_DELAY_MS}ms...`);
                retryTimerRef.current = setTimeout(() => {
                    if (!cancelled) {
                        // Re-invoke directly instead of toggling state
                        initAll();
                    }
                }, RETRY_DELAY_MS);
            } else {
                // Exhausted retries — mark as done to stop looping
                console.error('[AppData] Core fetch failed after max retries. Giving up.');
                hasFetchedRef.current = true;
                retryCountRef.current = 0;
            }
        };

        initAll();

        return () => {
            cancelled = true;
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    // Only re-run when token changes. The callbacks are stable (depend only on token).
    }, [token, fetchCoreData, fetchGeoData, fetchConversations, fetchSchemes]);

    // Refresh all (called after Profile save, etc.)
    const refreshAll = useCallback(async () => {
        retryCountRef.current = 0;
        await fetchCoreData();
        await Promise.all([fetchGeoData(), fetchConversations(), fetchSchemes()]);
    }, [fetchCoreData, fetchGeoData, fetchConversations, fetchSchemes]);

    // Refresh only geo (Forecast refresh button)
    const refreshGeo = useCallback(async () => {
        await fetchGeoData();
    }, [fetchGeoData]);

    // Refresh only conversations
    const refreshConversations = useCallback(async () => {
        await fetchConversations();
    }, [fetchConversations]);

    // Refresh only schemes (FarmDetails refresh button)
    const refreshSchemes = useCallback(async () => {
        await fetchSchemes();
    }, [fetchSchemes]);

    const isDataReady = !landLoading && !weatherLoading && !cropsLoading && !fieldsLoading;

    return (
        <AppDataContext.Provider
            value={{
                land,
                landLoading,
                weather,
                weatherLoading,
                activeCrops,
                cropsLoading,
                fields,
                fieldsLoading,
                geoData,
                geoLoading,
                geoError,
                conversations,
                conversationsLoading,
                setConversations,
                schemes,
                schemesLoading,
                schemesError,
                isDataReady,
                refreshAll,
                refreshGeo,
                refreshConversations,
                refreshSchemes,
            }}
        >
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = () => {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
};
