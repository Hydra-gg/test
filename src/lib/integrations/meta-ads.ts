/**
 * Meta (Facebook) Ads Integration
 * OAuth flow and API client (Per-Company Credentials)
 */

import { supabase } from '@/lib/supabase/client';
import type { CompanyOAuthApp } from './oauth-config';

// Meta API URLs (static)
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const META_API_BASE = 'https://graph.facebook.com/v18.0';

// =============================================================================
// TOKEN EXCHANGE
// =============================================================================

export interface MetaTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

export interface MetaLongLivedTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export async function exchangeMetaCode(
    code: string,
    app: CompanyOAuthApp
): Promise<MetaTokenResponse> {
    const redirectUri = app.redirect_uri || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/meta`;
    const appId = app.app_id || app.client_id;

    const params = new URLSearchParams({
        client_id: appId,
        client_secret: app.client_secret,
        redirect_uri: redirectUri,
        code,
    });

    const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meta token exchange failed: ${error}`);
    }

    return response.json();
}

export async function getLongLivedToken(
    shortLivedToken: string,
    app: CompanyOAuthApp
): Promise<MetaLongLivedTokenResponse> {
    const appId = app.app_id || app.client_id;

    const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: app.client_secret,
        fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get long-lived token: ${error}`);
    }

    return response.json();
}

// =============================================================================
// API CLIENT
// =============================================================================

export interface MetaAdAccount {
    id: string;
    name: string;
    accountId: string;
    currency: string;
    timezone: string;
    accountStatus: number;
}

export async function getMetaAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    const response = await fetch(
        `${META_API_BASE}/me/adaccounts?fields=id,name,account_id,currency,timezone_name,account_status&access_token=${accessToken}`
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch Meta ad accounts: ${error}`);
    }

    const data = await response.json();

    return (data.data || []).map((account: Record<string, unknown>) => ({
        id: account.id as string,
        name: account.name as string || `Account ${account.account_id}`,
        accountId: account.account_id as string,
        currency: account.currency as string || 'USD',
        timezone: account.timezone_name as string || 'America/New_York',
        accountStatus: account.account_status as number,
    }));
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export interface SaveConnectionParams {
    companyId: string;
    accountId: string;
    accountName: string;
    accessToken: string;
    expiresIn: number;
}

export async function saveMetaConnection({
    companyId,
    accountId,
    accountName,
    accessToken,
    expiresIn,
}: SaveConnectionParams): Promise<{ success: boolean; error?: string }> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error } = await supabase
        .from('ad_platform_connections')
        .upsert({
            company_id: companyId,
            platform: 'meta',
            account_id: accountId,
            account_name: accountName,
            access_token: accessToken,
            token_expires_at: expiresAt,
            permission_scope: 'read',
            sync_status: 'pending',
        }, {
            onConflict: 'company_id,platform,account_id',
        });

    if (error) {
        console.error('Failed to save Meta connection:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// =============================================================================
// CAMPAIGN & INSIGHTS FETCHING
// =============================================================================

export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    dailyBudget?: string;
    lifetimeBudget?: string;
}

export async function getMetaCampaigns(
    accessToken: string,
    adAccountId: string
): Promise<MetaCampaign[]> {
    const fields = 'id,name,status,objective,daily_budget,lifetime_budget';
    const response = await fetch(
        `${META_API_BASE}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}&limit=100`
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch campaigns: ${error}`);
    }

    const data = await response.json();

    return (data.data || []).map((campaign: Record<string, unknown>) => ({
        id: campaign.id as string,
        name: campaign.name as string,
        status: campaign.status as string,
        objective: campaign.objective as string,
        dailyBudget: campaign.daily_budget as string | undefined,
        lifetimeBudget: campaign.lifetime_budget as string | undefined,
    }));
}

export interface MetaInsight {
    campaignId: string;
    dateStart: string;
    dateStop: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    purchaseValue: number;
}

export async function getMetaCampaignInsights(
    accessToken: string,
    adAccountId: string,
    datePreset: string = 'last_30d'
): Promise<MetaInsight[]> {
    const fields = 'campaign_id,impressions,clicks,spend,actions,action_values';
    const response = await fetch(
        `${META_API_BASE}/${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}&level=campaign&access_token=${accessToken}`
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch insights: ${error}`);
    }

    const data = await response.json();

    return (data.data || []).map((insight: Record<string, unknown>) => {
        const actions = insight.actions as Array<{ action_type: string; value: string }> || [];
        const conversions = actions
            .filter(a => ['purchase', 'lead', 'complete_registration'].includes(a.action_type))
            .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);

        const actionValues = insight.action_values as Array<{ action_type: string; value: string }> || [];
        const purchaseValue = actionValues
            .filter(a => a.action_type === 'purchase')
            .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);

        return {
            campaignId: insight.campaign_id as string,
            dateStart: insight.date_start as string,
            dateStop: insight.date_stop as string,
            impressions: parseInt(insight.impressions as string || '0'),
            clicks: parseInt(insight.clicks as string || '0'),
            spend: parseFloat(insight.spend as string || '0'),
            conversions,
            purchaseValue,
        };
    });
}

export interface MetaMetrics {
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
}

export async function getMetaMetrics(
    accessToken: string,
    adAccountId: string,
    startDate: string,
    endDate: string
): Promise<MetaMetrics[]> {
    const fields = 'campaign_id,date_start,impressions,clicks,spend,actions,action_values';
    const response = await fetch(
        `${META_API_BASE}/${adAccountId}/insights?fields=${fields}&time_range={"since":"${startDate}","until":"${endDate}"}&time_increment=1&level=campaign&access_token=${accessToken}`
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch metrics: ${error}`);
    }

    const data = await response.json();

    return (data.data || []).map((metric: Record<string, unknown>) => {
        const actions = metric.actions as Array<{ action_type: string; value: string }> || [];
        const conversions = actions
            .filter(a => ['purchase', 'lead', 'complete_registration'].includes(a.action_type))
            .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);

        const actionValues = metric.action_values as Array<{ action_type: string; value: string }> || [];
        const revenue = actionValues
            .filter(a => a.action_type === 'purchase')
            .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);

        return {
            campaignId: metric.campaign_id as string,
            date: metric.date_start as string,
            impressions: parseInt(metric.impressions as string || '0'),
            clicks: parseInt(metric.clicks as string || '0'),
            conversions,
            spend: parseFloat(metric.spend as string || '0'),
            revenue,
        };
    });
}

export async function refreshMetaToken(
    currentToken: string,
    app: CompanyOAuthApp
): Promise<MetaTokenResponse> {
    return getLongLivedToken(currentToken, app);
}
