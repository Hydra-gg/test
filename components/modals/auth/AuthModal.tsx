import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, children, title }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - does NOT close on click */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md"
                        aria-hidden="true"
                    />

                    {/* Modal Container - Scrollable outer container */}
                    <div className="fixed inset-0 z-[10000] overflow-y-auto overflow-x-hidden">
                        <div className="min-h-full flex items-start md:items-center justify-center px-4 py-6 md:py-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                className="relative w-full max-w-md"
                            >
                                {/* Glass Card - No max-height, grows with content */}
                                <div
                                    className="relative rounded-2xl"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(20, 20, 22, 0.97) 0%, rgba(15, 15, 17, 0.99) 100%)',
                                        backdropFilter: 'blur(40px)',
                                        WebkitBackdropFilter: 'blur(40px)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 100px rgba(197, 160, 89, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                                    }}
                                >
                                    {/* Gold accent line at top */}
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent rounded-t-2xl" />

                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
                                        aria-label="Close modal"
                                    >
                                        <X size={16} className="text-white/60 group-hover:text-white transition-colors" />
                                    </button>

                                    {/* Header */}
                                    {title && (
                                        <div className="px-6 pt-6 pb-2">
                                            <h2 className="text-2xl font-serif font-bold text-white">{title}</h2>
                                        </div>
                                    )}

                                    {/* Content - No max-height, grows naturally */}
                                    <div className="px-6 py-5">
                                        {children}
                                    </div>

                                    {/* Bottom gradient accent */}
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gold/[0.02] to-transparent pointer-events-none rounded-b-2xl" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
