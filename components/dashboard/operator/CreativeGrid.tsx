'use client';

import { Image as ImageIcon, Video, Layers, TrendingUp, TrendingDown } from 'lucide-react';
import type { CreativeMetrics } from '@/lib/ai/creative-analytics';

export function CreativeGrid({ creatives }: { creatives: CreativeMetrics[] }) {
    if (creatives.length === 0) {
        return (
            <div className="p-8 border border-[#ffffff10] rounded-xl bg-[#111111] text-center">
                <div className="w-12 h-12 bg-[#ffffff05] rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-white">No Creative Data</h3>
                <p className="text-gray-400 mt-2">
                    Creative-level performance data is not available yet.
                    Ensure your ad accounts are synced with granular reporting enabled.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {creatives.map((creative) => (
                <div
                    key={creative.id}
                    className="group relative bg-[#111111] border border-[#ffffff10] hover:border-[#ffffff20] rounded-xl overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-xl"
                >
                    {/* Thumbnail / Preview */}
                    <div className="aspect-square bg-[#0A0A0A] relative flex items-center justify-center overflow-hidden">
                        {creative.thumbnailUrl ? (
                            <img src={creative.thumbnailUrl} alt={creative.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                            <div className="text-gray-600">
                                {creative.format === 'video' ? <Video className="w-12 h-12" /> :
                                    creative.format === 'carousel' ? <Layers className="w-12 h-12" /> :
                                        <ImageIcon className="w-12 h-12" />}
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 backdrop-blur text-white border border-white/10 uppercase tracking-wider">
                            {creative.status}
                        </div>
                    </div>

                    {/* Metrics Overlay */}
                    <div className="p-4">
                        <h4 className="font-medium text-white truncate mb-3" title={creative.name}>{creative.name}</h4>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">CTR</p>
                                <p className={`font-semibold ${creative.ctr > 2 ? 'text-emerald-400' : 'text-white'}`}>
                                    {creative.ctr.toFixed(2)}%
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 text-xs">ROAS</p>
                                <p className={`font-semibold ${creative.roas > 3 ? 'text-emerald-400' : creative.roas < 1.5 ? 'text-red-400' : 'text-white'}`}>
                                    {creative.roas.toFixed(2)}x
                                </p>
                            </div>
                        </div>

                        {/* Top Performer Tag */}
                        {creative.topPerformer && (
                            <div className="mt-4 pt-3 border-t border-[#ffffff10] flex items-center gap-2 text-xs font-medium text-amber-500">
                                <TrendingUp className="w-3 h-3" /> Top Performer
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
