/**
 * AI Recommendations API
 * POST /api/ai/recommendations - Generate new recommendations
 * GET /api/ai/recommendations - Get pending recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    generateRecommendations,
    saveRecommendations,
    getPendingRecommendations,
    approveRecommendation,
    rejectRecommendation,
} from '@/lib/ai';

// GET: Fetch pending recommendations
export async function GET(request: NextRequest) {
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
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated' }, { status: 400 });
        }

        const recommendations = await getPendingRecommendations(profile.company_id);
        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Generate new recommendations or approve/reject
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

        const body = await request.json();
        const { action, recommendationId, reason } = body;

        // Handle approve/reject actions
        if (action === 'approve') {
            if (!recommendationId) {
                return NextResponse.json({ error: 'Recommendation ID required' }, { status: 400 });
            }

            // Only CEO or approved roles can approve
            if (profile.role !== 'ceo' && profile.role !== 'operator') {
                return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
            }

            const success = await approveRecommendation(recommendationId, user.id);
            if (!success) {
                return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
            }

            // Log audit
            await supabase.from('audit_logs').insert({
                company_id: profile.company_id,
                user_id: user.id,
                action: 'recommendation_approved',
                entity_type: 'ai_recommendation',
                entity_id: recommendationId,
            });

            return NextResponse.json({ success: true, action: 'approved' });
        }

        if (action === 'reject') {
            if (!recommendationId) {
                return NextResponse.json({ error: 'Recommendation ID required' }, { status: 400 });
            }

            const success = await rejectRecommendation(recommendationId, user.id, reason);
            if (!success) {
                return NextResponse.json({ error: 'Failed to reject' }, { status: 500 });
            }

            await supabase.from('audit_logs').insert({
                company_id: profile.company_id,
                user_id: user.id,
                action: 'recommendation_rejected',
                entity_type: 'ai_recommendation',
                entity_id: recommendationId,
                details: { reason },
            });

            return NextResponse.json({ success: true, action: 'rejected' });
        }

        // Generate new recommendations
        if (action === 'generate') {
            const recommendations = await generateRecommendations(profile.company_id);
            await saveRecommendations(profile.company_id, recommendations);

            await supabase.from('audit_logs').insert({
                company_id: profile.company_id,
                user_id: user.id,
                action: 'recommendations_generated',
                entity_type: 'ai_recommendation',
                details: { count: recommendations.length },
            });

            return NextResponse.json({
                success: true,
                count: recommendations.length,
                recommendations,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing recommendation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
