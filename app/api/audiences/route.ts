import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAudiences, saveAudience } from '@/lib/api';

export async function GET(req: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const audiences = await getAudiences(profile.company_id, supabase);
    return NextResponse.json(audiences);
}

export async function POST(req: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    try {
        const body = await req.json();
        const { name, platform, type, targeting_spec, size_estimate } = body;

        const audience = await saveAudience({
            company_id: profile.company_id,
            name,
            platform,
            type: type || 'custom',
            targeting_spec,
            size_estimate
        }, supabase);

        return NextResponse.json(audience);
    } catch (error) {
        console.error('Error saving audience:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
