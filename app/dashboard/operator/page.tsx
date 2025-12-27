import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCampaigns } from '@/lib/api';
import { calculateCampaignROI, type ROIMetrics } from '@/lib/ai/roi-engine';
import { getTopPerformingCreatives } from '@/lib/ai/creative-analytics';
import { CampaignTable } from '@/components/dashboard/operator/CampaignTable';
import { CreativeGrid } from '@/components/dashboard/operator/CreativeGrid';
import { Layers, Zap } from 'lucide-react';

export const metadata = {
    title: 'Operator View | Escalate AI',
    description: 'Detailed campaign and creative performance analysis',
};

async function OperatorContent() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/?action=login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return (
            <div className="p-8 text-center">
                <p>Please complete your company profile setup.</p>
            </div>
        );
    }

    // 1. Fetch Data in Parallel
    const [campaigns, creatives] = await Promise.all([
        getCampaigns(profile.company_id, supabase),
        getTopPerformingCreatives(profile.company_id),
    ]);

    // 2. Calculate ROI for each campaign
    // In a real high-scale app, we would cache this or store materialized views
    const campaignMetricsPromises = campaigns.map(c => calculateCampaignROI(c.id));
    const campaignMetricsResults = await Promise.all(campaignMetricsPromises);

    // Filter out nulls and format
    const campaignData: ROIMetrics[] = campaignMetricsResults
        .filter((m): m is ROIMetrics => m !== null);

    return (
        <div className="space-y-8">
            {/* Header Stats could go here, but omitted for now to focus on deep dive */}

            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Campaign Performance</h2>
                </div>
                <CampaignTable data={campaignData} />
            </section>

            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-semibold text-white">Creative Insights</h2>
                </div>
                <CreativeGrid creatives={creatives} />
            </section>
        </div>
    );
}

export default function OperatorPage() {
    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Operator View
                </h1>
                <p className="text-gray-400 mt-2">
                    Granular analysis of campaigns and creative assets.
                </p>
            </header>

            <Suspense fallback={
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                </div>
            }>
                <OperatorContent />
            </Suspense>
        </div>
    );
}
