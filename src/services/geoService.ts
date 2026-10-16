const GEO_API_URL = `${import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001'}/geo`;

export interface NDVIData {
    ndvi_mean: number | null;
    health_status: string;
    date_range_days: number;
}

// ─── Daily rainfall breakdown from backend ──────────────────────────────
export interface DailyRainfall {
    day: number;
    rainfall_mm: number;
    severity: string; // IMD category: no_rain | light | moderate | heavy | very_heavy | extremely_heavy
}

export interface RainfallData {
    // Backward-compatible fields
    forecast_rainfall_mm: number;
    forecast_days: number;
    // New classified fields
    cumulative_mm: number;
    daily_breakdown: DailyRainfall[];
    peak_24h_mm: number | null;
    peak_24h_severity: string;
    waterlogging_risk: string;   // low | moderate | high | very_high | unknown
    river_flood_status: string;  // not_assessed
    classification_method: string;
    disclaimer: string;
}

export interface TemperatureData {
    max_temp_celsius: number | null;
    min_temp_celsius: number | null;
    forecast_days: number;
}

export interface FarmMetricsData {
    temperature_celsius: number | null;
    humidity_percent: number | null;
    soil_moisture_mm: number | null;
    soil_ph: number | null;
}

export interface GeoAnalysisData {
    ndvi: NDVIData;
    rainfall_forecast: RainfallData;
    temperature_forecast: TemperatureData;
    farm_metrics: FarmMetricsData;
    alerts: string[];
}

export const analyzeGeo = async (
    latitude: number,
    longitude: number,
    farmerId?: string
): Promise<GeoAnalysisData> => {
    const response = await fetch(`${GEO_API_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            latitude,
            longitude,
            ...(farmerId && { farmer_id: farmerId }),
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Geo analysis failed' }));
        throw new Error(err.detail || 'Failed to fetch geo analysis');
    }

    return response.json();
};
