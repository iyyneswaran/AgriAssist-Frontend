const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Crop {
    id: string;
    name: string;
    growthDays: number;
}

export interface CropAssignment {
    id: string;
    fieldId: string;
    cropId: string;
    sowingDate: string;
    harvestDate: string | null;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    crop: Crop;
}

export const getActiveCrops = async (token: string): Promise<CropAssignment[]> => {
    const response = await fetch(`${API_URL}/governance/active-assignments`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to fetch active crops' }));
        throw new Error(err.message || 'Failed to fetch active crops');
    }
    return response.json();
};

export const listCrops = async (token: string): Promise<Crop[]> => {
    const response = await fetch(`${API_URL}/governance/crops`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to list crops' }));
        throw new Error(err.message || 'Failed to list crops');
    }
    return response.json();
};

export const assignCrop = async (token: string, fieldId: string, cropId: string, sowingDate: string): Promise<{ assignment: CropAssignment }> => {
    const response = await fetch(`${API_URL}/governance/assignment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fieldId, cropId, sowingDate })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to assign crop' }));
        throw new Error(err.message || 'Failed to assign crop');
    }
    return response.json();
};
