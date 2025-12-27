'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface DashboardThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const DashboardThemeContext = createContext<DashboardThemeContextValue | undefined>(undefined);

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        const saved = localStorage.getItem('dashboard-theme') as Theme;
        if (saved === 'light' || saved === 'dark') {
            setTheme(saved);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        // Save theme preference (only after initial mount)
        if (mounted) {
            localStorage.setItem('dashboard-theme', theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const value: DashboardThemeContextValue = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
    };

    // Prevent flash of wrong theme by rendering invisible until mounted, 
    // BUT maintain component tree structure to avoid "Rendered more hooks" errors 
    // and hydration mismatches from return null.

    return (
        <DashboardThemeContext.Provider value={value}>
            <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </DashboardThemeContext.Provider>
    );
}

export function useDashboardTheme() {
    const context = useContext(DashboardThemeContext);
    if (!context) {
        throw new Error('useDashboardTheme must be used within a DashboardThemeProvider');
    }
    return context;
}
