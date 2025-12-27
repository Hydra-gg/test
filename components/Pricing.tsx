'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Crown, Lock, DollarSign } from 'lucide-react';

const tiers = [
    {
        name: 'Foundation',
        price: '$2,500',
        period: '/ month',
        description: 'For companies that want growth execution without building an internal team.',
        featuresHeader: 'We handle:',
        features: [
            'Conversion-focused landing pages and funnels',
            'Ad campaign setup and ongoing optimization (Meta / Google)',
            'Weekly performance tracking and reporting',
            'AI-assisted creative and copy updates',
            'Support for up to 5,000 monthly visitors'
        ],
        focus: 'Product, sales, and operations — we run growth.',
        cta: 'Start Delegating',
        icon: Zap,
        popular: false,
    },
    {
        name: 'Escalate Pro',
        price: '$5,000',
        period: '/ month',
        description: 'For teams ready to scale aggressively without hiring.',
        featuresHeader: 'We handle everything in Foundation, plus:',
        features: [
            'Multi-platform ad management (Meta, Google, TikTok)',
            'Continuous creative testing and scaling',
            'AI-powered copywriting and personalization',
            'Real-time performance visibility',
            'Support for up to 50,000 monthly visitors'
        ],
        focus: 'Growth decisions — not execution.',
        cta: 'Scale With Escalate',
        icon: Crown,
        popular: true,
    },
    {
        name: 'Escalate Ultra',
        price: 'Custom',
        period: '',
        description: 'For companies that want a dedicated growth function.',
        featuresHeader: 'We become your growth partner:',
        features: [
            'Dedicated strategy director',
            'Custom AI workflows built around your business',
            'Advanced personalization and experimentation',
            'Priority execution and ongoing optimization',
            'White-label reporting for leadership and investors',
            'Priority 24/7 support'
        ],
        focus: 'Leading the company — we handle the growth engine.',
        cta: 'Talk to a Growth Director',
        icon: DollarSign,
        popular: false,
    }
];


const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="relative min-h-screen bg-obsidian overflow-hidden py-24">
            {/* Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050505] via-[#0A0A0B] to-[#050505]" />

            {/* Decorative Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-8">

                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                        <span className="w-8 h-[1px] bg-gold-dark"></span> Investment <span className="w-8 h-[1px] bg-gold-dark"></span>
                    </h2>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-white mb-4">
                        Access the <span className="italic text-gold-bright">Protocol</span>
                    </h1>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30, scale: tier.popular ? 1.05 : 1 }}
                            whileInView={{ opacity: 1, y: 0, scale: tier.popular ? 1.05 : 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
                            whileHover={{
                                y: -8,
                                scale: tier.popular ? 1.08 : 1.02,
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                }
                            }}
                            style={{ willChange: 'transform' }}
                            className={`relative p-8 rounded-3xl border cursor-pointer group flex flex-col h-full transition-[background,border,box-shadow] duration-500 ease-out
                                ${tier.popular
                                    ? 'bg-gradient-to-b from-white/[0.08] to-black/40 border-gold/50 z-20 shadow-[0_10px_40px_rgba(197,160,89,0.1)] hover:border-gold/80 hover:shadow-[0_25px_80px_rgba(197,160,89,0.35)]'
                                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-gold/40 hover:shadow-[0_20px_60px_rgba(197,160,89,0.2)] z-10'
                                }
                            `}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-obsidian text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
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
                            <p className="text-xs uppercase tracking-wider text-white/40 mb-4">{tier.featuresHeader}</p>
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
                                    &quot;{tier.focus}&quot;
                                </p>
                            </div>

                            {/* CTA */}
                            <button
                                className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 mt-auto
                                    ${tier.popular
                                        ? 'bg-white text-obsidian hover:bg-white/90'
                                        : 'bg-white/5 text-white border border-white/10 hover:bg-white hover:text-obsidian'
                                    }
                                `}
                            >
                                {tier.cta}
                                <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center text-white/30 text-sm mt-16">
                    All plans include a 7-day money-back guarantee. No questions asked.
                </p>
            </div>
        </section>
    );
};

export default Pricing;
