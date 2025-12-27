import React from 'react';
import { Linkedin, Twitter } from 'lucide-react';
import SectionDivider from '../src/components/SectionDivider';

const team = [
    {
        name: "David Chen",
        role: "Founder & CEO",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
    },
    {
        name: "Elena Rodriguez",
        role: "Chief Product Officer",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop",
    },
    {
        name: "James Wilson",
        role: "CTO",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    },
    {
        name: "Sarah Kim",
        role: "Head of Operations",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop",
    }
];

const Team: React.FC = () => {
    return (
        <div className="bg-obsidian min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 md:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div>
                        <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                            <span className="w-8 h-[1px] bg-gold-dark"></span> Visionaries <span className="w-8 h-[1px] bg-gold-dark"></span>
                        </h2>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-8 tracking-tighter">
                            Meet the <span className="text-gold italic">Architects.</span>
                        </h1>
                        <p className="text-xl text-platinum/60 max-w-2xl mx-auto leading-relaxed">
                            The minds building the operating system for global commerce.
                        </p>
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* Team Grid */}
            <section className="py-20 px-6 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, i) => (
                            <div
                                key={i}
                                className="group relative"
                            >
                                <div className="relative overflow-hidden rounded-2xl mb-6 aspect-[4/5]">
                                    <div className="absolute inset-0 bg-gold/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent z-20" />
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                    />

                                    {/* Socials overlay */}
                                    <div className="absolute bottom-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        <button className="w-8 h-8 rounded-full bg-white text-obsidian flex items-center justify-center hover:bg-gold transition-colors">
                                            <Linkedin size={14} />
                                        </button>
                                        <button className="w-8 h-8 rounded-full bg-white text-obsidian flex items-center justify-center hover:bg-gold transition-colors">
                                            <Twitter size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold transition-colors">{member.name}</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-platinum/40">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Team;
