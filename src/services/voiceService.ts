/**
 * Voice Service — Frontend service for STT and TTS via the Python Chat backend.
 * Calls /api/voice/transcribe and /api/voice/synthesize endpoints.
 */

// Python Chat backend base URL (same host as WS, different port)
const VOICE_API_URL = 'http://localhost:8001/api/voice';

/**
 * Send audio blob to the backend for speech-to-text transcription.
 */
export const transcribeAudio = async (audioBlob: Blob, language?: string): Promise<{ text: string; language: string }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    if (language) {
        formData.append('language', language);
    }

    const response = await fetch(`${VOICE_API_URL}/transcribe`, {
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

    const response = await fetch(`${VOICE_API_URL}/synthesize`, {
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
