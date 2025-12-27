import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Shield } from 'lucide-react';

interface PasswordResetSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginClick: () => void;
}

// Animated Shield Unlock SVG
const AnimatedShieldCheck: React.FC = () => (
    <motion.svg
        width="52"
        height="52"
        viewBox="0 0 52 52"
        fill="none"
    >
        {/* Shield outline */}
        <motion.path
            d="M26 4 L44 12 L44 24 C44 36 26 48 26 48 C26 48 8 36 8 24 L8 12 L26 4 Z"
            stroke="#C5A059"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        />
        {/* Check mark */}
        <motion.path
            d="M18 26 L23 31 L34 20"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
        />
    </motion.svg>
);

const PasswordResetSuccessModal: React.FC<PasswordResetSuccessModalProps> = ({
    isOpen,
    onClose,
    onLoginClick
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-lg"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
                    transition={{ type: 'spring', duration: 0.65, bounce: 0.4 }}
                    className="relative w-full max-w-md"
                >
                    <div className="relative bg-gradient-to-br from-[#1a1a1c] via-[#1d1d20] to-[#141416] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Animated ambient glows */}
                        <motion.div
                            animate={{
                                scale: [1, 1.25, 1],
                                opacity: [0.15, 0.35, 0.15]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/25 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.1, 0.25, 0.1]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                            className="absolute -bottom-16 -right-16 w-48 h-48 bg-gold/20 rounded-full blur-3xl"
                        />

                        {/* Close Button */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors z-10"
                        >
                            <X size={20} />
                        </motion.button>

                        {/* Content */}
                        <div className="p-8 text-center relative z-10">
                            {/* Success Icon with rings */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    delay: 0.1,
                                    type: 'spring',
                                    stiffness: 180,
                                    damping: 12
                                }}
                                className="inline-block mb-6"
                            >
                                <div className="relative flex items-center justify-center">
                                    {/* Expanding rings */}
                                    {[0, 1, 2].map((ring) => (
                                        <motion.div
                                            key={ring}
                                            initial={{ scale: 0.85, opacity: 0.5 }}
                                            animate={{ scale: 1.7 + ring * 0.35, opacity: 0 }}
                                            transition={{
                                                duration: 1.6,
                                                repeat: Infinity,
                                                delay: ring * 0.3,
                                                ease: "easeOut"
                                            }}
                                            className="absolute w-24 h-24 rounded-full border border-emerald-400/50"
                                        />
                                    ))}

                                    {/* Main circle */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                                        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/30 via-gold/20 to-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.35)]"
                                    >
                                        <AnimatedShieldCheck />
                                    </motion.div>

                                    {/* Glow pulse */}
                                    <motion.div
                                        animate={{
                                            boxShadow: [
                                                '0 0 15px rgba(16,185,129,0.2)',
                                                '0 0 50px rgba(16,185,129,0.45)',
                                                '0 0 15px rgba(16,185,129,0.2)'
                                            ]
                                        }}
                                        transition={{ duration: 1.3, repeat: Infinity }}
                                        className="absolute w-24 h-24 rounded-full"
                                    />
                                </div>
                            </motion.div>

                            {/* Staggered Text */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                            >
                                <h3 className="text-2xl font-serif font-bold text-white mb-2 overflow-hidden">
                                    <motion.span
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
                                        className="inline-block"
                                    >
                                        Password
                                    </motion.span>{' '}
                                    <motion.span
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
                                        className="inline-block"
                                    >
                                        Reset
                                    </motion.span>{' '}
                                    <motion.span
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6, type: 'spring', stiffness: 120 }}
                                        className="inline-block text-emerald-400"
                                    >
                                        Successful!
                                    </motion.span>
                                </h3>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-platinum/60 mb-8"
                                >
                                    Your password has been successfully reset.{' '}
                                    <span className="text-platinum/80">You can now sign in with your new password.</span>
                                </motion.p>
                            </motion.div>

                            {/* Login Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <motion.button
                                    onClick={onLoginClick}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="group relative w-full py-4 bg-gradient-to-br from-gold-dark via-gold to-gold text-white font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_6px_30px_rgba(197,160,89,0.35)] overflow-hidden"
                                >
                                    {/* Shimmer */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '200%' }}
                                        transition={{
                                            duration: 1.8,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                    />

                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-gold to-amber-400"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />

                                    <span className="relative flex items-center gap-2">
                                        <motion.span
                                            animate={{ rotate: [0, 15, -15, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <Shield size={18} />
                                        </motion.span>
                                        Sign In Now
                                        <motion.span
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            <ArrowRight size={18} />
                                        </motion.span>
                                    </span>
                                </motion.button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PasswordResetSuccessModal;
