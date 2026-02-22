const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface LandDetails {
    id?: string;
    farmerId?: string;
    name: string;
    totalArea: number;
    soilType: string;
    latitude: number;
    longitude: number;
    district: string;
    state: string;
}

export const getMyLand = async (token: string): Promise<LandDetails | null> => {
    const response = await fetch(`${API_URL}/governance/land`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 404) {
        return null; // No land registered yet
    }

    if (!response.ok) throw new Error('Failed to fetch land details');
    return response.json();
};

export const registerLand = async (token: string, data: LandDetails): Promise<{ land: LandDetails }> => {
    const response = await fetch(`${API_URL}/governance/land`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, areaUnit: 'ACRE' })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to register land' }));
        throw new Error(err.message || 'Failed to register land');
    }
    return response.json();
};

export const updateLand = async (token: string, data: Partial<LandDetails>): Promise<{ land: LandDetails }> => {
    const response = await fetch(`${API_URL}/governance/land`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to update land' }));
        throw new Error(err.message || 'Failed to update land');
    }
    return response.json();
};
