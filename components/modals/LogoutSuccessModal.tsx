import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LogoutSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogoutSuccessModal: React.FC<LogoutSuccessModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            // Auto-redirect after 2 seconds
            const timer = setTimeout(() => {
                onClose();
                router.push('/');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose, router]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
                    >
                        <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                            >
                                <CheckCircle size={40} className="text-green-500" />
                            </motion.div>

                            <h2 className="text-2xl font-serif font-bold text-white mb-2">
                                Signed Out
                            </h2>
                            <p className="text-white/50 mb-6">
                                You have been successfully signed out.
                            </p>

                            {/* Loading indicator */}
                            <div className="flex items-center justify-center gap-2 text-sm text-white/40">
                                <LogOut size={14} />
                                <span>Redirecting to home...</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LogoutSuccessModal;
