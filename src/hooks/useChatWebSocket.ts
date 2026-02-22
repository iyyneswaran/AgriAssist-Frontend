import { useState, useEffect, useRef, useCallback } from 'react';

// Using port 8001 for WS as per the Python backend logs
const WS_BASE_URL = 'ws://localhost:8001/ws';

export interface WsMessage {
    type: string;
    content?: string;
    detail?: string;
}

export const useChatWebSocket = (conversationId: string | null, token: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [aiMessageStream, setAiMessageStream] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    // We can also let the UI know if an error occurred
    const [wsError, setWsError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const pendingMessageRef = useRef<{ content: string; language: string } | null>(null);

    const connect = useCallback(() => {
        if (!conversationId || !token) return;

        // Disconnect existing if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        setIsConnecting(true);
        const wsUrl = `${WS_BASE_URL}/chat?session_id=${conversationId}&token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WS Connected to chat', conversationId);
            setIsConnected(true);
            setIsConnecting(false);
            setWsError(null);

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
            try {
                const data: WsMessage = JSON.parse(event.data);

                if (data.type === 'ai_token' && data.content) {
                    setIsStreaming(true);
                    setAiMessageStream((prev) => prev + data.content);
                } else if (data.type === 'ai_complete') {
                    setIsStreaming(false);
                    // At this point, the UI might want to save `aiMessageStream` 
                    // to the permanent message list and clear it.
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
            console.log('WS Disconnected', event.code, event.reason);
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WS Connection error:', error);
            setIsConnected(false);
        };

        wsRef.current = ws;

    }, [conversationId, token]);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        }
    }, [connect]);


    const sendMessage = useCallback((content: string, language = 'en') => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Reset stream state before sending new message
            setAiMessageStream('');
            setIsStreaming(true);

            wsRef.current.send(JSON.stringify({
                type: 'chat_message',
                content,
                language
            }));
        } else {
            console.warn("WS not connected. Queuing message...");
            pendingMessageRef.current = { content, language };
        }
    }, []);

    const clearStream = () => setAiMessageStream('');

    return {
        isConnected,
        isConnecting,
        isStreaming,
        aiMessageStream,
        wsError,
        sendMessage,
        clearStream
    };
};
