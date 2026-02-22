export const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface User {
    id: string;
    name: string | null;
    role: string;
    phoneNumber: string;
}

export interface AuthResponse {
    message: string;
    token?: string;
    user?: User;
}

// Request OTP
export const requestOTP = async (phoneNumber: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/request-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request OTP');
    }

    return response.json();
};

// Verify OTP
export const verifyOTP = async (phoneNumber: string, otp: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify OTP');
    }

    return response.json();
};

// Update Profile
export const updateProfile = async (name: string, token: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
    }

    return response.json();
};
