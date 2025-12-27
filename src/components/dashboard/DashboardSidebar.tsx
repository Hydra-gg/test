'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, Users, Puzzle, BarChart3, CreditCard, Settings, PanelLeftClose } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';

const navItems = [
    { label: 'Projects', href: '/dashboard', icon: FolderKanban },
    { label: 'Team', href: '/dashboard/team', icon: Users },
    { label: 'Integrations', href: '/dashboard/integrations', icon: Puzzle },
    { label: 'Usage', href: '/dashboard/usage', icon: BarChart3 },
    { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { label: 'Organization settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar() {
    const pathname = usePathname();
    const { profile } = useProfile();
    const { isDark } = useDashboardTheme();

    const tierLabel = profile?.subscription_tier?.toUpperCase() || 'FREE';

    return (
        <aside className={`fixed left-0 top-0 h-screen w-56 border-r flex flex-col z-40 transition-colors duration-300
            ${isDark
                ? 'bg-[#1a1a1a] border-white/5'
                : 'bg-white border-gray-200'
            }`}
        >
            {/* Logo Header */}
            <div className="px-4 py-3">
                <Image
                    src="/assets/logo.png"
                    alt="Escalate AI"
                    width={480}
                    height={480}
                    className={`rounded transition-all duration-300 ${!isDark ? 'brightness-0' : ''}`}
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-2 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                                ${isDark
                                    ? isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    : isActive
                                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }
                            `}
                        >
                            <item.icon
                                size={16}
                                className={`transition-colors duration-200
                                    ${isDark
                                        ? isActive ? 'text-white' : 'text-white/40'
                                        : isActive ? 'text-emerald-600' : 'text-gray-500'
                                    }`}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom - Collapse */}
            <div className={`px-2 py-3 border-t transition-colors duration-300
                ${isDark ? 'border-white/5' : 'border-gray-200'}`}
            >
                <button className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors
                    ${isDark
                        ? 'text-white/40 hover:text-white/60 hover:bg-white/5'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <PanelLeftClose size={16} />
                </button>
            </div>
        </aside>
    );
}

