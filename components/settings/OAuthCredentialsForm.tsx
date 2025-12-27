'use client';

/**
 * OAuth App Credentials Form Component
 * For adding/editing ad platform OAuth credentials
 */

import { useState, useEffect } from 'react';
import type { AdPlatformType } from '@/lib/integrations';
import type { OAuthApp, SaveOAuthAppParams } from '@/hooks/useOAuthApps';
import styles from './OAuthCredentialsForm.module.css';

interface PlatformConfig {
    name: string;
    icon: string;
    color: string;
    fields: {
        clientId: { label: string; placeholder: string };
        clientSecret: { label: string; placeholder: string };
        developerToken?: { label: string; placeholder: string };
        appId?: { label: string; placeholder: string };
    };
    docsUrl: string;
}

const PLATFORM_CONFIGS: Record<AdPlatformType, PlatformConfig> = {
    google: {
        name: 'Google Ads',
        icon: '🔵',
        color: '#4285F4',
        fields: {
            clientId: { label: 'OAuth Client ID', placeholder: 'xxx.apps.googleusercontent.com' },
            clientSecret: { label: 'OAuth Client Secret', placeholder: 'GOCSPX-xxxxx' },
            developerToken: { label: 'Developer Token', placeholder: 'xxxx-xxxx-xxxx' },
        },
        docsUrl: 'https://developers.google.com/google-ads/api/docs/oauth/overview',
    },
    meta: {
        name: 'Meta (Facebook) Ads',
        icon: '🔷',
        color: '#1877F2',
        fields: {
            clientId: { label: 'App ID', placeholder: '123456789012345' },
            clientSecret: { label: 'App Secret', placeholder: 'xxxxxxxxxxxxxxxx' },
            appId: { label: 'Business Manager ID (optional)', placeholder: '123456789012345' },
        },
        docsUrl: 'https://developers.facebook.com/docs/marketing-apis/get-started',
    },
    tiktok: {
        name: 'TikTok Ads',
        icon: '🎵',
        color: '#000000',
        fields: {
            clientId: { label: 'App ID', placeholder: '123456789' },
            clientSecret: { label: 'App Secret', placeholder: 'xxxxxxxxxxxxxxxx' },
        },
        docsUrl: 'https://business-api.tiktok.com/portal/docs',
    },
    linkedin: {
        name: 'LinkedIn Ads',
        icon: '💼',
        color: '#0A66C2',
        fields: {
            clientId: { label: 'Client ID', placeholder: 'xxxxxxxxxxxxx' },
            clientSecret: { label: 'Client Secret', placeholder: 'xxxxxxxxxxxxxxxx' },
        },
        docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    },
};

interface Props {
    platform: AdPlatformType;
    existingApp?: OAuthApp;
    onSave: (params: SaveOAuthAppParams) => Promise<boolean>;
    onDelete?: () => Promise<boolean>;
    onCancel: () => void;
    saving: boolean;
}

export default function OAuthCredentialsForm({
    platform,
    existingApp,
    onSave,
    onDelete,
    onCancel,
    saving,
}: Props) {
    const config = PLATFORM_CONFIGS[platform];
    const [clientId, setClientId] = useState(existingApp?.client_id || '');
    const [clientSecret, setClientSecret] = useState('');
    const [developerToken, setDeveloperToken] = useState(existingApp?.developer_token || '');
    const [appId, setAppId] = useState(existingApp?.app_id || '');
    const [showSecret, setShowSecret] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setClientId(existingApp?.client_id || '');
        setDeveloperToken(existingApp?.developer_token || '');
        setAppId(existingApp?.app_id || '');
        setClientSecret('');
    }, [existingApp]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientId.trim()) return;
        if (!existingApp && !clientSecret.trim()) return;

        const success = await onSave({
            platform,
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim() || 'UNCHANGED',
            developerToken: developerToken.trim() || undefined,
            appId: appId.trim() || undefined,
        });

        if (success) {
            onCancel();
        }
    };

    const handleDelete = async () => {
        if (onDelete) {
            const success = await onDelete();
            if (success) {
                setShowDeleteConfirm(false);
                onCancel();
            }
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header} style={{ borderColor: config.color }}>
                    <span className={styles.icon}>{config.icon}</span>
                    <div>
                        <h2>{existingApp ? 'Edit' : 'Configure'} {config.name}</h2>
                        <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className={styles.docsLink}>
                            View Setup Documentation →
                        </a>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>{config.fields.clientId.label}</label>
                        <input
                            type="text"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder={config.fields.clientId.placeholder}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>
                            {config.fields.clientSecret.label}
                            {existingApp && <span className={styles.optional}> (leave blank to keep existing)</span>}
                        </label>
                        <div className={styles.secretField}>
                            <input
                                type={showSecret ? 'text' : 'password'}
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder={existingApp ? '••••••••••••' : config.fields.clientSecret.placeholder}
                                required={!existingApp}
                            />
                            <button
                                type="button"
                                className={styles.toggleSecret}
                                onClick={() => setShowSecret(!showSecret)}
                            >
                                {showSecret ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {config.fields.developerToken && (
                        <div className={styles.field}>
                            <label>{config.fields.developerToken.label}</label>
                            <input
                                type="text"
                                value={developerToken}
                                onChange={(e) => setDeveloperToken(e.target.value)}
                                placeholder={config.fields.developerToken.placeholder}
                            />
                        </div>
                    )}

                    {config.fields.appId && (
                        <div className={styles.field}>
                            <label>{config.fields.appId.label}</label>
                            <input
                                type="text"
                                value={appId}
                                onChange={(e) => setAppId(e.target.value)}
                                placeholder={config.fields.appId.placeholder}
                            />
                        </div>
                    )}

                    <div className={styles.actions}>
                        {existingApp && onDelete && (
                            <>
                                {showDeleteConfirm ? (
                                    <div className={styles.deleteConfirm}>
                                        <span>Delete credentials?</span>
                                        <button
                                            type="button"
                                            className={styles.confirmDelete}
                                            onClick={handleDelete}
                                            disabled={saving}
                                        >
                                            Yes, Delete
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.cancelDelete}
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.deleteBtn}
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </>
                        )}
                        <div className={styles.rightActions}>
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={onCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={styles.saveBtn}
                                disabled={saving || !clientId.trim() || (!existingApp && !clientSecret.trim())}
                                style={{ backgroundColor: config.color }}
                            >
                                {saving ? 'Saving...' : existingApp ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
