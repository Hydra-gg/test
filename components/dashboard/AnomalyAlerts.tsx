'use client';

import { AlertTriangle, AlertOctagon, Info, CheckCircle, ArrowRight } from 'lucide-react';
import type { Anomaly } from '@/lib/ai/anomaly-detection';

export function AnomalyAlerts({ anomalies }: { anomalies: Anomaly[] }) {
    if (anomalies.length === 0) return null;

    // Filter to only show high/critical anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');

    if (criticalAnomalies.length === 0) return null;

    return (
        <div className="mb-8 space-y-3">
            {criticalAnomalies.map((anomaly, index) => (
                <div
                    key={index}
                    className={`
                        rounded-lg p-4 border flex items-start gap-4 relative overflow-hidden group
                        ${anomaly.severity === 'critical'
                            ? 'bg-red-500/10 border-red-500/20 text-red-200'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-200'}
                    `}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {anomaly.severity === 'critical'
                            ? <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                            : <AlertTriangle className="w-5 h-5 text-amber-500" />
                        }
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white tracking-wide">
                                {anomaly.title}
                            </h4>
                            <span className={`
                                text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border
                                ${anomaly.severity === 'critical'
                                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                    : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}
                            `}>
                                {anomaly.severity}
                            </span>
                        </div>
                        <p className="text-sm opacity-90">{anomaly.description}</p>

                        <div className="flex gap-4 mt-2 text-xs font-mono opacity-70">
                            {anomaly.campaignName && (
                                <span>Campaign: {anomaly.campaignName}</span>
                            )}
                            {anomaly.percentChange && (
                                <span>Change: {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%</span>
                            )}
                        </div>
                    </div>

                    <button className="flex-shrink-0 p-2 hover:bg-[#ffffff10] rounded-lg transition-colors group-hover:translate-x-1 duration-300">
                        <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>

                    {/* Background glow */}
                    <div className={`
                        absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none
                        ${anomaly.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}
                    `} />
                </div>
            ))}
        </div>
    );
}
