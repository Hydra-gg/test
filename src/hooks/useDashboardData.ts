'use client';

/**
 * useDashboardData Hook
 * Fetches all data needed for the executive dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDashboardKPIs,
    getPendingRecommendations,
    getCampaigns,
    getNotifications,
    getWhatChangedToday,
    getUserCompany,
} from '@/lib/api';
import type {
    Company,
    Campaign,
    AIRecommendation,
    Notification,
    DashboardKPIs,
    WhatChangedItem,
} from '@/types/database';

export interface DashboardData {
    company: Company | null;
    kpis: DashboardKPIs | null;
    campaigns: Campaign[];
    pendingRecommendations: AIRecommendation[];
    notifications: Notification[];
    whatChangedToday: WhatChangedItem[];
}

export function useDashboardData() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData>({
        company: null,
        kpis: null,
        campaigns: [],
        pendingRecommendations: [],
        notifications: [],
        whatChangedToday: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // First get the user's company
            const company = await getUserCompany(user.id);

            if (!company) {
                // User has no company yet - might be in onboarding
                setData({
                    company: null,
                    kpis: null,
                    campaigns: [],
                    pendingRecommendations: [],
                    notifications: [],
                    whatChangedToday: [],
                });
                setLoading(false);
                return;
            }

            // Fetch all dashboard data in parallel
            const [kpis, campaigns, pendingRecs, notifications, whatChanged] = await Promise.all([
                getDashboardKPIs(company.id),
                getCampaigns(company.id),
                getPendingRecommendations(company.id),
                getNotifications(user.id, true), // unread only
                getWhatChangedToday(company.id),
            ]);

            setData({
                company,
                kpis,
                campaigns,
                pendingRecommendations: pendingRecs,
                notifications,
                whatChangedToday: whatChanged,
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refetch function for manual refresh
    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        ...data,
        loading,
        error,
        refetch,
    };
}
