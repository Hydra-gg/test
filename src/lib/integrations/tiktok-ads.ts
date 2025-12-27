/**
 * TikTok Ads Integration
 * OAuth flow and API client (Per-Company Credentials)
 */

import { supabase } from '@/lib/supabase/client';
import type { CompanyOAuthApp } from './oauth-config';

// TikTok API URLs (static)
const TIKTOK_TOKEN_URL = 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/';
const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

// =============================================================================
// TOKEN EXCHANGE
// =============================================================================

export interface TikTokTokenResponse {
    access_token: string;
    advertiser_ids: string[];
    scope: string;
    token_type: string;
}

export async function exchangeTikTokCode(
    authCode: string,
    app: CompanyOAuthApp
): Promise<TikTokTokenResponse> {
    const appId = app.app_id || app.client_id;

    const response = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app_id: appId,
            secret: app.client_secret,
            auth_code: authCode,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`TikTok token exchange failed: ${error}`);
    }

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`TikTok API error: ${data.message}`);
    }

    return data.data;
}

// =============================================================================
// API CLIENT
// =============================================================================

export interface TikTokAdvertiser {
    advertiserId: string;
    advertiserName: string;
    currency: string;
    timezone: string;
}

export async function getTikTokAdvertisers(
    accessToken: string,
    advertiserIds: string[]
): Promise<TikTokAdvertiser[]> {
    const advertisers: TikTokAdvertiser[] = [];

    for (const advertiserId of advertiserIds) {
        try {
            const response = await fetch(
                `${TIKTOK_API_BASE}/advertiser/info/?advertiser_ids=["${advertiserId}"]`,
                {
                    headers: {
                        'Access-Token': accessToken,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.code === 0 && data.data?.list) {
                    for (const adv of data.data.list) {
                        advertisers.push({
                            advertiserId: adv.advertiser_id,
                            advertiserName: adv.advertiser_name || `TikTok Account ${adv.advertiser_id}`,
                            currency: adv.currency || 'USD',
                            timezone: adv.timezone || 'UTC',
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to fetch TikTok advertiser ${advertiserId}:`, error);
        }
    }

    return advertisers;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export interface SaveTikTokConnectionParams {
    companyId: string;
    advertiserId: string;
    advertiserName: string;
    accessToken: string;
}

export async function saveTikTokConnection({
    companyId,
    advertiserId,
    advertiserName,
    accessToken,
}: SaveTikTokConnectionParams): Promise<{ success: boolean; error?: string }> {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
        .from('ad_platform_connections')
        .upsert({
            company_id: companyId,
            platform: 'tiktok',
            account_id: advertiserId,
            account_name: advertiserName,
            access_token: accessToken,
            token_expires_at: expiresAt,
            permission_scope: 'read',
            sync_status: 'pending',
        }, {
            onConflict: 'company_id,platform,account_id',
        });

    if (error) {
        console.error('Failed to save TikTok connection:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// =============================================================================
// CAMPAIGN & METRICS FETCHING
// =============================================================================

export interface TikTokCampaign {
    campaignId: string;
    campaignName: string;
    objectiveType: string;
    status: string;
    budget: number;
}

export async function getTikTokCampaigns(
    accessToken: string,
    advertiserId: string
): Promise<TikTokCampaign[]> {
    const response = await fetch(
        `${TIKTOK_API_BASE}/campaign/get/`,
        {
            method: 'POST',
            headers: {
                'Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                advertiser_id: advertiserId,
                page_size: 100,
            }),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch TikTok campaigns');
    }

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`TikTok API error: ${data.message}`);
    }

    return (data.data?.list || []).map((campaign: Record<string, unknown>) => ({
        campaignId: campaign.campaign_id as string,
        campaignName: campaign.campaign_name as string,
        objectiveType: campaign.objective_type as string,
        status: campaign.operation_status as string,
        budget: campaign.budget as number,
    }));
}

export interface TikTokMetrics {
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
}

export async function getTikTokMetrics(
    accessToken: string,
    advertiserId: string,
    startDate: string,
    endDate: string
): Promise<TikTokMetrics[]> {
    const response = await fetch(
        `${TIKTOK_API_BASE}/report/integrated/get/`,
        {
            method: 'POST',
            headers: {
                'Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                advertiser_id: advertiserId,
                report_type: 'BASIC',
                dimensions: ['campaign_id', 'stat_time_day'],
                metrics: ['spend', 'impressions', 'clicks', 'conversion'],
                data_level: 'AUCTION_CAMPAIGN',
                start_date: startDate,
                end_date: endDate,
                page_size: 1000,
            }),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch TikTok metrics');
    }

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`TikTok API error: ${data.message}`);
    }

    return (data.data?.list || []).map((row: Record<string, unknown>) => {
        const dimensions = row.dimensions as Record<string, string>;
        const metrics = row.metrics as Record<string, string>;
        return {
            campaignId: dimensions.campaign_id,
            date: dimensions.stat_time_day,
            impressions: parseInt(metrics.impressions || '0'),
            clicks: parseInt(metrics.clicks || '0'),
            conversions: parseFloat(metrics.conversion || '0'),
            spend: parseFloat(metrics.spend || '0'),
        };
    });
}

export async function refreshTikTokToken(
    refreshToken: string,
    app: CompanyOAuthApp
): Promise<TikTokTokenResponse> {
    throw new Error('TikTok does not support token refresh - tokens are long-lived (1 year)');
}
