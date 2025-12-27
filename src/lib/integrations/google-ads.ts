/**
 * Google Ads Integration
 * OAuth flow and API client for Google Ads (Per-Company Credentials)
 */

import { supabase } from '@/lib/supabase/client';
import type { CompanyOAuthApp } from './oauth-config';

// Google Ads API URLs (static)
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API_BASE = 'https://googleads.googleapis.com';
const GOOGLE_API_VERSION = 'v15';

// =============================================================================
// TOKEN EXCHANGE (requires company credentials)
// =============================================================================

export interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export async function exchangeGoogleCode(
    code: string,
    app: CompanyOAuthApp
): Promise<GoogleTokenResponse> {
    const redirectUri = app.redirect_uri || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/google`;

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: app.client_id,
            client_secret: app.client_secret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google token exchange failed: ${error}`);
    }

    return response.json();
}

export async function refreshGoogleToken(
    refreshToken: string,
    app: CompanyOAuthApp
): Promise<GoogleTokenResponse> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: app.client_id,
            client_secret: app.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google token refresh failed: ${error}`);
    }

    return response.json();
}

// =============================================================================
// API CLIENT (needs developer token from company app)
// =============================================================================

export interface GoogleAdsAccount {
    customerId: string;
    descriptiveName: string;
    currencyCode: string;
    timeZone: string;
}

export async function getGoogleAdsAccounts(
    accessToken: string,
    developerToken: string
): Promise<GoogleAdsAccount[]> {
    const response = await fetch(
        `${GOOGLE_API_BASE}/${GOOGLE_API_VERSION}/customers:listAccessibleCustomers`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch Google Ads accounts: ${error}`);
    }

    const data = await response.json();
    const customerIds: string[] = data.resourceNames?.map((name: string) =>
        name.replace('customers/', '')
    ) || [];

    const accounts: GoogleAdsAccount[] = [];
    for (const customerId of customerIds) {
        try {
            const accountDetails = await getGoogleAdsAccountDetails(accessToken, developerToken, customerId);
            if (accountDetails) {
                accounts.push(accountDetails);
            }
        } catch (error) {
            console.error(`Failed to fetch details for customer ${customerId}:`, error);
        }
    }

    return accounts;
}

async function getGoogleAdsAccountDetails(
    accessToken: string,
    developerToken: string,
    customerId: string
): Promise<GoogleAdsAccount | null> {
    const query = `
        SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone
        FROM customer
        LIMIT 1
    `;

    const response = await fetch(
        `${GOOGLE_API_BASE}/${GOOGLE_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'login-customer-id': customerId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        }
    );

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    const customer = data[0]?.results?.[0]?.customer;

    if (!customer) return null;

    return {
        customerId: customer.id,
        descriptiveName: customer.descriptiveName || `Account ${customer.id}`,
        currencyCode: customer.currencyCode || 'USD',
        timeZone: customer.timeZone || 'America/New_York',
    };
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export interface SaveConnectionParams {
    companyId: string;
    accountId: string;
    accountName: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export async function saveGoogleConnection({
    companyId,
    accountId,
    accountName,
    accessToken,
    refreshToken,
    expiresIn,
}: SaveConnectionParams): Promise<{ success: boolean; error?: string }> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error } = await supabase
        .from('ad_platform_connections')
        .upsert({
            company_id: companyId,
            platform: 'google',
            account_id: accountId,
            account_name: accountName,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: expiresAt,
            permission_scope: 'read',
            sync_status: 'pending',
        }, {
            onConflict: 'company_id,platform,account_id',
        });

    if (error) {
        console.error('Failed to save Google connection:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// =============================================================================
// CAMPAIGN DATA FETCHING
// =============================================================================

export interface GoogleAdsCampaign {
    id: string;
    name: string;
    status: string;
    advertisingChannelType: string;
    budgetAmountMicros: string;
    startDate?: string;
    endDate?: string;
}

export async function getGoogleAdsCampaigns(
    accessToken: string,
    developerToken: string,
    customerId: string
): Promise<GoogleAdsCampaign[]> {
    const query = `
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.campaign_budget,
            campaign.start_date,
            campaign.end_date
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.name
        LIMIT 100
    `;

    const response = await fetch(
        `${GOOGLE_API_BASE}/${GOOGLE_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'login-customer-id': customerId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch campaigns: ${error}`);
    }

    const data = await response.json();
    const campaigns: GoogleAdsCampaign[] = [];

    for (const batch of data) {
        for (const result of batch.results || []) {
            const campaign = result.campaign;
            campaigns.push({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                advertisingChannelType: campaign.advertisingChannelType,
                budgetAmountMicros: campaign.campaignBudget?.amountMicros || '0',
                startDate: campaign.startDate,
                endDate: campaign.endDate,
            });
        }
    }

    return campaigns;
}

// =============================================================================
// METRICS FETCHING
// =============================================================================

export interface GoogleAdsMetrics {
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    costMicros: number;
    conversionsValue: number;
}

export async function getGoogleAdsMetrics(
    accessToken: string,
    developerToken: string,
    customerId: string,
    startDate: string,
    endDate: string
): Promise<GoogleAdsMetrics[]> {
    const query = `
        SELECT
            campaign.id,
            segments.date,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros,
            metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY segments.date DESC
    `;

    const response = await fetch(
        `${GOOGLE_API_BASE}/${GOOGLE_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'login-customer-id': customerId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch metrics: ${error}`);
    }

    const data = await response.json();
    const metrics: GoogleAdsMetrics[] = [];

    for (const batch of data) {
        for (const result of batch.results || []) {
            metrics.push({
                campaignId: result.campaign.id,
                date: result.segments.date,
                impressions: parseInt(result.metrics.impressions || '0'),
                clicks: parseInt(result.metrics.clicks || '0'),
                conversions: parseFloat(result.metrics.conversions || '0'),
                costMicros: parseInt(result.metrics.costMicros || '0'),
                conversionsValue: parseFloat(result.metrics.conversionsValue || '0'),
            });
        }
    }

    return metrics;
}
