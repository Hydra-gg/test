/**
 * Platform Sync Service
 * Orchestrates data synchronization from ad platforms to database
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    getGoogleAdsCampaigns,
    getGoogleAdsMetrics,
    refreshGoogleToken
} from '@/lib/integrations/google-ads';
import {
    getMetaCampaigns,
    getMetaMetrics,
    refreshMetaToken
} from '@/lib/integrations/meta-ads';
import {
    getTikTokCampaigns,
    getTikTokMetrics,
    refreshTikTokToken
} from '@/lib/integrations/tiktok-ads';
import {
    getLinkedInCampaigns,
    getLinkedInMetrics,
    refreshLinkedInToken
} from '@/lib/integrations/linkedin-ads';

export interface SyncResult {
    success: boolean;
    connectionId: string;
    platform: string;
    campaignsSynced: number;
    metricsRecordsSynced: number;
    errors: string[];
    duration: number;
}

export interface SyncOptions {
    companyId?: string;
    platform?: string;
    daysBack?: number;
    forceRefresh?: boolean;
}

/**
 * Sync all active platform connections for a company
 */
export async function syncCompanyData(
    companyId: string,
    options: Omit<SyncOptions, 'companyId'> = {}
): Promise<SyncResult[]> {
    const supabase = await createServerSupabaseClient();
    const results: SyncResult[] = [];

    // Get all active connections for the company
    let query = supabase
        .from('ad_platform_connections')
        .select('*')
        .eq('company_id', companyId)
        .in('sync_status', ['healthy', 'pending', 'error']);

    if (options.platform) {
        query = query.eq('platform', options.platform);
    }

    const { data: connections, error } = await query;

    if (error || !connections || connections.length === 0) {
        console.error('No connections found for company:', companyId, error);
        return results;
    }

    // Sync each connection
    for (const connection of connections) {
        try {
            const result = await syncConnection(connection, options);
            results.push(result);
        } catch (error) {
            console.error(`Failed to sync connection ${connection.id}:`, error);
            results.push({
                success: false,
                connectionId: connection.id,
                platform: connection.platform,
                campaignsSynced: 0,
                metricsRecordsSynced: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                duration: 0,
            });
        }
    }

    return results;
}

/**
 * Sync a specific platform connection
 */
export async function syncConnection(
    connection: any,
    options: SyncOptions = {}
): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
        success: false,
        connectionId: connection.id,
        platform: connection.platform,
        campaignsSynced: 0,
        metricsRecordsSynced: 0,
        errors: [],
        duration: 0,
    };

    const supabase = await createServerSupabaseClient();

    try {
        // Update sync status to 'syncing'
        await supabase
            .from('ad_platform_connections')
            .update({ sync_status: 'syncing' })
            .eq('id', connection.id);

        // Check if token needs refresh
        const needsRefresh = new Date(connection.token_expires_at) <= new Date();
        let accessToken = connection.access_token;

        if (needsRefresh && connection.refresh_token) {
            accessToken = await refreshAccessToken(connection);
        }

        // Get OAuth app credentials for this company
        const { data: oauthApp } = await supabase
            .from('company_oauth_apps')
            .select('*')
            .eq('company_id', connection.company_id)
            .eq('platform', connection.platform)
            .single();

        if (!oauthApp) {
            throw new Error(`No OAuth app found for platform ${connection.platform}`);
        }

        // Sync campaigns
        const campaigns = await fetchCampaigns(
            connection.platform,
            accessToken,
            connection.account_id,
            oauthApp
        );

        if (campaigns.length > 0) {
            const campaignIds = await saveCampaigns(
                connection.company_id,
                connection.id,
                connection.platform,
                campaigns
            );
            result.campaignsSynced = campaignIds.length;

            // Sync metrics for each campaign
            const daysBack = options.daysBack || 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const endDate = new Date();

            const metricsCount = await syncMetricsForCampaigns(
                connection.platform,
                accessToken,
                connection.account_id,
                campaignIds,
                startDate,
                endDate,
                oauthApp
            );

            result.metricsRecordsSynced = metricsCount;
        }

        // Update connection status
        await supabase
            .from('ad_platform_connections')
            .update({
                sync_status: 'healthy',
                last_sync_at: new Date().toISOString(),
                sync_error: null,
            })
            .eq('id', connection.id);

        result.success = true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(errorMessage);

        // Update connection with error status
        await supabase
            .from('ad_platform_connections')
            .update({
                sync_status: 'error',
                sync_error: errorMessage,
            })
            .eq('id', connection.id);
    }

    result.duration = Date.now() - startTime;
    return result;
}

