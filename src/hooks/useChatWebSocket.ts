import { useState, useEffect, useRef, useCallback } from 'react';

const WS_BASE_URL = 'ws://localhost:8001/ws';

export interface WsMessage {
    type: string;
    content?: string;
    detail?: string;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;

export const useChatWebSocket = (conversationId: string | null, token: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [aiMessageStream, setAiMessageStream] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [wsError, setWsError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const pendingMessageRef = useRef<{ content: string; language: string } | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    // Keep a ref of conversationId so connect() always reads the latest value
    const conversationIdRef = useRef(conversationId);
    conversationIdRef.current = conversationId;

    const tokenRef = useRef(token);
    tokenRef.current = token;

    const connect = useCallback((overrideConversationId?: string) => {
        const effectiveConvId = overrideConversationId ?? conversationIdRef.current;
        const effectiveToken = tokenRef.current;

        if (!effectiveConvId || !effectiveToken) return;
        if (!isMounted.current) return;

        // Disconnect existing if any
        if (wsRef.current) {
            wsRef.current.onclose = null; // Prevent reconnect from old close
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnecting(true);
        setWsError(null);

        const wsUrl = `${WS_BASE_URL}/chat?session_id=${effectiveConvId}&token=${effectiveToken}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (!isMounted.current) return;
            console.log('WS Connected to chat', effectiveConvId);
            setIsConnected(true);
            setIsConnecting(false);
            setWsError(null);
            reconnectAttempts.current = 0; // Reset on successful connection

            if (pendingMessageRef.current) {
                console.log('Sending pending message...');
                setAiMessageStream('');
                setIsStreaming(true);
                ws.send(JSON.stringify({
                    type: 'chat_message',
                    ...pendingMessageRef.current
                }));
                pendingMessageRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            if (!isMounted.current) return;
            try {
                const data: WsMessage = JSON.parse(event.data);

                if (data.type === 'ai_token' && data.content) {
                    setIsStreaming(true);
                    setAiMessageStream((prev) => prev + data.content);
                } else if (data.type === 'ai_complete') {
                    setIsStreaming(false);
                } else if (data.type === 'error') {
                    console.error("WS Error from backend:", data.detail);
                    setWsError(data.detail || 'Unknown error');
                    setIsStreaming(false);
                }
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        ws.onclose = (event) => {
            if (!isMounted.current) return;
            console.log('WS Disconnected', event.code, event.reason);
            setIsConnected(false);
            setIsConnecting(false);

            // Auto-reconnect on abnormal closure (1006) or unexpected close
            if (event.code !== 1000 && event.code !== 1008) {
                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current += 1;
                    const delay = RECONNECT_DELAY_MS * reconnectAttempts.current;
                    console.log(`WS Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    reconnectTimer.current = setTimeout(() => {
                        if (isMounted.current) connect();
                    }, delay);
                } else {
                    setWsError('Connection lost. Please refresh the page.');
                }
            }
        };

        ws.onerror = (error) => {
            console.error('WS Connection error:', error);
            // Set user-visible error so the UI can react
            if (isMounted.current) {
                setWsError('WebSocket connection failed. Is the server running?');
            }
        };

        wsRef.current = ws;
    }, []); // No dependencies — reads from refs

    useEffect(() => {
        isMounted.current = true;
        if (conversationId && token) {
            connect();
        }
        return () => {
            isMounted.current = false;
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [conversationId, token, connect]);


    const sendMessage = useCallback((content: string, language = 'en') => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            setAiMessageStream('');
            setIsStreaming(true);

            wsRef.current.send(JSON.stringify({
                type: 'chat_message',
                content,
                language
            }));
        } else {
            console.warn("WS not connected. Queuing message and reconnecting...");
            pendingMessageRef.current = { content, language };
            // Trigger reconnect
            reconnectAttempts.current = 0;
            connect();
        }
    }, [connect]);

    /**
     * Connect to a specific conversation and immediately queue a message.
     * Used when a new conversation is created and we need to send the first
     * message without waiting for state/effect propagation.
     */
    const connectAndSend = useCallback((targetConversationId: string, content: string, language = 'en') => {
        pendingMessageRef.current = { content, language };
        reconnectAttempts.current = 0;
        connect(targetConversationId);
    }, [connect]);

    const clearStream = () => setAiMessageStream('');

    return {
        isConnected,
        isConnecting,
        isStreaming,
        aiMessageStream,
        wsError,
        sendMessage,
        connectAndSend,
        clearStream
    };
};
