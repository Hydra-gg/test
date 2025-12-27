'use client';

import {
    LineChart, Line, ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, Tooltip
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Target, Zap } from 'lucide-react';
import type { TrendAnalysis, ROIMetrics } from '@/lib/ai/roi-engine';

interface KPICardsProps {
    metrics: {
        totalSpend: number;
        totalRevenue: number;
        roas: number;
        activeAnomalies: number;
    };
    trends: TrendAnalysis;
}

export function KPICards({ metrics, trends }: KPICardsProps) {
    const data = trends.trends.slice(-7); // Last 7 days for sparklines

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Revenue Card */}
            <Card>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            ${metrics.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>
                <div className="h-12 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.1}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Spend Card */}
            <Card>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-medium text-gray-400">Total Spend</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            ${metrics.totalSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                </div>
                <div className="h-12 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <Line
                                type="monotone"
                                dataKey="spend"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {trends.spendTrend === 'increasing' && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Spend increasing</span>
                    </div>
                )}
            </Card>

            {/* ROAS Card */}
            <Card>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-medium text-gray-400">Global ROAS</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-2xl font-bold text-white">
                                {metrics.roas.toFixed(2)}x
                            </h3>
                            {trends.roasTrend === 'improving' ? (
                                <span className="text-xs font-medium text-emerald-500 flex items-center">
                                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                    Improving
                                </span>
                            ) : trends.roasTrend === 'declining' ? (
                                <span className="text-xs font-medium text-red-500 flex items-center">
                                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                                    Declining
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-gray-500">Stable</span>
                            )}
                        </div>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Target className="w-5 h-5 text-purple-500" />
                    </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (metrics.roas / 4) * 100)}%` }} // Target 4.0 ROAS
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">Target: 4.0x ROAS</p>
            </Card>

            {/* Anomalies Card */}
            <Card className={metrics.activeAnomalies > 0 ? 'border-red-500/30 bg-red-500/5' : ''}>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-medium text-gray-400">Active Anomalies</p>
                        <h3 className={`text-2xl font-bold mt-1 ${metrics.activeAnomalies > 0 ? 'text-red-400' : 'text-white'}`}>
                            {metrics.activeAnomalies}
                        </h3>
                    </div>
                    <div className={`p-2 rounded-lg ${metrics.activeAnomalies > 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                        <Zap className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                    {metrics.activeAnomalies > 0
                        ? 'Requires immediate attention'
                        : 'System running smoothly'}
                </p>
            </Card>
        </div>
    );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#111111] border border-[#ffffff10] rounded-xl p-5 hover:border-[#ffffff20] transition-colors ${className}`}>
            {children}
        </div>
    );
}
