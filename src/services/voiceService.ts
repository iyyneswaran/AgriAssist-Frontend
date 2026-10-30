import { authenticatedApiFetch } from './apiFetch';
/**
 * Voice Service — Frontend service for STT and TTS via the Python Chat backend.
 * Calls /api/voice/transcribe and /api/voice/synthesize endpoints.
 */

// Python Chat backend base URL (same host as WS, different port)
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8001';
const VOICE_API_URL = `${CHAT_API_BASE}/api/voice`;
const TEXT_CHAT_API_URL = `${CHAT_API_BASE}/api/chat`;

export interface VoiceChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * Strips markdown symbols so TTS synthesizes clean, natural-sounding audio.
 */
export const cleanMarkdownForSpeech = (text: string): string => {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1')     // italics
        .replace(/#{1,6}\s+/g, '')          // headings
        .replace(/`([^`]+)`/g, '$1')       // inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/^\s*[-*+]\s+/gm, '')     // list bullets
        .replace(/^\s*\d+\.\s+/gm, '')     // numbered items
        .replace(/---+/g, '')              // horizontal rules
        .trim();
};

/**
 * Send full message history to the Seva AI Agent (/api/chat/agent)
 * Enables multi-turn tool calling (schemes, market prices, checklists, grievances) for voice!
 */
export const generateVoiceAgentReply = async (
    messages: VoiceChatMessage[],
    language?: string
): Promise<string> => {
    const response = await authenticatedApiFetch(`${TEXT_CHAT_API_URL}/agent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            messages, 
            language: language || 'ta'
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'AI agent request failed' }));
        throw new Error(err.detail || err.error || `AI failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content || data.response || "No response received";
};

/**
 * Send transcribed text to the backend LLM for a conversational reply.
 * Uses Seva AI Agent under the hood.
 */
export const generateVoiceChatReply = async (text: string, language?: string, latitude?: number, longitude?: number): Promise<string> => {
    try {
        return await generateVoiceAgentReply([{ role: 'user', content: text }], language);
    } catch (e) {
        // Fallback to legacy endpoint if agent fails
        const response = await authenticatedApiFetch(`${TEXT_CHAT_API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: text, 
                language: language || 'ta',
                latitude,
                longitude 
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'AI request failed' }));
            throw new Error(err.error || `AI failed: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    }
};

/**
 * Send audio blob to the backend for speech-to-text transcription.
 */
export const transcribeAudio = async (audioBlob: Blob, language?: string): Promise<{ text: string; language: string }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    if (language) {
        formData.append('language', language);
    }

    const response = await authenticatedApiFetch(`${VOICE_API_URL}/transcribe`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'STT request failed' }));
        throw new Error(err.error || `STT failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Send text to the backend for text-to-speech synthesis.
 * Returns the audio as a Blob that can be played via an Audio element.
 */
export const synthesizeSpeech = async (text: string, language?: string): Promise<Blob> => {
    const formData = new FormData();
    formData.append('text', text);
    if (language) {
        formData.append('language', language);
    }

    const response = await authenticatedApiFetch(`${VOICE_API_URL}/synthesize`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'TTS request failed' }));
        throw new Error(err.error || `TTS failed: ${response.status}`);
    }

    return response.blob();
};

/**
 * Helper: Play an audio blob through the browser speakers.
 * Returns a promise that resolves when playback finishes.
 */
export const playAudioBlob = (blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
        };
        audio.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
        audio.play().catch(reject);
    });
};
