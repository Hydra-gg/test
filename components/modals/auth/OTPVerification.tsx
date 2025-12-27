import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, RefreshCw, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OTPVerificationProps {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onSuccess, onBack }) => {
    const { verifyOtp, resendCode } = useAuth();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
    const [shake, setShake] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Clear messages after 5 seconds
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

        // Auto-submit
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
        console.log('🔐 Verifying OTP...');

        try {
            await verifyOtp(email, otp);
            console.log('✅ OTP verified!');
            setLoading(false);
            // Go straight to Welcome modal - no intermediate screen
            onSuccess();
        } catch (err: any) {
            console.error('❌ OTP failed:', err.message);
            setLoading(false);
            setError(err.message || 'Invalid code. Please try again.');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setCode(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;

        setResending(true);
        setError(null);
        setResendSuccess(false);

        try {
            await resendCode(email);
            setResendCooldown(60);
            setResendSuccess(true);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.message || 'Failed to resend. Try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                    <Mail size={28} className="text-gold" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-platinum/50 text-sm">
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
                        className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center flex items-center justify-center gap-2"
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
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-2"
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OTP Inputs */}
            <motion.div
                className="flex justify-center gap-2 sm:gap-3"
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                {code.map((digit, index) => (
                    <div key={index} className="relative">
                        {focusedIndex === index && (
                            <div className="absolute -inset-1 bg-gold/20 rounded-xl blur-md" />
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
            <div className="text-center pt-2">
                <button onClick={onBack} className="text-white/40 hover:text-white text-sm transition-colors">
                    ← Back to registration
                </button>
            </div>
        </div>
    );
};

export default OTPVerification;
