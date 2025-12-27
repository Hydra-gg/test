'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any; error: AuthError | null; needsVerification: boolean }>;
    signOut: () => Promise<void>;
    signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ data: any; error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
    updatePassword: (password: string) => Promise<{ data: any; error: AuthError | null }>;
    verifyOtp: (email: string, otp: string) => Promise<{ data: any; error: AuthError | null }>;
    resendCode: (email: string) => Promise<{ data: any; error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    // Handle error appropriately, maybe log it.
                    console.error('Error getting session:', error);
                }
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Unexpected error during auth initialization:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signUp = async (email: string, password: string, metadata?: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });

        // Check if email confirmation is required (session might be null even if successful)
        const needsVerification = !data.session && !!data.user;

        return { data, error, needsVerification };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const signInWithOAuth = async (provider: 'google' | 'apple') => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    };

    const resetPassword = async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });
        return { data, error };
    };

    const updatePassword = async (password: string) => {
        const { data, error } = await supabase.auth.updateUser({
            password,
        });
        return { data, error };
    };

    const verifyOtp = async (email: string, otp: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup',
        });
        return { data, error };
    };

    const resendCode = async (email: string) => {
        const { data, error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });
        return { data, error };
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
        resetPassword,
        updatePassword,
        verifyOtp,
        resendCode,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
