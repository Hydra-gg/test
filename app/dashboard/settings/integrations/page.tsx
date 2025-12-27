'use client';

/**
 * Integrations Settings Page
 * Manage ad platform OAuth credentials and connections
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOAuthApps } from '@/hooks/useOAuthApps';
import { useIntegrations } from '@/hooks/useIntegrations';
import OAuthCredentialsForm from '@/components/settings/OAuthCredentialsForm';
import { RefreshCw } from 'lucide-react';
import type { AdPlatformType } from '@/lib/integrations';
import styles from './page.module.css';

interface PlatformInfo {
    platform: AdPlatformType;
    name: string;
    icon: string;
    color: string;
    description: string;
}

const PLATFORMS: PlatformInfo[] = [
    {
        platform: 'google',
        name: 'Google Ads',
        icon: '🔵',
        color: '#4285F4',
        description: 'Search, Display, YouTube, Shopping campaigns',
    },
    {
        platform: 'meta',
        name: 'Meta Ads',
        icon: '🔷',
        color: '#1877F2',
        description: 'Facebook, Instagram, Messenger, Audience Network',
    },
    {
        platform: 'tiktok',
        name: 'TikTok Ads',
        icon: '🎵',
        color: '#000000',
        description: 'TikTok For Business advertising',
    },
    {
        platform: 'linkedin',
        name: 'LinkedIn Ads',
        icon: '💼',
        color: '#0A66C2',
        description: 'B2B advertising, Sponsored Content, InMail',
    },
];

export default function IntegrationsSettingsPage() {
    const router = useRouter();
    const { session } = useAuth();
    const { apps, canManage, loading, saving, error, saveApp, deleteApp, isPlatformConfigured } = useOAuthApps();
    const { connections, connect, disconnect, loading: connectionsLoading } = useIntegrations();

    const [editingPlatform, setEditingPlatform] = useState<AdPlatformType | null>(null);
    const [connectingPlatform, setConnectingPlatform] = useState<AdPlatformType | null>(null);
    const [syncingPlatform, setSyncingPlatform] = useState<AdPlatformType | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleConnect = async (platform: AdPlatformType) => {
        if (!isPlatformConfigured(platform)) {
            setStatusMessage({ type: 'error', message: `Please configure ${platform} credentials first` });
            return;
        }

        setConnectingPlatform(platform);
        setStatusMessage(null);

        try {
            const authUrl = await connect(platform);
            if (authUrl) {
                window.location.href = authUrl;
            }
        } catch (err) {
            setStatusMessage({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to connect'
            });
        } finally {
            setConnectingPlatform(null);
        }
    };

    const handleDisconnect = async (connectionId: string, platform: AdPlatformType) => {
        const success = await disconnect(connectionId);
        if (success) {
            setStatusMessage({ type: 'success', message: `${platform} disconnected successfully` });
        }
    };

    const handleSync = async (platform: AdPlatformType) => {
        setSyncingPlatform(platform);
        setStatusMessage(null);

        try {
            const response = await fetch('/api/cron/sync-metrics?scope=company');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Sync failed');

            setStatusMessage({ type: 'success', message: `Successfully synced ${platform} data` });
            // Ideally re-fetch connections to update last_synced_at, but we can rely on manual refresh for now
        } catch (error) {
            setStatusMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Sync failed'
            });
        } finally {
            setSyncingPlatform(null);
        }
    };

    const getConnectionForPlatform = (platform: AdPlatformType) => {
        return connections.find(c => c.platform === platform);
    };

    const existingApp = editingPlatform
        ? apps.find(app => app.platform === editingPlatform)
        : undefined;

    if (loading || connectionsLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading integrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Ad Platform Integrations</h1>
                    <p>Connect your advertising accounts to sync campaigns and metrics</p>
                </div>
                <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </header>

            {statusMessage && (
                <div className={`${styles.statusMessage} ${styles[statusMessage.type]}`}>
                    {statusMessage.message}
                    <button onClick={() => setStatusMessage(null)}>×</button>
                </div>
            )}

            {error && (
                <div className={`${styles.statusMessage} ${styles.error}`}>
                    {error}
                </div>
            )}

            <div className={styles.grid}>
                {PLATFORMS.map((platform) => {
                    const isConfigured = isPlatformConfigured(platform.platform);
                    const connection = getConnectionForPlatform(platform.platform);
                    const isConnected = !!connection;

                    return (
                        <div
                            key={platform.platform}
                            className={`${styles.card} ${isConnected ? styles.connected : ''}`}
                            style={{ '--platform-color': platform.color } as React.CSSProperties}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.platformIcon}>{platform.icon}</span>
                                <div className={styles.platformInfo}>
                                    <h3>{platform.name}</h3>
                                    <p>{platform.description}</p>
                                </div>
                                <div className={styles.statusBadge}>
                                    {isConnected ? (
                                        <span className={styles.connectedBadge}>✓ Connected</span>
                                    ) : isConfigured ? (
                                        <span className={styles.configuredBadge}>Ready</span>
                                    ) : (
                                        <span className={styles.notConfiguredBadge}>Not Configured</span>
                                    )}
                                </div>
                            </div>

                            {isConnected && connection && (
                                <div className={styles.connectionInfo}>
                                    <div className={styles.accountInfo}>
                                        <span className={styles.accountLabel}>Account:</span>
                                        <span className={styles.accountName}>{connection.account_name}</span>
                                    </div>
                                    <div className={styles.syncStatus}>
                                        <span className={`${styles.syncDot} ${styles[connection.sync_status]}`}></span>
                                        <span>Sync: {connection.sync_status}</span>
                                        {connection.last_sync_at && (
                                            <span className={styles.lastSynced}>
                                                {new Date(connection.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={styles.cardActions}>
                                {canManage && (
                                    <button
                                        className={styles.configureBtn}
                                        onClick={() => setEditingPlatform(platform.platform)}
                                    >
                                        {isConfigured ? '⚙️ Edit Credentials' : '🔧 Configure'}
                                    </button>
                                )}

                                {isConnected ? (
                                    <div className="flex gap-2 w-full">
                                        <button
                                            className={styles.syncBtn}
                                            onClick={() => handleSync(platform.platform)}
                                            disabled={!!syncingPlatform}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <RefreshCw className={`w-3 h-3 ${syncingPlatform === platform.platform ? 'animate-spin' : ''}`} />
                                            {syncingPlatform === platform.platform ? 'Syncing...' : 'Sync'}
                                        </button>
                                        <button
                                            className={styles.disconnectBtn}
                                            onClick={() => handleDisconnect(connection!.id, platform.platform)}
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={styles.connectBtn}
                                        onClick={() => handleConnect(platform.platform)}
                                        disabled={!isConfigured || connectingPlatform === platform.platform}
                                        style={{ backgroundColor: isConfigured ? platform.color : undefined }}
                                    >
                                        {connectingPlatform === platform.platform
                                            ? 'Connecting...'
                                            : '🔗 Connect Account'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <section className={styles.helpSection}>
                <h2>How to Set Up</h2>
                <ol className={styles.steps}>
                    <li>
                        <strong>Configure API Credentials:</strong> Click "Configure" on each platform and enter your OAuth app credentials from the respective developer console.
                    </li>
                    <li>
                        <strong>Connect Account:</strong> Click "Connect Account" to authorize access to your advertising data.
                    </li>
                    <li>
                        <strong>Start Syncing:</strong> Once connected, your campaigns and metrics will automatically sync to your dashboard.
                    </li>
                </ol>
            </section>

            {editingPlatform && (
                <OAuthCredentialsForm
                    platform={editingPlatform}
                    existingApp={existingApp}
                    onSave={saveApp}
                    onDelete={existingApp ? () => deleteApp(editingPlatform) : undefined}
                    onCancel={() => setEditingPlatform(null)}
                    saving={saving}
                />
            )}
        </div>
    );
}
