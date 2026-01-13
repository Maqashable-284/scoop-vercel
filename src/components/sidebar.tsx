'use client';

import { Sparkles, MessageSquare, Info, X, Trash2, MessageCircle, Droplet, Zap, Leaf, AlertCircle, Apple, TrendingDown, TrendingUp, Dumbbell } from 'lucide-react';
import { groupConversationsByDate } from '../lib/groupConversations';
import { LucideIcon } from 'lucide-react';

// Theme icon mapping
const THEME_ICONS: Record<string, LucideIcon> = {
    protein: Droplet,
    creatine: Zap,
    vitamins: Leaf,
    allergy: AlertCircle,
    diet: Apple,
    weight_loss: TrendingDown,
    muscle: TrendingUp,
    workout: Dumbbell,
};

// Keywords for each theme
const KEYWORDS: Record<string, string[]> = {
    protein: ['პროტეინ', 'protein', 'ცილ', 'whey'],
    creatine: ['კრეატინ', 'creatine'],
    vitamins: ['ვიტამინ', 'vitamin'],
    allergy: ['ალერგი', 'allergy', 'აუტანლობ'],
    diet: ['დიეტ', 'diet', 'კვებ', 'nutrition'],
    weight_loss: ['წონ', 'weight', 'დაკლებ', 'loss'],
    muscle: ['კუნთ', 'muscle', 'მასა', 'mass', 'gain'],
    workout: ['ვარჯიშ', 'workout', 'ტრენ', 'train'],
};

// Get appropriate icon based on conversation title
function getConversationIcon(title: string): LucideIcon {
    const lowerTitle = title.toLowerCase();

    for (const [theme, keywords] of Object.entries(KEYWORDS)) {
        if (keywords.some(kw => lowerTitle.includes(kw))) {
            return THEME_ICONS[theme];
        }
    }

    return MessageCircle; // default
}

// Format time as "16:23" (24-hour format, Tbilisi UTC+4)
function formatTime(dateStr?: string): string {
    if (!dateStr) return '';

    // Backend sends UTC time without 'Z', manually append it to force UTC parsing
    const utcString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(utcString);

    // Convert to Tbilisi timezone (UTC+4)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Tbilisi'
    });
}

interface ConversationItem {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
}

interface SidebarProps {
    conversations: ConversationItem[];
    activeId: string | null;
    onNewChat: () => void;
    onSelect: (id: string) => void;
    onClose: () => void;
    onDeleteData: () => void;
    isOpen: boolean;
}

export function Sidebar({
    conversations,
    activeId,
    onNewChat,
    onSelect,
    onClose,
    onDeleteData,
    isOpen,
}: SidebarProps) {
    // Group conversations by date
    const grouped = groupConversationsByDate(conversations);

    const renderConversationGroup = (title: string, convs: ConversationItem[]) => {
        if (convs.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 px-3 mb-3">
                    {title}
                </h3>
                <div className="space-y-0.5">
                    {convs.map((conv) => {
                        const isActive = activeId === conv.id;
                        const timestamp = formatTime(conv.updated_at || conv.created_at);
                        const IconComponent = getConversationIcon(conv.title);

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 group relative ${isActive
                                    ? 'bg-green-50 text-foreground font-medium shadow-sm'
                                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                                    }`}
                                style={isActive ? { borderLeftWidth: '3px', borderLeftColor: '#0A7364' } : {}}
                            >
                                {/* Dynamic Theme Icon */}
                                <IconComponent
                                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0A7364]' : 'text-gray-400'}`}
                                    strokeWidth={1.5}
                                />

                                {/* Title */}
                                <span className="flex-1 truncate">
                                    {conv.title}
                                </span>

                                {/* Timestamp */}
                                {timestamp && (
                                    <span className={`text-xs flex-shrink-0 ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {timestamp}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div
                className={`
                fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
            >
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-medium">
                            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                            <span>ბოლო საუბრები</span>
                        </div>

                        {conversations.length === 0 ? (
                            <div className="text-sm text-muted-foreground/60 py-8 text-center">
                                საუბრები არ არის...
                            </div>
                        ) : (
                            <>
                                {renderConversationGroup('დღეს', grouped.today)}
                                {renderConversationGroup('გუშინ', grouped.yesterday)}
                                {renderConversationGroup('წინა 7 დღე', grouped.previous7Days)}
                            </>
                        )}
                    </div>

                    {/* About assistant */}
                    <div className="p-4 border-t border-sidebar-border space-y-1">
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-full px-3 py-2 rounded-md hover:bg-sidebar-accent">
                            <Info className="w-4 h-4" strokeWidth={1.5} />
                            <span>ასისტენტის შესახებ</span>
                        </button>
                        <button
                            onClick={onDeleteData}
                            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-md hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            <span>წაშალე მონაცემები</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