/**
 * Refresh access token for a connection
 */
async function refreshAccessToken(connection: any): Promise<string> {
    const supabase = await createServerSupabaseClient();

    // Get OAuth app for token refresh
    const { data: oauthApp } = await supabase
        .from('company_oauth_apps')
        .select('*')
        .eq('company_id', connection.company_id)
        .eq('platform', connection.platform)
        .single();

    if (!oauthApp) {
        throw new Error('OAuth app not found for token refresh');
    }

    let tokenResponse: { access_token: string; expires_in?: number };

    switch (connection.platform) {
        case 'google':
            tokenResponse = await refreshGoogleToken(connection.refresh_token, oauthApp);
            break;
        case 'meta':
            tokenResponse = await refreshMetaToken(connection.refresh_token, oauthApp);
            break;
        case 'tiktok':
            throw new Error('TikTok tokens do not support refresh - tokens are long-lived (1 year)');
        case 'linkedin':
            tokenResponse = await refreshLinkedInToken(connection.refresh_token, oauthApp);
            break;
        default:
            throw new Error(`Unsupported platform: ${connection.platform}`);
    }

    // Update connection with new token
    const expiresIn = tokenResponse.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase
        .from('ad_platform_connections')
        .update({
            access_token: tokenResponse.access_token,
            token_expires_at: expiresAt,
        })
        .eq('id', connection.id);

    return tokenResponse.access_token;
}

/**
 * Fetch campaigns from platform
 */
