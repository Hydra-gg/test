/**
 * Metrics Sync Cron Job
 * API route to trigger synchronization of ad metrics
 * Protected by CRON_SECRET or Admin Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { syncCompanyData, syncAllCompanies } from '@/lib/services/platform-sync';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        const supabase = await createServerSupabaseClient();

        // Check authentication
        // 1. CRON_SECRET (for external schedulers like Vercel Cron)
        const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

        // 2. Admin User (for manual triggering via browser/Postman)
        let isAdmin = false;
        let companyIdToSync: string | null = null;

        if (!isCronAuth) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, company_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'admin' || profile?.role === 'ceo') {
                    isAdmin = true;
                    // If triggered manually by user, prefer syncing ONLY their company
                    // unless they are admin and request 'all'
                    companyIdToSync = profile.company_id;
                }
            }
        }

        if (!isCronAuth && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine scope
        const scope = request.nextUrl.searchParams.get('scope') || 'all';

        // 3. Sync Logic
        const results = [];

        if (companyIdToSync && scope !== 'force_all') {
            // Sync specific company (manual trigger case)
            console.log(`Starting manual sync for company ${companyIdToSync}`);
            const companyResults = await syncCompanyData(companyIdToSync, { daysBack: 30 });
            results.push(...companyResults);
        } else {
            // Sync all companies (Cron case)
            console.log('Starting global sync...');
            await syncAllCompanies({ daysBack: 7 });
        }

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Sync Job Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
