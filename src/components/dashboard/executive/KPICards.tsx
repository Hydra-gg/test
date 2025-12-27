'use client';

/**
 * KPICards Component
 * Executive-level metrics display for CEO dashboard
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Users,
    Activity,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import type { DashboardKPIs } from '@/types/database';

interface KPICardsProps {
    kpis: DashboardKPIs | null;
    loading?: boolean;
}

export function KPICards({ kpis, loading }: KPICardsProps) {
    const { isDark } = useDashboardTheme();

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(2)}`;
    };

    const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

    const cards = [
        {
            id: 'roi',
            label: 'Total ROI',
            value: kpis ? formatPercent(kpis.total_roi) : '--',
            icon: TrendingUp,
            color: 'emerald',
            trend: kpis && kpis.total_roi > 0 ? 'up' : 'down',
            description: 'Return on investment',
        },
        {
            id: 'roas',
            label: 'ROAS',
            value: kpis ? `${kpis.total_roas.toFixed(2)}x` : '--',
            icon: Target,
            color: 'blue',
            trend: kpis && kpis.total_roas > 2 ? 'up' : kpis && kpis.total_roas > 1 ? 'neutral' : 'down',
            description: 'Return on ad spend',
        },
        {
            id: 'spend',
            label: 'Total Spend',
            value: kpis ? formatCurrency(kpis.total_spend) : '--',
            icon: DollarSign,
            color: 'purple',
            subValue: kpis ? `${kpis.active_campaigns} active campaigns` : '',
            description: 'Last 30 days',
        },
        {
            id: 'revenue',
            label: 'Revenue',
            value: kpis ? formatCurrency(kpis.total_revenue) : '--',
            icon: Activity,
            color: 'teal',
            trend: kpis && kpis.total_revenue > kpis.total_spend ? 'up' : 'down',
            description: 'Attributed revenue',
        },
        {
            id: 'cac',
            label: 'CAC',
            value: kpis ? formatCurrency(kpis.cac) : '--',
            icon: Users,
            color: 'orange',
            trend: kpis && kpis.ltv > kpis.cac * 3 ? 'up' : 'down',
            description: 'Customer acquisition cost',
        },
        {
            id: 'efficiency',
            label: 'Spend Efficiency',
            value: kpis ? `${(kpis.spend_efficiency * 100).toFixed(0)}%` : '--',
            icon: Zap,
            color: 'rose',
            trend: kpis && kpis.spend_efficiency > 1 ? 'up' : 'down',
            description: 'Revenue / Spend ratio',
        },
    ];

    const alertCards = [
        {
            id: 'recommendations',
            label: 'Pending Actions',
            value: kpis?.pending_recommendations ?? 0,
            icon: AlertTriangle,
            color: kpis && kpis.pending_recommendations > 5 ? 'amber' : 'emerald',
        },
        {
            id: 'anomalies',
            label: 'Anomalies',
            value: kpis?.anomalies_count ?? 0,
            icon: AlertTriangle,
            color: kpis && kpis.anomalies_count > 0 ? 'red' : 'emerald',
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className={`p-5 rounded-2xl animate-pulse ${isDark ? 'bg-[#242424]' : 'bg-white'
                            }`}
                    >
                        <div className={`h-10 w-10 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        <div className={`h-4 w-20 mt-4 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        <div className={`h-8 w-28 mt-2 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main KPI Grid */}
            <div className="grid grid-cols-6 gap-4">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-5 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer ${isDark
                                    ? 'bg-[#242424] border border-white/5 hover:border-white/10'
                                    : 'bg-white shadow-sm hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                                        }`}
                                >
                                    <Icon size={20} className="text-emerald-500" />
                                </div>
                                {card.trend && (
                                    <div
                                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${card.trend === 'up'
                                                ? isDark
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-emerald-50 text-emerald-600'
                                                : card.trend === 'down'
                                                    ? isDark
                                                        ? 'bg-red-500/10 text-red-400'
                                                        : 'bg-red-50 text-red-600'
                                                    : isDark
                                                        ? 'bg-white/5 text-white/50'
                                                        : 'bg-gray-50 text-gray-500'
                                            }`}
                                    >
                                        {card.trend === 'up' ? (
                                            <TrendingUp size={12} />
                                        ) : card.trend === 'down' ? (
                                            <TrendingDown size={12} />
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <p className={`text-xs mt-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                {card.label}
                            </p>
                            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {card.value}
                            </p>
                            {card.description && (
                                <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                    {card.description}
                                </p>
                            )}
                            {card.subValue && (
                                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    {card.subValue}
                                </p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Alert Cards Row */}
            <div className="grid grid-cols-2 gap-4">
                {alertCards.map((card, index) => {
                    const Icon = card.icon;
                    const isHighlight = card.color === 'red' || card.color === 'amber';
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            className={`p-4 rounded-2xl flex items-center gap-4 ${isHighlight
                                    ? isDark
                                        ? 'bg-amber-500/10 border border-amber-500/20'
                                        : 'bg-amber-50 border border-amber-200'
                                    : isDark
                                        ? 'bg-[#242424] border border-white/5'
                                        : 'bg-white shadow-sm'
                                }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                                    }`}
                            >
                                <Icon size={24} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                    {card.label}
                                </p>
                                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {card.value}
                                </p>
                            </div>
                            {card.value > 0 && (
                                <button
                                    className={`ml-auto px-4 py-2 rounded-full text-sm font-medium transition-colors ${isDark
                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Review
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default KPICards;
