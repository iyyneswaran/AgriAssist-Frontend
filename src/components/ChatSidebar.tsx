import { useState } from 'react';
import { Search, Edit3, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ChatHistoryItem {
    id: string;
    fieldId: string | null;
    cropAssignmentId: string | null;
    status: string;
    startedAt: string;
    field?: { name: string };
    cropAssignment?: { crop: { name: string } };
    // A helper to show a snippet or title, since the DB doesn't have a title field,
    // we could format a display name like "Chat about [Field Name]" or use the first message snippet later.
}

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    chats: ChatHistoryItem[];
    currentChatId?: string | null;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
    onDeleteChat: (id: string) => void;
}

export default function ChatSidebar({ isOpen, onClose, chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }: ChatSidebarProps) {

    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const { t } = useTranslation();

    // A helper to generate a title for the chat
    const getChatTitle = (chat: ChatHistoryItem) => {
        if (chat.field) return `Field: ${chat.field.name}`;
        if (chat.cropAssignment) return `Crop: ${chat.cropAssignment.crop.name}`;
        return `Chat on ${new Date(chat.startedAt).toLocaleDateString()}`;
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar Drawer */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-80 bg-black border-r border-white/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-4">

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('chat.search')}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
                        />
                    </div>

                    {/* New Chat Button */}
                    <button
                        onClick={() => {
                            onNewChat();
                            onClose();
                        }}
                        className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors mb-8 px-2 font-medium text-sm"
                    >
                        <Edit3 size={18} />
                        {t('chat.newChat')}
                    </button>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <h3 className="text-gray-400 text-xs font-medium px-2 mb-4">{t('chat.recentChats')}</h3>

                        <div className="space-y-1">
                            {chats.length === 0 ? (
                                <p className="text-gray-500 text-sm px-2">{t('chat.noHistory')}</p>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-white/10' : 'hover:bg-white/5'
                                            }`}
                                        onClick={() => {
                                            onSelectChat(chat.id);
                                            onClose();
                                        }}
                                    >
                                        <span className="text-sm text-green-100 truncate flex-1 pr-4">
                                            {getChatTitle(chat)}
                                        </span>
                                        <button
                                            className="text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setChatToDelete(chat.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {chatToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Dark backing */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setChatToDelete(null)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative glass-panel-dark border border-white/20 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-medium text-white mb-2">{t('chat.deleteChat')}</h3>
                        <p className="text-sm text-gray-300 mb-6">
                            {t('chat.deletePrompt')}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setChatToDelete(null)}
                                className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                            >
                                {t('chat.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteChat(chatToDelete);
                                    setChatToDelete(null);
                                }}
                                className="px-5 py-2 rounded-full text-sm font-medium bg-red-500/80 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 border border-red-500/50"
                            >
                                {t('chat.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
