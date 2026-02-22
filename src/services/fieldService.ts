const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Field {
    id: string;
    landId: string;
    name: string;
    area: number;
}

export const addField = async (token: string, data: { name: string, area: number }): Promise<{ field: Field }> => {
    const response = await fetch(`${API_URL}/governance/field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, unit: 'ACRE' })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to add field' }));
        throw new Error(err.message || 'Failed to add field');
    }
    return response.json();
};

export const getMyFields = async (token: string): Promise<Field[]> => {
    const response = await fetch(`${API_URL}/governance/field`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to fetch fields' }));
        throw new Error(err.message || 'Failed to fetch fields');
    }
    return response.json();
};
