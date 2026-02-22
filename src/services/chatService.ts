import { API_BASE_URL } from './authService';
import type { ChatHistoryItem } from '../components/ChatSidebar';

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    sender: 'USER' | 'AI' | 'SYSTEM';
    messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VOICE';
    textContent: string | null;
    filePath: string | null;
    createdAt: string;
}

// Get user's conversation list
export const getMyConversations = async (token: string, page = 1, limit = 20): Promise<PaginatedResponse<ChatHistoryItem>> => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch conversations');
    }

    return response.json();
};

export const addMessage = async (token: string, conversationId: string, messageData: any) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to add message');
    }

    return response.json();
};

export const deleteConversation = async (token: string, conversationId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete conversation');
    }

    // DELETE requests often return 204 No Content, so we don't expect a JSON body
    return response.status === 204 ? {} : response.json();
};

// Start a new conversation (creates DB record)
export const startConversation = async (token: string, fieldId?: string, cropAssignmentId?: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fieldId, cropAssignmentId })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to start conversation');
    }

    return response.json();
};

// Get messages for a specific conversation
export const getConversationMessages = async (token: string, conversationId: string, page = 1, limit = 50): Promise<PaginatedResponse<ChatMessage>> => {
    const response = await fetch(`${API_BASE_URL}/chat/messages/${conversationId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch messages');
    }

    return response.json();
};
