import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ResetPasswordOTPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onResend: () => Promise<void>;
    email: string;
}

const ResetPasswordOTPModal: React.FC<ResetPasswordOTPModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onResend,
    email
}) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [shake, setShake] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
            setCode(['', '', '', '', '', '']);
            setError(null);
            setResendSuccess(false);
        }
    }, [isOpen]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Clear resend success after 5 seconds
    useEffect(() => {
        if (resendSuccess) {
            const timer = setTimeout(() => setResendSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [resendSuccess]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        setError(null);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        const fullCode = newCode.join('');
        if (fullCode.length === 6 && newCode.every(d => d !== '')) {
            handleVerify(fullCode);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
            const fullCode = code.join('');
            if (fullCode.length === 6) handleVerify(fullCode);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        const newCode = [...code];
        pasted.split('').forEach((d, i) => { if (i < 6) newCode[i] = d; });
        setCode(newCode);

        if (pasted.length === 6) handleVerify(pasted);
    };

    const handleVerify = async (otp: string) => {
        if (loading) return;

        setLoading(true);
        setError(null);
        console.log('🔐 Verifying password reset OTP for:', email);

        try {
            // Verify the OTP using 'recovery' type - this is what Supabase uses for password reset
            const { error } = await supabase.auth.verifyOtp({
                email: email.toLowerCase().trim(),
                token: otp,
                type: 'recovery', // THIS IS THE KEY - use 'recovery' for password reset OTP
            });

            if (error) {
                console.error('❌ OTP verification error:', error);
                throw error;
            }

            console.log('✅ Password reset OTP verified');
            // User is now in a "recovery" session and can update their password
            onSuccess();
        } catch (err: any) {
            console.error('💥 OTP verification failed:', err);
            setError(err.message || 'Invalid code. Please try again.');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setCode(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;

        setResending(true);
        setError(null);
        setResendSuccess(false);
        console.log('📤 Resending password reset OTP');

        try {
            // Resend using resetPasswordForEmail
            const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim());

            if (error) {
                console.error('❌ Resend error:', error);
                throw error;
            }

            console.log('✅ OTP resent');
            setResendCooldown(60);
            setResendSuccess(true);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            console.error('💥 Resend failed:', err);
            setError(err.message || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

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
                    initial={{ opacity: 0, scale: 0.85, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 40 }}
                    transition={{ type: 'spring', duration: 0.6, bounce: 0.35 }}
                    className="relative w-full max-w-md"
                >
                    <div className="relative bg-gradient-to-br from-[#1a1a1c] via-[#1d1d20] to-[#141416] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
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
                                    <Shield size={28} className="text-gold" />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-white mb-2">
                                    Enter Verification Code
                                </h2>
                                <p className="text-platinum/60 text-sm">
                                    We sent a 6-digit code to<br />
                                    <span className="text-gold font-medium">{email}</span>
                                </p>
                            </div>

                            {/* Success Message */}
                            <AnimatePresence>
                                {resendSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center flex items-center justify-center gap-2 mb-4"
                                    >
                                        <CheckCircle size={16} />
                                        New code sent! Check your email.
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-2 mb-4"
                                    >
                                        <AlertCircle size={16} />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* OTP Inputs */}
                            <motion.div
                                className="flex justify-center gap-2 sm:gap-3 mb-4"
                                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                                transition={{ duration: 0.4 }}
                            >
                                {code.map((digit, index) => (
                                    <div key={index} className="relative">
                                        {focusedIndex === index && (
                                            <div className="absolute -inset-1 bg-gold/25 rounded-xl blur-md" />
                                        )}
                                        <input
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={index === 0 ? handlePaste : undefined}
                                            onFocus={() => setFocusedIndex(index)}
                                            onBlur={() => setFocusedIndex(null)}
                                            disabled={loading}
                                            className={`
                                                relative w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold 
                                                rounded-xl border-2 transition-all duration-200 focus:outline-none z-10
                                                ${digit ? 'bg-gold/15 border-gold/60 text-gold' : 'bg-white/[0.03] border-white/10 text-white'}
                                                ${focusedIndex === index ? 'border-gold bg-gold/10' : ''}
                                                disabled:opacity-50
                                            `}
                                        />
                                    </div>
                                ))}
                            </motion.div>

                            {/* Loading */}
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-4 gap-2">
                                    <Loader2 size={24} className="text-gold animate-spin" />
                                    <span className="text-platinum/50 text-sm">Verifying...</span>
                                </div>
                            )}

                            {/* Resend */}
                            <div className="text-center pt-4">
                                <p className="text-white/40 text-sm mb-2">Didn't receive the code?</p>
                                <button
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0 || resending}
                                    className="inline-flex items-center gap-2 text-gold hover:text-gold-bright disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                                >
                                    {resending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={16} />
                                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Back */}
                            <div className="text-center pt-4">
                                <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors">
                                    ← Back
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ResetPasswordOTPModal;
