const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UserProfile {
    id: string;
    phoneNumber: string;
    name: string | null;
    role: string;
    interface: string;
}

export const getProfile = async (token: string): Promise<UserProfile> => {
    const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
};

export const updateProfile = async (token: string, data: { name?: string, interface?: string }): Promise<{ user: UserProfile }> => {
    const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to update profile' }));
        throw new Error(err.message || 'Failed to update profile');
    }
    return response.json();
};
