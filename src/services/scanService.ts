/**
 * Scan Crop Service — Handles disease detection API calls.
 * Communicates with the Chat backend (port 8001) for image analysis and remedy generation.
 */

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001';

// ── Types ──

export interface ScanPrediction {
    disease_label: string;
    crop_name: string;
    disease_name: string;
    confidence: number;
    is_healthy: boolean;
}

export interface ScanRemedy {
    explanation: string;
    treatment_steps: string[];
    preventive_measures: string[];
    sensor_advice: string | null;
    source: 'ai' | 'fallback';
}

export interface ScanResult {
    prediction: ScanPrediction;
    remedy: ScanRemedy;
}

// ── API Functions ──

/**
 * Combined analyze endpoint: upload image → get prediction + AI remedy.
 */
export const analyzeCrop = async (file: File): Promise<ScanResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${CHAT_API_URL}/api/scan/analyze`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(err.detail || 'Failed to analyze crop image');
    }

    return response.json();
};

/**
 * Predict-only endpoint: upload image → get disease prediction.
 */
export const predictDisease = async (file: File): Promise<ScanPrediction> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${CHAT_API_URL}/api/scan/predict`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Prediction failed' }));
        throw new Error(err.detail || 'Failed to predict disease');
    }

    return response.json();
};
