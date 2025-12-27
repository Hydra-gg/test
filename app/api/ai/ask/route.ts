/**
 * AI Q&A API
 * POST /api/ai/ask - Ask questions about ad performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    calculateCompanyROI,
    calculateTrends,
    generateRecommendations,
    answerQuestion,
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
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated' }, { status: 400 });
        }

        const body = await request.json();
        const { question } = body;

        if (!question || typeof question !== 'string') {
            return NextResponse.json({ error: 'Question required' }, { status: 400 });
        }

        if (question.length > 500) {
            return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 });
        }

        // Gather context
        const [campaigns, trends, recommendations] = await Promise.all([
            calculateCompanyROI(profile.company_id),
            calculateTrends(profile.company_id, 30),
            generateRecommendations(profile.company_id),
        ]);

        // Answer the question
        const answer = await answerQuestion(question, {
            campaigns,
            trends,
            recommendations,
        });

        // Log the question (for analytics)
        await supabase.from('audit_logs').insert({
            company_id: profile.company_id,
            user_id: user.id,
            action: 'ai_question_asked',
            entity_type: 'ai_qa',
            details: { question: question.substring(0, 100) },
        });

        return NextResponse.json({
            question,
            answer,
            context: {
                campaignCount: campaigns.length,
                trendPeriod: trends.period,
            },
        });
    } catch (error) {
        console.error('Error processing question:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
