import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InlineErrorProps {
    message?: string | null;
}

const InlineError: React.FC<InlineErrorProps> = ({ message }) => {
    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 mt-1.5"
                >
                    <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400 leading-tight">{message}</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InlineError;
