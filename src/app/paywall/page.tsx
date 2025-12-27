'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';

const benefits = [
    'AI-powered growth automation',
    'Real-time analytics dashboard',
    'Multi-channel campaign management',
    'Priority 24/7 support',
    'Custom AI workflows',
];

export default function PaywallPage() {
    const router = useRouter();
    const { isPremium, loading } = useProfile();

    // Redirect active subscribers to dashboard
    useEffect(() => {
        if (!loading && isPremium) {
            router.push('/dashboard');
        }
    }, [isPremium, loading, router]);

    // Show loading while checking subscription or redirecting
    if (loading || isPremium) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    {/* Spinner */}
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                        <div className="absolute inset-0 border-2 border-transparent border-t-gold rounded-full animate-spin" />
                    </div>
                    <span className="text-white/50 text-sm">
                        {isPremium ? 'Redirecting to dashboard...' : 'Checking subscription...'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative max-w-lg w-full"
            >
                {/* Card */}
                <div className="rounded-3xl p-8 md:p-12 border border-white/10 bg-gradient-to-b from-white/[0.08] to-black/40 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgba(197,160,89,0.4)]">
                        <Crown size={32} className="text-obsidian" />
                    </div>

                    {/* Header */}
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white text-center mb-3">
                        Unlock the <span className="text-gold">Dashboard</span>
                    </h1>
                    <p className="text-white/50 text-center mb-8 max-w-sm mx-auto">
                        Upgrade to a premium plan to access your personalized business dashboard and AI-powered growth tools.
                    </p>

                    {/* Benefits */}
                    <ul className="space-y-3 mb-8">
                        {benefits.map((benefit, idx) => (
                            <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                className="flex items-center gap-3 text-white/80"
                            >
                                <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                                    <Check size={12} className="text-gold" />
                                </div>
                                {benefit}
                            </motion.li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <Link href="/#pricing">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gradient-to-br from-gold-dark via-gold to-gold text-obsidian font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(197,160,89,0.4)] hover:shadow-[0_8px_40px_rgba(197,160,89,0.5)] transition-all duration-300"
                        >
                            View Plans
                            <ArrowRight size={18} />
                        </motion.button>
                    </Link>

                    {/* Back Link */}
                    <Link
                        href="/"
                        className="block text-center text-sm text-white/40 hover:text-white/60 mt-6 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>

                {/* Logo at bottom */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Zap size={16} className="text-gold" />
                    <span className="text-sm font-serif text-white/40">Escalate AI</span>
                </div>
            </motion.div>
        </div>
    );
}
