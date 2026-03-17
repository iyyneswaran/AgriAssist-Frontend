import { API_BASE_URL } from './authService';

/**
 * Trigger a network fallback call or SMS when the user is offline.
 * Calls POST /api/voice-agent/network-fallback on the backend.
 */
export async function triggerNetworkFallback(params: {
    phoneNumber: string;
    chatId?: string;
    failedQuery?: string;
    channel: 'call' | 'sms';
}): Promise<{ success: boolean; error?: string }> {
    const {
        phoneNumber,
        chatId = phoneNumber,
        failedQuery = 'The user lost internet connectivity and needs assistance.',
        channel,
    } = params;

    try {
        const response = await fetch(`${API_BASE_URL}/voice-agent/network-fallback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, failedQuery, phoneNumber, channel }),
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error || 'Request failed' };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
    }
}

/**
 * Trigger a direct AI voice call to the user's phone.
 * Calls POST /api/voice-agent/make-call on the backend.
 */
export async function triggerAICall(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/voice-agent/make-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error || 'Call failed' };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
    }
}
