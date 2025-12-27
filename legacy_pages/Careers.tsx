import React from 'react';
import { ArrowUpRight, Brain, Globe, Code } from 'lucide-react';
import SectionDivider from '../src/components/SectionDivider';

const roles = [
    {
        title: "Senior AI Strategist",
        department: "Operations",
        location: "Zurich / Remote",
        type: "Full-time",
        icon: Brain
    },
    {
        title: "Full Stack Engineer",
        department: "Engineering",
        location: "London / Remote",
        type: "Full-time",
        icon: Code
    },
    {
        title: "Growth Architect",
        department: "Marketing",
        location: "New York / Remote",
        type: "Contract",
        icon: Globe
    }
];

const Careers: React.FC = () => {
    return (
        <div className="bg-obsidian min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 md:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div>
                        <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                            <span className="w-8 h-[1px] bg-gold-dark"></span> Join The Protocol <span className="w-8 h-[1px] bg-gold-dark"></span>
                        </h2>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-8 tracking-tighter">
                            Architect the <span className="text-gold italic">Future.</span>
                        </h1>
                        <p className="text-xl text-platinum/60 max-w-2xl mx-auto leading-relaxed">
                            We are recruiting elite talent to build the next generation of autonomous enterprise systems.
                        </p>
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* Roles */}
            <section className="py-20 px-6 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-4">
                        {roles.map((role, i) => (
                            <div
                                key={i}
                                className="group p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                                        <role.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gold transition-colors">{role.title}</h3>
                                        <p className="text-xs uppercase tracking-widest text-platinum/40 flex items-center gap-3">
                                            <span>{role.department}</span>
                                            <span className="w-1 h-1 rounded-full bg-gold/50" />
                                            <span>{role.location}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-platinum/40 border border-white/10 px-3 py-1 rounded-full">{role.type}</span>
                                    <ArrowUpRight size={20} className="text-white/40 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
