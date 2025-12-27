import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import SectionDivider from '../src/components/SectionDivider';

const consultants = [
    {
        name: "Alexander V.",
        role: "Senior Strategy Director",
        specialty: "Enterprise Scaling",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
        desc: "Former VP at Fortune 500. Specializes in rapid market expansion protocols."
    },
    {
        name: "Sarah Jenkins",
        role: "AI Implementation Lead",
        specialty: "Neural Architectures",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
        desc: "Architected AI systems for 3 unicorns. Expert in LLM integration."
    },
    {
        name: "Marcus Thorne",
        role: "Growth Engineer",
        specialty: "Viral Loops",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
        desc: "The mind behind 40M+ active user campaigns. Engineering viral coefficients."
    }
];

interface ConsultantsProps {
    onOpenBriefing: () => void;
}

const Consultants: React.FC<ConsultantsProps> = ({ onOpenBriefing }) => {
    return (
        <div className="bg-obsidian min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 md:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.1),transparent_50%)]" />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div>
                        <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                            <span className="w-8 h-[1px] bg-gold-dark"></span> Elite Network <span className="w-8 h-[1px] bg-gold-dark"></span>
                        </h2>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-8 tracking-tighter">
                            Deploy <span className="text-gold italic">Intelligence.</span>
                        </h1>
                        <p className="text-xl text-platinum/60 max-w-2xl mx-auto leading-relaxed">
                            Access a curated network of world-class strategists, engineers, and growth architects ready to execute the Escalate protocol.
                        </p>
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* Consultants Grid */}
            <section className="py-20 px-6 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {consultants.map((consultant, i) => (
                            <div
                                key={i}
                                className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent hover:from-gold/50 transition-all duration-500"
                            >
                                <div className="absolute inset-0 bg-gold/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative h-full bg-[#0A0A0B] rounded-xl overflow-hidden p-6 border border-white/5 group-hover:border-gold/30 transition-colors">
                                    <div className="mb-6 overflow-hidden rounded-lg aspect-square">
                                        <img
                                            src={consultant.image}
                                            alt={consultant.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-2xl font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{consultant.name}</h3>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gold/80">{consultant.role}</p>
                                        </div>

                                        <p className="text-sm text-platinum/60 leading-relaxed">
                                            {consultant.desc}
                                        </p>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-xs text-white/40 flex items-center gap-2">
                                                <Zap size={12} className="text-gold" /> {consultant.specialty}
                                            </span>
                                            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-gold group-hover:text-obsidian transition-all">
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* CTA */}
            <section className="py-32 px-6 md:px-8 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-white mb-8">
                        Ready to <span className="text-gold">Escalate?</span>
                    </h2>
                    <p className="text-platinum/60 mb-12">
                        Schedule a briefing with a senior director today.
                    </p>
                    <button onClick={onOpenBriefing} className="px-8 py-4 bg-gold text-obsidian font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-colors">
                        Request Briefing
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Consultants;
