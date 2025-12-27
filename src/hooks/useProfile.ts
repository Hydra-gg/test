'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/types/database';

// Re-export Profile type for backwards compatibility
export type { Profile } from '@/types/database';


export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setProfile(null);
                setLoading(false);
                return;
            }

            // Reset loading state when user changes
            setLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('id, business_name, first_name, last_name, country, avatar_url, subscription_tier, subscription_status, company_id, role, permissions, created_at')
                    .eq('id', user.id)
                    .single();

                if (fetchError) {
                    setError(fetchError.message);
                } else {
                    setProfile(data as Profile);
                }
            } catch (err) {
                setError('Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    // Check if subscription is active
    const isPremium = profile?.subscription_status === 'active';

    return { profile, loading, error, isPremium };
}
