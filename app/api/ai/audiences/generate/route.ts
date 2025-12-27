import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateAudienceSegments } from '@/lib/ai/audience-generator';

export async function POST(req: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { description, platform } = body;

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const audiences = await generateAudienceSegments(description, platform);

        return NextResponse.json({ audiences });
    } catch (error) {
        console.error('Error in audience generation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
