// Scheme Recommendation Service — calls the Chat backend's /api/schemes/recommend endpoint

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001';

export interface SchemeRecommendation {
    id: string;
    title: string;
    description: string;
    eligibility: string;
    region: string;
    crop_type: string;
    benefit_amount?: string;
    scheme_id?: string;
    similarity: number;
    base_score: number;
    boost: number;
    final_score: number;
}

export interface SchemeRecommendationResponse {
    status: string;
    count: number;
    data: {
        answer: string;
        source_documents: SchemeRecommendation[];
    };
}

export const getSchemeRecommendations = async (
    token: string,
    params: {
        crop?: string;
        soil_type?: string;
        area_acres?: number;
        state?: string;
        district?: string;
        top_k?: number;
    }
): Promise<SchemeRecommendationResponse> => {
    const queryParts: string[] = [];

    if (params.crop) queryParts.push(`crop=${encodeURIComponent(params.crop)}`);
    if (params.soil_type) queryParts.push(`soil_type=${encodeURIComponent(params.soil_type)}`);
    if (params.area_acres) queryParts.push(`area_acres=${params.area_acres}`);
    if (params.state) queryParts.push(`state=${encodeURIComponent(params.state)}`);
    if (params.district) queryParts.push(`district=${encodeURIComponent(params.district)}`);
    if (params.top_k) queryParts.push(`top_k=${params.top_k}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const response = await fetch(`${CHAT_API_URL}/api/schemes/recommend${queryString}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Failed to fetch schemes' }));
        throw new Error(err.detail || 'Failed to fetch scheme recommendations');
    }

    return response.json();
};
