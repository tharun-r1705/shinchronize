import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export const TypingIndicator = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 mb-4"
        >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                    <motion.div
                        className="w-2 h-2 bg-amber-500 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="w-2 h-2 bg-amber-500 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.div
                        className="w-2 h-2 bg-amber-500 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    />
                </div>
                <span className="text-xs text-muted-foreground ml-2">Zenith is thinking...</span>
            </div>
        </motion.div>
    );
};

export default TypingIndicator;
