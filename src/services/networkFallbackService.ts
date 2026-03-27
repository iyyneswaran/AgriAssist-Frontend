import { API_BASE_URL } from './authService';
import { apiFetch } from './apiFetch';

const DIRECT_VOICE_AGENT_PHONE_NUMBER = import.meta.env.VITE_VOICE_AGENT_PHONE_NUMBER?.trim() || '';

const normalizeCallError = (error?: string): string => {
    if (!error) {
        return 'Could not start the AI assistant call.';
    }

    if (error.includes('ENOTFOUND api.twilio.com')) {
        return 'The device running the backend is offline, so it cannot reach Twilio. Use a hosted backend or configure a direct phone number fallback.';
    }

    return error;
};

export const getDirectAICallUrl = (): string | null => {
    if (!DIRECT_VOICE_AGENT_PHONE_NUMBER) {
        return null;
    }

    return `tel:${DIRECT_VOICE_AGENT_PHONE_NUMBER}`;
};

/**
 * Trigger a network fallback call or SMS when the user is offline.
 * Calls POST /api/voice-agent/network-fallback on the backend.
 */
export async function triggerNetworkFallback(params: {
    phoneNumber?: string;
    chatId?: string;
    failedQuery?: string;
    channel: 'call' | 'sms';
}): Promise<{ success: boolean; error?: string }> {
    const {
        phoneNumber,
        chatId = phoneNumber || 'offline-user',
        failedQuery = 'The user lost internet connectivity and needs assistance.',
        channel,
    } = params;

    try {
        const response = await apiFetch(`${API_BASE_URL}/voice-agent/network-fallback`, {
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
export async function triggerAICall(phoneNumber?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/voice-agent/make-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(phoneNumber ? { phoneNumber } : {}),
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: normalizeCallError(data.error || 'Call failed') };
        }

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: normalizeCallError(message) };
    }
}
