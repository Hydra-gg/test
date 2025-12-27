/**
 * TikTok OAuth Callback Route
 * GET /api/integrations/callback/tiktok
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
    decodeOAuthState,
    validateOAuthState,
    getCompanyOAuthApp,
    exchangeTikTokCode,
    getTikTokAdvertisers,
    saveTikTokConnection,
} from '@/lib/integrations';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const authCode = searchParams.get('auth_code');
    const stateParam = searchParams.get('state');

    if (!authCode || !stateParam) {
        return NextResponse.redirect(
            new URL('/dashboard/integrations?error=missing_params', request.url)
        );
    }

    try {
        const supabase = await createServerSupabaseClient();

        const state = decodeOAuthState(stateParam);
        if (!state || state.platform !== 'tiktok') {
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
        const oauthApp = await getCompanyOAuthApp(state.companyId, 'tiktok', supabase);
        if (!oauthApp) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_credentials', request.url)
            );
        }

        const tokenResponse = await exchangeTikTokCode(authCode, oauthApp);

        if (!tokenResponse.access_token || !tokenResponse.advertiser_ids?.length) {
            return NextResponse.redirect(
                new URL('/dashboard/integrations?error=no_accounts', request.url)
            );
        }

        const advertisers = await getTikTokAdvertisers(
            tokenResponse.access_token,
            tokenResponse.advertiser_ids
        );

        const primaryAdvertiser = advertisers[0] || {
            advertiserId: tokenResponse.advertiser_ids[0],
            advertiserName: `TikTok Account ${tokenResponse.advertiser_ids[0]}`,
        };

        const result = await saveTikTokConnection({
            companyId: state.companyId,
            advertiserId: primaryAdvertiser.advertiserId,
            advertiserName: primaryAdvertiser.advertiserName,
            accessToken: tokenResponse.access_token,
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to save connection');
        }

        await supabase.from('audit_logs').insert({
            company_id: state.companyId,
            user_id: state.userId,
            action: 'tiktok_ads_connected',
            entity_type: 'ad_platform_connection',
            details: {
                advertiser_id: primaryAdvertiser.advertiserId,
                advertiser_name: primaryAdvertiser.advertiserName,
            },
        });

        return NextResponse.redirect(
            new URL(`/dashboard/integrations?success=tiktok&account=${encodeURIComponent(primaryAdvertiser.advertiserName)}`, request.url)
        );
    } catch (err) {
        console.error('TikTok OAuth callback error:', err);
        return NextResponse.redirect(
            new URL('/dashboard/integrations?error=callback_failed', request.url)
        );
    }
}
