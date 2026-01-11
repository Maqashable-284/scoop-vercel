'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings, Send, Sparkles, MessageSquare, Info, Menu, X } from 'lucide-react';
import { EmptyScreen } from './empty-screen';
import { ChatLoader } from './chat-loader';
import { ChatResponse } from './chat-response';
import { ScoopLogo } from './scoop-logo';

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
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Sidebar Component
function Sidebar({
    conversations,
    activeId,
    onNewChat,
    onSelect,
    onClose,
    isOpen,
}: {
    conversations: { id: string; title: string }[];
    activeId: string | null;
    onNewChat: () => void;
    onSelect: (id: string) => void;
    onClose: () => void;
    isOpen: boolean;
}) {
    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
                    {/* New conversation button */}
                    <div className="p-4">
                        <button
                            onClick={onNewChat}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
                            style={{ backgroundColor: '#0A7364' }}
                        >
                            <Sparkles className="w-4 h-4" style={{ color: '#D9B444' }} />
                            <span>ახალი საუბარი</span>
                        </button>
                    </div>

                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 hover:bg-sidebar-accent rounded-md lg:hidden transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Recent conversations */}
                    <div className="flex-1 px-4 overflow-y-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 font-medium">
                            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                            <span>ბოლო საუბრები</span>
                        </div>

                        {conversations.length === 0 ? (
                            <div className="text-sm text-muted-foreground/60 py-8 text-center">
                                საუბრები არ არის...
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => onSelect(conv.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${activeId === conv.id
                                            ? 'bg-sidebar-accent text-foreground font-medium'
                                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                                            }`}
                                    >
                                        {conv.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* About assistant */}
                    <div className="p-4 border-t border-sidebar-border">
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-full px-3 py-2 rounded-md hover:bg-sidebar-accent">
                            <Info className="w-4 h-4" strokeWidth={1.5} />
                            <span>ასისტენტის შესახებ</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find((c) => c.id === activeId);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages, isLoading]); // Scroll on loading state change too

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
                        user_id: `widget_${convId}`,
                        message: text,
                        conversation_id: convId,
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
        [activeId, createNewConversation, isLoading]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Render logic to support history + ChatResponse
    const renderChatHistory = () => {
        if (!activeConversation || activeConversation.messages.length === 0) {
            return <EmptyScreen setInput={(text: string) => sendMessage(text)} />;
        }

        const items = [];
        const msgs = activeConversation.messages;

        for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];

            if (msg.role === 'user') {
                const nextMsg = msgs[i + 1];

                // 1. User followed by Assistant -> Render ChatResponse (Pair)
                if (nextMsg && nextMsg.role === 'assistant') {
                    // Convert backend quick_replies to ChatResponse format
                    const dynamicQuickReplies = nextMsg.quickReplies?.map((qr, idx) => ({
                        id: `qr-${idx}`,
                        text: qr.title,
                        icon: null, // Backend doesn't send icons, ChatResponse will handle
                    }));

                    items.push(
                        <ChatResponse
                            key={msg.id}
                            userMessage={msg.content}
                            assistantContent={nextMsg.content}
                            quickReplies={dynamicQuickReplies}
                            onQuickReplyClick={(id, text) => sendMessage(text)}
                        />
                    );
                    i++; // Skip assistant message as it's consumed by ChatResponse
                }
                // 2. User is last message & Loading -> Render ChatLoader
                else if (isLoading && i === msgs.length - 1) {
                    items.push(
                        <ChatLoader key="loader" userMessage={msg.content} />
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
                conversations={conversations.map((c) => ({ id: c.id, title: c.title }))}
                activeId={activeId}
                onNewChat={startNewChat}
                onSelect={(id) => {
                    setActiveId(id);
                    setSidebarOpen(false);
                }}
                onClose={() => setSidebarOpen(false)}
                isOpen={sidebarOpen}
            />

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
