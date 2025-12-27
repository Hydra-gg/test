import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SocialLoginButton from './SocialLoginButton';

interface LoginFormProps {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
    onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess, onForgotPassword }) => {
    const { signIn, signInWithOAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setErrors({ general: error.message });
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            await signInWithOAuth(provider);
        } catch (error: any) {
            setErrors({ general: error.message });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-3xl font-serif font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-platinum/50 text-sm">Sign in to access your console</p>
            </div>

            {/* General Error */}
            <AnimatePresence>
                {errors.general && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1.5"
                    >
                        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400 leading-tight">{errors.general}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
                <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} />
                <SocialLoginButton provider="apple" onClick={() => handleSocialLogin('apple')} />
            </div>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#141416] px-2 text-white/40">Or sign in with email</span>
                </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Email</label>
                <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200"
                    />
                </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Password</label>
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs text-gold/70 hover:text-gold transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>
                <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        required
                        className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gradient-to-br from-gold-dark via-gold to-gold text-white font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_30px_rgba(197,160,89,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
            >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <>
                        Sign In
                        <ArrowRight size={18} />
                    </>
                )}
            </motion.button>



            {/* Switch to Register */}
            <div className="text-center">
                <p className="text-white/40 text-sm">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-gold hover:text-gold-bright font-medium transition-colors"
                    >
                        Create Account
                    </button>
                </p>
            </div>
        </form>
    );
};

export default LoginForm;
