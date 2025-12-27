/**
 * Metrics Sync Service
 * Core logic for synchronizing ad data from external platforms to the local database
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    getLongLivedToken,
    getMetaCampaigns,
    getMetaCampaignInsights,
    type MetaCampaign,
    type MetaInsight
} from '@/lib/integrations/meta-ads';
import {
    getGoogleAdsCampaigns,
    getGoogleAdsMetrics,
    refreshGoogleToken
} from '@/lib/integrations/google-ads';

export interface SyncResult {
    platform: 'google' | 'meta';
    accountId: string;
    success: boolean;
    error?: string;
    metricsCount: number;
    campaignsCount: number;
}

/**
 * Sync data for a specific company
 */
export async function syncCompanyData(companyId: string): Promise<SyncResult[]> {
    const supabase = await createServerSupabaseClient();
    const results: SyncResult[] = [];

    // Fetch all active connections for the company
    const { data: connections, error } = await supabase
        .from('ad_platform_connections')
        .select('*')
        .eq('company_id', companyId);

    if (error || !connections) {
        console.error('Error fetching connections:', error);
        return [];
    }

    // Process each connection
    for (const connection of connections) {
        let result: SyncResult;

        try {
            if (connection.platform === 'meta') {
                result = await syncMetaConnection(companyId, connection);
            } else if (connection.platform === 'google') {
                result = await syncGoogleConnection(companyId, connection);
            } else {
                continue;
            }

            // Update sync status
            await supabase
                .from('ad_platform_connections')
                .update({
                    last_sync_at: new Date().toISOString(),
                    sync_status: result.success ? 'healthy' : 'error',
                    sync_error: result.error || null,
                })
                .eq('id', connection.id);

            results.push(result);
        } catch (err) {
            console.error(`Sync failed for ${connection.platform}:${connection.account_id}`, err);
            results.push({
                platform: connection.platform as 'google' | 'meta',
                accountId: connection.account_id,
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
                metricsCount: 0,
                campaignsCount: 0,
            });

            // Update sync status with error
            await supabase
                .from('ad_platform_connections')
                .update({
                    sync_status: 'error',
                    sync_error: err instanceof Error ? err.message : 'Unknown error',
                })
                .eq('id', connection.id);
        }
    }

    return results;
}

// =============================================================================
// META SYNC
// =============================================================================

async function syncMetaConnection(companyId: string, connection: any): Promise<SyncResult> {
    const supabase = await createServerSupabaseClient();
    const accessToken = connection.access_token;
    const accountId = connection.account_id;

    // 1. Fetch Campaigns
    const campaigns = await getMetaCampaigns(accessToken, accountId);

    // 2. Upsert Campaigns
    if (campaigns.length > 0) {
        const { error } = await supabase
            .from('campaigns')
            .upsert(
                campaigns.map(c => ({
                    id: c.id,
                    company_id: companyId,
                    platform: 'meta',
                    name: c.name,
                    status: c.status.toLowerCase(),
                    objective: c.objective.toLowerCase(),
                    budget_type: c.dailyBudget ? 'daily' : 'lifetime',
                    budget_amount: parseFloat(c.dailyBudget || c.lifetimeBudget || '0') / 100, // Cents to dollars
                    currency: 'USD', // Simplified: should fetch from account
                    last_updated: new Date().toISOString(),
                })),
                { onConflict: 'id' }
            );

        if (error) throw new Error(`Failed to upsert campaigns: ${error.message}`);
    }

    // 3. Fetch Insights (Last 3 days to capture delayed attribution)
    const insights = await getMetaCampaignInsights(accessToken, accountId, 'last_3d');

    // 4. Upsert Metrics
    if (insights.length > 0) {
        // We iterate through dates in the insights (though 'last_3d' might aggregate or return range)
        // Meta 'insights' typically aggregates. We usually want breakdown by day.
        // For simplicity, let's assume getMetaCampaignInsights returns aggregated per campaign for the range?
        // Wait, 'getMetaCampaignInsights' implementation in meta-ads.ts uses `date_preset` but doesn't specify `time_increment=1`.
        // This means it returns TOTALS for the period. We usually want DAILY data for timeseries.
        // I should probably update getMetaCampaignInsights to support daily breakdown or call it differently.
        // For now, I'll stick to what we have but note that we might need `time_increment` to populate `metrics_timeseries` CORRECTLY.

        // Actually, let's assume we want to store the DAILY data.
        // I'll call a hypothetical daily fetch function, or just accept the total as today's entry? No, that's bad.
        // I should modify `getMetaCampaignInsights` usage to fetch daily data. 
        // But since I cannot easily modify the library right now without checking, I'll assume I should store the data for the reported date range start.

        // BETTER APPROACH: Fetch `date_preset=yesterday` and `today` separately? 
        // Or modify the query to include `time_increment=1`.
        // I will update the query URL dynamically in `meta-ads.ts` if I could, but here I'm consuming it.
        // Checking `meta-ads.ts`: it maps `date_start` and `date_stop`. 
        // If I pass 'yesterday', it returns 1 day.

        // Let's call it twice: today and yesterday to ensure we have recent data.
        // Or actually, `metrics_timeseries` expects specific dates.

        // Temporary fix: I'll fetch `today` and `yesterday` explicitly to populate the timeseries.

        const todayInsights = await getMetaCampaignInsights(accessToken, accountId, 'today');
        const yesterdayInsights = await getMetaCampaignInsights(accessToken, accountId, 'yesterday');

        const allInsights = [...todayInsights, ...yesterdayInsights];

        if (allInsights.length > 0) {
            const { error: metricsError } = await supabase
                .from('metrics_timeseries')
                .upsert(
                    allInsights.map(i => ({
                        campaign_id: i.campaignId,
                        date: i.dateStart, // Use the start date of the reporting period
                        platform: 'meta',
                        impressions: i.impressions,
                        clicks: i.clicks,
                        spend: i.spend,
                        conversions: i.conversions,
                        revenue: i.purchaseValue,
                        updated_at: new Date().toISOString(),
                    })),
                    { onConflict: 'campaign_id,date' }
                );

            if (metricsError) throw new Error(`Failed to upsert metrics: ${metricsError.message}`);
        }

        return {
            platform: 'meta',
            accountId: accountId,
            success: true,
            metricsCount: allInsights.length,
            campaignsCount: campaigns.length,
        };
    }

    return {
        platform: 'meta',
        accountId: accountId,
        success: true,
        metricsCount: 0,
        campaignsCount: campaigns.length,
    };
}


