'use client';

/**
 * RecommendationQueue Component
 * AI-generated recommendations with approve/reject actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    TrendingUp,
    TrendingDown,
    Pause,
    DollarSign,
    RefreshCw,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import type { AIRecommendation } from '@/types/database';

interface RecommendationQueueProps {
    recommendations: AIRecommendation[];
    loading?: boolean;
    onApprove: (id: string) => Promise<boolean>;
    onReject: (id: string, reason?: string) => Promise<boolean>;
    canApprove: boolean;
    actionLoading?: string | null;
}

const typeIcons: Record<string, typeof Zap> = {
    budget_shift: DollarSign,
    pause: Pause,
    scale: TrendingUp,
    creative_swap: RefreshCw,
    audience_adjust: Users,
    bid_adjust: TrendingDown,
    creative_refresh: RefreshCw,
};

const priorityColors = {
    low: 'gray',
    medium: 'blue',
    high: 'amber',
    critical: 'red',
};

export function RecommendationQueue({
    recommendations,
    loading,
    onApprove,
    onReject,
    canApprove,
    actionLoading,
}: RecommendationQueueProps) {
    const { isDark } = useDashboardTheme();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async (id: string) => {
        const success = await onApprove(id);
        if (success && expandedId === id) {
            setExpandedId(null);
        }
    };

    const handleReject = async (id: string) => {
        const success = await onReject(id, rejectReason);
        if (success) {
            setRejectingId(null);
            setRejectReason('');
            if (expandedId === id) setExpandedId(null);
        }
    };

    const formatROIImpact = (impact: number | null) => {
        if (impact === null) return 'Unknown';
        const sign = impact >= 0 ? '+' : '';
        return `${sign}${impact.toFixed(1)}% ROI`;
    };

    const formatConfidence = (score: number) => {
        if (score >= 0.8) return { label: 'High', color: 'emerald' };
        if (score >= 0.5) return { label: 'Medium', color: 'amber' };
        return { label: 'Low', color: 'red' };
    };

    if (loading) {
        return (
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#242424] border border-white/5' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className={`h-6 w-40 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`p-4 rounded-xl mb-3 animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className={`h-5 w-3/4 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                        <div className={`h-4 w-1/2 mt-2 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                    </div>
                ))}
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#242424] border border-white/5' : 'bg-white shadow-sm'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    AI Recommendations
                </h3>
                <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm mt-1">No pending recommendations</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#242424] border border-white/5' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        AI Recommendations
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                        {recommendations.length} pending action{recommendations.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    View All
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {recommendations.slice(0, 5).map((rec, index) => {
                        const Icon = typeIcons[rec.type] || Zap;
                        const priorityColor = priorityColors[rec.priority];
                        const confidence = formatConfidence(rec.confidence_score);
                        const isExpanded = expandedId === rec.id;
                        const isRejecting = rejectingId === rec.id;
                        const isLoading = actionLoading === rec.id;

                        return (
                            <motion.div
                                key={rec.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`rounded-xl overflow-hidden transition-all ${isDark
                                        ? 'bg-white/5 hover:bg-white/10 border border-white/5'
                                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                                    } ${isExpanded ? 'ring-2 ring-emerald-500/50' : ''}`}
                            >
                                {/* Main Content */}
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? `bg-${priorityColor}-500/20` : `bg-${priorityColor}-100`
                                                }`}
                                        >
                                            <Icon size={20} className={`text-${priorityColor}-500`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {rec.title}
                                                </h4>
                                                {rec.priority === 'critical' && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                                                        Critical
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm mt-0.5 truncate ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                                {rec.description || rec.action_summary}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span
                                                    className={`text-xs font-medium ${rec.predicted_roi_impact && rec.predicted_roi_impact > 0
                                                            ? 'text-emerald-500'
                                                            : 'text-red-500'
                                                        }`}
                                                >
                                                    {formatROIImpact(rec.predicted_roi_impact)}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${isDark ? `bg-${confidence.color}-500/20 text-${confidence.color}-400` : `bg-${confidence.color}-100 text-${confidence.color}-700`
                                                        }`}
                                                >
                                                    {confidence.label} confidence
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight
                                            size={20}
                                            className={`flex-shrink-0 transition-transform ${isDark ? 'text-white/30' : 'text-gray-400'
                                                } ${isExpanded ? 'rotate-90' : ''}`}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Actions */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div
                                                className={`px-4 py-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100/50'
                                                    }`}
                                            >
                                                {isRejecting ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Reason for rejection (optional)"
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            className={`w-full px-3 py-2 rounded-lg text-sm ${isDark
                                                                    ? 'bg-white/10 border border-white/20 text-white placeholder-white/30'
                                                                    : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'
                                                                }`}
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleReject(rec.id)}
                                                                disabled={isLoading}
                                                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                                                            >
                                                                Confirm Reject
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectingId(null)}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'
                                                                    }`}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApprove(rec.id)}
                                                            disabled={!canApprove || isLoading}
                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isLoading ? (
                                                                <RefreshCw size={16} className="animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 size={16} />
                                                            )}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectingId(rec.id)}
                                                            disabled={!canApprove || isLoading}
                                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${isDark
                                                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            <XCircle size={16} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {!canApprove && (
                                                    <p className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                                        <AlertCircle size={12} />
                                                        You don&apos;t have permission to approve actions
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {recommendations.length > 5 && (
                <button
                    className={`w-full mt-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    View {recommendations.length - 5} more recommendations
                </button>
            )}
        </div>
    );
}

export default RecommendationQueue;