async function fetchCampaigns(
    platform: string,
    accessToken: string,
    accountId: string,
    oauthApp: any
): Promise<any[]> {
    switch (platform) {
        case 'google':
            return await getGoogleAdsCampaigns(accessToken, oauthApp.developer_token, accountId);
        case 'meta':
            return await getMetaCampaigns(accessToken, accountId);
        case 'tiktok':
            return await getTikTokCampaigns(accessToken, accountId);
        case 'linkedin':
            return await getLinkedInCampaigns(accessToken, accountId);
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

/**
 * Save campaigns to database
 */
async function saveCampaigns(
    companyId: string,
    connectionId: string,
    platform: string,
    campaigns: any[]
): Promise<string[]> {
    const supabase = await createServerSupabaseClient();
    const savedIds: string[] = [];

    for (const campaign of campaigns) {
        const campaignData = normalizeCampaign(platform, campaign, companyId, connectionId);

        const { data, error } = await supabase
            .from('campaigns')
            .upsert(campaignData, {
                onConflict: 'company_id,platform,platform_campaign_id',
            })
            .select('id')
            .single();

        if (data && !error) {
            savedIds.push(data.id);
        }
    }

    return savedIds;
}

/**
 * Normalize campaign data from different platforms
 */
function normalizeCampaign(
    platform: string,
    campaign: any,
    companyId: string,
    connectionId: string
): any {
    const base = {
        company_id: companyId,
        platform_connection_id: connectionId,
        platform,
        platform_campaign_id: String(campaign.id),
        name: campaign.name,
        updated_at: new Date().toISOString(),
    };

    switch (platform) {
        case 'google':
            return {
                ...base,
                status: campaign.status?.toLowerCase() || 'active',
                channel: campaign.advertisingChannelType,
                budget_daily: parseFloat(campaign.budgetAmountMicros || '0') / 1000000,
                start_date: campaign.startDate,
                end_date: campaign.endDate,
            };
        case 'meta':
            return {
                ...base,
                status: campaign.status?.toLowerCase() || 'active',
                objective: campaign.objective,
                budget_daily: parseFloat(campaign.daily_budget || '0') / 100,
                budget_total: parseFloat(campaign.lifetime_budget || '0') / 100,
                start_date: campaign.start_time,
                end_date: campaign.stop_time,
            };
        case 'tiktok':
            return {
                ...base,
                status: campaign.status?.toLowerCase() || 'active',
                objective: campaign.objective_type,
                budget_daily: parseFloat(campaign.budget || '0'),
            };
        case 'linkedin':
            return {
                ...base,
                status: campaign.status?.toLowerCase() || 'active',
                objective: campaign.objectiveType,
                budget_total: parseFloat(campaign.totalBudget?.amount || '0'),
            };
        default:
            return base;
    }
}

/**
 * Sync metrics for multiple campaigns
 */
async function syncMetricsForCampaigns(
    platform: string,
    accessToken: string,
    accountId: string,
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
    oauthApp: any
): Promise<number> {
    const supabase = await createServerSupabaseClient();
    let totalRecords = 0;

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch metrics from platform
    let metrics: any[] = [];

    switch (platform) {
        case 'google':
            metrics = await getGoogleAdsMetrics(
                accessToken,
                oauthApp.developer_token,
                accountId,
                startDateStr,
                endDateStr
            );
            break;
        case 'meta':
            metrics = await getMetaMetrics(accessToken, accountId, startDateStr, endDateStr);
            break;
        case 'tiktok':
            metrics = await getTikTokMetrics(accessToken, accountId, startDateStr, endDateStr);
            break;
        case 'linkedin':
            metrics = await getLinkedInMetrics(accessToken, accountId, startDateStr, endDateStr);
            break;
    }

    // Get campaign ID mapping (platform_campaign_id -> internal id)
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, platform_campaign_id')
        .in('id', campaignIds);

    const campaignIdMap = new Map(
        (campaigns || []).map((c) => [c.platform_campaign_id, c.id])
    );

    // Prepare metrics records for insertion
    const metricsRecords = metrics
        .map((m) => normalizeMetrics(platform, m, campaignIdMap))
        .filter((m) => m !== null);

    // Batch insert metrics
    if (metricsRecords.length > 0) {
        const { error } = await supabase
            .from('metrics_timeseries')
            .upsert(metricsRecords, {
                onConflict: 'campaign_id,creative_id,audience_id,date,granularity',
            });

        if (!error) {
            totalRecords = metricsRecords.length;
        }
    }

    return totalRecords;
}

/**
 * Normalize metrics data from different platforms
 */
function normalizeMetrics(
    platform: string,
    metric: any,
    campaignIdMap: Map<string, string>
): any | null {
    const campaignId = campaignIdMap.get(String(metric.campaignId));
    if (!campaignId) return null;

    const spend = platform === 'google'
        ? parseFloat(metric.costMicros || '0') / 1000000
        : parseFloat(metric.spend || '0');

    const revenue = parseFloat(metric.conversionsValue || metric.revenue || '0');
    const conversions = parseFloat(metric.conversions || '0');
    const impressions = parseInt(String(metric.impressions || '0'));
    const clicks = parseInt(String(metric.clicks || '0'));

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 ? revenue / spend : 0;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

    return {
        campaign_id: campaignId,
        date: metric.date,
        granularity: 'day',
        impressions,
        clicks,
        conversions: Math.round(conversions),
        spend,
        revenue,
        ctr,
        cpc,
        cpa,
        roas,
        roi,
        created_at: new Date().toISOString(),
    };
}

/**
 * Sync all companies (for cron job)
 */
export async function syncAllCompanies(options: SyncOptions = {}): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const { data: companies, error } = await supabase
        .from('companies')
        .select('id')
        .not('subscription_tier', 'eq', 'cancelled');

    if (error || !companies) {
        console.error('Failed to fetch companies for sync:', error);
        return;
    }

    console.log(`Starting sync for ${companies.length} companies...`);

    for (const company of companies) {
        try {
            const results = await syncCompanyData(company.id, options);
            const successCount = results.filter((r) => r.success).length;
            console.log(`Company ${company.id}: ${successCount}/${results.length} syncs successful`);
        } catch (error) {
            console.error(`Failed to sync company ${company.id}:`, error);
        }
    }

    console.log('Sync complete for all companies');
}
