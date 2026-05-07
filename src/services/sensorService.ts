import { io, Socket } from 'socket.io-client';

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001';
const IOT_SERVER_URL = import.meta.env.VITE_IOT_SERVER_URL || 'http://localhost:3000';

let socket: Socket | null = null;

const getSocket = () => {
    if (!socket) {
        socket = io(IOT_SERVER_URL, {
            reconnectionDelayMax: 10000,
        });
    }
    return socket;
};

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

const mapSocketData = (data: any): SensorLiveReading => ({
    id: `live-${Date.now()}`,
    temperature: Number(data.temperature),
    humidity: Number(data.humidity),
    moisture: Number(data.moisture),
    createdAt: new Date().toISOString(),
});

export const getLatestSensorData = async (): Promise<SensorLiveReading | null> => {
    try {
        const response = await fetch(`${IOT_SERVER_URL}/api/sensors`);
        if (!response.ok) {
            throw new Error(`Failed to fetch from IoT server: ${response.status}`);
        }
        const data = await response.json();
        return mapSocketData(data);
    } catch (err) {
        console.warn('Failed to fetch initial sensor data from IoT server:', err);
        return null;
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
    const s = getSocket();

    const connectHandler = () => onStatusChange?.('live');
    const disconnectHandler = () => onStatusChange?.('closed');
    const connectErrorHandler = () => onStatusChange?.('error');
    
    const dataHandler = (data: any) => {
        onReading(mapSocketData(data));
    };

    s.on('connect', connectHandler);
    s.on('disconnect', disconnectHandler);
    s.on('connect_error', connectErrorHandler);
    s.on('sensor-data', dataHandler);

    if (s.connected) {
        onStatusChange?.('live');
    } else {
        onStatusChange?.('connecting');
    }

    return () => {
        s.off('connect', connectHandler);
        s.off('disconnect', disconnectHandler);
        s.off('connect_error', connectErrorHandler);
        s.off('sensor-data', dataHandler);
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
