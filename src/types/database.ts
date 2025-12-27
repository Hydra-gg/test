/**
 * Escalate AI Database Types
 * Auto-generated from Supabase schema
 */

// =============================================================================
// COMPANY & USER TYPES
// =============================================================================

export type CompanySize = 'startup' | 'smb' | 'mid-market' | 'enterprise';
export type DelegationLevel = 'advisory' | 'supervised' | 'autonomous';
export type UserRole = 'ceo' | 'operator' | 'analyst';

export interface UserPermissions {
    read: boolean;
    approve: boolean;
    override: boolean;
}

export interface Company {
    id: string;
    name: string;
    industry: string | null;
    region: string | null;
    size: CompanySize | null;
    monthly_spend_min: number | null;
    monthly_spend_max: number | null;
    subscription_tier: string;
    delegation_level: DelegationLevel;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    business_name: string;
    first_name: string | null;
    last_name: string | null;
    country: string | null;
    avatar_url: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    company_id: string | null;
    role: UserRole;
    permissions: UserPermissions;
    created_at: string;
}

// =============================================================================
// AD PLATFORM TYPES
// =============================================================================

export type AdPlatform = 'google' | 'meta' | 'tiktok' | 'linkedin';
export type PermissionScope = 'read' | 'execute';
export type SyncStatus = 'pending' | 'syncing' | 'healthy' | 'error';

export interface AdPlatformConnection {
    id: string;
    company_id: string;
    platform: AdPlatform;
    account_id: string | null;
    account_name: string | null;
    permission_scope: PermissionScope;
    sync_status: SyncStatus;
    last_sync_at: string | null;
    sync_error: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================================================
// CAMPAIGN & CREATIVE TYPES
// =============================================================================

export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft' | 'error';
export type CreativeFormat = 'image' | 'video' | 'carousel' | 'collection' | 'text';
export type AudienceType = 'custom' | 'lookalike' | 'interest' | 'retargeting' | 'broad';

export interface Campaign {
    id: string;
    company_id: string;
    platform_connection_id: string | null;
    platform_campaign_id: string;
    name: string;
    platform: string;
    channel: string | null;
    objective: string | null;
    status: CampaignStatus;
    budget_daily: number | null;
    budget_total: number | null;
    bid_strategy: string | null;
    start_date: string | null;
    end_date: string | null;
    health_score: number | null;
    created_at: string;
    updated_at: string;
}

export interface AdCreative {
    id: string;
    campaign_id: string;
    platform_creative_id: string | null;
    name: string | null;
    headline: string | null;
    primary_text: string | null;
    cta_text: string | null;
    image_url: string | null;
    video_url: string | null;
    format: CreativeFormat | null;
    placement: string | null;
    status: string;
    fatigue_score: number | null;
    created_at: string;
    updated_at: string;
}

export interface Audience {
    id: string;
    company_id: string;
    platform: string;
    platform_audience_id: string | null;
    name: string;
    segment_type: AudienceType | null;
    size_estimate: number | null;
    performance_score: number | null;
    created_at: string;
    updated_at: string;
}

// =============================================================================
// METRICS TYPES
// =============================================================================

export type MetricGranularity = 'hour' | 'day' | 'week';

export interface MetricsTimeseries {
    id: string;
    campaign_id: string;
    creative_id: string | null;
    audience_id: string | null;
    date: string;
    granularity: MetricGranularity;
    // Core metrics
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    // Derived metrics
    ctr: number | null;
    cpc: number | null;
    cpa: number | null;
    roas: number | null;
    roi: number | null;
    cac: number | null;
    ltv: number | null;
    created_at: string;
}

// Aggregated metrics for dashboard display
export interface AggregatedMetrics {
    total_spend: number;
    total_revenue: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    avg_ctr: number;
    avg_cpc: number;
    avg_cpa: number;
    overall_roas: number;
    overall_roi: number;
}

// =============================================================================
// AI RECOMMENDATION TYPES
// =============================================================================

export type RecommendationType =
    | 'budget_shift'
    | 'pause'
    | 'scale'
    | 'creative_swap'
    | 'audience_adjust'
    | 'bid_adjust'
    | 'creative_refresh';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationStatus = 'pending' | 'approved' | 'executed' | 'rejected' | 'expired' | 'failed';

export interface AIRecommendation {
    id: string;
    company_id: string;
    campaign_id: string | null;
    creative_id: string | null;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string | null;
    action_summary: string | null;
    // ROI Prediction
    predicted_roi_impact: number | null;
    predicted_cost_savings: number | null;
    predicted_revenue_increase: number | null;
    confidence_score: number;
    confidence_band_low: number | null;
    confidence_band_high: number | null;
    // Status tracking
    status: RecommendationStatus;
    approved_by: string | null;
    approved_at: string | null;
    rejected_by: string | null;
    rejected_at: string | null;
    rejection_reason: string | null;
    executed_at: string | null;
    execution_result: Record<string, unknown> | null;
    // Metadata
    expires_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

// For display in dashboard
export interface RecommendationWithCampaign extends AIRecommendation {
    campaign?: Campaign;
    creative?: AdCreative;
}

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export type WorkflowTriggerType = 'manual' | 'scheduled' | 'threshold' | 'event';

export interface Workflow {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    n8n_workflow_id: string | null;
    trigger_type: WorkflowTriggerType | null;
    trigger_config: Record<string, unknown>;
    is_active: boolean;
    requires_approval: boolean;
    last_run_at: string | null;
    last_run_status: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================================================
// AUDIT & NOTIFICATION TYPES
// =============================================================================

export interface AuditLog {
    id: string;
    company_id: string | null;
    user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    changes: Record<string, unknown>;
    details: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export type NotificationType = 'alert' | 'approval_request' | 'anomaly' | 'report' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
    id: string;
    company_id: string;
    user_id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string | null;
    link_to: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

// =============================================================================
// REPORT TYPES
// =============================================================================

export type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'custom' | 'pilot_summary';

export interface ExecutiveReport {
    id: string;
    company_id: string;
    generated_by: string | null;
    report_type: ReportType;
    title: string;
    date_from: string | null;
    date_to: string | null;
    total_spend: number | null;
    total_revenue: number | null;
    total_roi: number | null;
    total_roas: number | null;
    summary: string | null;
    insights: unknown[];
    recommendations_executed: number;
    roi_from_recommendations: number | null;
    pdf_url: string | null;
    created_at: string;
}

// =============================================================================
// DASHBOARD VIEW TYPES
// =============================================================================

export interface DashboardKPIs {
    total_roi: number;
    total_roas: number;
    total_spend: number;
    total_revenue: number;
    cac: number;
    ltv: number;
    spend_efficiency: number; // revenue / spend
    active_campaigns: number;
    pending_recommendations: number;
    anomalies_count: number;
}

export interface WhatChangedItem {
    id: string;
    timestamp: string;
    type: 'recommendation_executed' | 'anomaly_detected' | 'budget_change' | 'performance_change';
    title: string;
    description: string;
    impact: number | null; // ROI impact
    is_positive: boolean;
}

export interface AnomalyAlert {
    id: string;
    campaign_id: string;
    campaign_name: string;
    type: 'spend_spike' | 'conversion_drop' | 'ctr_decline' | 'budget_exhausted' | 'creative_fatigue';
    severity: 'warning' | 'critical';
    message: string;
    detected_at: string;
    metric_value: number;
    expected_value: number;
    deviation_percent: number;
}
