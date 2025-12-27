/**
 * Google OAuth Callback Route
 * GET /api/integrations/callback/google
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    decodeOAuthState,
    validateOAuthState,
    getCompanyOAuthApp,
    exchangeGoogleCode,
    getGoogleAdsAccounts,
    saveGoogleConnection,
} from '@/lib/integrations';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(
            new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(
            new URL('/dashboard/integrations?error=missing_params', request.url)
        );
    }

    try {
        const supabase = await createServerSupabaseClient();

        const state = decodeOAuthState(stateParam);
        if (!state || state.platform !== 'google') {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=invalid_state', request.url)
            );
        }

        if (!validateOAuthState(state)) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=expired_state', request.url)
            );
        }

        // Get company's OAuth app credentials
        const oauthApp = await getCompanyOAuthApp(state.companyId, 'google', supabase);
        if (!oauthApp) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_credentials', request.url)
            );
        }

        // Exchange code for tokens using company credentials
        const tokenResponse = await exchangeGoogleCode(code, oauthApp);

        if (!tokenResponse.access_token) {
            throw new Error('No access token received');
        }

        // Get accounts using developer token from company app
        const developerToken = oauthApp.developer_token || '';
        const accounts = await getGoogleAdsAccounts(tokenResponse.access_token, developerToken);

        if (accounts.length === 0) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_accounts', request.url)
            );
        }

        const primaryAccount = accounts[0];

        const result = await saveGoogleConnection({
            companyId: state.companyId,
            accountId: primaryAccount.customerId,
            accountName: primaryAccount.descriptiveName,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token || '',
            expiresIn: tokenResponse.expires_in,
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to save connection');
        }

        await supabase.from('audit_logs').insert({
            company_id: state.companyId,
            user_id: state.userId,
            action: 'google_ads_connected',
            entity_type: 'ad_platform_connection',
            details: {
                account_id: primaryAccount.customerId,
                account_name: primaryAccount.descriptiveName,
            },
        });

        return NextResponse.redirect(
            new URL(`/dashboard/integrations?success=google&account=${encodeURIComponent(primaryAccount.descriptiveName)}`, request.url)
        );
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return NextResponse.redirect(
            new URL('/dashboard/integrations?error=callback_failed', request.url)
        );
    }
}
