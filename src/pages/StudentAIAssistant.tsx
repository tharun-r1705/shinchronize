import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Brain,
    Send,
    Trash2,
    Sparkles,
    MessageSquare,
    Bell,
    X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { agentApi, AgentMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { StudentNavbar } from "@/components/StudentNavbar";
import { MessageBubble, TypingIndicator } from "@/components/AgentChat";

interface ChatMessage extends AgentMessage {
    toolsUsed?: string[];
}

const SUGGESTED_PROMPTS = [
    "What's my current readiness score?",
    "Show me my coding activity",
    "What should I focus on to improve?",
    "Add a goal to solve 50 LeetCode problems",
    "What are my strongest skills?",
];

const StudentAIAssistant = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [nudges, setNudges] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Load conversation history on mount
    useEffect(() => {
        const loadHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/student/login');
                return;
            }

            try {
                const response = await agentApi.getHistory(token);
                if (response.messages && response.messages.length > 0) {
                    setMessages(response.messages.map(m => ({
                        ...m,
                        toolsUsed: m.toolCalls?.map(tc => tc.name) || []
                    })));
                }
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadHistory();
    }, [navigate]);

    // Load nudges
    useEffect(() => {
        const loadNudges = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await agentApi.getNudges(token);
                if (response.nudges) {
                    setNudges(response.nudges);
                }
            } catch (error) {
                console.error('Failed to load nudges:', error);
            }
        };

        loadNudges();
    }, []);

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/student/login');
            return;
        }

        // Add user message immediately
        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await agentApi.sendMessage(text, token);

            // Add assistant response
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.response,
                timestamp: response.timestamp,
                toolsUsed: response.toolsUsed
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            toast({
                title: "Message failed",
                description: error.message || "Failed to get response from Zenith",
                variant: "destructive"
            });
            // Remove the user message if failed
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const clearConversation = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await agentApi.clearConversation(token);
            setMessages([]);
            toast({
                title: "Conversation cleared",
                description: "Starting fresh with Zenith"
            });
        } catch (error) {
            toast({
                title: "Failed to clear",
                description: "Could not clear conversation history",
                variant: "destructive"
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            <StudentNavbar />

            <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl flex flex-col">
                {/* Header */}
                <header className="mb-6 flex flex-col items-center">
                    <div className="w-full relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 text-center mb-4">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-3 mb-2">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"
                                >
                                    <Brain className="w-5 h-5 text-white" />
                                </motion.div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                                    Zenith AI Mentor
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Your personal career co-pilot • Ask anything about your profile
                            </p>
                        </div>
                    </div>

                    {/* Proactive Nudges */}
                    <AnimatePresence>
                        {nudges.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="w-full space-y-2 mb-4"
                            >
                                {nudges.map((nudge, i) => (
                                    <motion.div
                                        key={nudge._id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start relative"
                                    >
                                        <div className="bg-amber-500/20 p-2 rounded-lg">
                                            <Bell className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{nudge.title}</h4>
                                            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">{nudge.message}</p>
                                        </div>
                                        <button
                                            onClick={() => setNudges(prev => prev.filter(n => n._id !== nudge._id))}
                                            className="text-amber-700/50 hover:text-amber-700 p-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                {/* Chat Container */}
                <Card className="flex-1 flex flex-col overflow-hidden border-border/50">
                    {/* Messages Area */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoadingHistory ? (
                            <div className="space-y-4">
                                <Skeleton className="h-16 w-3/4" />
                                <Skeleton className="h-12 w-1/2 ml-auto" />
                                <Skeleton className="h-20 w-3/4" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-4"
                                >
                                    <MessageSquare className="w-8 h-8 text-amber-500" />
                                </motion.div>
                                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                                <p className="text-muted-foreground text-sm mb-6 max-w-md">
                                    Ask Zenith about your profile, coding activity, readiness score, or set new goals.
                                </p>

                                {/* Suggested Prompts */}
                                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs hover:border-amber-500/50 hover:bg-amber-500/5"
                                            onClick={() => sendMessage(prompt)}
                                        >
                                            <Sparkles className="w-3 h-3 mr-1.5 text-amber-500" />
                                            {prompt}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <MessageBubble
                                        key={index}
                                        role={message.role}
                                        content={message.content}
                                        timestamp={message.timestamp}
                                        toolsUsed={message.toolsUsed}
                                        isLatest={index === messages.length - 1}
                                    />
                                ))}

                                <AnimatePresence>
                                    {isLoading && <TypingIndicator />}
                                </AnimatePresence>

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </CardContent>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-card/50">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Zenith anything..."
                                disabled={isLoading}
                                className="flex-1 border-border/50 focus-visible:ring-amber-500/50"
                            />
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                            {messages.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={clearConversation}
                                    className="text-muted-foreground hover:text-destructive"
                                    title="Clear conversation"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Quick prompts when conversation exists */}
                        {messages.length > 0 && !isLoading && (
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, i) => (
                                    <Badge
                                        key={i}
                                        variant="outline"
                                        className="cursor-pointer text-xs whitespace-nowrap hover:bg-amber-500/10 hover:border-amber-500/30"
                                        onClick={() => sendMessage(prompt)}
                                    >
                                        {prompt}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default StudentAIAssistant;
