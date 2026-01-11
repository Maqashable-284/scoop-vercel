'use client';

import type React from "react"
import ReactMarkdown from 'react-markdown'
import { ScoopLogo } from "./scoop-logo"
import { RefreshCw } from "lucide-react"

interface QuickReply {
    id: string
    text: string
    icon?: React.ReactNode
}

interface ChatResponseProps {
    userMessage?: string
    assistantContent?: string  // NEW: Actual LLM response
    quickReplies?: QuickReply[]
    onQuickReplyClick?: (id: string, text: string) => void
}

// Default quick replies (fallback if backend doesn't send any)
const defaultQuickReplies: QuickReply[] = [
    { id: "compare", text: "Whey vs Isolate შეადარე" },
    { id: "muscle", text: "კუნთის ზრდისთვის რა არის საუკეთესო?" },
    { id: "budget", text: "100₾-მდე ვარიანტები" },
    { id: "popular", text: "ყველაზე პოპულარული პროდუქტი" },
]

export function ChatResponse({
    userMessage,
    assistantContent,
    quickReplies = defaultQuickReplies,
    onQuickReplyClick,
}: ChatResponseProps) {
    return (
        <div className="space-y-6">
            {/* User message */}
            {userMessage && (
                <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] shadow-sm" style={{ backgroundColor: '#0A7364', color: 'white' }}>
                        <p className="text-sm md:text-base leading-relaxed">{userMessage}</p>
                    </div>
                </div>
            )}

            {/* Assistant response */}
            <div className="flex items-start gap-4">
                {/* Scoop icon */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-border flex items-center justify-center bg-card flex-shrink-0" style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}>
                    <ScoopLogo className="w-5 h-5 md:w-6 md:h-6" />
                </div>

                <div className="flex-1 space-y-4">
                    {/* Actual LLM Response as Markdown */}
                    {assistantContent ? (
                        <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
                            <ReactMarkdown>{assistantContent}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">პასუხი იტვირთება...</p>
                    )}
                </div>
            </div>

            {/* Quick reply buttons */}
            {quickReplies && quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                    {quickReplies.map((reply) => (
                        <button
                            key={reply.id}
                            onClick={() => onQuickReplyClick?.(reply.id, reply.text)}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 text-sm text-foreground cursor-pointer hover:shadow-sm active:scale-95"
                        >
                            {reply.icon || <RefreshCw className="w-4 h-4" strokeWidth={1.5} />}
                            <span className="group-hover:text-primary transition-colors">{reply.text}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
