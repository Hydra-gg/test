import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAudiences } from '@/lib/api';
import { AudienceManagerLayout } from './AudienceManagerLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AudiencePage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/?action=login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return <div>No company profile</div>;
    }

    const audiences = await getAudiences(profile.company_id);

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
            <DashboardHeader
                user={{
                    name: profile.full_name || 'User',
                    email: profile.email || '',
                    role: profile.role || 'Member',
                    avatar_url: profile.avatar_url || ''
                }}
                companyName="Escalate Corp"
            />

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Audience Manager</h1>
                    <p className="text-gray-400 text-lg">
                        Build and manage high-converting audience segments using AI.
                    </p>
                </div>

                <AudienceManagerLayout initialAudiences={audiences} />
            </div>
        </main>
    );
}
