'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthContainer from '@/components/modals/auth/AuthContainer';
import ProfileDropdown from '@/components/ProfileDropdown';
import LogoutSuccessModal from '@/components/modals/LogoutSuccessModal';

const featuresItems = [
    {
        title: 'Growth AI Systems',
        description: 'Neural networks that scale your customer acquisition automatically',
        href: '#growth-ai',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=280&h=160&fit=crop'
    },
    {
        title: 'Creative Intelligence',
        description: 'AI-generated ads, creatives, and copy that convert',
        href: '#creative-ai',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=280&h=160&fit=crop'
    },
    {
        title: 'Conversion Infrastructure',
        description: 'Optimize every touchpoint with predictive analytics',
        href: '#conversion',
        image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=280&h=160&fit=crop'
    },
    {
        title: 'Personalization Engines',
        description: 'Hyper-personalized experiences at scale',
        href: '#personalization',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=280&h=160&fit=crop'
    },
];

const advertisingItems = [
    {
        title: 'Meta Ads Platform',
        description: 'Facebook & Instagram ad automation',
        href: '#meta-ads',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=280&h=160&fit=crop'
    },
    {
        title: 'Google Ads Suite',
        description: 'Search, Display & YouTube campaigns',
        href: '#google-ads',
        image: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=280&h=160&fit=crop'
    },
    {
        title: 'TikTok Amplifier',
        description: 'Viral content and ad optimization',
        href: '#tiktok-ads',
        image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=280&h=160&fit=crop'
    },
    {
        title: 'AI Models & Data',
        description: 'Proprietary ML models for targeting',
        href: '#ai-models',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=280&h=160&fit=crop'
    },
];

const supportItems = [
    { title: 'Contact Us', description: 'Get in touch with our team', href: '/contact' },
    { title: 'Careers', description: 'Join our growing team', href: '/careers' },
    { title: 'Our Team', description: 'Meet the people behind Escalate', href: '/team' },
    { title: 'Terms of Service', description: 'Legal & Policies', href: '#' },
];

interface NavbarProps {
    initiallyOpen?: boolean;
    initialView?: 'login' | 'register';
}

