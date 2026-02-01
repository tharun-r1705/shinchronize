import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <div className="relative mb-8">
                    <div className="text-[200px] font-bold text-muted-foreground/10 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h1 className="text-4xl font-bold text-gradient">Page Not Found</h1>
                    </div>
                </div>

                <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Link to="/">
                        <Button>
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
