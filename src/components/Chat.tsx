'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings, Send, Menu, AlertTriangle } from 'lucide-react';
import { EmptyScreen } from './empty-screen';
import { ChatLoader } from './chat-loader';
import { ChatResponse } from './chat-response';
import { ScoopLogo } from './scoop-logo';
import { Sidebar } from './sidebar';

// Backend API URL - Production Cloud Run
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://scoop-ai-sdk-358331686110.europe-west1.run.app';

interface QuickReply {
    title: string;
    payload: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    quickReplies?: QuickReply[];
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    created_at?: string;
    updated_at?: string;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Fallback Message Bubble (for older history or simple texts)
function MessageBubble({ message }: { message: Message }) {
    if (message.role === 'user') {
        return (
            <div className="flex justify-end mb-4">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-xl max-w-[80%]" style={{ backgroundColor: '#0A7364', color: 'white' }}>
                    <p className="text-sm">{message.content}</p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center bg-card flex-shrink-0">
                <ScoopLogo className="w-4 h-4" />
            </div>
            <div className="flex-1 bg-card border border-border rounded-xl px-4 py-3 max-w-[85%]">
                <div className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}

// Main Chat Component
export default function Chat() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find((c) => c.id === activeId);

    // Last user message ref for smart scrolling
    const lastUserMessageRef = useRef<HTMLDivElement>(null);

    // Initialize persistent userId on mount (client-side only to avoid hydration mismatch)
    useEffect(() => {
        // Check consent first
        const hasConsent = localStorage.getItem('scoop_history_consent');
        if (!hasConsent) {
            setShowConsentModal(true);
        }

        const stored = localStorage.getItem('scoop_user_id');
        if (stored) {
            setUserId(stored);
        } else {
            const newId = `widget_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem('scoop_user_id', newId);
            setUserId(newId);
        }
    }, []);

    // Handle consent acceptance
    const handleAcceptConsent = useCallback(() => {
        localStorage.setItem('scoop_history_consent', 'true');
        setShowConsentModal(false);
    }, []);

    // Handle consent rejection (don't save history)
    const handleRejectConsent = useCallback(() => {
        localStorage.setItem('scoop_history_consent', 'false');
        setShowConsentModal(false);
    }, []);

    // Handle delete all user data
    const handleDeleteData = useCallback(async () => {
        if (!userId) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/user/${userId}/data`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Clear localStorage
                localStorage.removeItem('scoop_user_id');
                localStorage.removeItem('scoop_history_consent');

                // Reset state
                setConversations([]);
                setActiveId(null);
                setSessionsLoaded(false);
                setShowDeleteConfirm(false);

                // Generate new userId
                const newId = `widget_${Math.random().toString(36).substring(2, 15)}`;
                localStorage.setItem('scoop_user_id', newId);
                setUserId(newId);

                // Show consent modal again
                setShowConsentModal(true);
            }
        } catch (error) {
            console.error('[Scoop] Failed to delete data:', error);
        } finally {
            setIsDeleting(false);
        }
    }, [userId]);

    // Load sessions from backend on mount
    useEffect(() => {
        if (!userId || sessionsLoaded) return;

        const loadSessions = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/sessions/${userId}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.sessions && data.sessions.length > 0) {
                    // Convert backend sessions to frontend Conversation format
                    const loadedConvs: Conversation[] = data.sessions.map((s: {
                        session_id: string;
                        title: string;
                        created_at?: string;
                        updated_at?: string;
                    }) => ({
                        id: s.session_id,
                        title: s.title || 'ახალი საუბარი',
                        messages: [], // Will be loaded when selected
                        created_at: s.created_at,
                        updated_at: s.updated_at,
                    }));
                    setConversations(loadedConvs);
                }
                setSessionsLoaded(true);
            } catch (error) {
                console.error('[Scoop] Failed to load sessions:', error);
                setSessionsLoaded(true);
            }
        };

