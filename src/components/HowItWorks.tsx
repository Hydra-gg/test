'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Brain,
    Rocket,
    Trophy,
    ArrowRight,
    CheckCircle2,
    Magnet
} from 'lucide-react';

import AnoAI from './ui/animated-shader-background';

const steps = [
    {
        number: '01',
        icon: Magnet,
        title: 'Strategic Briefing',
        description: 'We dive deep into your business, goals, and challenges. Our team crafts a custom AI-powered growth strategy.',
        highlights: ['60-minute deep dive session', 'Complete market analysis', 'Custom strategy blueprint'],
        color: 'from-blue-500 to-cyan-500',
    },
    {
        number: '02',
        icon: Brain,
        title: 'AI Analysis & Planning',
        description: 'Our proprietary AI analyzes millions of data points to identify your highest-impact opportunities.',
        highlights: ['Competitor intelligence', 'Audience discovery', 'Channel optimization'],
        color: 'from-purple-500 to-violet-500',
    },
    {
        number: '03',
        icon: Rocket,
        title: 'Launch & Optimize',
        description: 'We deploy your campaigns with precision. AI continuously optimizes for maximum ROI 24/7.',
        highlights: ['Multi-channel deployment', 'Real-time optimization', 'Clear performance updates for leadership'],
        color: 'from-amber-500 to-orange-500',
    },
    {
        number: '04',
        icon: Trophy,
        title: 'Scale & Dominate',
        description: 'Watch your business grow as we scale what works and double down on winning strategies.',
        highlights: ['Predictive scaling', 'Market expansion', 'Continuous innovation'],
        color: 'from-emerald-500 to-green-500',
    },
];

const HowItWorks: React.FC = () => {
    return (
        <section id="how-it-works" className="relative py-32 md:py-48 bg-obsidian overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <AnoAI />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 md:mb-24"
                >
                    <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                        <span className="w-8 h-[1px] bg-gold-dark"></span> Process <span className="w-8 h-[1px] bg-gold-dark"></span>
                    </h2>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-white mb-4">
                        From Strategy to <span className="italic text-gold-bright">Escalation</span>
                    </h1>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                className="relative"
                            >
                                {/* Step Card */}
                                <div className="group rounded-2xl p-8 h-full relative overflow-hidden bg-[#1F1F22] border border-white/10 hover:border-gold/30 hover:bg-[#252529] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 z-10">
                                    {/* Subtle Gold Glow on Hover */}
                                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10">
                                        {/* Number & Icon Row */}
                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-6xl font-display font-black text-white/10 group-hover:text-gold/10 transition-colors">
                                                {step.number}
                                            </span>
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-gold/30 group-hover:bg-gold/5 transition-all">
                                                <step.icon size={24} className="text-gold" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-xl font-serif font-medium text-white mb-4 group-hover:text-gold transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-[#A1A1AA] text-sm leading-relaxed mb-8">
                                            {step.description}
                                        </p>

                                        {/* Highlights */}
                                        <ul className="space-y-3">
                                            {step.highlights.map((highlight, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-platinum/70">
                                                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                                    <span>{highlight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Arrow connector (visible on lg) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:flex absolute top-1/2 -right-6 w-12 h-12 items-center justify-center z-20 -translate-y-1/2">
                                        <ArrowRight className="text-gold/40 w-6 h-6" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
