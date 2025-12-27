'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useDateRange, type DatePreset } from '@/contexts/DateRangeContext';

export function DateRangePicker() {
    const { startDate, endDate, preset, setPreset, setRange } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const presets: { label: string; value: DatePreset }[] = [
        { label: 'Last 7 Days', value: '7d' },
        { label: 'Last 30 Days', value: '30d' },
        { label: 'Last 90 Days', value: '90d' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
    ];

    const router = useRouter();
    const searchParams = useSearchParams();

    // Sync URL to Context on mount/update
    useEffect(() => {
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (from && to) {
            setRange(new Date(from), new Date(to), 'custom');
        }
    }, [searchParams, setRange]);

    const handleApplyRange = (start: Date, end: Date, newPreset: DatePreset) => {
        setRange(start, end, newPreset);
        setIsOpen(false);

        // Update URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('from', start.toISOString().split('T')[0]);
        params.set('to', end.toISOString().split('T')[0]);
        router.push(`?${params.toString()}`);
    };

    const handlePresetSelect = (value: DatePreset) => {
        setPreset(value); // This updates context state (start/end)

        // We need the calculated dates from the context change to update URL
        // But context update is async/state based. 
        // Better to calculate here or wait for effect.
        // Let's recalculate simply for URL push to be immediate
        const now = new Date();
        let start = now;
        let end = new Date();

        if (value === '7d') start = new Date(now.setDate(now.getDate() - 7));
        else if (value === '30d') start = new Date(now.setDate(now.getDate() - 30));
        else if (value === '90d') start = new Date(now.setDate(now.getDate() - 90));
        else if (value === 'this_month') start = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (value === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('from', start.toISOString().split('T')[0]);
        params.set('to', end.toISOString().split('T')[0]);
        router.push(`?${params.toString()}`);

        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#ffffff10] rounded-lg text-sm text-gray-300 hover:text-white hover:border-[#ffffff20] transition-colors"
            >
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span>
                    {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-[#ffffff10] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider">
                            Presets
                        </div>
                        {presets.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => handlePresetSelect(p.value)}
                                className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors ${preset === p.value
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'text-gray-300 hover:bg-[#ffffff05] hover:text-white'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Range Inputs (Simplified for MVP) */}
                    <div className="border-t border-[#ffffff10] p-3 space-y-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Custom Range
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Start</label>
                                <input
                                    type="date"
                                    value={format(startDate, 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                        const date = e.target.valueAsDate;
                                        if (date) setRange(date, endDate, 'custom');
                                    }}
                                    className="w-full bg-[#ffffff05] border border-[#ffffff10] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">End</label>
                                <input
                                    type="date"
                                    value={format(endDate, 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                        const date = e.target.valueAsDate;
                                        // Set to end of day
                                        if (date) {
                                            date.setHours(23, 59, 59, 999);
                                            setRange(startDate, date, 'custom');
                                            setPreset('custom'); // Ensure preset updates to custom if interacting here
                                        }
                                    }}
                                    className="w-full bg-[#ffffff05] border border-[#ffffff10] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
