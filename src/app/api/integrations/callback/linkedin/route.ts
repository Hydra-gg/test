/**
 * LinkedIn OAuth Callback Route
 * GET /api/integrations/callback/linkedin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    decodeOAuthState,
    validateOAuthState,
    getCompanyOAuthApp,
    exchangeLinkedInCode,
    getLinkedInAdAccounts,
    saveLinkedInConnection,
} from '@/lib/integrations';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        console.error('LinkedIn OAuth error:', error);
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
        if (!state || state.platform !== 'linkedin') {
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
        const oauthApp = await getCompanyOAuthApp(state.companyId, 'linkedin', supabase);
        if (!oauthApp) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_credentials', request.url)
            );
        }

        const tokenResponse = await exchangeLinkedInCode(code, oauthApp);

        if (!tokenResponse.access_token) {
            throw new Error('No access token received');
        }

        const accounts = await getLinkedInAdAccounts(tokenResponse.access_token);

        if (accounts.length === 0) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_accounts', request.url)
            );
        }

        const primaryAccount = accounts[0];

        const result = await saveLinkedInConnection({
            companyId: state.companyId,
            accountId: primaryAccount.id,
            accountName: primaryAccount.name,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to save connection');
        }

        await supabase.from('audit_logs').insert({
            company_id: state.companyId,
            user_id: state.userId,
            action: 'linkedin_ads_connected',
            entity_type: 'ad_platform_connection',
            details: {
                account_id: primaryAccount.id,
                account_name: primaryAccount.name,
            },
        });

        return NextResponse.redirect(
            new URL(`/dashboard/integrations?success=linkedin&account=${encodeURIComponent(primaryAccount.name)}`, request.url)
        );
    } catch (err) {
        console.error('LinkedIn OAuth callback error:', err);
        return NextResponse.redirect(
            new URL('/dashboard/integrations?error=callback_failed', request.url)
        );
    }
}
