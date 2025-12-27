/**
 * Meta OAuth Callback Route
 * GET /api/integrations/callback/meta
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    decodeOAuthState,
    validateOAuthState,
    getCompanyOAuthApp,
    exchangeMetaCode,
    getLongLivedToken,
    getMetaAdAccounts,
    saveMetaConnection,
} from '@/lib/integrations';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        console.error('Meta OAuth error:', error);
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
        if (!state || state.platform !== 'meta') {
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
        const oauthApp = await getCompanyOAuthApp(state.companyId, 'meta', supabase);
        if (!oauthApp) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_credentials', request.url)
            );
        }

        // Exchange code for short-lived token
        const shortLivedToken = await exchangeMetaCode(code, oauthApp);
        if (!shortLivedToken.access_token) {
            throw new Error('No access token received');
        }

        // Get long-lived token
        const longLivedToken = await getLongLivedToken(shortLivedToken.access_token, oauthApp);
        const accounts = await getMetaAdAccounts(longLivedToken.access_token);

        if (accounts.length === 0) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_accounts', request.url)
            );
        }

        const activeAccounts = accounts.filter(a => a.accountStatus === 1);
        const accountToSave = activeAccounts[0] || accounts[0];

        const result = await saveMetaConnection({
            companyId: state.companyId,
            accountId: accountToSave.accountId,
            accountName: accountToSave.name,
            accessToken: longLivedToken.access_token,
            expiresIn: longLivedToken.expires_in,
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to save connection');
        }

        await supabase.from('audit_logs').insert({
            company_id: state.companyId,
            user_id: state.userId,
            action: 'meta_ads_connected',
            entity_type: 'ad_platform_connection',
            details: {
                account_id: accountToSave.accountId,
                account_name: accountToSave.name,
            },
        });

        return NextResponse.redirect(
            new URL(`/dashboard/integrations?success=meta&account=${encodeURIComponent(accountToSave.name)}`, request.url)
        );
    } catch (err) {
        console.error('Meta OAuth callback error:', err);
        return NextResponse.redirect(
            new URL('/dashboard/integrations?error=callback_failed', request.url)
        );
    }
}
