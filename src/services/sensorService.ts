/**
 * Sensor Data Service — Fetches live IoT sensor data from ESP32 hardware
 * via ngrok tunnel, and advanced analysis from the FastAPI backend.
 */

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001';
const SENSOR_HARDWARE_URL = import.meta.env.VITE_SENSOR_HARDWARE_URL || 'https://incised-scripturally-lois.ngrok-free.dev';

export interface HardwareSensorData {
    temperature: number | null;
    humidity: number | null;
    soil_moisture: number | null;
    [key: string]: any; // ESP32 may send additional fields
}

export interface SensorReading {
    id: string;
    user_id: string;
    temperature: number | null;
    humidity: number | null;
    soil_moisture: number | null;
    recorded_at: string;
}

export interface AnalysisItem {
    id: string;
    title: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    icon: string;
    summary: string;
    recommendation: string;
    score: number | null;
    details: Record<string, any> | null;
}

export interface SensorAnalysisResponse {
    sensor: HardwareSensorData | null;
    analyses: AnalysisItem[];
    computed_at: string;
    has_sensor_data: boolean;
}

/**
 * Fetch live sensor data directly from ESP32 hardware via ngrok tunnel,
 * proxied through our FastAPI backend to avoid CORS issues.
 */
export const getHardwareSensorData = async (): Promise<HardwareSensorData> => {
    const response = await fetch(`${CHAT_API_URL}/api/sensor-data/live`);

    if (!response.ok) {
        if (response.status === 503) {
            throw new Error('device_offline');
        }
        throw new Error('Failed to fetch sensor data from hardware');
    }

    const data = await response.json();
    return data;
};

/**
 * Fetch full analysis (sensor + GEE + weather combined) from FastAPI backend.
 * The backend will also pull live sensor data from the hardware endpoint.
 */
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
