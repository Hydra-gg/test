/**
 * N8N Webhook Receiver
 * Endpoint for N8N workflows to report execution status back to the platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recommendationId, status, output, error } = body;

        // Basic Validation
        if (!recommendationId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Authentication Check
        // N8N should send a secret key in headers
        const authHeader = request.headers.get('x-webhook-secret');
        if (authHeader !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();
        const timestamp = new Date().toISOString();

        // Update Recommendation Status
        if (status === 'success') {
            await supabase
                .from('ai_recommendations')
                .update({
                    status: 'executed',
                    executed_at: timestamp,
                    execution_result: output || { success: true },
                })
                .eq('id', recommendationId);
        } else {
            await supabase
                .from('ai_recommendations')
                .update({
                    status: 'failed',
                    // Don't overwrite executed_at if it's a failure? Or maybe do to show attempted run.
                    // Let's store error in metadata or execution_result
                    execution_result: { error: error || 'Unknown error', failed_at: timestamp },
                })
                .eq('id', recommendationId);
        }

        // Log Audit Entry
        // Since this is a system webhook, we don't have a user_id easily unless passed.
        // We'll use a system identifier or null
        await supabase.from('audit_logs').insert({
            action: status === 'success' ? 'recommendation_executed_remote' : 'recommendation_failed_remote',
            entity_type: 'ai_recommendation',
            entity_id: recommendationId,
            details: { source: 'n8n', status, error },
            created_at: timestamp
        });

        return NextResponse.json({ received: true });

    } catch (err) {
        console.error('Webhook processing failed:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
