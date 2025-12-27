import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, X, Loader2, ArrowRight } from 'lucide-react';
import InlineError from '@/components/ui/InlineError';
import { supabase } from '@/lib/supabase/client';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (email: string) => void;
    onBackToLogin?: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.toLowerCase().trim();

        if (!cleanEmail) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        console.log('📧 Sending password reset OTP to:', cleanEmail);

        try {
            // Use resetPasswordForEmail - this sends an OTP code (not magic link if configured in Supabase)
            const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

            if (error) {
                console.error('❌ Password reset error:', error);
                throw error;
            }

            console.log('✅ Password reset OTP sent');
            onSuccess(cleanEmail);
        } catch (err: any) {
            console.error('💥 Password reset exception:', err);
            setError(err.message || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                <div className="relative bg-gradient-to-br from-[#1a1a1c] to-[#141416] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    {/* Content */}
                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                                <Mail size={28} className="text-gold" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-2">
                                Forgot Password?
                            </h2>
                            <p className="text-platinum/60 text-sm">
                                Enter your email and we'll send you a code to reset your password
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="you@company.com"
                                        className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${error ? 'border-red-500/50' : 'border-white/10'
                                            }`}
                                        disabled={loading}
                                    />
                                </div>
                                <InlineError message={error} />
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.01 }}
                                whileTap={{ scale: loading ? 1 : 0.99 }}
                                className="w-full py-3.5 bg-gradient-to-br from-gold-dark via-gold to-gold text-white font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_30px_rgba(197,160,89,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Send Reset Code
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </motion.button>

                            {/* Back to Login */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={onBackToLogin || onClose}
                                    className="text-white/40 hover:text-white text-sm transition-colors"
                                >
                                    ← Back to Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordModal;
