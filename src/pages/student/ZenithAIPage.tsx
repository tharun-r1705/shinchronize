import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { agentApi, AgentMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    RefreshCw,
    Trash2,
    MessageSquare,
    Lightbulb,
    Target,
    BookOpen,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MessageBubbleProps {
    message: AgentMessage;
    isLast: boolean;
}

function MessageBubble({ message, isLast }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex gap-3',
                isUser ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            <Avatar className={cn(
                'w-8 h-8 flex-shrink-0 border',
                isUser 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-gradient-to-br from-primary to-purple-500 border-primary/30'
            )}>
                <AvatarFallback className={cn(
                    isUser ? 'text-primary' : 'text-white'
                )}>
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </AvatarFallback>
            </Avatar>

            <div className={cn(
                'flex flex-col max-w-[80%]',
                isUser ? 'items-end' : 'items-start'
            )}>
                <div className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-md'
                        : 'bg-muted/50 border border-border/50 rounded-tl-md'
                )}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.timestamp && (
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3"
        >
            <Avatar className="w-8 h-8 bg-gradient-to-br from-primary to-purple-500 border border-primary/30">
                <AvatarFallback className="text-white">
                    <Sparkles className="w-4 h-4" />
                </AvatarFallback>
            </Avatar>
            <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                <motion.span 
                    className="w-2 h-2 bg-primary/60 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                />
                <motion.span 
                    className="w-2 h-2 bg-primary/60 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                />
                <motion.span 
                    className="w-2 h-2 bg-primary/60 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                />
            </div>
        </motion.div>
    );
}

const suggestedPrompts = [
    { icon: Target, text: "What skills should I focus on for SDE roles?" },
    { icon: MessageSquare, text: "Review my interview preparation strategy" },
    { icon: BookOpen, text: "Help me create a study plan for DSA" },
    { icon: Lightbulb, text: "What's trending in the job market?" },
];

export default function ZenithAIPage() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch conversation history
    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['agent-history'],
        queryFn: () => agentApi.getHistory(token!, 50),
        enabled: !!token,
    });

    // Send message mutation
    const sendMessage = useMutation({
        mutationFn: (message: string) => agentApi.sendMessage(message, token!),
        onMutate: () => {
            setIsTyping(true);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-history'] });
            setIsTyping(false);
        },
        onError: (error: any) => {
            setIsTyping(false);
            toast.error(error.message || 'Failed to send message');
        },
    });

    // Clear conversation mutation
    const clearConversation = useMutation({
        mutationFn: () => agentApi.clearConversation(token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-history'] });
            toast.success('Conversation cleared');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to clear conversation');
        },
    });

    const messages = historyData?.messages || [];

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || sendMessage.isPending) return;

        // Optimistically add user message
        queryClient.setQueryData(['agent-history'], (old: any) => ({
            ...old,
            messages: [
                ...(old?.messages || []),
                {
                    role: 'user',
                    content: trimmed,
                    timestamp: new Date().toISOString(),
                },
            ],
        }));

        sendMessage.mutate(trimmed);
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    const handlePromptClick = (prompt: string) => {
        setInput(prompt);
        textareaRef.current?.focus();
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-glow">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-semibold text-lg">Zenith AI</h1>
                                <Badge variant="gradient" size="sm">Beta</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Your personal career mentor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-history'] })}
                            disabled={historyLoading}
                            className="h-9 w-9"
                        >
                            <RefreshCw className={cn('w-4 h-4', historyLoading && 'animate-spin')} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => clearConversation.mutate()}
                            disabled={clearConversation.isPending || messages.length === 0}
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 && !historyLoading ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            {/* Hero Icon */}
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-xl" />
                                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-glow">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-2">
                                Hello! I'm <span className="text-gradient">Zenith</span>
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
                                Your AI-powered career mentor. I can help with interview prep, skill development,
                                career planning, and more.
                            </p>
                            
                            {/* Suggested Prompts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                                {suggestedPrompts.map((prompt, index) => (
                                    <motion.button
                                        key={prompt.text}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                        onClick={() => handlePromptClick(prompt.text)}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                                    >
                                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                            <prompt.icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                            {prompt.text}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <MessageBubble
                                    key={`${message.timestamp}-${index}`}
                                    message={message}
                                    isLast={index === messages.length - 1}
                                />
                            ))}
                            <AnimatePresence>
                                {isTyping && <TypingIndicator />}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-2 bg-muted/30 rounded-2xl p-2 border border-border/50 focus-within:border-primary/50 transition-colors">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Zenith anything about your career..."
                            className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                            rows={1}
                            disabled={sendMessage.isPending}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            variant="gradient"
                            disabled={!input.trim() || sendMessage.isPending}
                            className="flex-shrink-0 rounded-xl h-10 w-10"
                        >
                            {sendMessage.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                        Zenith AI has access to your profile data to provide personalized advice
                    </p>
                </form>
            </div>
        </div>
    );
}
