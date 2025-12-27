/**
 * useOAuthApps Hook
 * Manages OAuth app credentials for each ad platform
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { AdPlatformType } from '@/lib/integrations';

export interface OAuthApp {
    id: string;
    platform: AdPlatformType;
    client_id: string;
    developer_token?: string;
    app_id?: string;
    redirect_uri?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface SaveOAuthAppParams {
    platform: AdPlatformType;
    clientId: string;
    clientSecret: string;
    developerToken?: string;
    appId?: string;
    redirectUri?: string;
}

export function useOAuthApps() {
    const { session } = useAuth();
    const [apps, setApps] = useState<OAuthApp[]>([]);
    const [canManage, setCanManage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchApps = useCallback(async () => {
        if (!session?.access_token) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/settings/oauth-apps', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch OAuth apps');
            }

            const data = await response.json();
            setApps(data.apps || []);
            setCanManage(data.canManage || false);
        } catch (err) {
            console.error('Error fetching OAuth apps:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch apps');
        } finally {
            setLoading(false);
        }
    }, [session?.access_token]);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const saveApp = useCallback(async (params: SaveOAuthAppParams): Promise<boolean> => {
        if (!session?.access_token) return false;

        try {
            setSaving(true);
            setError(null);

            const response = await fetch('/api/settings/oauth-apps', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save OAuth app');
            }

            await fetchApps(); // Refresh list
            return true;
        } catch (err) {
            console.error('Error saving OAuth app:', err);
            setError(err instanceof Error ? err.message : 'Failed to save app');
            return false;
        } finally {
            setSaving(false);
        }
    }, [session?.access_token, fetchApps]);

    const deleteApp = useCallback(async (platform: AdPlatformType): Promise<boolean> => {
        if (!session?.access_token) return false;

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`/api/settings/oauth-apps?platform=${platform}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete OAuth app');
            }

            await fetchApps(); // Refresh list
            return true;
        } catch (err) {
            console.error('Error deleting OAuth app:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete app');
            return false;
        } finally {
            setSaving(false);
        }
    }, [session?.access_token, fetchApps]);

    const getAppByPlatform = useCallback((platform: AdPlatformType): OAuthApp | undefined => {
        return apps.find(app => app.platform === platform);
    }, [apps]);

    const isPlatformConfigured = useCallback((platform: AdPlatformType): boolean => {
        return apps.some(app => app.platform === platform && app.is_active);
    }, [apps]);

    return {
        apps,
        canManage,
        loading,
        saving,
        error,
        saveApp,
        deleteApp,
        getAppByPlatform,
        isPlatformConfigured,
        refresh: fetchApps,
    };
}
