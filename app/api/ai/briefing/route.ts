/**
 * AI Briefing API
 * POST /api/ai/briefing - Generate executive briefing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    calculateCompanyROI,
    calculateTrends,
    detectAnomalies,
    generateRecommendations,
    generateExecutiveBriefing,
} from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated' }, { status: 400 });
        }

        // Gather all data needed for briefing
        const [campaigns, trends, anomalies, recommendations] = await Promise.all([
            calculateCompanyROI(profile.company_id),
            calculateTrends(profile.company_id, 30),
            detectAnomalies(profile.company_id),
            generateRecommendations(profile.company_id),
        ]);

        // Generate executive briefing
        const briefing = await generateExecutiveBriefing(
            profile.company_id,
            campaigns,
            trends,
            anomalies,
            recommendations
        );

        if (!briefing) {
            return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            company_id: profile.company_id,
            user_id: user.id,
            action: 'briefing_generated',
            entity_type: 'ai_briefing',
        });

        return NextResponse.json({
            briefing,
            stats: {
                campaignCount: campaigns.length,
                anomalyCount: anomalies.length,
                recommendationCount: recommendations.length,
            },
        });
    } catch (error) {
        console.error('Error generating briefing:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
