'use client';

/**
 * useCampaigns Hook
 * Fetches and manages campaign data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, getCampaignsByStatus, getUserCompany } from '@/lib/api';
import type { Campaign, CampaignStatus } from '@/types/database';

export function useCampaigns(statusFilter?: CampaignStatus) {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const company = await getUserCompany(user.id);
            if (!company) {
                setCampaigns([]);
                return;
            }

            const data = statusFilter
                ? await getCampaignsByStatus(company.id, statusFilter)
                : await getCampaigns(company.id);

            setCampaigns(data);
        } catch (err) {
            setError('Failed to load campaigns');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, statusFilter]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Derived stats
    const stats = {
        total: campaigns.length,
        active: campaigns.filter((c) => c.status === 'active').length,
        paused: campaigns.filter((c) => c.status === 'paused').length,
        ended: campaigns.filter((c) => c.status === 'ended').length,
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget_daily || 0), 0),
    };

    return {
        campaigns,
        loading,
        error,
        stats,
        refetch: fetchCampaigns,
    };
}
