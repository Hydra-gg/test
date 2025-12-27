'use client';

/**
 * useRecommendations Hook
 * Manages AI recommendations with approve/reject functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import {
    getRecommendations,
    getPendingRecommendations,
    approveRecommendation,
    rejectRecommendation,
    getUserCompany,
} from '@/lib/api';
import type { AIRecommendation, RecommendationStatus } from '@/types/database';

export function useRecommendations(statusFilter?: RecommendationStatus) {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Check if user can approve recommendations
    const canApprove = profile?.permissions?.approve ?? false;

    const fetchRecommendations = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const company = await getUserCompany(user.id);
            if (!company) {
                setRecommendations([]);
                return;
            }

            const recs = statusFilter
                ? await getRecommendations(company.id, statusFilter)
                : await getPendingRecommendations(company.id);

            setRecommendations(recs);
        } catch (err) {
            setError('Failed to load recommendations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, statusFilter]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const approve = useCallback(
        async (recommendationId: string) => {
            if (!user?.id || !canApprove) return false;

            setActionLoading(recommendationId);
            try {
                const success = await approveRecommendation(recommendationId, user.id);
                if (success) {
                    // Update local state
                    setRecommendations((prev) =>
                        prev.map((r) =>
                            r.id === recommendationId
                                ? { ...r, status: 'approved' as const, approved_by: user.id }
                                : r
                        )
                    );
                }
                return success;
            } finally {
                setActionLoading(null);
            }
        },
        [user?.id, canApprove]
    );

    const reject = useCallback(
        async (recommendationId: string, reason?: string) => {
            if (!user?.id || !canApprove) return false;

            setActionLoading(recommendationId);
            try {
                const success = await rejectRecommendation(recommendationId, user.id, reason);
                if (success) {
                    setRecommendations((prev) =>
                        prev.map((r) =>
                            r.id === recommendationId
                                ? { ...r, status: 'rejected' as const, rejected_by: user.id, rejection_reason: reason ?? null }
                                : r
                        )
                    );
                }
                return success;
            } finally {
                setActionLoading(null);
            }
        },
        [user?.id, canApprove]
    );

    return {
        recommendations,
        loading,
        error,
        actionLoading,
        canApprove,
        approve,
        reject,
        refetch: fetchRecommendations,
    };
}
