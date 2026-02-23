const GEO_API_URL = 'http://localhost:8001/geo';

export interface NDVIData {
    ndvi_mean: number | null;
    health_status: string;
    date_range_days: number;
}

export interface RainfallData {
    forecast_rainfall_mm: number;
    forecast_days: number;
}

export interface TemperatureData {
    max_temp_celsius: number | null;
    min_temp_celsius: number | null;
    forecast_days: number;
}

export interface GeoAnalysisData {
    ndvi: NDVIData;
    rainfall_forecast: RainfallData;
    temperature_forecast: TemperatureData;
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
