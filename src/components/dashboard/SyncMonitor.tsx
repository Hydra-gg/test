'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PlatformConnection {
    id: string;
    platform: string;
    account_name: string;
    sync_status: 'pending' | 'syncing' | 'healthy' | 'error';
    last_sync_at: string | null;
    sync_error: string | null;
    token_expires_at: string;
}

interface SyncMonitorProps {
    connections: PlatformConnection[];
    onSync?: (connectionId: string) => Promise<void>;
}

export function SyncMonitor({ connections, onSync }: SyncMonitorProps) {
    const [syncing, setSyncing] = useState<Record<string, boolean>>({});

    const handleSync = async (connectionId: string) => {
        if (!onSync) return;

        setSyncing(prev => ({ ...prev, [connectionId]: true }));
        try {
            await onSync(connectionId);
        } finally {
            setSyncing(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-400';
            case 'syncing': return 'text-blue-400';
            case 'error': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-500/10 text-green-400';
            case 'syncing': return 'bg-blue-500/10 text-blue-400';
            case 'error': return 'bg-red-500/10 text-red-400';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'google':
                return (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                );
            case 'meta':
                return (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                );
            case 'tiktok':
                return (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                );
            case 'linkedin':
                return (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                );
            default:
                return <div className="w-6 h-6 bg-gray-600 rounded-full" />;
        }
    };

    if (connections.length === 0) {
        return (
            <div className="bg-[#0A0A0A] border border-[#ffffff10] rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">No platform connections</div>
                <div className="text-sm text-gray-500">Connect your ad platforms to start syncing data</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {connections.map((connection) => {
                const tokenExpiresSoon = new Date(connection.token_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const isSyncing = syncing[connection.id] || connection.sync_status === 'syncing';

                return (
                    <div
                        key={connection.id}
                        className="bg-[#0A0A0A] border border-[#ffffff10] rounded-lg p-6 hover:border-[#ffffff20] transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex-shrink-0">
                                    {getPlatformIcon(connection.platform)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-white font-medium truncate">
                                            {connection.account_name}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(connection.sync_status)}`}>
                                            {connection.sync_status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="capitalize">{connection.platform}</span>
                                            {connection.last_sync_at && (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        Last synced {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {connection.sync_error && (
                                            <div className="text-red-400 text-xs mt-2 p-2 bg-red-500/10 rounded">
                                                {connection.sync_error}
                                            </div>
                                        )}

                                        {tokenExpiresSoon && (
                                            <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-500/10 rounded flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Token expires soon - reconnect to continue syncing
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {onSync && (
                                <button
                                    onClick={() => handleSync(connection.id)}
                                    disabled={isSyncing}
                                    className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg
                                        className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
