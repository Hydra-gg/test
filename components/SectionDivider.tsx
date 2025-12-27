'use client';

import React from 'react';

const SectionDivider: React.FC = () => {
    return (
        <div className="relative w-full">
            {/* Golden gradient line */}
            <div
                className="w-full h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, #5a4a2d 15%, #8C6F3D 30%, #C5A059 50%, #8C6F3D 70%, #5a4a2d 85%, transparent 100%)',
                }}
            />
            {/* Subtle glow effect */}
            <div
                className="absolute inset-0 w-full h-px top-1/2 -translate-y-1/2 blur-sm opacity-50"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, #C5A059 30%, #F2D29F 50%, #C5A059 70%, transparent 100%)',
                }}
            />
        </div>
    );
};

export default SectionDivider;

