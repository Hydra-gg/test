'use client';

import React from 'react';
import { motion } from 'framer-motion';

const CTASection: React.FC = () => {
    return (
        <section className="relative py-24 md:py-32 bg-obsidian overflow-hidden">
            {/* Subtle ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
                {/* Giant Text */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <h2
                        className="font-serif font-black italic leading-[0.9] tracking-tighter"
                        style={{
                            fontSize: 'clamp(4rem, 15vw, 14rem)',
                            background: 'linear-gradient(90deg, #8C6F3D 0%, #C5A059 20%, #F2D29F 50%, #C5A059 80%, #8C6F3D 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Dominate
                    </h2>
                    <h2
                        className="font-serif font-black italic leading-[0.9] tracking-tighter -mt-2 md:-mt-4"
                        style={{
                            fontSize: 'clamp(4rem, 15vw, 14rem)',
                            background: 'linear-gradient(90deg, #8C6F3D 0%, #C5A059 20%, #F2D29F 50%, #C5A059 80%, #8C6F3D 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Your Era.
                    </h2>
                </motion.div>

            </div>
        </section>
    );
};

export default CTASection;
