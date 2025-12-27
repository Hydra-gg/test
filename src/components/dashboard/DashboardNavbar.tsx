'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, HelpCircle, Sun, Moon, ChevronDown, Building2, ChevronRight, Settings, LogOut } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardNavbarProps {
    profile: Profile | null;
}

export default function DashboardNavbar({ profile }: DashboardNavbarProps) {
    const { isDark, toggleTheme } = useDashboardTheme();
    const { signOut } = useAuth();
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return (profile.first_name[0] + profile.last_name[0]).toUpperCase();
        }
        return 'US';
    };

    const tierLabel = profile?.subscription_tier?.toUpperCase() || 'FREE';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setShowDropdown(false);
        await signOut();
        setShowSuccessModal(true);
        setTimeout(() => {
            setShowSuccessModal(false);
            router.push('/');
        }, 2000);
    };

    return (
        <>
            <header className={`h-12 border-b flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-300
                ${isDark
                    ? 'bg-[#1a1a1a] border-white/5'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
            >
                {/* Left - Breadcrumb Navigation */}
                <nav className="flex items-center gap-1">
                    {/* Business Section */}
                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                        ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                    >
                        <span className="flex items-center justify-center w-4 h-4">
                            <Building2 size={14} className={`${isDark ? 'text-emerald-400' : 'text-gray-600'}`} />
                        </span>
                        <span className={`text-sm font-normal ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {profile?.business_name || 'Escalate'}
                        </span>
                        <span className={`flex items-center h-5 px-1.5 text-[10px] font-semibold rounded
                            ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}
                        >
                            {tierLabel}
                        </span>
                    </div>

                    {/* Separator */}
                    <ChevronRight size={14} className={`flex-shrink-0 ${isDark ? 'text-white/30' : 'text-gray-300'}`} />

                    {/* Campaign Section */}
                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                        ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                    >
                        <span className={`text-sm font-normal ${isDark ? 'text-white' : 'text-gray-700'}`}>
                            main
                        </span>
                        <span className={`flex items-center gap-1.5 h-5 px-1.5 text-[10px] font-semibold rounded
                            ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                        >
                            <span className="relative flex items-center justify-center w-2 h-2">
                                <span className={`absolute w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-emerald-400/50' : 'bg-emerald-500/40'}`}></span>
                                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                            </span>
                            ACTIVE
                        </span>
                    </div>
                </nav>

                {/* Right - Actions */}
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-1.5 rounded-md transition-colors
                            ${isDark
                                ? 'hover:bg-white/5 text-white/40 hover:text-white/60'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    {/* Search */}
                    <button className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                        ${isDark
                            ? 'bg-white/5 hover:bg-white/10 text-white/40'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                    >
                        <Search size={14} />
                        <span>Search...</span>
                        <span className={`text-[10px] border rounded px-1
                            ${isDark
                                ? 'text-white/30 border-white/10'
                                : 'text-gray-400 border-gray-300'
                            }`}
                        >
                            ⌘K
                        </span>
                    </button>

                    {/* Help */}
                    <button className={`p-1.5 rounded-md transition-colors
                        ${isDark
                            ? 'hover:bg-white/5 text-white/40 hover:text-white/60'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <HelpCircle size={16} />
                    </button>

                    {/* Notifications */}
                    <button className={`relative p-1.5 rounded-md transition-colors
                        ${isDark
                            ? 'hover:bg-white/5 text-white/40 hover:text-white/60'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Bell size={16} />
                    </button>

                    {/* Avatar with Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md hover:scale-105 transition-transform cursor-pointer"
                        >
                            {getInitials()}
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-xl z-50 ${isDark ? 'bg-[#252525] border border-white/10' : 'bg-white border border-gray-200'}`}>
                                <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {profile?.first_name} {profile?.last_name}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                        {profile?.business_name || 'My Business'}
                                    </p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            router.push('/dashboard/settings');
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-[#252525]' : 'bg-white'} shadow-2xl`}>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Signed Out Successfully</h3>
                        <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Redirecting to home page...</p>
                    </div>
                </div>
            )}
        </>
    );
}
