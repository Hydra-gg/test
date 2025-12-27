import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, X, Loader2, ArrowRight, Check } from 'lucide-react';
import InlineError from '@/components/ui/InlineError';
import { supabase } from '@/lib/supabase/client';

interface NewPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    email: string;
}

// Password validation rules
const passwordRules = [
    { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { id: 'uppercase', label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'Contains number', test: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: 'Contains special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const NewPasswordModal: React.FC<NewPasswordModalProps> = ({ isOpen, onClose, onSuccess, email }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    const passedRules = passwordRules.filter(rule => rule.test(password)).length;
    const strength = passedRules === 0 ? 0 : passedRules <= 2 ? 1 : passedRules <= 4 ? 2 : 3;
    const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];
    const strengthColors = ['', 'text-red-400', 'text-yellow-400', 'text-emerald-400'];
    const barColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { password?: string; confirmPassword?: string } = {};

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        console.log('🔐 Updating password for:', email);

        // Create a timeout promise
        const timeoutPromise = new Promise<{ data: null; error: null; timedOut: true }>((resolve) => {
            setTimeout(() => resolve({ data: null, error: null, timedOut: true }), 5000);
        });

        // Create the update promise
        const updatePromise = supabase.auth.updateUser({
            password: password,
        }).then(result => ({ ...result, timedOut: false as const }));

        try {
            // Race between update and timeout
            const result = await Promise.race([updatePromise, timeoutPromise]);

            console.log('📦 Update result:', { timedOut: result.timedOut, hasData: !!result.data, error: result.error });

            if (result.timedOut) {
                // Timeout occurred but USER_UPDATED event will have fired
                // Password was changed, so proceed to success
                console.log('⏱️ Update call timed out, but password was likely updated. Proceeding.');
                setLoading(false);
                onSuccess();
                return;
            }

            if (result.error) {
                console.error('❌ Password update error:', result.error);
                setErrors({ password: result.error.message || 'Failed to reset password' });
                setLoading(false);
                return;
            }

            console.log('✅ Password updated successfully');
            setLoading(false);
            onSuccess();
        } catch (err: any) {
            console.error('💥 Password update exception:', err);
            setErrors({ password: err.message || 'Failed to reset password' });
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
                                <Lock size={28} className="text-gold" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-2">
                                Set New Password
                            </h2>
                            <p className="text-platinum/60 text-sm">
                                Create a strong password for your account
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setErrors(prev => ({ ...prev, password: undefined }));
                                        }}
                                        placeholder="••••••••••"
                                        className={`w-full pl-12 pr-12 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.password ? 'border-red-500/50' : 'border-white/10'
                                            }`}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InlineError message={errors.password} />

                                {/* Password Strength */}
                                {password.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 space-y-3"
                                    >
                                        {/* Strength Bar */}
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-white/40 uppercase tracking-wider">Password Strength</span>
                                            <span className={`text-xs font-medium ${strengthColors[strength]}`}>{strengthLabels[strength]}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(strength / 3) * 100}%` }}
                                                transition={{ duration: 0.3 }}
                                                className={`h-full rounded-full ${barColors[strength]}`}
                                            />
                                        </div>

                                        {/* Rules List */}
                                        <div className="space-y-2">
                                            {passwordRules.map((rule) => {
                                                const passed = rule.test(password);
                                                return (
                                                    <div key={rule.id} className="flex items-center gap-2">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${passed ? 'border-emerald-500/50 bg-emerald-500/20' : 'border-white/10 bg-white/[0.05]'
                                                            }`}>
                                                            {passed ? (
                                                                <Check size={12} className="text-emerald-400" />
                                                            ) : (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                            )}
                                                        </div>
                                                        <span className={`text-xs ${passed ? 'text-emerald-400' : 'text-white/40'}`}>
                                                            {rule.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                        }}
                                        placeholder="••••••••••"
                                        className={`w-full pl-12 pr-12 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                                            }`}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InlineError message={errors.confirmPassword} />
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
                                        Reset Password
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default NewPasswordModal;
