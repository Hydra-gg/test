/**
 * LinkedIn Ads Integration
 * OAuth flow and API client (Per-Company Credentials)
 */

import { supabase } from '@/lib/supabase/client';
import type { CompanyOAuthApp } from './oauth-config';

// LinkedIn API URLs (static)
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// =============================================================================
// TOKEN EXCHANGE
// =============================================================================

export interface LinkedInTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope: string;
}

export async function exchangeLinkedInCode(
    code: string,
    app: CompanyOAuthApp
): Promise<LinkedInTokenResponse> {
    const redirectUri = app.redirect_uri || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/linkedin`;

    const response = await fetch(LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: app.client_id,
            client_secret: app.client_secret,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`LinkedIn token exchange failed: ${error}`);
    }

    return response.json();
}

export async function refreshLinkedInToken(
    refreshToken: string,
    app: CompanyOAuthApp
): Promise<LinkedInTokenResponse> {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: app.client_id,
            client_secret: app.client_secret,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`LinkedIn token refresh failed: ${error}`);
    }

    return response.json();
}

// =============================================================================
// API CLIENT
// =============================================================================

export interface LinkedInAdAccount {
    id: string;
    name: string;
    currency: string;
    status: string;
}

export async function getLinkedInAdAccounts(accessToken: string): Promise<LinkedInAdAccount[]> {
    const response = await fetch(
        `${LINKEDIN_API_BASE}/adAccountsV2?q=search&search=(status:(values:List(ACTIVE)))`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch LinkedIn ad accounts: ${error}`);
    }

    const data = await response.json();

    return (data.elements || []).map((account: Record<string, unknown>) => ({
        id: account.id as string,
        name: account.name as string || `LinkedIn Account ${account.id}`,
        currency: account.currency as string || 'USD',
        status: account.status as string,
    }));
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export interface SaveLinkedInConnectionParams {
    companyId: string;
    accountId: string;
    accountName: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
}

export async function saveLinkedInConnection({
    companyId,
    accountId,
    accountName,
    accessToken,
    refreshToken,
    expiresIn,
}: SaveLinkedInConnectionParams): Promise<{ success: boolean; error?: string }> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error } = await supabase
        .from('ad_platform_connections')
        .upsert({
            company_id: companyId,
            platform: 'linkedin',
            account_id: accountId,
            account_name: accountName,
            access_token: accessToken,
            refresh_token: refreshToken || null,
            token_expires_at: expiresAt,
            permission_scope: 'read',
            sync_status: 'pending',
        }, {
            onConflict: 'company_id,platform,account_id',
        });

    if (error) {
        console.error('Failed to save LinkedIn connection:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// =============================================================================
// CAMPAIGN & METRICS FETCHING
// =============================================================================

export interface LinkedInCampaign {
    id: string;
    name: string;
    status: string;
    objectiveType: string;
    dailyBudget?: number;
}

export async function getLinkedInCampaigns(
    accessToken: string,
    accountId: string
): Promise<LinkedInCampaign[]> {
    const response = await fetch(
        `${LINKEDIN_API_BASE}/adCampaignsV2?q=search&search=(account:(values:List(urn%3Ali%3AsponsoredAccount%3A${accountId})))`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch LinkedIn campaigns');
    }

    const data = await response.json();

    return (data.elements || []).map((campaign: Record<string, unknown>) => ({
        id: campaign.id as string,
        name: campaign.name as string,
        status: campaign.status as string,
        objectiveType: campaign.objectiveType as string,
        dailyBudget: (campaign.dailyBudget as Record<string, number>)?.amount,
    }));
}

export interface LinkedInMetrics {
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
}

export async function getLinkedInMetrics(
    accessToken: string,
    accountId: string,
    startDate: string,
    endDate: string
): Promise<LinkedInMetrics[]> {
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    const response = await fetch(
        `${LINKEDIN_API_BASE}/adAnalyticsV2?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=(start:(day:${startDay},month:${startMonth},year:${startYear}),end:(day:${endDay},month:${endMonth},year:${endYear}))&accounts=List(urn%3Ali%3AsponsoredAccount%3A${accountId})&fields=impressions,clicks,externalWebsiteConversions,costInLocalCurrency`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch LinkedIn metrics');
    }

    const data = await response.json();

    return (data.elements || []).map((row: Record<string, unknown>) => {
        const pivotValue = row.pivotValue as string || '';
        const campaignId = pivotValue.replace('urn:li:sponsoredCampaign:', '');

        const dateRange = row.dateRange as Record<string, Record<string, number>> || {};
        const start = dateRange.start || {};
        const date = `${start.year}-${String(start.month).padStart(2, '0')}-${String(start.day).padStart(2, '0')}`;

        return {
            campaignId,
            date,
            impressions: row.impressions as number || 0,
            clicks: row.clicks as number || 0,
            conversions: row.externalWebsiteConversions as number || 0,
            spend: row.costInLocalCurrency as number || 0,
        };
    });
}
