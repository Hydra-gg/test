/**
 * OAuth Configuration (Per-Company)
 * Fetches OAuth credentials from database per company
 */

import { supabase } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AdPlatformType = 'google' | 'meta' | 'tiktok' | 'linkedin';

export interface CompanyOAuthApp {
    id: string;
    company_id: string;
    platform: AdPlatformType;
    client_id: string;
    client_secret: string;
    developer_token: string | null;
    app_id: string | null;
    redirect_uri: string | null;
    is_active: boolean;
    is_verified: boolean;
}

export interface OAuthState {
    companyId: string;
    userId: string;
    platform: AdPlatformType;
    timestamp: number;
}

// =============================================================================
// FETCH COMPANY OAUTH CREDENTIALS
// =============================================================================

export async function getCompanyOAuthApp(
    companyId: string,
    platform: AdPlatformType,
    supabaseClient?: SupabaseClient
): Promise<CompanyOAuthApp | null> {
    const client = supabaseClient || supabase;
    const { data, error } = await client
        .from('company_oauth_apps')
        .select('*')
        .eq('company_id', companyId)
        .eq('platform', platform)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        return null;
    }

    return data as CompanyOAuthApp;
}

export async function getAllCompanyOAuthApps(
    companyId: string
): Promise<CompanyOAuthApp[]> {
    const { data, error } = await supabase
        .from('company_oauth_apps')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching OAuth apps:', error);
        return [];
    }

    return (data || []) as CompanyOAuthApp[];
}

// =============================================================================
// SAVE/UPDATE OAUTH CREDENTIALS
// =============================================================================

export interface SaveOAuthAppParams {
    companyId: string;
    platform: AdPlatformType;
    clientId: string;
    clientSecret: string;
    developerToken?: string;
    appId?: string;
    redirectUri?: string;
    createdBy: string;
}

export async function saveCompanyOAuthApp(params: SaveOAuthAppParams): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('company_oauth_apps')
        .upsert({
            company_id: params.companyId,
            platform: params.platform,
            client_id: params.clientId,
            client_secret: params.clientSecret,
            developer_token: params.developerToken || null,
            app_id: params.appId || null,
            redirect_uri: params.redirectUri || null,
            created_by: params.createdBy,
            is_active: true,
        }, {
            onConflict: 'company_id,platform',
        });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deleteCompanyOAuthApp(
    companyId: string,
    platform: AdPlatformType
): Promise<boolean> {
    const { error } = await supabase
        .from('company_oauth_apps')
        .delete()
        .eq('company_id', companyId)
        .eq('platform', platform);

    return !error;
}

// =============================================================================
// CHECK IF PLATFORM IS CONFIGURED FOR COMPANY
// =============================================================================

export async function isPlatformConfigured(
    companyId: string,
    platform: AdPlatformType
): Promise<boolean> {
    const app = await getCompanyOAuthApp(companyId, platform);
    return app !== null && app.is_active;
}

// =============================================================================
// STATE ENCODING/DECODING
// =============================================================================

export function encodeOAuthState(state: OAuthState): string {
    return Buffer.from(JSON.stringify(state)).toString('base64url');
}

export function decodeOAuthState(encodedState: string): OAuthState | null {
    try {
        const decoded = Buffer.from(encodedState, 'base64url').toString('utf8');
        return JSON.parse(decoded) as OAuthState;
    } catch {
        return null;
    }
}

export function validateOAuthState(state: OAuthState): boolean {
    const TEN_MINUTES = 10 * 60 * 1000;
    return Date.now() - state.timestamp < TEN_MINUTES;
}

// =============================================================================
// GENERATE PLATFORM-SPECIFIC AUTH URLS
// =============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getGoogleAuthUrl(app: CompanyOAuthApp, state: OAuthState): string {
    const redirectUri = app.redirect_uri || `${BASE_URL}/api/integrations/callback/google`;
    const params = new URLSearchParams({
        client_id: app.client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent',
        state: encodeOAuthState(state),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getMetaAuthUrl(app: CompanyOAuthApp, state: OAuthState): string {
    const redirectUri = app.redirect_uri || `${BASE_URL}/api/integrations/callback/meta`;
    const appId = app.app_id || app.client_id;
    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'ads_management,ads_read,business_management,public_profile',
        state: encodeOAuthState(state),
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

export function getTikTokAuthUrl(app: CompanyOAuthApp, state: OAuthState): string {
    const redirectUri = app.redirect_uri || `${BASE_URL}/api/integrations/callback/tiktok`;
    const appId = app.app_id || app.client_id;
    const params = new URLSearchParams({
        app_id: appId,
        redirect_uri: redirectUri,
        state: encodeOAuthState(state),
    });
    return `https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/?${params.toString()}`;
}

export function getLinkedInAuthUrl(app: CompanyOAuthApp, state: OAuthState): string {
    const redirectUri = app.redirect_uri || `${BASE_URL}/api/integrations/callback/linkedin`;
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: app.client_id,
        redirect_uri: redirectUri,
        scope: 'r_ads r_ads_reporting r_organization_social rw_ads',
        state: encodeOAuthState(state),
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

// Helper to get auth URL for any platform
export function getAuthUrl(app: CompanyOAuthApp, state: OAuthState): string {
    switch (app.platform) {
        case 'google':
            return getGoogleAuthUrl(app, state);
        case 'meta':
            return getMetaAuthUrl(app, state);
        case 'tiktok':
            return getTikTokAuthUrl(app, state);
        case 'linkedin':
            return getLinkedInAuthUrl(app, state);
        default:
            throw new Error(`Unknown platform: ${app.platform}`);
    }
}
