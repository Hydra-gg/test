'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { DashboardThemeProvider, useDashboardTheme } from '@/contexts/DashboardThemeContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading, isPremium } = useProfile();
    const { isDark } = useDashboardTheme();

    const isLoading = authLoading || profileLoading;

    // Hide noise overlay on dashboard
    useEffect(() => {
        document.body.classList.add('no-noise');
        return () => {
            document.body.classList.remove('no-noise');
        };
    }, []);

    useEffect(() => {
        if (isLoading) return;

        // Redirect to home if not authenticated
        if (!user) {
            router.push('/');
            return;
        }

        // Redirect to paywall if not premium
        if (!isPremium) {
            router.push('/paywall');
            return;
        }
    }, [user, isPremium, isLoading, router]);

    // Show loading state while checking auth/subscription or redirecting
    if (isLoading || !user || !isPremium) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
            >
                <div className="flex flex-col items-center gap-4">
                    {/* Spinner */}
                    <div className="relative w-10 h-10">
                        <div className={`absolute inset-0 border-2 rounded-full
                            ${isDark ? 'border-white/10' : 'border-gray-200'}`}
                        />
                        <div className="absolute inset-0 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                    <span className={`text-sm transition-colors duration-300
                        ${isDark ? 'text-white/50' : 'text-gray-500'}`}
                    >
                        Loading dashboard...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex transition-colors duration-300
            ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
        >
            {/* Sidebar */}
            <DashboardSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col ml-56">
                {/* Navbar */}
                <DashboardNavbar profile={profile} />

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardThemeProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </DashboardThemeProvider>
    );
}

