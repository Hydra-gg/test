/**
 * Manual Sync API
 * Allows authenticated company users to trigger a sync for their company
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { syncCompanyData, syncConnection } from '@/lib/services/platform-sync';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's company
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
        }

        // Parse request body
        const body = await request.json().catch(() => ({}));
        const { connectionId, platform, daysBack = 30 } = body;

        let results;

        if (connectionId) {
            // Sync specific connection
            const { data: connection } = await supabase
                .from('ad_platform_connections')
                .select('*')
                .eq('id', connectionId)
                .eq('company_id', profile.company_id)
                .single();

            if (!connection) {
                return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
            }

            const result = await syncConnection(connection, { daysBack });
            results = [result];
        } else {
            // Sync all connections for the company (optionally filtered by platform)
            results = await syncCompanyData(profile.company_id, {
                platform,
                daysBack,
                forceRefresh: true,
            });
        }

        // Calculate summary
        const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            totalCampaigns: results.reduce((sum, r) => sum + r.campaignsSynced, 0),
            totalMetrics: results.reduce((sum, r) => sum + r.metricsRecordsSynced, 0),
        };

        return NextResponse.json({
            success: true,
            summary,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Manual sync error:', error);
        return NextResponse.json(
            {
                error: 'Sync failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
