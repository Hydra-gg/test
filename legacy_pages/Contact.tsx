import React, { useState } from 'react';
import { Mail, MapPin, Send, MessageSquare } from 'lucide-react';
import SectionDivider from '../src/components/SectionDivider';

const Contact: React.FC = () => {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitted:', formState);
    };

    return (
        <div className="bg-obsidian min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 md:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div>
                        <h2 className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center justify-center gap-4">
                            <span className="w-8 h-[1px] bg-gold-dark"></span> Secure Channel <span className="w-8 h-[1px] bg-gold-dark"></span>
                        </h2>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-8 tracking-tighter">
                            Contact <span className="text-gold italic">Node.</span>
                        </h1>
                        <p className="text-xl text-platinum/60 max-w-2xl mx-auto leading-relaxed">
                            Establish a direct line to Escalate command.
                        </p>
                    </div>
                </div>
            </section>

            <SectionDivider />

            <section className="py-20 px-6 md:px-8">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-24">

                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-6">Global Coordinates</h3>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Headquarters</h4>
                                        <p className="text-platinum/60 text-sm leading-relaxed">
                                            Bahnhofstrasse 10<br />
                                            8001 Zurich, Switzerland
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Encryption Key</h4>
                                        <p className="text-platinum/60 text-sm">
                                            secure@escalate.ai
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
                            <h4 className="text-gold font-bold mb-2 flex items-center gap-2">
                                <MessageSquare size={16} /> Priority Access
                            </h4>
                            <p className="text-sm text-platinum/60 leading-relaxed mb-4">
                                Typical response time for vetted inquiries is under 4 hours.
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-platinum/40 font-bold">Identity</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-gold/50 focus:bg-white/10 transition-all font-sans"
                                    placeholder="Full Name"
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-platinum/40 font-bold">Frequency</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-gold/50 focus:bg-white/10 transition-all font-sans"
                                    placeholder="Email Address"
                                    value={formState.email}
                                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-platinum/40 font-bold">Transmission</label>
                                <textarea
                                    rows={5}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-gold/50 focus:bg-white/10 transition-all font-sans resize-none"
                                    placeholder="Message Protocol..."
                                    value={formState.message}
                                    onChange={e => setFormState({ ...formState, message: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-gold text-obsidian font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 group"
                            >
                                Transmit
                                <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Contact;