        loadSessions();
    }, [userId, sessionsLoaded]);

    // Load session history when selecting from sidebar
    const loadSessionHistory = useCallback(async (sessionId: string) => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`${BACKEND_URL}/session/${sessionId}/history`);
            if (!res.ok) return;
            const data = await res.json();

            if (data.messages) {
                const messages: Message[] = data.messages.map((m: { role: string; content: string }, idx: number) => ({
                    id: `${sessionId}_${idx}`,
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                }));

                // Update the conversation with loaded messages
                setConversations(prev => prev.map(conv =>
                    conv.id === sessionId
                        ? { ...conv, messages }
                        : conv
                ));
            }
        } catch (error) {
            console.error('[Scoop] Failed to load session history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // Auto-scroll: scroll to user's message so response starts visible
    useEffect(() => {
        // When loading starts, scroll to end (to show loader)
        // When response arrives, scroll to user message (to show from beginning)
        if (isLoading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (lastUserMessageRef.current) {
            // Scroll user message to top with some padding
            lastUserMessageRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, [activeConversation?.messages, isLoading]);

    // Create new conversation - just reset to empty screen
    const startNewChat = useCallback(() => {
        setActiveId(null);
        setInput('');
        setSidebarOpen(false);
    }, []);

    // Actually create conversation when first message is sent
    const createNewConversation = useCallback(() => {
        const newId = generateId();
        const newConv: Conversation = {
            id: newId,
            title: 'ახალი საუბარი',
            messages: [],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveId(newId);
        return newId;
    }, []);

    // Send message using /chat endpoint
    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isLoading) return;

            let convId = activeId;
            if (!convId) {
                convId = createNewConversation();
            }

            setInput('');
            setIsLoading(true);

            const userMessage: Message = {
                id: generateId(),
                role: 'user',
                content: text.trim(),
            };

            // Add user message immediately
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === convId
                        ? {
                            ...conv,
                            title: conv.messages.length === 0 ? text.slice(0, 25) + '...' : conv.title,
                            messages: [...conv.messages, userMessage],
                        }
                        : conv
                )
            );

            try {
                // Simulate network delay for demo visuals if needed, or just fetch
                const response = await fetch(`${BACKEND_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        message: text,
                        session_id: convId,
                    }),
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                const responseText = data.response_text_geo || data.response || data.text || '';

                // Extract dynamic quick_replies from backend
                const backendQuickReplies: QuickReply[] = data.quick_replies || [];

                // Add assistant message with quick replies
                const assistantMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: responseText,
                    quickReplies: backendQuickReplies,
                };

                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === convId
                            ? {
                                ...conv,
                                messages: [...conv.messages, assistantMessage],
                            }
                            : conv
                    )
                );

            } catch (error) {
                console.error('[Scoop] Fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [activeId, createNewConversation, isLoading, userId]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Render logic to support history + ChatResponse
    const renderChatHistory = () => {
        // Show skeleton while loading history to prevent layout shift
        if (isLoadingHistory) {
            return (
                <div className="max-w-3xl mx-auto px-6 py-6 space-y-6 animate-pulse">
                    {/* Skeleton for user message */}
                    <div className="flex justify-end">
                        <div className="bg-gray-200 h-10 w-48 rounded-xl" />
                    </div>
                    {/* Skeleton for assistant message */}
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="bg-gray-200 h-4 w-full rounded" />
                            <div className="bg-gray-200 h-4 w-3/4 rounded" />
                            <div className="bg-gray-200 h-4 w-1/2 rounded" />
                        </div>
                    </div>
                </div>
            );
        }

        if (!activeConversation || activeConversation.messages.length === 0) {
            return <EmptyScreen setInput={(text: string) => sendMessage(text)} />;
        }

        const items = [];
        const msgs = activeConversation.messages;

        for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];
            const isLastUserMessage = msg.role === 'user' && i === msgs.length - 1 ||
                (msg.role === 'user' && msgs[i + 1]?.role === 'assistant' && i + 1 === msgs.length - 1);

            if (msg.role === 'user') {
                const nextMsg = msgs[i + 1];

                // 1. User followed by Assistant -> Render ChatResponse (Pair)
                if (nextMsg && nextMsg.role === 'assistant') {
                    // Convert backend quick_replies to ChatResponse format
                    // Pass undefined if empty so ChatResponse uses defaults
                    const qrList = nextMsg.quickReplies ?? [];
                    const dynamicQuickReplies = qrList.length > 0
                        ? qrList.map((qr, idx) => ({
                            id: `qr-${idx}`,
                            text: qr.title,
                            icon: null,
                        }))
                        : undefined; // Let ChatResponse use defaults

                    // Check if this is the last pair - add ref for scroll
                    const isLastPair = i + 1 === msgs.length - 1;

                    items.push(
                        <div key={msg.id} ref={isLastPair ? lastUserMessageRef : undefined}>
                            <ChatResponse
                                userMessage={msg.content}
                                assistantContent={nextMsg.content}
                                quickReplies={dynamicQuickReplies}
                                onQuickReplyClick={(id, text) => sendMessage(text)}
                            />
                        </div>
                    );
                    i++; // Skip assistant message as it's consumed by ChatResponse
                }
                // 2. User is last message & Loading -> Render ChatLoader
                else if (isLoading && i === msgs.length - 1) {
                    items.push(
                        <div key="loader" ref={lastUserMessageRef}>
                            <ChatLoader userMessage={msg.content} />
                        </div>
                    );
                }
                // 3. User is last message & NOT Loading (maybe error or waiting) -> Render Bubble
                else {
                    items.push(
                        <MessageBubble key={msg.id} message={msg} />
                    );
                }
            } else if (msg.role === 'assistant') {
                // If we hit an assistant message that wasn't skipped (orphan?), render bubble
                items.push(<MessageBubble key={msg.id} message={msg} />);
            }
        }

        return (
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
                {items}
                <div ref={messagesEndRef} />
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                conversations={conversations.map((c) => ({
                    id: c.id,
                    title: c.title,
                    created_at: c.created_at,
                    updated_at: c.updated_at
                }))}
                activeId={activeId}
                onNewChat={startNewChat}
                onSelect={(id) => {
                    setActiveId(id);
                    setSidebarOpen(false);
                    // Load history if not already loaded
                    const conv = conversations.find(c => c.id === id);
                    if (conv && conv.messages.length === 0) {
                        loadSessionHistory(id);
                    }
                }}
                onClose={() => setSidebarOpen(false)}
                onDeleteData={() => setShowDeleteConfirm(true)}
                isOpen={sidebarOpen}
            />

            {/* Consent Modal */}
            {showConsentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-lg font-semibold mb-3">ისტორიის შენახვა</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            გსურს რომ შევინახოთ შენი საუბრების ისტორია?
                            ეს საშუალებას მოგცემს ძველი საუბრების გაგრძელებას გვერდის გადატვირთვის შემდეგ.
                            მონაცემები 7 დღის შემდეგ ავტომატურად იშლება.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRejectConsent}
                                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                არა
                            </button>
                            <button
                                onClick={handleAcceptConsent}
                                className="flex-1 py-2 px-4 rounded-lg text-white hover:opacity-90"
                                style={{ backgroundColor: '#0A7364' }}
                            >
                                დიახ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                            <h2 className="text-lg font-semibold">მონაცემების წაშლა</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            დარწმუნებული ხარ? ეს წაშლის ყველა შენს საუბარს და მონაცემს.
                            ეს მოქმედება ვერ გაუქმებელია.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                disabled={isDeleting}
                            >
                                გაუქმება
                            </button>
                            <button
                                onClick={handleDeleteData}
                                disabled={isDeleting}
                                className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            >
                                {isDeleting ? 'იშლება...' : 'წაშლა'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-primary">Scoop AI</span>
                </div>

                {/* Desktop Header - Pine Green */}
                <div className="hidden lg:flex px-6 py-4 items-center justify-between text-white" style={{ backgroundColor: '#0A7364' }}>
                    <div className="flex items-center gap-3">
                        <ScoopLogo className="w-7 h-7" />
                        <span className="font-semibold text-lg">Scoop AI ასისტენტი</span>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
                        <Settings className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Chat content */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {renderChatHistory()}
                </div>

                {/* Input area */}
                <div className="">
                    <div className="max-w-3xl mx-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="დაწერე Scoop ასისტენტს..."
                                disabled={isLoading}
                                className="flex-1 bg-background border border-border rounded-xl px-5 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-white"
                                style={{ backgroundColor: '#0A7364' }}
                            >
                                <Send className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        </form>
                        <p className="text-center text-xs text-muted-foreground mt-3">
                            Scoop AI • ქირონი • სპორტული კვების კონსულტანტი
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
