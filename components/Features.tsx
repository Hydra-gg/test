'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Layout,
    Paintbrush,
    Rocket,
    Users,
    BarChart3,
    Target,
    Shield,
    Zap,
    Cpu,
    Globe,
    MessageSquare,
    Layers,
    Brain,
    LineChart,
    Lightbulb,
    Lock,
    UserCheck
} from 'lucide-react';

const features = [
    // Row 1
    {
        title: 'AI Website & Funnel Infrastructure',
        function: 'AI-built, conversion-optimized websites and funnels designed to adapt, test, and scale automatically.',
        capabilities: [
            { icon: Layout, label: 'DYNAMIC FUNNELS' },
            { icon: BarChart3, label: 'AUTO-OPTIMIZATION' },
            { icon: Globe, label: 'GLOBAL CDN' },
            { icon: Layers, label: 'ADAPTIVE UX' }
        ],
        outcome: '"Higher conversion rates without redesign cycles or engineering overhead."',
    },
    {
        title: 'AI Creative Generation Engine',
        function: 'An AI system that produces, tests, and scales high-performing creative assets.',
        capabilities: [
            { icon: Paintbrush, label: 'MULTI-FORMAT ADS' },
            { icon: Zap, label: 'RAPID TESTING' },
            { icon: Target, label: 'AUDIENCE MATCH' },
            { icon: Layers, label: 'ASSET LIBRARY' }
        ],
        outcome: '"Unlimited creative velocity without creative fatigue."',
    },
    {
        title: 'Autonomous Ad Deployment',
        function: 'A self-managing ad execution system across major platforms.',
        capabilities: [
            { icon: Rocket, label: 'AUTO-LAUNCH' },
            { icon: Shield, label: 'BUDGET GUARD' },
            { icon: Globe, label: 'CROSS-PLATFORM' },
            { icon: Cpu, label: 'PREDICTIVE BIDDING' }
        ],
        outcome: '"Spend flows to what works. Manual intervention disappears."',
    },
    {
        title: 'AI Ad Personalization Engine',
        function: 'Real-time personalization across ads and funnels.',
        capabilities: [
            { icon: Users, label: 'TAILORED MSGS' },
            { icon: MessageSquare, label: 'DYNAMIC COPY' },
            { icon: Target, label: 'MICRO-SEGMENTS' },
            { icon: Zap, label: 'REAL-TIME ADAPT' }
        ],
        outcome: '"Higher relevance, lower CPA, stronger unit economics."',
    },
    {
        title: 'Growth Intelligence Layer',
        function: 'The decision making brain of the Escalate system.',
        capabilities: [
            { icon: Brain, label: 'MARKET INTEL' },
            { icon: LineChart, label: 'FORECASTING' },
            { icon: Lightbulb, label: 'ACTIONABLE INSIGHTS' },
            { icon: Layers, label: 'SCALE STRATEGY' }
        ],
        outcome: '"Clear decisions backed by data, not guesswork."',
    },
    // Row 2
    {
        title: 'Brand Strategy & Positioning',
        function: 'AI-supported brand and messaging strategy aligned with growth goals.',
        capabilities: [
            { icon: MessageSquare, label: 'BRAND NARRATIVE' },
            { icon: Target, label: 'OFFER ALIGNMENT' },
            { icon: Paintbrush, label: 'CREATIVE DIRECTION' },
            { icon: Globe, label: 'MARKET POSITIONING' }
        ],
        outcome: '"Consistent, scalable brand execution across."',
    },
    {
        title: 'Governance & Control',
        function: 'Enterprise grade oversight and transparency.',
        capabilities: [
            { icon: Lock, label: 'FULL VISIBILITY' },
            { icon: Shield, label: 'SAFETY CONTROLS' },
            { icon: UserCheck, label: 'HUMAN OVERSIGHT' },
            { icon: Layers, label: 'COMPLIANCE' }
        ],
        outcome: '"Confidence, control, and trust at scale."',
    },
    {
        title: 'Strategic Advisory Access',
        function: 'Direct access to Escalate strategists for high level guidance.',
        capabilities: [
            { icon: Users, label: 'STRATEGIC REVIEWS' },
            { icon: Zap, label: 'OPTIMIZATION' },
            { icon: Target, label: 'GROWTH PLANNING' },
            { icon: Brain, label: 'EXPERT INSIGHTS' }
        ],
        outcome: '"You\'re never guessing — even as the system scales."',
    }
];

const Features: React.FC = () => {
    return (
        <section className="relative py-24 md:py-32 bg-[#141416] text-white overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />

            <div className="max-w-[1600px] mx-auto px-6 md:px-8 relative z-10">

                {/* Header */}
                <div className="mb-24 relative">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-[2px] w-12 bg-gold"></div>
                                <span className="text-gold text-xs font-bold tracking-[0.3em] uppercase">Own the Market</span>
                            </div>
                            <h2 className="text-6xl md:text-8xl font-serif font-black tracking-tighter text-white max-w-4xl leading-[0.9]">
                                Total Market <br />
                                <span className="italic text-white/80">Dominance.</span>
                            </h2>
                        </div>

                        {/* Logo on the right */}
                        <div className="hidden md:block pb-4">
                            <img src="/assets/logo.png" alt="Escalate AI" className="w-48 opacity-90 invert brightness-0 invert" />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.15 }}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            className="group h-full bg-[#1F1F22] rounded-[2rem] border border-white/10 flex flex-col hover:border-gold/30 hover:bg-[#252529] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden"
                        >
                            {/* Top Image Placeholder - Full Width */}
                            <div className="w-full aspect-[4/3] bg-[#1A1A1D] relative overflow-hidden group-hover:bg-[#222225] transition-colors duration-500 border-b border-white/5">
                                {/* Grid Pattern */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)`,
                                        backgroundSize: '24px 24px'
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1D] max-h-20 bottom-0 w-full group-hover:from-[#222225] transition-colors duration-500" />
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                {/* Title */}
                                <h3 className="text-2xl font-serif font-medium leading-tight mb-8 min-h-[3.5rem] text-white group-hover:text-gold transition-colors">
                                    {feature.title}
                                </h3>

                                {/* Function */}
                                <div className="mb-8 flex-grow">
                                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3">FUNCTION</p>
                                    <p className="text-[#A1A1AA] text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                                        {feature.function}
                                    </p>
                                </div>

                                {/* Capabilities */}
                                <div className="mb-10">
                                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3">CAPABILITIES</p>
                                    <div className="space-y-2">
                                        {feature.capabilities.map((cap, cIdx) => (
                                            <div key={cIdx} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                                                <cap.icon size={12} className="text-emerald-400 group-hover:text-gold transition-colors" />
                                                <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">{cap.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Outcome */}
                                <div className="mt-auto pt-6 border-t border-white/10 group-hover:border-white/20 transition-colors">
                                    <p className="text-[10px] font-bold text-gold tracking-widest uppercase mb-3">OUTCOME</p>
                                    <p className="text-white font-serif italic text-sm leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                                        {feature.outcome}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div >
        </section >
    );
};

export default Features;
