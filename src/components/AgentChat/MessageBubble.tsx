import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp?: string;
    toolsUsed?: string[];
    isLatest?: boolean;
}

export const MessageBubble = ({
    role,
    content,
    timestamp,
    toolsUsed = [],
    isLatest = false
}: MessageBubbleProps) => {
    const isUser = role === "user";
    const isAssistant = role === "assistant";

    return (
        <motion.div
            initial={isLatest ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex gap-3 mb-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                )}
            >
                {isUser ? (
                    <User className="w-4 h-4" />
                ) : (
                    <Bot className="w-4 h-4" />
                )}
            </div>

            {/* Message Content */}
            <div
                className={cn(
                    "flex flex-col max-w-[80%]",
                    isUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        isUser
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                    )}
                >
                    {/* Render markdown-like content */}
                    <div className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                        {content.split('\n').map((line, i) => {
                            // Handle headers
                            if (line.startsWith('### ')) {
                                return <h4 key={i} className="font-bold mt-2 mb-1">{line.slice(4)}</h4>;
                            }
                            if (line.startsWith('## ')) {
                                return <h3 key={i} className="font-bold mt-3 mb-1">{line.slice(3)}</h3>;
                            }
                            // Handle bullet points
                            if (line.startsWith('- ') || line.startsWith('* ')) {
                                return (
                                    <div key={i} className="flex items-start gap-2 my-0.5">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{line.slice(2)}</span>
                                    </div>
                                );
                            }
                            // Handle numbered lists
                            if (/^\d+\.\s/.test(line)) {
                                const match = line.match(/^(\d+)\.\s(.*)$/);
                                if (match) {
                                    return (
                                        <div key={i} className="flex items-start gap-2 my-0.5">
                                            <span className="text-primary font-semibold">{match[1]}.</span>
                                            <span>{match[2]}</span>
                                        </div>
                                    );
                                }
                            }
                            // Handle bold text
                            if (line.includes('**')) {
                                const parts = line.split(/\*\*(.*?)\*\*/g);
                                return (
                                    <p key={i} className="my-0.5">
                                        {parts.map((part, j) =>
                                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                        )}
                                    </p>
                                );
                            }
                            // Empty line
                            if (!line.trim()) {
                                return <div key={i} className="h-2" />;
                            }
                            return <p key={i} className="my-0.5">{line}</p>;
                        })}
                    </div>
                </div>

                {/* Tools used indicator */}
                {isAssistant && toolsUsed && toolsUsed.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {toolsUsed.map((tool, i) => (
                            <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded"
                            >
                                {tool.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                {timestamp && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default MessageBubble;
