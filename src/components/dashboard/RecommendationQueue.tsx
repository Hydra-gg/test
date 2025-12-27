'use client';

import { useState } from 'react';
import { Check, X, ArrowRight, AlertCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recommendation } from '@/lib/ai/recommendation-generator';

interface RecommendationQueueProps {
    recommendations: Recommendation[];
    onAction: (id: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
}

export function RecommendationQueue({ recommendations: initialData, onAction }: RecommendationQueueProps) {
    const [recommendations, setRecommendations] = useState(initialData);
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessing(id);
        await onAction(id, action);

        // Remove from list
        setRecommendations(prev => prev.filter(r => r.campaignId !== id && (r as any).id !== id)); // Handle both ID types slightly hackily for now
        setProcessing(null);
    };

    if (recommendations.length === 0) {
        return (
            <div className="bg-[#111111] border border-[#ffffff10] rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-[#ffffff05] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-medium text-white">All caught up!</h3>
                <p className="text-gray-400 mt-2">No pending recommendations at the moment.</p>
                <button className="mt-6 px-4 py-2 bg-[#ffffff05] hover:bg-[#ffffff10] text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
                    <RefreshCw className="w-4 h-4" />
                    Check for new optimizations
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#111111] border border-[#ffffff10] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#ffffff10] flex justify-between items-center bg-[#0A0A0A]/50">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Optimization Queue
                    <span className="bg-[#ffffff10] text-xs px-2 py-0.5 rounded-full text-gray-400">
                        {recommendations.length}
                    </span>
                </h3>
            </div>

            <div className="divide-y divide-[#ffffff05]">
                <AnimatePresence>
                    {recommendations.map((rec, index) => (
                        <RecommendationItem
                            key={rec.campaignId || index}
                            recommendation={rec}
                            onAction={handleAction}
                            processing={processing === (rec.campaignId || (rec as any).id)} // Fallback for ID
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function RecommendationItem({
    recommendation,
    onAction,
    processing
}: {
    recommendation: Recommendation;
    onAction: (id: string, action: 'approve' | 'reject') => Promise<void>;
    processing: boolean;
}) {
    // Determine icon and color based on type
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'budget_shift': return { icon: ArrowRight, color: 'text-blue-400', bg: 'bg-blue-500/10' };
            case 'pause': return { icon: X, color: 'text-red-400', bg: 'bg-red-500/10' };
            case 'scale': return { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
            case 'creative_swap': return { icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10' };
            case 'audience_adjust': return { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' };
            default: return { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' };
        }
    };

    const style = getTypeStyles(recommendation.type);
    const Icon = style.icon;

    // Use a unique ID - ideally the recommendation object has an 'id', fall back to campaignId for now
    const id = (recommendation as any).id || recommendation.campaignId;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, padding: 0 }}
            className="p-5 hover:bg-[#ffffff02] transition-colors group"
        >
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                    <Icon className={`w-5 h-5 ${style.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h4 className="font-medium text-white truncate pr-4">{recommendation.title}</h4>
                            <p className="text-sm text-gray-400 line-clamp-2">{recommendation.description}</p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${recommendation.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                    recommendation.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-blue-500/20 text-blue-400'
                                }`}>
                                {recommendation.priority}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                                {Math.round(recommendation.confidenceScore * 100)}% confidence
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        {recommendation.campaignName && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#ffffff05] rounded">
                                {recommendation.platform === 'google' ? 'Google Ads' :
                                    recommendation.platform === 'meta' ? 'Meta Ads' : 'Ad Network'}
                                <span className="text-gray-600">•</span>
                                {recommendation.campaignName}
                            </span>
                        )}
                        {recommendation.estimatedSavings && (
                            <span className="text-emerald-400 flex items-center gap-1">
                                <DollarSignIcon className="w-3 h-3" />
                                Est. Savings: ${recommendation.estimatedSavings.toLocaleString()}
                            </span>
                        )}
                        {recommendation.predictedROIImpact && (
                            <span className="text-blue-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{recommendation.predictedROIImpact}% ROI
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Area */}
            <div className="mt-4 pl-14 flex items-center justify-between border-t border-[#ffffff05] pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-gray-500 italic">
                    Reasoning: {recommendation.rationale}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onAction(id, 'reject')}
                        disabled={processing}
                        className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#ffffff10] rounded-lg transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => onAction(id, 'approve')}
                        disabled={processing}
                        className="px-4 py-1.5 text-xs font-medium bg-white text-black hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-white/10"
                    >
                        {processing ? (
                            <>
                                <RefreshCw className="w-3 h-3 animate-spin" /> Process...
                            </>
                        ) : (
                            <>
                                <Check className="w-3 h-3" /> Approve
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function DollarSignIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}
