'use client';

import { useState } from 'react';
import {
    ArrowUpDown,
    Search,
    Filter,
    Play,
    Pause,
    AlertTriangle,
    CheckCircle,
    MoreHorizontal
} from 'lucide-react';
import type { ROIMetrics } from '@/lib/ai/roi-engine';

interface CampaignTableProps {
    data: ROIMetrics[];
}

type SortField = 'totalSpend' | 'totalRevenue' | 'roas' | 'roi' | 'campaignName';
type SortDirection = 'asc' | 'desc';

export function CampaignTable({ data: initialData }: CampaignTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('totalSpend');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [platformFilter, setPlatformFilter] = useState<string>('all');

    // Filtering
    const filteredData = initialData.filter(item => {
        const matchesSearch = item.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    // Sorting
    const sortedData = [...filteredData].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        // Numeric sort
        return sortDirection === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <span className={`inline-block ml-1 transition-opacity ${sortField === field ? 'opacity-100' : 'opacity-30'}`}>
            <ArrowUpDown className="w-3 h-3" />
        </span>
    );

    return (
        <div className="bg-[#111111] border border-[#ffffff10] rounded-xl overflow-hidden mb-8">
            {/* Header Controls */}
            <div className="p-4 border-b border-[#ffffff10] flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#ffffff05] border border-[#ffffff10] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-[#ffffff08] transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <select
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-[#ffffff05] border border-[#ffffff10] rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Platforms</option>
                            <option value="google">Google Ads</option>
                            <option value="meta">Meta Ads</option>
                            <option value="tiktok">TikTok Ads</option>
                            <option value="linkedin">LinkedIn Ads</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#ffffff02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('campaignName')}>
                                Campaign <SortIcon field="campaignName" />
                            </th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('totalSpend')}>
                                Spend <SortIcon field="totalSpend" />
                            </th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('totalRevenue')}>
                                Revenue <SortIcon field="totalRevenue" />
                            </th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('roas')}>
                                ROAS <SortIcon field="roas" />
                            </th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('roi')}>
                                ROI <SortIcon field="roi" />
                            </th>
                            <th className="px-6 py-4 text-center">Efficiency</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ffffff05] text-sm text-gray-300">
                        {sortedData.length > 0 ? (
                            sortedData.map((row) => (
                                <tr key={row.campaignId} className="hover:bg-[#ffffff02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${row.efficiencyScore > 70 ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                                            <div>
                                                <div className="font-medium text-white truncate max-w-[200px]" title={row.campaignName}>
                                                    {row.campaignName}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 capitalize">
                                                    {row.platform}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        ${row.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                                        ${row.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">
                                        <span className={row.roas >= 4 ? 'text-emerald-400' : row.roas < 2 ? 'text-red-400' : 'text-gray-300'}>
                                            {row.roas.toFixed(2)}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        <span className={row.roi > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                            {row.roi > 0 ? '+' : ''}{row.roi.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ffffff05] border border-[#ffffff10]">
                                            {row.efficiencyScore}/100
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 hover:bg-[#ffffff10] rounded-lg text-gray-500 hover:text-white transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No campaigns found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Folder Pagination (Not implemented in MVP but looks nice) */}
            <div className="p-4 border-t border-[#ffffff10] flex justify-between items-center text-xs text-gray-500">
                <span>Showing {sortedData.length} campaigns</span>
                <div className="flex gap-2">
                    <button disabled className="px-3 py-1 opacity-50 cursor-not-allowed">Previous</button>
                    <button disabled className="px-3 py-1 opacity-50 cursor-not-allowed">Next</button>
                </div>
            </div>
        </div>
    );
}
