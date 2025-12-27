'use client';

import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter, Instagram, Mail, Sparkles } from 'lucide-react';
import SectionDivider from './SectionDivider';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-obsidian">
            <SectionDivider />

            <div className="pt-20 md:pt-32 pb-10 md:pb-16 max-w-[1600px] mx-auto px-6 md:px-8">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 mb-20 md:mb-32">

                    {/* Brand & Logo Section */}
                    <div className="lg:col-span-3 space-y-8">
                        <Link href="/" className="flex items-center gap-3 w-fit group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20 group-hover:shadow-gold/40 transition-shadow">
                                <Sparkles size={20} className="text-obsidian" />
                            </div>
                            <span className="text-xl font-serif font-bold text-white">
                                Escalate
                            </span>
                        </Link>

                        <p className="text-lg text-white/80 font-light leading-relaxed max-w-xs">
                            The world&apos;s first AI-native strategic protocol for elite enterprise scaling.
                        </p>

                        {/* Social Media */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            {[
                                { Icon: Linkedin, label: 'LinkedIn', href: '#' },
                                { Icon: Twitter, label: 'Twitter', href: '#' },
                                { Icon: Instagram, label: 'Instagram', href: '#' },
                                { Icon: Mail, label: 'Contact', href: '/contact' }
                            ].map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="group flex items-center justify-center p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/30 transition-all duration-300"
                                    aria-label={item.label}
                                >
                                    <item.Icon size={18} className="text-white group-hover:text-gold transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">

                        {/* Platform */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-serif text-gold">Platform</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Growth Engine</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">AI Creative & Ads</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Conversion Systems</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Personalization Layer</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Analytics & Reporting</a></li>
                            </ul>
                        </div>

                        {/* Solutions */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-serif text-gold">Solutions</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Growth for Scaling Companies</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Paid Media Management</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Funnel & Website Optimization</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">AI-Powered Personalization</a></li>
                            </ul>
                        </div>

                        {/* How It Works */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-serif text-gold">How It Works</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Our Process</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">AI + Human Execution</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Governance & Control</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-serif text-gold">Company</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="text-sm text-white hover:text-gold transition-colors">About Escalate</a></li>
                                <li><Link href="/team" className="text-sm text-white hover:text-gold transition-colors">Our Team</Link></li>
                                <li><Link href="/careers" className="text-sm text-white hover:text-gold transition-colors">Careers</Link></li>
                            </ul>
                        </div>

                    </div>
                </div>

                <SectionDivider />

                <div className="pt-10 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-4 opacity-50">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                            <Sparkles size={12} className="text-obsidian" />
                        </div>
                    </div>
                    <p className="text-sm md:text-base text-white font-medium tracking-wide">
                        © {currentYear} Escalate AI Inc. | All System Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
