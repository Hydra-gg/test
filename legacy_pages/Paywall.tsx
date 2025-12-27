import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Zap, Crown, Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../src/lib/supabase/client';
import { useAuth } from '../src/contexts/AuthContext';

// Define SubscriptionTier locally if not exported from client or just use string
type SubscriptionTier = 'free' | 'lite' | 'pro' | 'ultra';

const tiers = [
    {
        name: 'Foundation',
        price: '$2,500',
        period: '/mo',
        description: 'For companies that want growth execution without building an internal team.',
        features: [
            'Conversion-focused landing pages and funnels',
            'Ad campaign setup and ongoing optimization (Meta / Google)',
            'Weekly performance tracking and reporting',
            'AI-assisted creative and copy updates',
            'Support for up to 5,000 monthly visitors'
        ],
        focus: 'Product, sales, and operations — we run growth.',
        cta: 'Select Foundation',
        icon: Zap,
        popular: false,
    },
    {
        name: 'Escalate Pro',
        price: '$5,000',
        period: '/mo',
        description: 'For teams ready to scale aggressively without hiring.',
        features: [
            'Everything in Foundation',
            'Multi-platform ad management (Meta, Google, TikTok)',
            'Continuous creative testing and scaling',
            'AI-powered copywriting and personalization',
            'Real-time performance visibility',
            'Support for up to 50,000 monthly visitors'
        ],
        focus: 'Growth decisions — not execution.',
        cta: 'Select Pro',
        icon: Crown,
        popular: true,
    },
    {
        name: 'Escalate Ultra',
        price: 'Custom',
        period: 'Engagement',
        description: 'For companies that want a dedicated growth function.',
        features: [
            'Dedicated strategy director',
            'Custom AI workflows built around your business',
            'Advanced personalization and experimentation',
            'Priority execution and ongoing optimization',
            'White-label reporting for leadership and investors',
            'Priority 24/7 support'
        ],
        focus: 'Leading the company — we handle the growth engine.',
        cta: 'Contact Sales',
        icon: Crown,
        popular: false,
    }
];

const Paywall: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const handleSelectPlan = async (tierName: string) => {
        if (!user) {
            router.push('/');
            return;
        }

        try {
            setProcessingPlan(tierName);

            // Map UI names to DB enums
            let dbTier: SubscriptionTier = 'free';
            if (tierName === 'Foundation') dbTier = 'lite';
            else if (tierName === 'Escalate Pro') dbTier = 'pro';
            else if (tierName === 'Escalate Ultra') dbTier = 'ultra';

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Call Database Function to update subscription
            const { error } = await supabase.rpc('update_user_subscription', {
                p_user_id: user.id,
                p_tier: dbTier,
                p_status: 'active'
            });

            if (error) throw error;

            // Refresh session manually if needed
            await supabase.auth.refreshSession();

            setPaymentSuccess(true);

            // Redirect after success message
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (error) {
            console.error('Payment failed:', error);
            setProcessingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050505] via-[#0A0A0B] to-[#050505]" />

            {/* Decorative Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

            {/* Processing/Success Overlay */}
            <AnimatePresence>
                {(processingPlan || paymentSuccess) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#1a1a1c] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center relative overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold/20 rounded-full blur-[50px]" />

                            {paymentSuccess ? (
                                <>
                                    <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30">
                                        <Check size={40} className="text-gold" />
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-white mb-2">
                                        Payment Successful
                                    </h3>
                                    <p className="text-platinum/60 mb-6">Redirecting to dashboard...</p>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gold"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="relative w-20 h-20 mx-auto mb-6">
                                        <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                                        <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
                                    <p className="text-platinum/60 text-sm">
                                        Securing your spot on {processingPlan}...
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-8 pt-32 md:pt-40 pb-16 md:pb-24">

                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    {/* Lock Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 border border-gold/30 mb-8">
                        <Lock size={36} className="text-gold" />
                    </div>

                    <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                        <span className="w-8 h-[1px] bg-gold-dark"></span> Premium Access <span className="w-8 h-[1px] bg-gold-dark"></span>
                    </h2>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-white mb-4">
                        Choose Your <span className="italic text-gold-bright">Plan</span>
                    </h1>
                    <p className="text-platinum/60 text-lg max-w-2xl mx-auto">
                        Unlock the full power of Escalate. Select a plan to access your dashboard and start scaling.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`relative p-8 rounded-3xl border cursor-pointer group flex flex-col h-full transition-all duration-300 hover:-translate-y-3 hover:scale-[1.02]
                                ${tier.popular
                                    ? 'bg-gradient-to-b from-white/[0.08] to-black/40 border-gold/30 z-20 scale-105 hover:border-gold/60 hover:shadow-[0_20px_60px_rgba(197,160,89,0.25)]'
                                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-gold/30 hover:shadow-[0_20px_50px_rgba(197,160,89,0.15)] z-10'
                                }
                            `}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-obsidian text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            {/* Icon Header */}
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-8 border
                                ${tier.popular ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/10 text-white/60'}
                            `}>
                                <tier.icon size={28} />
                            </div>

                            <h4 className="text-xl font-bold text-white mb-2">{tier.name}</h4>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-serif font-black text-white">{tier.price}</span>
                                <span className="text-sm text-white/40">{tier.period}</span>
                            </div>
                            <p className="text-sm text-platinum/60 min-h-[40px] mb-8 leading-relaxed">
                                {tier.description}
                            </p>

                            {/* Features */}
                            <ul className="space-y-4 mb-8">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-platinum/80">
                                        <Check size={16} className={`mt-0.5 ${tier.popular ? 'text-gold' : 'text-emerald-500'}`} />
                                        <span className="flex-1">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Focus Section */}
                            <div className="mb-10 pt-6 border-t border-white/5">
                                <p className="text-xs uppercase tracking-wider text-white/40 mb-2">You focus on:</p>
                                <p className="text-sm font-medium text-white/90 italic">
                                    "{tier.focus}"
                                </p>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => handleSelectPlan(tier.name)}
                                disabled={!!processingPlan}
                                className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 mt-auto
                                    ${tier.popular
                                        ? 'bg-gold text-obsidian hover:bg-white'
                                        : 'bg-white/5 text-white border border-white/10 hover:bg-white hover:text-obsidian'
                                    }
                                    ${processingPlan ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {tier.cta}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center text-white/30 text-sm mt-16">
                    All plans include a 7-day money-back guarantee. No questions asked.
                </p>
            </div>
        </div>
    );
};

export default Paywall;
