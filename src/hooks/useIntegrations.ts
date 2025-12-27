'use client';

/**
 * useIntegrations Hook
 * Manages ad platform connections for the current user/company
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getAdPlatformConnections, getUserCompany } from '@/lib/api';
import type { AdPlatformConnection, AdPlatform } from '@/types/database';

export interface IntegrationsState {
    connections: AdPlatformConnection[];
    loading: boolean;
    error: string | null;
}

export function useIntegrations() {
    const { user } = useAuth();
    const [connections, setConnections] = useState<AdPlatformConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);

    const fetchConnections = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const company = await getUserCompany(user.id);
            if (!company) {
                setConnections([]);
                setLoading(false);
                return;
            }

            setCompanyId(company.id);
            const data = await getAdPlatformConnections(company.id);
            setConnections(data);
        } catch (err) {
            console.error('Error fetching integrations:', err);
            setError('Failed to load integrations');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    // Check if a platform is connected
    const isConnected = useCallback((platform: AdPlatform): boolean => {
        return connections.some(c => c.platform === platform && c.sync_status !== 'error');
    }, [connections]);

    // Get connection for a specific platform
    const getConnection = useCallback((platform: AdPlatform): AdPlatformConnection | undefined => {
        return connections.find(c => c.platform === platform);
    }, [connections]);

    // Initiate OAuth flow for a platform
    const connect = useCallback(async (platform: AdPlatform): Promise<string | null> => {
        if (!user?.id) return null;

        try {
            // Get auth token for API call
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return null;

            const response = await fetch(`/api/integrations/${platform}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to initiate OAuth');
            }

            const data = await response.json();
            return data.authUrl;
        } catch (err) {
            console.error(`Error connecting ${platform}:`, err);
            setError(`Failed to connect ${platform}`);
            return null;
        }
    }, [user?.id]);

    // Disconnect a platform
    const disconnect = useCallback(async (connectionId: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('ad_platform_connections')
                .delete()
                .eq('id', connectionId);

            if (deleteError) throw deleteError;

            // Update local state
            setConnections(prev => prev.filter(c => c.id !== connectionId));
            return true;
        } catch (err) {
            console.error('Error disconnecting:', err);
            setError('Failed to disconnect platform');
            return false;
        }
    }, []);

    // Trigger a sync for a connection
    const triggerSync = useCallback(async (connectionId: string): Promise<boolean> => {
        try {
            // Update status to syncing
            const { error: updateError } = await supabase
                .from('ad_platform_connections')
                .update({ sync_status: 'syncing' })
                .eq('id', connectionId);

            if (updateError) throw updateError;

            // Update local state
            setConnections(prev =>
                prev.map(c =>
                    c.id === connectionId ? { ...c, sync_status: 'syncing' as const } : c
                )
            );

            // Trigger sync API (will be implemented in Phase 2.4)
            // await fetch(`/api/integrations/sync/${connectionId}`, { method: 'POST' });

            return true;
        } catch (err) {
            console.error('Error triggering sync:', err);
            return false;
        }
    }, []);

    return {
        connections,
        loading,
        error,
        companyId,
        isConnected,
        getConnection,
        connect,
        disconnect,
        triggerSync,
        refetch: fetchConnections,
    };
}
