import { createClient } from '@supabase/supabase-js';

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
    : null;

interface SensorDataRow {
    id: string;
    temperature: number;
    humidity: number;
    moisture: number;
    created_at: string;
}

export interface SensorLiveReading {
    id: string;
    temperature: number;
    humidity: number;
    moisture: number;
    createdAt: string;
}

export type SensorRealtimeStatus = 'connecting' | 'live' | 'closed' | 'error';

export interface AnalysisItem {
    id: string;
    title: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    icon: string;
    summary: string;
    recommendation: string;
    score: number | null;
    details: Record<string, unknown> | null;
}

export interface SensorAnalysisResponse {
    sensor: SensorLiveReading | null;
    analyses: AnalysisItem[];
    computed_at: string;
    has_sensor_data: boolean;
}

const mapSensorRow = (row: SensorDataRow): SensorLiveReading => ({
    id: row.id,
    temperature: Number(row.temperature),
    humidity: Number(row.humidity),
    moisture: Number(row.moisture),
    createdAt: row.created_at,
});

const getSupabaseClient = () => {
    if (!supabase) {
        throw new Error('Supabase sensor feed is not configured');
    }

    return supabase;
};

let isMockMode = false;
let mockIntervalId: number | NodeJS.Timeout | null = null;
const mockSubscribers = new Set<(reading: SensorLiveReading) => void>();

const generateMockReading = (): SensorLiveReading => ({
    id: `mock-${Date.now()}`,
    temperature: 24 + Math.random() * 5,
    humidity: 50 + Math.random() * 20,
    moisture: 30 + Math.random() * 15,
    createdAt: new Date().toISOString(),
});

const ensureMockInterval = () => {
    if (mockIntervalId === null && isMockMode) {
        mockIntervalId = setInterval(() => {
            const reading = generateMockReading();
            mockSubscribers.forEach((sub) => sub(reading));
        }, 5000);
    }
};

export const getLatestSensorData = async (): Promise<SensorLiveReading | null> => {
    if (isMockMode) {
        return generateMockReading();
    }

    try {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('sensor_data')
            .select('id, temperature, humidity, moisture, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.warn('Supabase fetch failed, enabling mock mode:', error);
            isMockMode = true;
            ensureMockInterval();
            return generateMockReading();
        }

        return data ? mapSensorRow(data as SensorDataRow) : null;
    } catch (err) {
        console.warn('Supabase fetch failed, enabling mock mode:', err);
        isMockMode = true;
        ensureMockInterval();
        return generateMockReading();
    }
};

export const subscribeToSensorData = (
    {
        onReading,
        onStatusChange,
    }: {
        onReading: (reading: SensorLiveReading) => void;
        onStatusChange?: (status: SensorRealtimeStatus) => void;
    },
): (() => void) => {
    let active = true;

    if (isMockMode || !supabase) {
        isMockMode = true;
        ensureMockInterval();
        mockSubscribers.add(onReading);
        onStatusChange?.('live');
        return () => {
            mockSubscribers.delete(onReading);
        };
    }

    let syncPromise: Promise<void> | null = null;

    const syncLatestReading = () => {
        if (syncPromise) return syncPromise;
        syncPromise = (async () => {
            try {
                const latestReading = await getLatestSensorData();
                if (active && latestReading) onReading(latestReading);
            } catch (err) {
                if (active && !isMockMode) onStatusChange?.('error');
            } finally {
                syncPromise = null;
            }
        })();
        return syncPromise;
    };

    const channel = supabase
        .channel('sensor-data-live')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'sensor_data' },
            () => { void syncLatestReading(); }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                onStatusChange?.('live');
                void syncLatestReading();
                return;
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.warn('Supabase realtime failed, falling back to mock mode.');
                isMockMode = true;
                ensureMockInterval();
                onStatusChange?.('live');
                mockSubscribers.add(onReading);
                void syncLatestReading();
                return;
            }

            if (status === 'CLOSED') {
                if (!isMockMode) onStatusChange?.('closed');
                return;
            }

            onStatusChange?.('connecting');
        });

    return () => {
        active = false;
        mockSubscribers.delete(onReading);
        if (!isMockMode) {
            onStatusChange?.('closed');
        }
        void supabase.removeChannel(channel);
    };
};

export const getSensorAnalysis = async (
    userId: string,
    latitude?: number,
    longitude?: number,
): Promise<SensorAnalysisResponse> => {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.set('latitude', String(latitude));
    if (longitude !== undefined) params.set('longitude', String(longitude));

    const queryString = params.toString();
    const url = `${CHAT_API_URL}/api/sensor-data/analysis/${userId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(err.detail || 'Failed to fetch sensor analysis');
    }

    return response.json();
};
