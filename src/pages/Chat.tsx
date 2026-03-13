import { useState, useEffect, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { Menu, Mic, Star, ArrowUp } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import VoiceChatOverlay from '../components/VoiceChatOverlay';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { startConversation, getConversationMessages, deleteConversation, getMyConversations, addMessage } from '../services/chatService';
import type { ChatMessage } from '../services/chatService';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

// Custom markdown components for styled AI responses
const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-sm font-bold text-white mt-3 mb-1.5">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold text-green-400 mt-2.5 mb-1">{children}</h3>
    ),
    p: ({ children }) => (
        <p className="text-sm leading-relaxed mb-2 text-white/90">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="space-y-1 mb-2 ml-1">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="space-y-1 mb-2 ml-1 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="text-sm text-white/85 leading-relaxed flex gap-2">
            <span className="text-green-400 mt-0.5 shrink-0">•</span>
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-white/70">{children}</em>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-green-500/50 pl-3 my-2 text-white/70 text-sm">
            {children}
        </blockquote>
    ),
    code: ({ children, className }) => {
        const isInline = !className;
        return isInline ? (
            <code className="bg-white/10 text-green-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
        ) : (
            <code className="block bg-black/40 border border-white/10 rounded-lg p-3 my-2 text-xs font-mono text-green-300 overflow-x-auto">{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="my-2">{children}</pre>
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto my-2 rounded-lg border border-white/10">
            <table className="w-full text-xs">{children}</table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-white/5 border-b border-white/10">{children}</thead>
    ),
    th: ({ children }) => (
        <th className="px-3 py-1.5 text-left text-green-400 font-medium text-[11px] uppercase tracking-wider">{children}</th>
    ),
    td: ({ children }) => (
        <td className="px-3 py-1.5 text-white/80 border-t border-white/5">{children}</td>
    ),
    hr: () => (
        <hr className="border-white/10 my-3" />
    ),
    a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300 transition">{children}</a>
    ),
};

export default function Chat() {
    const { token } = useAuth();
    const { t, i18n } = useTranslation();

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

    const [isTyping, setIsTyping] = useState(false);

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
    }, [messages, isTyping]);




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

        // Create mock user message for immediate UI update
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
        setIsTyping(true);

        try {
            // Send the message over HTTP
            const response = await addMessage(token, targetConvId as string, {
                sender: 'USER',
                messageType: 'TEXT',
                textContent: currentText,
                language: i18n.language
            });

            // Replace the mock message with the actual messages from the server
            // The server returns { userMessage, aiMessage }
            setMessages(prev => [
                ...prev.filter(m => m.id !== userMsg.id), // remove mock msg
                response.userMessage,
                response.aiMessage
            ]);
        } catch (err: any) {
            console.error("Failed to send message over HTTP:", err);
            // Optionally add an error message to the UI here
            const errorMsg: ChatMessage = {
                id: Date.now().toString() + "_err",
                conversationId: targetConvId as string,
                sender: 'AI',
                messageType: 'TEXT',
                textContent: "Sorry, there was an error communicating with the server.",
                filePath: null,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev.filter(m => m.id !== userMsg.id), userMsg, errorMsg]);
        } finally {
            setIsTyping(false);
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
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                                        msg.sender === 'USER'
                                            ? 'bg-green-600/80 text-white rounded-tr-sm'
                                            : 'glass-panel-dark border border-white/10 text-white/90 rounded-tl-sm'
                                    }`}>
                                        {msg.sender === 'AI' ? (
                                            <div className="markdown-chat">
                                                <ReactMarkdown components={markdownComponents}>
                                                    {msg.textContent || ''}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            msg.textContent
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed glass-panel-dark border border-white/10 text-white/90 rounded-tl-sm flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-150"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-300"></div>
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
                                placeholder={isTyping ? t('chat.loading') : t('chat.askAgriAssist')}
                                disabled={isTyping}
                                className="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none text-sm disabled:opacity-50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSend();
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={isTyping}
                                    onClick={() => setIsVoiceOverlayOpen(true)}
                                    className="p-2 text-white/70 hover:text-white transition disabled:opacity-50"
                                >
                                    <Mic size={20} />
                                </button>
                                <button
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${inputText.trim() && !isTyping
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:from-green-400 hover:to-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                                        }`}
                                    disabled={!inputText.trim() || isTyping}
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
