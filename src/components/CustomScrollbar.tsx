'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomScrollbarProps {
    visible: boolean;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ visible }) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showScrollbar, setShowScrollbar] = useState(false);

    // Calculate scroll metrics
    const updateScrollMetrics = useCallback(() => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const totalScrollableHeight = scrollHeight - clientHeight;

        if (totalScrollableHeight > 0) {
            const progress = (scrollTop / totalScrollableHeight) * 100;
            setScrollProgress(progress);

            // Calculate thumb height based on viewport ratio
            const viewportRatio = clientHeight / scrollHeight;
            const minThumbHeight = 40;
            const trackHeight = clientHeight - 80;
            const calculatedThumbHeight = Math.max(minThumbHeight, viewportRatio * trackHeight);
            setThumbHeight(calculatedThumbHeight);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => setShowScrollbar(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowScrollbar(false);
        }
    }, [visible]);

    useEffect(() => {
        let rafId: number | null = null;

        const throttledUpdate = () => {
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    updateScrollMetrics();
                    rafId = null;
                });
            }
        };

        updateScrollMetrics();
        window.addEventListener('scroll', throttledUpdate, { passive: true });
        window.addEventListener('resize', updateScrollMetrics, { passive: true });

        return () => {
            window.removeEventListener('scroll', throttledUpdate);
            window.removeEventListener('resize', updateScrollMetrics);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [updateScrollMetrics]);

    // Handle clicking on track to jump to position
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const track = e.currentTarget;
        const rect = track.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const trackHeight = rect.height;
        const clickProgress = (clickY / trackHeight) * 100;

        const { scrollHeight, clientHeight } = document.documentElement;
        const totalScrollableHeight = scrollHeight - clientHeight;
        const newScrollTop = (clickProgress / 100) * totalScrollableHeight;

        window.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
        });
    };

    // Handle drag scrolling
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const trackElement = document.getElementById('custom-scrollbar-track');
            if (!trackElement) return;

            const rect = trackElement.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            const trackHeight = rect.height;
            const dragProgress = Math.max(0, Math.min(100, (mouseY / trackHeight) * 100));

            const { scrollHeight, clientHeight } = document.documentElement;
            const totalScrollableHeight = scrollHeight - clientHeight;
            const newScrollTop = (dragProgress / 100) * totalScrollableHeight;

            window.scrollTo({
                top: newScrollTop,
                behavior: 'auto'
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging]);

    // Calculate thumb position
    const trackHeight = typeof window !== 'undefined' ? window.innerHeight - 80 : 0;
    const maxThumbOffset = trackHeight - thumbHeight;
    const thumbOffset = (scrollProgress / 100) * maxThumbOffset;

    return (
        <AnimatePresence>
            {showScrollbar && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed right-0.5 top-10 bottom-10 z-[9998] flex items-center"
                    style={{ pointerEvents: 'auto', willChange: 'transform' }}
                >
                    {/* Fully transparent track */}
                    <div
                        id="custom-scrollbar-track"
                        className="relative h-full w-1 rounded-full cursor-pointer transition-all duration-300"
                        style={{
                            background: 'transparent',
                            willChange: 'transform',
                        }}
                        onClick={handleTrackClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Scrollbar thumb - bright gold */}
                        <motion.div
                            className="absolute left-0 right-0 rounded-full cursor-grab active:cursor-grabbing"
                            style={{
                                top: thumbOffset,
                                height: thumbHeight,
                                background: isDragging
                                    ? 'linear-gradient(180deg, #FFE5A0 0%, #FFD700 50%, #F2D29F 100%)'
                                    : isHovered
                                        ? 'linear-gradient(180deg, #FFD700 0%, #F2D29F 50%, #C5A059 100%)'
                                        : 'linear-gradient(180deg, #F2D29F 0%, #D4AF37 50%, #C5A059 100%)',
                                willChange: 'transform, top',
                                transform: 'translateZ(0)',
                            }}
                            onMouseDown={handleMouseDown}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CustomScrollbar;
