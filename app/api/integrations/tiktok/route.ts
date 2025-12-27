/**
 * TikTok Ads OAuth Initiation Route (Per-Company Credentials)
 * GET /api/integrations/tiktok
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCompanyOAuthApp, getTikTokAuthUrl, type OAuthState } from '@/lib/integrations/oauth-config';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
        }

        const oauthApp = await getCompanyOAuthApp(profile.company_id, 'tiktok', supabase);

        if (!oauthApp) {
            return NextResponse.json(
                {
                    error: 'TikTok Ads not configured',
                    message: 'Please add your TikTok Marketing API credentials in Settings > Integrations',
                    needsSetup: true
                },
                { status: 400 }
            );
        }

        const state: OAuthState = {
            companyId: profile.company_id,
            userId: user.id,
            platform: 'tiktok',
            timestamp: Date.now(),
        };

        const authUrl = getTikTokAuthUrl(oauthApp, state);
        return NextResponse.json({ authUrl });
    } catch (error) {
        console.error('TikTok OAuth initiation error:', error);
        return NextResponse.json({ error: 'Failed to initiate TikTok OAuth' }, { status: 500 });
    }
}
