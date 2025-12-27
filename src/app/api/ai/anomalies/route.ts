/**
 * AI Anomalies API
 * GET /api/ai/anomalies - Get current anomalies
 * POST /api/ai/anomalies - Scan for new anomalies or acknowledge/resolve
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    detectAnomalies,
    saveAnomalies,
    getUnresolvedAnomalies,
    acknowledgeAnomaly,
    resolveAnomaly,
} from '@/lib/ai';

// GET: Fetch unresolved anomalies
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

        const anomalies = await getUnresolvedAnomalies(profile.company_id);

        // Group by severity for convenience
        const grouped = {
            critical: anomalies.filter(a => a.severity === 'critical'),
            high: anomalies.filter(a => a.severity === 'high'),
            medium: anomalies.filter(a => a.severity === 'medium'),
            low: anomalies.filter(a => a.severity === 'low'),
        };

        return NextResponse.json({
            anomalies,
            grouped,
            counts: {
                total: anomalies.length,
                critical: grouped.critical.length,
                high: grouped.high.length,
                medium: grouped.medium.length,
                low: grouped.low.length,
            },
        });
    } catch (error) {
        console.error('Error fetching anomalies:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Scan for anomalies or acknowledge/resolve
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
        const { action, anomalyId } = body;

        // Acknowledge an anomaly
        if (action === 'acknowledge') {
            if (!anomalyId) {
                return NextResponse.json({ error: 'Anomaly ID required' }, { status: 400 });
            }

            const success = await acknowledgeAnomaly(anomalyId, user.id);
            if (!success) {
                return NextResponse.json({ error: 'Failed to acknowledge' }, { status: 500 });
            }

            return NextResponse.json({ success: true, action: 'acknowledged' });
        }

        // Resolve an anomaly
        if (action === 'resolve') {
            if (!anomalyId) {
                return NextResponse.json({ error: 'Anomaly ID required' }, { status: 400 });
            }

            const success = await resolveAnomaly(anomalyId, user.id);
            if (!success) {
                return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 });
            }

            await supabase.from('audit_logs').insert({
                company_id: profile.company_id,
                user_id: user.id,
                action: 'anomaly_resolved',
                entity_type: 'anomaly_alert',
                entity_id: anomalyId,
            });

            return NextResponse.json({ success: true, action: 'resolved' });
        }

        // Scan for new anomalies
        if (action === 'scan') {
            const anomalies = await detectAnomalies(profile.company_id);

            if (anomalies.length > 0) {
                await saveAnomalies(profile.company_id, anomalies);
            }

            await supabase.from('audit_logs').insert({
                company_id: profile.company_id,
                user_id: user.id,
                action: 'anomaly_scan_triggered',
                entity_type: 'anomaly_alert',
                details: { detected: anomalies.length },
            });

            return NextResponse.json({
                success: true,
                detected: anomalies.length,
                anomalies,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing anomaly action:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
