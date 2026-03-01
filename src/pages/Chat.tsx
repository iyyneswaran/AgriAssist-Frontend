import { useState, useEffect, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { Menu, Mic, Star, ArrowUp } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import VoiceChatOverlay from '../components/VoiceChatOverlay';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { startConversation, getConversationMessages, deleteConversation, getMyConversations } from '../services/chatService';
import type { ChatMessage } from '../services/chatService';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useTranslation } from 'react-i18next';

export default function Chat() {
    const { token } = useAuth();
    const { t } = useTranslation();

    // Context data
    const { conversations: chats, setConversations: setChats } = useAppData();

    // Sidebar & History State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);

    // Current Conversation State
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // WebSocket Hook
    const { isConnected, isStreaming, aiMessageStream, wsError, sendMessage, connectAndSend, clearStream } = useChatWebSocket(activeConversationId, token);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages when a conversation is selected
    useEffect(() => {
        if (!token || !activeConversationId) return;
        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const res = await getConversationMessages(token, activeConversationId, 1, 100);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load messages:", err);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [token, activeConversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, aiMessageStream]);

    // Handle stream completion
    useEffect(() => {
        // If we just finished streaming, we need to append the final Stream as a standard message.
        if (!isStreaming && aiMessageStream) {
            const finalAiMessage: ChatMessage = {
                id: Date.now().toString(), // fake id until next reload
                conversationId: activeConversationId as string,
                sender: 'AI',
                messageType: 'TEXT',
                textContent: aiMessageStream,
                filePath: null,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, finalAiMessage]);
            clearStream();
        }
    }, [isStreaming, aiMessageStream, activeConversationId, clearStream]);


    const handleSend = async () => {
        if (!inputText.trim() || !token) return;

        const currentText = inputText;
        setInputText('');

        let targetConvId = activeConversationId;
        const isNewConversation = !targetConvId;

        // 1. If this is a new chat (no active ID), create the record first
        if (isNewConversation) {
            try {
                const res = await startConversation(token);
                targetConvId = res.conversation.id;
                setActiveConversationId(targetConvId);

                // Refresh sidebar
                const historyRes = await getMyConversations(token, 1, 50);
                setChats(historyRes.data);
            } catch (err) {
                console.error("Failed to start new conversation", err);
                return;
            }
        }

        // Prepare mock user message for immediate UI update
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            conversationId: targetConvId as string,
            sender: 'USER',
            messageType: 'TEXT',
            textContent: currentText,
            filePath: null,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);

        // For new conversations, use connectAndSend to avoid the
        // race condition where sendMessage has a stale conversationId
        if (isNewConversation) {
            connectAndSend(targetConvId as string, currentText);
        } else {
            sendMessage(currentText);
        }
    };

    const startNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
        setInputText('');
    };

    const handleDeleteChat = async (idToDelete: string) => {
        if (!token) return;
        try {
            await deleteConversation(token, idToDelete);

            // Remove from local state
            setChats(prev => prev.filter(c => c.id !== idToDelete));

            // If the deleted chat was the currently active one, clear the active view
            if (activeConversationId === idToDelete) {
                startNewChat();
            }
        } catch (err) {
            console.error("Failed to delete chat:", err);
            // Ideally add an error toast here
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex justify-center bg-black">
            {/* Gradient Overlay for Global Background */}
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-md h-full flex flex-col h-screen pb-24">

                {/* Header */}
                <div className="flex items-center p-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition backdrop-blur-md border border-white/10"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="ml-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium">
                        AgriAssist
                    </div>
                    {wsError && <div className="ml-auto text-xs text-red-400">{t('chat.wsError')}</div>}
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col px-4 overflow-y-auto no-scrollbar">

                    {/* Empty State / Greeting Area */}
                    {!activeConversationId && messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                            <h1 className="text-2xl font-medium text-white mb-8 tracking-wide">
                                {t('chat.whatCanIHelp')} <span className="text-green-400">{t('chat.with')}</span>
                            </h1>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsVoiceOverlayOpen(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full glass-panel-dark border border-white/20 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium"
                                >
                                    <Mic size={16} className="text-teal-400" />
                                    {t('chat.voiceChat')}
                                </button>
                                <button className="flex items-center gap-2 px-6 py-2.5 rounded-full glass-panel-dark border border-white/20 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                    {t('chat.cropAnalysis')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Active Chat View */
                        <div className="flex-1 py-4 space-y-6">
                            {isLoadingMessages && <p className="text-center text-white/50 text-sm">{t('chat.loading')}</p>}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.sender === 'USER'
                                        ? 'bg-green-600/80 text-white rounded-tr-sm'
                                        : 'glass-panel-dark border border-white/10 text-white/90 rounded-tl-sm'
                                        }`}>
                                        {msg.textContent}
                                    </div>
                                </div>
                            ))}

                            {/* Streaming Fake Message */}
                            {isStreaming && aiMessageStream && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed glass-panel-dark border border-white/10 text-white/90 rounded-tl-sm">
                                        {aiMessageStream} <span className="animate-pulse">|</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}

                </div>

                <div className="px-4 pb-4 mt-auto">
                    <div className="spark-border">
                        <div className="relative flex items-center w-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-full pl-6 pr-2 py-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={activeConversationId && !isConnected ? t('chat.reconnecting') : t('chat.askAgriAssist')}
                                disabled={!!(activeConversationId && !isConnected)}
                                className="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none text-sm disabled:opacity-50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSend();
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={!!(activeConversationId && !isConnected)}
                                    onClick={() => setIsVoiceOverlayOpen(true)}
                                    className="p-2 text-white/70 hover:text-white transition disabled:opacity-50"
                                >
                                    <Mic size={20} />
                                </button>
                                <button
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${inputText.trim() && (!activeConversationId || isConnected)
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:from-green-400 hover:to-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                                        }`}
                                    disabled={!inputText.trim() || !!(activeConversationId && !isConnected)}
                                    onClick={handleSend}
                                >
                                    <ArrowUp size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Floating Bottom Nav */}
            <BottomNav />

            {/* Sidebar */}
            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                chats={chats}
                currentChatId={activeConversationId}
                onSelectChat={(id) => setActiveConversationId(id)}
                onNewChat={startNewChat}
                onDeleteChat={handleDeleteChat}
            />

            {/* Voice Chat Overlay */}
            <VoiceChatOverlay
                isOpen={isVoiceOverlayOpen}
                onClose={() => setIsVoiceOverlayOpen(false)}
            />
        </div>
    );
}
