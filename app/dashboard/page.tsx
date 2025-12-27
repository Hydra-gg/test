import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    calculateCompanyROI,
    calculateTrends,
    detectAnomalies,
    generateRecommendations,
    generateExecutiveBriefing,
    approveRecommendation,
    rejectRecommendation,
    Recommendation
} from '@/lib/ai';

// Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICards } from '@/components/dashboard/KPICards';
import { ExecutiveBriefingView } from '@/components/dashboard/ExecutiveBriefing';
import { RecommendationQueue } from '@/components/dashboard/RecommendationQueue';
import { AnomalyAlerts } from '@/components/dashboard/AnomalyAlerts';

export const dynamic = 'force-dynamic';

// ... imports
import { startOfDay, subDays } from 'date-fns';

export default async function DashboardPage(props: { searchParams: Promise<{ from?: string; to?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createServerSupabaseClient();

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/?action=login');

    // Get Company Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role, full_name, email, avatar_url')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-400">
                No company profile associated with this account.
            </div>
        );
    }

    const companyId = profile.company_id;

    // Parse Date Range
    let dateRange = undefined;
    if (searchParams.from && searchParams.to) {
        dateRange = {
            startDate: startOfDay(new Date(searchParams.from)),
            endDate: new Date(searchParams.to) // Assuming 'to' is inclusive or end of day handled in API
        };
        // Fix end of day for 'to' if it's just a date string date
        dateRange.endDate.setHours(23, 59, 59, 999);
    }

    // Default to last 30 days for calculations if not specified
    const effectiveRange = dateRange || {
        startDate: subDays(new Date(), 30),
        endDate: new Date()
    };

    // Fetch AI Data
    // We pass dateRange to calculateCompanyROI
    const campaigns = await calculateCompanyROI(companyId, dateRange);

    // Trends usually needs a fixed lookback or same range. passing range option logic if supported, 
    // but calculateTrends currently takes 'days'. We'll adjust or leave as 30 for now if API not updated.
    // Actually, trends chart usually wants to match the view.
    // For MVP, limiting trends to 30 days is acceptable, or I should update calculateTrends too.
    const trends = await calculateTrends(companyId, 30);

    const anomalies = await detectAnomalies(companyId);
    const recommendations = await generateRecommendations(companyId);

    // Briefing is expensive, so it caches internally
    // We pass data to avoid re-fetching inside the function if possible, but the function handles it
    const briefing = await generateExecutiveBriefing(companyId, campaigns, trends, anomalies, recommendations);

    // Calculate aggregated metrics for KPICards
    const metrics = {
        totalSpend: campaigns.reduce((acc, c) => acc + c.totalSpend, 0),
        totalRevenue: campaigns.reduce((acc, c) => acc + c.totalRevenue, 0),
        roas: campaigns.reduce((acc, c) => acc + c.totalRevenue, 0) / Math.max(1, campaigns.reduce((acc, c) => acc + c.totalSpend, 0)),
        activeAnomalies: anomalies.length,
    };

    // Server Action for Recommendations
    async function handleRecommendationAction(id: string, action: 'approve' | 'reject', reason?: string) {
        'use server';

        // Re-verify auth inside server action
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (action === 'approve') {
            await approveRecommendation(id, user.id);
        } else {
            await rejectRecommendation(id, user.id, reason);
        }
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
            <Suspense fallback={<div className="h-16 bg-[#0A0A0A] border-b border-[#ffffff10]" />}>
                <DashboardHeader
                    user={{
                        name: profile.full_name || 'User',
                        email: profile.email || '',
                        role: profile.role || 'Member',
                        avatar_url: profile.avatar_url || ''
                    }}
                    companyName="Escalate Corp" // Fetch real name if needed
                />
            </Suspense>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 1. Anomaly Alerts (Critical Only) */}
                <AnomalyAlerts anomalies={anomalies} />

                {/* 2. KPI Cards */}
                <KPICards metrics={metrics} trends={trends} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 3. Executive Briefing (2/3 width) */}
                    <div className="lg:col-span-2">
                        <ExecutiveBriefingView briefing={briefing} />

                        {/* Secondary metrics or chart area could go here */}
                    </div>

                    {/* 4. Action Queue (1/3 width) */}
                    <div>
                        <RecommendationQueue
                            recommendations={recommendations}
                            onAction={handleRecommendationAction}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
