/**
 * API Route: Manage Company OAuth Apps
 * GET /api/settings/oauth-apps - List all OAuth apps for company
 * POST /api/settings/oauth-apps - Create/update OAuth app
 * DELETE /api/settings/oauth-apps - Delete OAuth app
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdPlatformType } from '@/lib/integrations';

// GET: Fetch all OAuth apps for the user's company
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

        // Get user's profile and company
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated' }, { status: 400 });
        }

        // Fetch OAuth apps for company (mask secrets for non-admins)
        const { data: apps, error } = await supabase
            .from('company_oauth_apps')
            .select('id, platform, client_id, developer_token, app_id, redirect_uri, is_active, is_verified, created_at, updated_at')
            .eq('company_id', profile.company_id)
            .order('platform');

        if (error) {
            console.error('Error fetching OAuth apps:', error);
            return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
        }

        // Include whether user can manage (CEO or admin)
        const canManage = profile.role === 'ceo' || profile.role === 'admin';

        return NextResponse.json({ apps: apps || [], canManage });
    } catch (error) {
        console.error('OAuth apps GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create or update OAuth app
export async function POST(request: NextRequest) {
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
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated' }, { status: 400 });
        }

        // Only CEO can manage OAuth apps
        if (profile.role !== 'ceo' && profile.role !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { platform, clientId, clientSecret, developerToken, appId, redirectUri } = body;

        if (!platform || !clientId || !clientSecret) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validPlatforms: AdPlatformType[] = ['google', 'meta', 'tiktok', 'linkedin'];
        if (!validPlatforms.includes(platform)) {
            return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
        }

        // Upsert OAuth app
        const { data, error } = await supabase
            .from('company_oauth_apps')
            .upsert({
                company_id: profile.company_id,
                platform,
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken || null,
                app_id: appId || null,
                redirect_uri: redirectUri || null,
                created_by: user.id,
                is_active: true,
            }, {
                onConflict: 'company_id,platform',
            })
            .select('id, platform, client_id, is_active, created_at')
            .single();

        if (error) {
            console.error('Error saving OAuth app:', error);
            return NextResponse.json({ error: 'Failed to save app' }, { status: 500 });
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            company_id: profile.company_id,
            user_id: user.id,
            action: 'oauth_app_saved',
            entity_type: 'company_oauth_apps',
            entity_id: data.id,
            details: { platform },
        });

        return NextResponse.json({ success: true, app: data });
    } catch (error) {
        console.error('OAuth apps POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove OAuth app
export async function DELETE(request: NextRequest) {
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
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'No company associated' }, { status: 400 });
        }

        if (profile.role !== 'ceo') {
            return NextResponse.json({ error: 'Only CEO can delete OAuth apps' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') as AdPlatformType;

        if (!platform) {
            return NextResponse.json({ error: 'Platform required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('company_oauth_apps')
            .delete()
            .eq('company_id', profile.company_id)
            .eq('platform', platform);

        if (error) {
            console.error('Error deleting OAuth app:', error);
            return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            company_id: profile.company_id,
            user_id: user.id,
            action: 'oauth_app_deleted',
            entity_type: 'company_oauth_apps',
            details: { platform },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('OAuth apps DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
