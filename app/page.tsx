'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SectionDivider from '@/components/SectionDivider';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import CTASection from '@/components/CTASection';
import CustomScrollbar from '@/components/CustomScrollbar';

import { Suspense } from 'react';

function HomeContent() {
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { isPremium, loading: profileLoading } = useProfile();

    // Check for auth action params
    const authAction = searchParams.get('action');
    const shouldOpenAuth = authAction === 'login' || authAction === 'register';
    const initialAuthView = authAction === 'register' ? 'register' : 'login';

    useEffect(() => {
        // Simulate loading/preloader delay
        const timer = setTimeout(() => setIsLoaded(true), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Redirect logged-in premium users to dashboard
        if (!authLoading && !profileLoading && user && isPremium) {
            router.push('/dashboard');
        }
    }, [user, isPremium, authLoading, profileLoading, router]);

    // Show loading while checking auth
    if (authLoading || profileLoading) {
        return (
            <main className="min-h-screen bg-obsidian flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
            </main>
        );
    }

    // If user is logged in and premium, they'll be redirected (show loading)
    if (user && isPremium) {
        return (
            <main className="min-h-screen bg-obsidian flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-obsidian">
            <CustomScrollbar visible={isLoaded} />
            <Navbar
                initiallyOpen={shouldOpenAuth}
                initialView={initialAuthView}
            />
            <Hero />
            <SectionDivider />
            <Features />
            <SectionDivider />
            <HowItWorks />
            <SectionDivider />
            <Pricing />
            <SectionDivider />
            <CTASection />
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-obsidian flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
            </main>
        }>
            <HomeContent />
        </Suspense>
    );
}