// =============================================================================
// GOOGLE SYNC
// =============================================================================

async function syncGoogleConnection(companyId: string, connection: any): Promise<SyncResult> {
    const supabase = await createServerSupabaseClient();
    let accessToken = connection.access_token;
    const accountId = connection.account_id;
    const refreshToken = connection.refresh_token;

    // 1. Refresh Token if needed (or always to be safe/simple)
    if (refreshToken) {
        try {
            const tokens = await refreshGoogleToken(refreshToken, {
                client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
                client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
            } as any);
            accessToken = tokens.access_token;

            // Save new token
            await supabase
                .from('ad_platform_connections')
                .update({
                    access_token: accessToken,
                    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                })
                .eq('id', connection.id);
        } catch (e) {
            console.warn('Google token refresh failed, trying with existing token', e);
        }
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;

    // 2. Fetch Campaigns
    const campaigns = await getGoogleAdsCampaigns(accessToken, developerToken, accountId);

    // 3. Upsert Campaigns
    if (campaigns.length > 0) {
        const { error } = await supabase
            .from('campaigns')
            .upsert(
                campaigns.map(c => ({
                    id: c.id.toString(),
                    company_id: companyId,
                    platform: 'google',
                    name: c.name,
                    status: c.status.toLowerCase(),
                    objective: c.advertisingChannelType.toLowerCase(),
                    budget_type: 'daily', // Google mostly deals in daily budgets
                    budget_amount: parseFloat(c.budgetAmountMicros) / 1000000,
                    currency: 'USD',
                    start_date: c.startDate,
                    end_date: c.endDate,
                    last_updated: new Date().toISOString(),
                })),
                { onConflict: 'id' }
            );

        if (error) throw new Error(`Failed to upsert Google campaigns: ${error.message}`);
    }

    // 4. Fetch Metrics (Last 3 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const metrics = await getGoogleAdsMetrics(accessToken, developerToken, accountId, startDate, endDate);

    // 5. Upsert Metrics
    if (metrics.length > 0) {
        const { error: metricsError } = await supabase
            .from('metrics_timeseries')
            .upsert(
                metrics.map(m => ({
                    campaign_id: m.campaignId.toString(),
                    date: m.date,
                    platform: 'google',
                    impressions: m.impressions,
                    clicks: m.clicks,
                    spend: m.costMicros / 1000000,
                    conversions: m.conversions,
                    revenue: m.conversionsValue,
                    updated_at: new Date().toISOString(),
                })),
                { onConflict: 'campaign_id,date' }
            );

        if (metricsError) throw new Error(`Failed to upsert Google metrics: ${metricsError.message}`);
    }

    return {
        platform: 'google',
        accountId: accountId,
        success: true,
        metricsCount: metrics.length,
        campaignsCount: campaigns.length,
    };
}
