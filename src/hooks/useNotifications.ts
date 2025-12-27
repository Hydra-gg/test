'use client';

/**
 * useNotifications Hook
 * Manages user notifications with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from '@/lib/api';
import type { Notification } from '@/types/database';

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const data = await getNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        if (!user?.id) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchNotifications]);

    const markAsRead = useCallback(async (notificationId: string) => {
        await markNotificationRead(notificationId);
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;
        await markAllNotificationsRead(user.id);
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
    }, [user?.id]);

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}
