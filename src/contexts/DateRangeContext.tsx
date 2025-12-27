'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export type DatePreset = '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'custom';

interface DateRangeContextType {
    startDate: Date;
    endDate: Date;
    preset: DatePreset;
    setRange: (start: Date, end: Date, preset?: DatePreset) => void;
    setPreset: (preset: DatePreset) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
    // Default to last 30 days
    const [startDate, setStartDate] = useState<Date>(subDays(startOfDay(new Date()), 30));
    const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));
    const [preset, setPresetState] = useState<DatePreset>('30d');

    const setRange = (start: Date, end: Date, newPreset: DatePreset = 'custom') => {
        setStartDate(start);
        setEndDate(end);
        setPresetState(newPreset);
    };

    const setPreset = (newPreset: DatePreset) => {
        const now = new Date();
        let start = now;
        let end = endOfDay(now);

        switch (newPreset) {
            case '7d':
                start = subDays(startOfDay(now), 7);
                break;
            case '30d':
                start = subDays(startOfDay(now), 30);
                break;
            case '90d':
                start = subDays(startOfDay(now), 90);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                break;
        }

        setStartDate(start);
        setEndDate(end);
        setPresetState(newPreset);
    };

    return (
        <DateRangeContext.Provider value={{ startDate, endDate, preset, setRange, setPreset }}>
            {children}
        </DateRangeContext.Provider>
    );
}

export function useDateRange() {
    const context = useContext(DateRangeContext);
    if (context === undefined) {
        throw new Error('useDateRange must be used within a DateRangeProvider');
    }
    return context;
}
