import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, userName }) => {
    const router = useRouter();

    const handleContinue = () => {
        onClose();
        router.push('/dashboard');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="relative w-full max-w-2xl"
            >
                <div className="relative bg-gradient-to-br from-[#1a1a1c] via-[#141416] to-[#0a0a0a] rounded-3xl border border-gold/20 shadow-2xl overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/40 hover:text-white/80 transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    {/* Content */}
                    <div className="relative p-12 text-center">
                        {/* Animated Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                delay: 0.2,
                                type: 'spring',
                                stiffness: 150,
                                damping: 12
                            }}
                            className="inline-block mb-8"
                        >
                            <div className="relative">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    {/* Logo */}
                                    <div className="relative w-full h-full">
                                        <img
                                            src="/assets/logo.png"
                                            alt="Escalate Logo"
                                            className="w-full h-full object-contain relative z-10"
                                            style={{
                                                filter: 'drop-shadow(0 0 40px rgba(212, 175, 55, 0.8))'
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Floating Particles */}
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{
                                            scale: [0, 1, 0],
                                            opacity: [0, 1, 0],
                                            x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                                            y: [0, Math.sin(i * 60 * Math.PI / 180) * 60]
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: 0.5 + i * 0.1,
                                            repeat: Infinity,
                                            repeatDelay: 1
                                        }}
                                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gold"
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* Welcome Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-4xl font-serif font-bold text-white mb-3">
                                Welcome to Escalate, {userName}!
                            </h2>
                            <p className="text-lg text-platinum/70 mb-8 max-w-lg mx-auto">
                                You're now part of an exclusive network of ambitious businesses ready to scale beyond limits.
                            </p>
                        </motion.div>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="grid grid-cols-3 gap-6 mb-10 max-w-2xl mx-auto"
                        >
                            {[
                                { title: 'Strategic Insights', desc: 'Data-driven decisions' },
                                { title: 'Expert Network', desc: 'Connect with leaders' },
                                { title: 'Growth Tools', desc: 'AI-powered automation & intelligent scaling' }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-gold/30 transition-colors"
                                >
                                    <h4 className="text-gold font-semibold mb-1">{feature.title}</h4>
                                    <p className="text-sm text-white/50">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            onClick={handleContinue}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-dark via-gold to-gold-bright text-obsidian font-bold rounded-xl shadow-[0_8px_30px_rgba(197,160,89,0.4)] hover:shadow-[0_12px_40px_rgba(197,160,89,0.5)] transition-all duration-300"
                        >
                            Continue
                            <ArrowRight size={20} />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default WelcomeModal;