const Navbar: React.FC<NavbarProps> = ({ initiallyOpen = false, initialView = 'login' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isAuthOpen, setIsAuthOpen] = useState(initiallyOpen);
    const [authView, setAuthView] = useState<'login' | 'register'>(initialView);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        setIsLogoutModalOpen(true);
    };

    const lastScrollY = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (initiallyOpen) {
            setIsAuthOpen(true);
            setAuthView(initialView);
        }
    }, [initiallyOpen, initialView]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollThreshold = 100;

            if (currentScrollY < scrollThreshold) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current && currentScrollY > scrollThreshold) {
                setIsVisible(false);
                setActiveDropdown(null);
            } else if (currentScrollY < lastScrollY.current) {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMouseEnter = (dropdown: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setActiveDropdown(dropdown);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 150);
    };

    const toggleMobileDropdown = (name: string) => {
        setMobileDropdown(mobileDropdown === name ? null : name);
    };

    const closeMenu = () => {
        setIsOpen(false);
        setMobileDropdown(null);
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: isVisible ? 0 : -100,
                    opacity: isVisible ? 1 : 0
                }}
                transition={{
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                }}
                className="fixed top-4 left-4 right-4 md:left-8 md:right-8 lg:left-12 lg:right-12 z-[100]"
            >
                {/* Floating Glass Container - exact match */}
                <div
                    className="relative rounded-2xl"
                    style={{
                        background: 'rgba(20, 20, 22, 0.75)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    }}
                >
                    {/* Subtle gradient overlay for depth */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
                        }}
                    />

                    <div className="relative px-4 md:px-6 lg:px-8 py-3 md:py-4">
                        <div className="flex items-center justify-between">

                            {/* Logo */}
                            <Link href="#" className="relative z-10 flex items-center">
                                <Image
                                    src="/assets/logo.png"
                                    alt="Escalate"
                                    width={112}
                                    height={28}
                                    className="h-6 md:h-7 w-auto"
                                />
                            </Link>

                            {/* Center Nav Links - Desktop Only */}
                            <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">

                                {/* Features Dropdown */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => handleMouseEnter('features')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button className="flex items-center gap-1.5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200">
                                        Features
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'features' ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {activeDropdown === 'features' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                                            >
                                                <div className="rounded-2xl overflow-hidden bg-[#141416] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                                                    <div className="grid grid-cols-2 gap-4 p-6 w-[580px]">
                                                        {featuresItems.map((item) => (
                                                            <a
                                                                key={item.title}
                                                                href={item.href}
                                                                className="flex gap-3 group p-2 rounded-xl hover:bg-white/5 transition-colors"
                                                            >
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.title}
                                                                    className="w-[100px] h-[60px] object-cover rounded-lg flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                                                />
                                                                <div className="flex flex-col justify-center">
                                                                    <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                                                                        {item.title}
                                                                    </h4>
                                                                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Advertising Dropdown */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => handleMouseEnter('advertising')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button className="flex items-center gap-1.5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200">
                                        Advertising
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'advertising' ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {activeDropdown === 'advertising' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                                            >
                                                <div className="rounded-2xl overflow-hidden bg-[#141416] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                                                    <div className="grid grid-cols-2 gap-4 p-6 w-[580px]">
                                                        {advertisingItems.map((item) => (
                                                            <a
                                                                key={item.title}
                                                                href={item.href}
                                                                className="flex gap-3 group p-2 rounded-xl hover:bg-white/5 transition-colors"
                                                            >
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.title}
                                                                    className="w-[100px] h-[60px] object-cover rounded-lg flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                                                />
                                                                <div className="flex flex-col justify-center">
                                                                    <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                                                                        {item.title}
                                                                    </h4>
                                                                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Simple Links */}
                                <Link
                                    href="/consultants"
                                    className="py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
                                    onMouseEnter={() => setActiveDropdown(null)}
                                >
                                    Consultants
                                </Link>
                                <a
                                    href="#pricing"
                                    className="py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
                                    onMouseEnter={() => setActiveDropdown(null)}
                                >
                                    Pricing
                                </a>

                                {/* Support Dropdown */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => handleMouseEnter('support')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button className="flex items-center gap-1.5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200">
                                        Support
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'support' ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {activeDropdown === 'support' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                                            >
                                                <div className="rounded-2xl overflow-hidden bg-[#141416] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                                                    <div className="flex flex-col p-4 w-[220px]">
                                                        {supportItems.map((item) => (
                                                            <Link
                                                                key={item.title}
                                                                href={item.href}
                                                                className="flex flex-col group px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                                            >
                                                                <h4 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                                                                    {item.title}
                                                                </h4>
                                                                <p className="text-xs text-white/40 mt-0.5">
                                                                    {item.description}
                                                                </p>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right Section - Desktop Buttons */}
                            <div className="hidden lg:flex items-center gap-3">
                                {/* Buttons handled above */}
                                {user ? (
                                    <ProfileDropdown user={user} onSignOut={handleSignOut} />
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setAuthView('login');
                                                setIsAuthOpen(true);
                                            }}
                                            className="px-5 py-2.5 bg-white text-obsidian text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_4px_15px_rgba(255,255,255,0.2)]"
                                        >
                                            Console
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAuthView('register');
                                                setIsAuthOpen(true);
                                            }}
                                            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                                            style={{
                                                background: 'linear-gradient(135deg, #8C6F3D 0%, #C5A059 50%, #F2D29F 100%)',
                                                boxShadow: '0 4px 15px rgba(197, 160, 89, 0.3)',
                                            }}
                                        >
                                            <span className="text-sm font-semibold text-white">
                                                Get Started
                                            </span>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="lg:hidden relative z-10 w-10 h-10 flex items-center justify-center text-white hover:text-gold transition-colors"
                                aria-label="Menu"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="fixed inset-0 z-[99] lg:hidden overflow-y-auto"
                        style={{
                            background: 'linear-gradient(180deg, rgba(10, 10, 12, 0.99) 0%, rgba(8, 8, 10, 1) 100%)',
                        }}
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            onClick={closeMenu}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:text-gold hover:border-gold/30 transition-all"
                        >
                            <X size={20} />
                        </motion.button>

                        <div className="min-h-screen flex flex-col pt-20 pb-8 px-6">
                            <motion.div
                                className="flex-1 space-y-1"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
                                    hidden: {}
                                }}
                            >
                                {/* Features Accordion */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}
                                    className="border-b border-white/10"
                                >
                                    <button
                                        onClick={() => toggleMobileDropdown('features')}
                                        className="w-full flex items-center justify-between py-4 text-lg font-medium text-white"
                                    >
                                        <span>Features</span>
                                        <motion.div
                                            animate={{ rotate: mobileDropdown === 'features' ? 45 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Plus size={20} className="text-gold" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {mobileDropdown === 'features' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pb-4 space-y-3 pl-2">
                                                    {featuresItems.map((item) => (
                                                        <a
                                                            key={item.title}
                                                            href={item.href}
                                                            onClick={closeMenu}
                                                            className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors"
                                                        >
                                                            <img src={item.image} alt={item.title} className="w-14 h-10 object-cover rounded-md" />
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                                                                <p className="text-xs text-white/40">{item.description}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Advertising Accordion */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}
                                    className="border-b border-white/10"
                                >
                                    <button
                                        onClick={() => toggleMobileDropdown('advertising')}
                                        className="w-full flex items-center justify-between py-4 text-lg font-medium text-white"
                                    >
                                        <span>Advertising</span>
                                        <motion.div
                                            animate={{ rotate: mobileDropdown === 'advertising' ? 45 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Plus size={20} className="text-gold" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {mobileDropdown === 'advertising' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pb-4 space-y-3 pl-2">
                                                    {advertisingItems.map((item) => (
                                                        <a
                                                            key={item.title}
                                                            href={item.href}
                                                            onClick={closeMenu}
                                                            className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors"
                                                        >
                                                            <img src={item.image} alt={item.title} className="w-14 h-10 object-cover rounded-md" />
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                                                                <p className="text-xs text-white/40">{item.description}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Simple Links */}
                                <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}>
                                    <Link href="/consultants" onClick={closeMenu} className="block py-4 text-lg font-medium text-white border-b border-white/10 hover:text-gold transition-colors">
                                        Consultants
                                    </Link>
                                </motion.div>
                                <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}>
                                    <a href="#pricing" onClick={closeMenu} className="block py-4 text-lg font-medium text-white border-b border-white/10 hover:text-gold transition-colors">
                                        Pricing
                                    </a>
                                </motion.div>

                                {/* Support Accordion */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}
                                    className="border-b border-white/10"
                                >
                                    <button
                                        onClick={() => toggleMobileDropdown('support')}
                                        className="w-full flex items-center justify-between py-4 text-lg font-medium text-white"
                                    >
                                        <span>Support</span>
                                        <motion.div
                                            animate={{ rotate: mobileDropdown === 'support' ? 45 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Plus size={20} className="text-gold" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {mobileDropdown === 'support' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pb-4 space-y-2 pl-2">
                                                    {supportItems.map((item) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            onClick={closeMenu}
                                                            className="block py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
                                                        >
                                                            <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                                                            <p className="text-xs text-white/40">{item.description}</p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.div>

                            {/* Mobile CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                className="mt-8 space-y-3"
                            >
                                {user ? (
                                    <button
                                        onClick={() => {
                                            closeMenu();
                                            signOut();
                                        }}
                                        className="block w-full py-4 text-center bg-white/10 text-white font-semibold text-base rounded-xl hover:bg-white/20 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                closeMenu();
                                                setAuthView('login');
                                                setIsAuthOpen(true);
                                            }}
                                            className="block w-full py-4 text-center bg-white text-obsidian font-semibold text-base rounded-xl hover:bg-white/90 transition-colors"
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={() => {
                                                closeMenu();
                                                setAuthView('register');
                                                setIsAuthOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-2 w-full py-4 text-white font-semibold text-base rounded-xl"
                                            style={{
                                                background: 'linear-gradient(135deg, #8C6F3D 0%, #C5A059 50%, #F2D29F 100%)',
                                            }}
                                        >
                                            Get Started
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <LogoutSuccessModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />
            <AuthContainer
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onReopen={() => setIsAuthOpen(true)}
                initialView={authView}
            />
        </>
    );
};

export default Navbar;
