import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Phone, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface ProfileDropdownProps {
    user: any; // Using any for now as AuthContext type wasn't fully visible, but likely has email/name
    onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, subscription_tier')
                    .eq('id', user.id)
                    .single();

                if (data) setProfile(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        };

        fetchProfile();
    }, [user]);

    // Dynamic Initials Logic
    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return (profile.first_name[0] + profile.last_name[0]).toUpperCase();
        }

        // Fallback to metadata
        if (!user) return '??';
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        if (fullName) {
            const parts = fullName.trim().split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return fullName.substring(0, 2).toUpperCase();
        }
        if (user.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'US';
    };

    const initials = getInitials();
    const firstName = profile?.first_name || (user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'User');
    const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'agency';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Premium Rectangular Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-3 p-1.5 pr-6 rounded-xl bg-[#1A1A1C]/90 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(197,160,89,0.15)] backdrop-blur-xl"
            >
                {/* Avatar Rectangle - Premium Effect */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C6F3D] to-[#C5A059] flex items-center justify-center shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-500 border border-[#F2D29F]/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <span className="relative z-10 text-xs font-bold text-white tracking-wider font-sans">
                        {initials}
                    </span>
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium group-hover:text-gold/80 transition-colors">Good Morning</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">
                            {firstName}
                        </span>
                        <span className="bg-gradient-to-r from-gold/20 to-gold/10 text-gold text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-gold/20 shadow-[0_2px_8px_rgba(197,160,89,0.2)]">PRO</span>
                    </div>
                </div>

                <ChevronDown
                    size={14}
                    className={`ml-2 text-white/40 transition-transform duration-300 group-hover:text-gold ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="absolute top-full right-0 mt-2 w-80 p-2 rounded-2xl bg-[#0F0F11]/95 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 overflow-hidden ring-1 ring-white/5"
                    >
                        {/* Business Dashboard */}
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-sm font-medium text-white/80 hover:text-white transition-colors group relative overflow-hidden"
                            onClick={() => setIsOpen(false)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/5 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-gold/10 text-white/60 group-hover:text-gold transition-colors relative z-10">
                                <LayoutDashboard size={16} />
                            </div>
                            <span className="relative z-10">Business Dashboard</span>
                        </Link>

                        {/* Contact Support */}
                        <button
                            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 text-sm font-medium text-white/80 hover:text-white transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/10 text-white/60 group-hover:text-blue-400 transition-colors">
                                    <Phone size={16} />
                                </div>
                                Contact Support
                            </div>
                        </button>

                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1.5" />

                        {/* Sign Out */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onSignOut();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-sm font-medium text-white/80 hover:text-red-400 transition-colors group"
                        >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/10 text-white/60 group-hover:text-red-400 transition-colors">
                                <LogOut size={16} />
                            </div>
                            Sign Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDropdown;
