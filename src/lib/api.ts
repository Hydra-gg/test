/**
 * Escalate AI - Supabase API Helpers
 * Functions for interacting with the database
 */

import { supabase } from './supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import type {
    Company,
    Campaign,
    AdPlatformConnection,
    AIRecommendation,
    MetricsTimeseries,
    Notification,
    AuditLog,
    DashboardKPIs,
    WhatChangedItem,
    AnomalyAlert,
    RecommendationStatus,
} from '@/types/database';

// =============================================================================
// COMPANY API
// =============================================================================

export async function getCompany(companyId: string): Promise<Company | null> {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

    if (error) {
        console.error('Error fetching company:', error);
        return null;
    }
    return data;
}

export async function getUserCompany(userId: string): Promise<Company | null> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

    if (!profile?.company_id) return null;
    return getCompany(profile.company_id);
}

// =============================================================================
// AD PLATFORM CONNECTIONS API
// =============================================================================

export async function getAdPlatformConnections(companyId: string): Promise<AdPlatformConnection[]> {
    const { data, error } = await supabase
        .from('ad_platform_connections')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching connections:', error);
        return [];
    }
    return data || [];
}

export async function getConnectionByPlatform(
    companyId: string,
    platform: string
): Promise<AdPlatformConnection | null> {
    const { data, error } = await supabase
        .from('ad_platform_connections')
        .select('*')
        .eq('company_id', companyId)
        .eq('platform', platform)
        .single();

    if (error) return null;
    return data;
}

export async function updateConnectionSyncStatus(
    connectionId: string,
    status: 'pending' | 'syncing' | 'healthy' | 'error',
    error?: string
): Promise<void> {
    const updates: Record<string, unknown> = {
        sync_status: status,
        last_sync_at: status === 'healthy' ? new Date().toISOString() : undefined,
    };
    if (error) updates.sync_error = error;

    await supabase
        .from('ad_platform_connections')
        .update(updates)
        .eq('id', connectionId);
}

// =============================================================================
// CAMPAIGNS API
// =============================================================================

export async function getCampaigns(companyId: string, client?: SupabaseClient): Promise<Campaign[]> {
    const { data, error } = await (client || supabase)
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
    }
    return data || [];
}

export async function getCampaignsByStatus(
    companyId: string,
    status: string,
    client?: SupabaseClient
): Promise<Campaign[]> {
    const { data, error } = await (client || supabase)
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', status)
        .order('updated_at', { ascending: false });

    if (error) return [];
    return data || [];
}

export async function getCampaignWithMetrics(
    campaignId: string,
    client?: SupabaseClient
): Promise<{
    campaign: Campaign | null;
    metrics: MetricsTimeseries[];
}> {
    const sb = client || supabase;
    const [campaignResult, metricsResult] = await Promise.all([
        sb.from('campaigns').select('*').eq('id', campaignId).single(),
        sb
            .from('metrics_timeseries')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('date', { ascending: false })
            .limit(30),
    ]);

    return {
        campaign: campaignResult.data,
        metrics: metricsResult.data || [],
    };
}

// =============================================================================
// AI RECOMMENDATIONS API
// =============================================================================

export async function getRecommendations(
    companyId: string,
    status?: RecommendationStatus,
    client?: SupabaseClient
): Promise<AIRecommendation[]> {
    let query = (client || supabase)
        .from('ai_recommendations')
        .select('*')
        .eq('company_id', companyId);

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
    return data || [];
}

export async function getPendingRecommendations(companyId: string, client?: SupabaseClient): Promise<AIRecommendation[]> {
    return getRecommendations(companyId, 'pending', client);
}

