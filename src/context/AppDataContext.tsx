import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    // Global loading (land + weather + crops + fields)
    isDataReady: boolean;

    // Refresh functions
    refreshAll: () => Promise<void>;
    refreshGeo: () => Promise<void>;
    refreshConversations: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

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

    // Track if initial fetch has happened
    const [hasFetched, setHasFetched] = useState(false);

    const fetchCoreData = useCallback(async () => {
        if (!token) return;

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
        } catch (err) {
            console.error('[AppData] Failed to fetch core data:', err);
            setLandLoading(false);
            setWeatherLoading(false);
            setCropsLoading(false);
            setFieldsLoading(false);
        }
    }, [token]);

    const fetchGeoData = useCallback(async () => {
        if (!token) return;

        setGeoLoading(true);
        setGeoError(null);

        try {
            const landData = land ?? await getMyLand(token).catch(() => null);
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
    }, [token, land]);

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

    // Initial fetch — runs once when token becomes available
    useEffect(() => {
        if (!token || hasFetched) return;

        const initAll = async () => {
            await fetchCoreData();
            // Fire geo and conversations in parallel (they don't depend on each other)
            await Promise.all([
                fetchGeoData(),
                fetchConversations(),
            ]);
            setHasFetched(true);
        };

        initAll();
    }, [token, hasFetched, fetchCoreData, fetchGeoData, fetchConversations]);

    // Refresh all (called after Profile save, etc.)
    const refreshAll = useCallback(async () => {
        setHasFetched(false); // allow re-fetch
        await fetchCoreData();
        await Promise.all([fetchGeoData(), fetchConversations()]);
        setHasFetched(true);
    }, [fetchCoreData, fetchGeoData, fetchConversations]);

    // Refresh only geo (Forecast refresh button)
    const refreshGeo = useCallback(async () => {
        await fetchGeoData();
    }, [fetchGeoData]);

    // Refresh only conversations
    const refreshConversations = useCallback(async () => {
        await fetchConversations();
    }, [fetchConversations]);

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
                isDataReady,
                refreshAll,
                refreshGeo,
                refreshConversations,
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
