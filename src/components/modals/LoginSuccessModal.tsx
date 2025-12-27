import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
}

const COUNTDOWN_DURATION = 3;

// Animated Check SVG
const AnimatedCheck: React.FC = () => (
    <motion.svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        className="text-gold"
    >
        <motion.circle
            cx="30"
            cy="30"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        />
        <motion.path
            d="M18 30 L26 38 L42 22"
            stroke="currentColor"
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

const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({ isOpen, onClose, userName }) => {
    const router = useRouter();
    const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleGoToDashboard = useCallback(() => {
        onClose();
        router.push('/dashboard');
    }, [onClose, router]);

    useEffect(() => {
        if (isOpen) {
            setCountdown(COUNTDOWN_DURATION);
            setProgress(0);
            setIsButtonEnabled(false);

            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + (100 / (COUNTDOWN_DURATION * 60));
                    return newProgress >= 100 ? 100 : newProgress;
                });
            }, 1000 / 60);

            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setIsButtonEnabled(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const redirectTimer = setTimeout(() => {
                handleGoToDashboard();
            }, COUNTDOWN_DURATION * 1000);

            return () => {
                clearInterval(progressInterval);
                clearInterval(countdownInterval);
                clearTimeout(redirectTimer);
            };
        }
    }, [isOpen, handleGoToDashboard]);

    if (!isOpen) return null;

    const welcomeWords = ['Welcome', 'Back'];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-lg"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
                    transition={{
                        type: 'spring',
                        duration: 0.7,
                        bounce: 0.4
                    }}
                    className="relative w-full max-w-md"
                >
                    <div className="relative bg-gradient-to-br from-[#1a1a1c] via-[#1d1d20] to-[#141416] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Animated ambient glow */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-20 -left-20 w-60 h-60 bg-gold/30 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                            className="absolute -bottom-20 -right-20 w-60 h-60 bg-gold/20 rounded-full blur-3xl"
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
                                    stiffness: 200,
                                    damping: 12
                                }}
                                className="inline-block mb-6"
                            >
                                <div className="relative flex items-center justify-center">
                                    {/* Multiple expanding rings */}
                                    {[0, 1, 2, 3].map((ring) => (
                                        <motion.div
                                            key={ring}
                                            initial={{ scale: 0.8, opacity: 0.6 }}
                                            animate={{ scale: 2 + ring * 0.5, opacity: 0 }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: ring * 0.4,
                                                ease: "easeOut"
                                            }}
                                            className="absolute w-24 h-24 rounded-full border-2 border-gold/40"
                                        />
                                    ))}

                                    {/* Main circle */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                                        className="w-28 h-28 rounded-full bg-gradient-to-br from-gold/40 via-gold/20 to-gold/10 border-2 border-gold flex items-center justify-center shadow-[0_0_40px_rgba(197,160,89,0.4)]"
                                    >
                                        <AnimatedCheck />
                                    </motion.div>

                                    {/* Glow pulse */}
                                    <motion.div
                                        animate={{
                                            boxShadow: [
                                                '0 0 20px rgba(197,160,89,0.2)',
                                                '0 0 60px rgba(197,160,89,0.5)',
                                                '0 0 20px rgba(197,160,89,0.2)'
                                            ]
                                        }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute w-28 h-28 rounded-full"
                                    />
                                </div>
                            </motion.div>

                            {/* Staggered Text Animation */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className="text-3xl font-serif font-bold text-white mb-2 overflow-hidden">
                                    {welcomeWords.map((word, index) => (
                                        <motion.span
                                            key={word}
                                            initial={{ y: 40, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{
                                                delay: 0.5 + index * 0.15,
                                                type: 'spring',
                                                stiffness: 100
                                            }}
                                            className="inline-block mr-2"
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                    {userName && (
                                        <motion.span
                                            initial={{ y: 40, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{
                                                delay: 0.8,
                                                type: 'spring',
                                                stiffness: 100
                                            }}
                                            className="text-gold"
                                        >
                                            , {userName}
                                        </motion.span>
                                    )}
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.9, type: 'spring' }}
                                    >
                                        !
                                    </motion.span>
                                </h3>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-platinum/60 mb-6"
                                >
                                    You've successfully signed in
                                </motion.p>
                            </motion.div>

                            {/* Countdown Progress Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mb-6"
                            >
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-platinum/50">Redirecting to Dashboard</span>
                                    <motion.span
                                        animate={{ scale: countdown === 0 ? [1, 1.2, 1] : 1 }}
                                        className="text-gold font-medium"
                                    >
                                        {countdown > 0 ? `${countdown}s` : '✨ Ready!'}
                                    </motion.span>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold/80 via-gold to-amber-400 rounded-full"
                                        style={{ width: `${progress}%` }}
                                        initial={{ width: '0%' }}
                                    />

                                    {/* Shimmer */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '200%' }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                        style={{ width: '50%' }}
                                    />

                                    {/* Glow */}
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-gold/60 blur-sm rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </motion.div>

                            {/* Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 }}
                            >
                                <motion.button
                                    onClick={handleGoToDashboard}
                                    disabled={!isButtonEnabled}
                                    whileHover={isButtonEnabled ? { scale: 1.03, y: -2 } : {}}
                                    whileTap={isButtonEnabled ? { scale: 0.97 } : {}}
                                    className={`
                                        group relative w-full py-4 px-6 rounded-xl font-semibold text-base
                                        transition-all duration-300 overflow-hidden
                                        ${isButtonEnabled
                                            ? 'bg-gradient-to-r from-gold via-amber-500 to-gold text-black shadow-xl shadow-gold/30'
                                            : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isButtonEnabled && (
                                        <>
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '200%' }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: 'linear'
                                                }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-gold to-amber-400"
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </>
                                    )}

                                    <span className="relative flex items-center justify-center gap-2">
                                        {isButtonEnabled ? (
                                            <>
                                                <motion.span
                                                    animate={{ rotate: [0, 15, -15, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    <Sparkles size={18} />
                                                </motion.span>
                                                Go to Dashboard
                                                <motion.span
                                                    animate={{ x: [0, 5, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    <ArrowRight size={18} />
                                                </motion.span>
                                            </>
                                        ) : (
                                            <>
                                                <motion.span
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full"
                                                />
                                                Please wait...
                                            </>
                                        )}
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

export default LoginSuccessModal;
