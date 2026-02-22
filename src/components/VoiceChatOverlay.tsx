import { useState, useRef, useEffect } from 'react';
import { Mic, X, Menu, Bot, Square, Loader2, Volume2 } from 'lucide-react';
import { transcribeAudio, synthesizeSpeech, playAudioBlob } from '../services/voiceService';

interface VoiceChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'done' | 'error';

const STATE_LABELS: Record<VoiceState, string> = {
    idle: 'Tap the mic to speak',
    recording: 'Listening...',
    transcribing: 'Processing speech...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
    done: 'Done! Tap mic to speak again',
    error: 'Something went wrong. Try again.',
};

const LANG_LABELS: Record<string, string> = {
    ta: 'Tamil',
    hi: 'Hindi',
    ml: 'Malayalam',
    en: 'English',
    te: 'Telugu',
    kn: 'Kannada',
    mr: 'Marathi',
};

export default function VoiceChatOverlay({ isOpen, onClose }: VoiceChatOverlayProps) {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [userText, setUserText] = useState('');
    const [aiText, setAiText] = useState('');
    const [detectedLang, setDetectedLang] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            stopRecording();
            setVoiceState('idle');
            setUserText('');
            setAiText('');
            setDetectedLang('');
            setErrorMsg('');
        }
    }, [isOpen]);

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const startRecording = async () => {
        try {
            setVoiceState('recording');
            setUserText('');
            setAiText('');
            setErrorMsg('');
            chunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await processVoice(audioBlob);
            };

            recorder.start(100); // collect data every 100ms
        } catch (err: any) {
            console.error('Mic access error:', err);
            setErrorMsg('Microphone access denied. Please allow mic permissions.');
            setVoiceState('error');
        }
    };

    const handleStopRecording = () => {
        stopRecording();
        // onstop callback will trigger processVoice
    };

    const processVoice = async (audioBlob: Blob) => {
        try {
            // Step 1: STT — transcribe audio
            setVoiceState('transcribing');
            const sttResult = await transcribeAudio(audioBlob);
            const text = sttResult.text;
            const lang = sttResult.language || 'ta';
            setUserText(text);
            setDetectedLang(lang);

            if (!text.trim()) {
                setErrorMsg("Couldn't understand the audio. Please try again.");
                setVoiceState('error');
                return;
            }

            // Step 2: AI — get response via the same transcribed text
            // We use the synthesize endpoint which also returns audio
            // But first we need the AI text response. For the full pipeline,
            // we'll send the text to TTS directly (the AI reasoning happens backend-side
            // in a future version). For now, send the user's text to TTS as an echo test,
            // or call a separate AI endpoint.
            // 
            // For the v1 voice flow: STT → TTS (echo the transcription back as speech)
            // The full pipeline (STT → AI → TTS) will be connected when the voice_pipeline
            // endpoint is exposed.

            setVoiceState('thinking');

            // Call the full voice pipeline by sending the audio to the backend
            // which does: STT → AI (Gemini) → TTS → returns audio
            // For now we use the direct TTS endpoint with the transcribed text
            setAiText(`Processing: "${text}"`);

            // Step 3: TTS — synthesize response speech
            setVoiceState('speaking');
            const responseAudio = await synthesizeSpeech(text, lang);
            setAiText(text); // Show what was spoken

            // Step 4: Play the audio response
            await playAudioBlob(responseAudio);

            setVoiceState('done');
        } catch (err: any) {
            console.error('Voice pipeline error:', err);
            setErrorMsg(err.message || 'Voice processing failed');
            setVoiceState('error');
        }
    };

    const handleMicClick = () => {
        if (voiceState === 'recording') {
            handleStopRecording();
        } else if (voiceState === 'idle' || voiceState === 'done' || voiceState === 'error') {
            startRecording();
        }
    };

    if (!isOpen) return null;

    const isProcessing = ['transcribing', 'thinking', 'speaking'].includes(voiceState);
    const isRecording = voiceState === 'recording';

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 animate-in fade-in duration-300">
            {/* Blurry Animated Background */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
                {isRecording && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                )}
            </div>

            {/* Top Navigation Row */}
            <div className="relative z-10 flex items-center justify-between mt-2">
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                    <Menu size={24} />
                </button>

                <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 text-sm font-medium tracking-wide">
                    Voice Assistant
                </div>

                {detectedLang && (
                    <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
                        {LANG_LABELS[detectedLang] || detectedLang}
                    </div>
                )}
                {!detectedLang && <div className="w-12"></div>}
            </div>

            {/* Center Area: Bot Avatar & Status */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-6">
                {/* Glowing Avatar */}
                <div className="relative mb-4">
                    {/* Ring animation — pulsing when recording */}
                    {isRecording && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full border border-red-400/60 transform scale-125"></div>
                        </>
                    )}
                    {isProcessing && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full border border-green-400/50 transform scale-125"></div>
                        </>
                    )}

                    {/* The Avatar */}
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl border border-white/10 z-10 relative transition-all duration-500 ${isRecording
                            ? 'bg-gradient-to-br from-red-900/60 to-black shadow-red-900/40'
                            : voiceState === 'speaking'
                                ? 'bg-gradient-to-br from-teal-900/60 to-black shadow-teal-900/40'
                                : 'bg-gradient-to-br from-gray-800 to-black shadow-green-900/40'
                        }`}>
                        {isProcessing ? (
                            <Loader2 size={60} className="text-green-400 animate-spin drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                        ) : voiceState === 'speaking' ? (
                            <Volume2 size={60} className="text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] animate-pulse" />
                        ) : (
                            <Bot size={80} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                        )}
                    </div>
                </div>

                {/* Status Label */}
                <p className={`text-xl font-medium tracking-wide ${voiceState === 'error' ? 'text-red-400' : 'text-white'
                    } ${isRecording ? 'animate-pulse' : ''}`}>
                    {STATE_LABELS[voiceState]}
                </p>

                {/* Error message */}
                {voiceState === 'error' && errorMsg && (
                    <p className="text-red-400/70 text-sm text-center max-w-xs">{errorMsg}</p>
                )}

                {/* User's transcribed text */}
                {userText && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 max-w-sm">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">You said</p>
                        <p className="text-white text-sm">{userText}</p>
                    </div>
                )}

                {/* AI response text */}
                {aiText && voiceState !== 'transcribing' && (
                    <div className="bg-green-500/5 backdrop-blur-md border border-green-500/10 rounded-2xl px-5 py-3 max-w-sm">
                        <p className="text-[10px] text-green-500/70 uppercase tracking-wider mb-1">AI Response</p>
                        <p className="text-green-100 text-sm">{aiText}</p>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-10 flex items-end justify-between mb-8">
                {/* Mic / Stop Button */}
                <button
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 ${isRecording
                            ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 animate-pulse'
                            : isProcessing
                                ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 text-white hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400'
                        }`}
                >
                    {isRecording ? <Square size={24} /> : <Mic size={24} />}
                </button>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
}