export async function approveRecommendation(
    recommendationId: string,
    userId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('ai_recommendations')
        .update({
            status: 'approved',
            approved_by: userId,
            approved_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

    if (error) {
        console.error('Error approving recommendation:', error);
        return false;
    }

    // Log the action
    await createAuditLog(userId, 'recommendation_approved', 'ai_recommendation', recommendationId);
    return true;
}

export async function rejectRecommendation(
    recommendationId: string,
    userId: string,
    reason?: string
): Promise<boolean> {
    const { error } = await supabase
        .from('ai_recommendations')
        .update({
            status: 'rejected',
            rejected_by: userId,
            rejected_at: new Date().toISOString(),
            rejection_reason: reason,
        })
        .eq('id', recommendationId);

    if (error) {
        console.error('Error rejecting recommendation:', error);
        return false;
    }

    await createAuditLog(userId, 'recommendation_rejected', 'ai_recommendation', recommendationId, {
        reason,
    });
    return true;
}

// =============================================================================
// METRICS API
// =============================================================================

export async function getMetricsForDateRange(
    campaignId: string,
    startDate: string,
    endDate: string
): Promise<MetricsTimeseries[]> {
    const { data, error } = await supabase
        .from('metrics_timeseries')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (error) return [];
    return data || [];
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export async function getCompanyMetricsAggregated(
    companyId: string,
    rangeOption: number | DateRange = 30,
    client?: SupabaseClient
): Promise<{
    total_spend: number;
    total_revenue: number;
    total_conversions: number;
    avg_roas: number;
}> {
    let startDate: Date;
    let endDate: Date = new Date(); // Default end is now

    if (typeof rangeOption === 'number') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - rangeOption);
    } else {
        startDate = rangeOption.startDate;
        endDate = rangeOption.endDate;
    }

    const { data, error } = await (client || supabase)
        .from('metrics_timeseries')
        .select('spend, revenue, conversions, roas, date, campaigns!inner(company_id)')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

    if (error || !data) {
        return { total_spend: 0, total_revenue: 0, total_conversions: 0, avg_roas: 0 };
    }

    const filtered = data.filter((m: Record<string, unknown>) => {
        const campaigns = m.campaigns as { company_id: string } | undefined;
        return campaigns?.company_id === companyId;
    });

    const totals = filtered.reduce(
        (acc, m) => ({
            total_spend: acc.total_spend + Number(m.spend || 0),
            total_revenue: acc.total_revenue + Number(m.revenue || 0),
            total_conversions: acc.total_conversions + Number(m.conversions || 0),
            roas_sum: acc.roas_sum + Number(m.roas || 0),
            count: acc.count + 1,
        }),
        { total_spend: 0, total_revenue: 0, total_conversions: 0, roas_sum: 0, count: 0 }
    );

    return {
        total_spend: totals.total_spend,
        total_revenue: totals.total_revenue,
        total_conversions: totals.total_conversions,
        avg_roas: totals.count > 0 ? totals.roas_sum / totals.count : 0,
    };
}

// =============================================================================
// DASHBOARD KPIs API
// =============================================================================

export async function getDashboardKPIs(
    companyId: string,
    dateRange?: DateRange,
    client?: SupabaseClient
): Promise<DashboardKPIs> {
    const [metrics, campaigns, pendingRecs] = await Promise.all([
        getCompanyMetricsAggregated(companyId, dateRange || 30, client),
        getCampaignsByStatus(companyId, 'active', client),
        getPendingRecommendations(companyId, client),
    ]);

    const roi = metrics.total_spend > 0
        ? ((metrics.total_revenue - metrics.total_spend) / metrics.total_spend) * 100
        : 0;

    return {
        total_roi: roi,
        total_roas: metrics.avg_roas,
        total_spend: metrics.total_spend,
        total_revenue: metrics.total_revenue,
        cac: metrics.total_conversions > 0 ? metrics.total_spend / metrics.total_conversions : 0,
        ltv: 0, // Requires additional data
        spend_efficiency: metrics.total_spend > 0 ? metrics.total_revenue / metrics.total_spend : 0,
        active_campaigns: campaigns.length,
        pending_recommendations: pendingRecs.length,
        anomalies_count: 0, // Will be calculated by anomaly detection
    };
}

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

export async function getNotifications(
    userId: string,
    unreadOnly: boolean = false
): Promise<Notification[]> {
    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

    if (unreadOnly) {
        query = query.eq('is_read', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

    if (error) return [];
    return data || [];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);
}

// =============================================================================
// AUDIT LOGS API
// =============================================================================

export async function createAuditLog(
    userId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, unknown>
): Promise<void> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

    await supabase.from('audit_logs').insert({
        company_id: profile?.company_id,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
    });
}

export async function getAuditLogs(
    companyId: string,
    limit: number = 100
): Promise<AuditLog[]> {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return [];
    return data || [];
}

// =============================================================================
// WHAT CHANGED TODAY API
// =============================================================================

export async function getWhatChangedToday(companyId: string): Promise<WhatChangedItem[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(20);

    if (!logs) return [];

    return logs.map((log) => ({
        id: log.id,
        timestamp: log.created_at,
        type: mapAuditActionToChangeType(log.action),
        title: formatAuditAction(log.action),
        description: log.details?.description || '',
        impact: log.details?.roi_impact || null,
        is_positive: log.details?.is_positive ?? true,
    }));
}

function mapAuditActionToChangeType(action: string): WhatChangedItem['type'] {
    if (action.includes('recommendation_executed')) return 'recommendation_executed';
    if (action.includes('anomaly')) return 'anomaly_detected';
    if (action.includes('budget')) return 'budget_change';
    return 'performance_change';
}

function formatAuditAction(action: string): string {
    return action
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

// =============================================================================
// AUDIENCE API
// =============================================================================

export async function getAudiences(companyId: string, client?: SupabaseClient): Promise<any[]> {
    const { data, error } = await (client || supabase)
        .from('audiences')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
}

export async function saveAudience(audience: {
    company_id: string;
    name: string;
    platform: string;
    type: string;
    targeting_spec: any;
    size_estimate?: number;
}, client?: SupabaseClient): Promise<any> {
    const { data, error } = await (client || supabase)
        .from('audiences')
        .insert(audience)
        .select()
        .single();

    if (error) {
        console.error('Error saving audience:', error);
        throw error;
    }
    return data;
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

export async function logAuditAction(params: {
    companyId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, any>;
    details?: Record<string, any>;
}) {
    // Fire and forget (don't await if performance critical, but for data safety usage validation best to await)
    const { error } = await supabase
        .from('audit_logs')
        .insert({
            company_id: params.companyId,
            user_id: params.userId,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId,
            changes: params.changes || {},
            details: params.details || {}
        });

    if (error) {
        console.error('Failed to write audit log:', error);
    }
}


