'use client';

/**
 * WhatChangedToday Component
 * Activity feed showing ROI-impacting changes
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    DollarSign,
    Zap,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import type { WhatChangedItem } from '@/types/database';

interface WhatChangedTodayProps {
    items: WhatChangedItem[];
    loading?: boolean;
}

const typeConfig = {
    recommendation_executed: {
        icon: Zap,
        color: 'emerald',
        label: 'Action Executed',
    },
    anomaly_detected: {
        icon: AlertTriangle,
        color: 'amber',
        label: 'Anomaly Detected',
    },
    budget_change: {
        icon: DollarSign,
        color: 'blue',
        label: 'Budget Change',
    },
    performance_change: {
        icon: TrendingUp,
        color: 'purple',
        label: 'Performance Change',
    },
};

export function WhatChangedToday({ items, loading }: WhatChangedTodayProps) {
    const { isDark } = useDashboardTheme();

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const formatImpact = (impact: number | null) => {
        if (impact === null) return null;
        const formatted = Math.abs(impact).toFixed(1);
        return impact >= 0 ? `+${formatted}%` : `-${formatted}%`;
    };

    if (loading) {
        return (
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#242424] border border-white/5' : 'bg-white shadow-sm'}`}>
                <div className={`h-6 w-48 rounded animate-pulse mb-6 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-lg animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        <div className="flex-1">
                            <div className={`h-4 w-3/4 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                            <div className={`h-3 w-1/2 mt-2 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#242424] border border-white/5' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        What Changed Today
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                        {items.length} event{items.length !== 1 ? 's' : ''} today
                    </p>
                </div>
                <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    <Clock size={12} />
                    <span>Live updates</span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    <Clock size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No changes today yet</p>
                    <p className="text-sm mt-1">Check back later for updates</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {items.slice(0, 8).map((item, index) => {
                        const config = typeConfig[item.type] || typeConfig.performance_change;
                        const Icon = config.icon;
                        const impactFormatted = formatImpact(item.impact);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                    }`}
                            >
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? `bg-${config.color}-500/20` : `bg-${config.color}-100`
                                            }`}
                                    >
                                        <Icon size={16} className={`text-${config.color}-500`} />
                                    </div>
                                    {index < items.length - 1 && (
                                        <div
                                            className={`w-0.5 h-8 mt-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.title}
                                        </h4>
                                        {impactFormatted && (
                                            <span
                                                className={`flex items-center gap-0.5 text-xs font-medium ${item.is_positive ? 'text-emerald-500' : 'text-red-500'
                                                    }`}
                                            >
                                                {item.is_positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {impactFormatted}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                        {item.description || config.label}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                        {formatTime(item.timestamp)}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {items.length > 8 && (
                <button
                    className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    View all {items.length} events
                </button>
            )}
        </div>
    );
}

export default WhatChangedToday;
