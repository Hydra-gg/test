/**
 * Anomaly Detection Module
 * Real-time detection of unusual patterns in campaign performance
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateCampaignROI, type ROIMetrics } from './roi-engine';

// =============================================================================
// TYPES
// =============================================================================

export type AnomalyType =
    | 'ctr_drop'
    | 'spend_spike'
    | 'conversion_drop'
    | 'budget_exhausted'
    | 'roas_decline'
    | 'cpa_spike'
    | 'impression_drop'
    | 'click_anomaly';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
    type: AnomalyType;
    severity: AnomalySeverity;
    campaignId: string;
    campaignName: string;
    platform: string;
    title: string;
    description: string;
    metricName: string;
    previousValue: number;
    currentValue: number;
    percentChange: number;
    threshold: number;
    detectedAt: Date;
    metadata: Record<string, unknown>;
}

export interface AnomalyDetectionConfig {
    ctrDropThreshold: number; // Percentage drop to trigger (e.g., 30 = 30%)
    spendSpikeThreshold: number; // Percentage increase
    conversionDropThreshold: number;
    roasDeclineThreshold: number;
    cpaSpikeThreshold: number;
    impressionDropThreshold: number;
    minDataPoints: number; // Minimum days of data needed
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
    ctrDropThreshold: 30, // CTR drops 30%+
    spendSpikeThreshold: 50, // Spend increases 50%+ unexpectedly
    conversionDropThreshold: 40, // Conversions drop 40%+
    roasDeclineThreshold: 25, // ROAS drops 25%+
    cpaSpikeThreshold: 30, // CPA increases 30%+
    impressionDropThreshold: 50, // Impressions drop 50%+
    minDataPoints: 7, // Need at least 7 days of data
};

// =============================================================================
// ANOMALY DETECTION
// =============================================================================

/**
 * Detect all anomalies for a company
 */
export async function detectAnomalies(
    companyId: string,
    config: Partial<AnomalyDetectionConfig> = {}
): Promise<Anomaly[]> {
    const settings = { ...DEFAULT_CONFIG, ...config };
    const supabase = await createServerSupabaseClient();
    const anomalies: Anomaly[] = [];

    // Get all campaigns
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, platform, status')
        .eq('company_id', companyId)
        .eq('status', 'active');

    if (error || !campaigns) {
        console.error('Error fetching campaigns for anomaly detection:', error);
        return [];
    }

    for (const campaign of campaigns) {
        // Get recent metrics
        const recentMetrics = await getRecentMetrics(campaign.id, 14);
        if (recentMetrics.length < settings.minDataPoints) continue;

        // Split into comparison periods
        const recentPeriod = recentMetrics.slice(0, 7);
        const previousPeriod = recentMetrics.slice(7, 14);

        if (previousPeriod.length === 0) continue;

        // Aggregate each period
        const recent = aggregateMetrics(recentPeriod);
        const previous = aggregateMetrics(previousPeriod);

        // Check for CTR drop
        const ctrAnomaly = detectCTRDrop(campaign, recent, previous, settings.ctrDropThreshold);
        if (ctrAnomaly) anomalies.push(ctrAnomaly);

        // Check for spend spike
        const spendAnomaly = detectSpendSpike(campaign, recent, previous, settings.spendSpikeThreshold);
        if (spendAnomaly) anomalies.push(spendAnomaly);

        // Check for conversion drop
        const convAnomaly = detectConversionDrop(campaign, recent, previous, settings.conversionDropThreshold);
        if (convAnomaly) anomalies.push(convAnomaly);

        // Check for ROAS decline
        const roasAnomaly = detectROASDecline(campaign, recent, previous, settings.roasDeclineThreshold);
        if (roasAnomaly) anomalies.push(roasAnomaly);

        // Check for CPA spike
        const cpaAnomaly = detectCPASpike(campaign, recent, previous, settings.cpaSpikeThreshold);
        if (cpaAnomaly) anomalies.push(cpaAnomaly);

        // Check for impression drop
        const impAnomaly = detectImpressionDrop(campaign, recent, previous, settings.impressionDropThreshold);
        if (impAnomaly) anomalies.push(impAnomaly);
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Get recent metrics for a campaign
 */
async function getRecentMetrics(campaignId: string, days: number) {
    const supabase = await createServerSupabaseClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('metrics_timeseries')
        .select('date, impressions, clicks, conversions, spend, revenue')
        .eq('campaign_id', campaignId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching metrics:', error);
        return [];
    }

    return data || [];
}

/**
 * Aggregate metrics into totals
 */
function aggregateMetrics(metrics: Array<{
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
}>) {
    const totals = metrics.reduce(
        (acc, m) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            conversions: acc.conversions + (m.conversions || 0),
            spend: acc.spend + (m.spend || 0),
            revenue: acc.revenue + (m.revenue || 0),
        }),
        { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    );

    // Calculate derived metrics
    return {
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
    };
}

// =============================================================================
// INDIVIDUAL ANOMALY DETECTORS
// =============================================================================

interface CampaignInfo {
    id: string;
    name: string;
    platform: string;
}

interface AggregatedMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    roas: number;
    cpa: number;
    conversionRate: number;
}

function detectCTRDrop(
    campaign: CampaignInfo,
    recent: AggregatedMetrics,
    previous: AggregatedMetrics,
    threshold: number
): Anomaly | null {
    if (previous.ctr === 0) return null;

    const percentChange = ((recent.ctr - previous.ctr) / previous.ctr) * 100;

    if (percentChange < -threshold) {
        return {
            type: 'ctr_drop',
            severity: percentChange < -50 ? 'critical' : percentChange < -40 ? 'high' : 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: campaign.platform,
            title: `CTR dropped ${Math.abs(percentChange).toFixed(1)}%`,
            description: `Click-through rate decreased from ${previous.ctr.toFixed(2)}% to ${recent.ctr.toFixed(2)}%. Consider refreshing ad creatives or reviewing audience targeting.`,
            metricName: 'CTR',
            previousValue: previous.ctr,
            currentValue: recent.ctr,
            percentChange,
            threshold,
            detectedAt: new Date(),
            metadata: { impressions: recent.impressions, clicks: recent.clicks },
        };
    }

    return null;
}

function detectSpendSpike(
    campaign: CampaignInfo,
    recent: AggregatedMetrics,
    previous: AggregatedMetrics,
    threshold: number
): Anomaly | null {
    if (previous.spend === 0) return null;

    const percentChange = ((recent.spend - previous.spend) / previous.spend) * 100;

    if (percentChange > threshold) {
        return {
            type: 'spend_spike',
            severity: percentChange > 100 ? 'critical' : percentChange > 75 ? 'high' : 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: campaign.platform,
            title: `Spend increased ${percentChange.toFixed(1)}%`,
            description: `Daily spend jumped from $${(previous.spend / 7).toFixed(2)} to $${(recent.spend / 7).toFixed(2)} per day. Review budget settings and bid strategy.`,
            metricName: 'Spend',
            previousValue: previous.spend,
            currentValue: recent.spend,
            percentChange,
            threshold,
            detectedAt: new Date(),
            metadata: { totalSpend: recent.spend },
        };
    }

    return null;
}

function detectConversionDrop(
    campaign: CampaignInfo,
    recent: AggregatedMetrics,
    previous: AggregatedMetrics,
    threshold: number
): Anomaly | null {
    if (previous.conversions < 5) return null; // Need minimum conversions

    const percentChange = ((recent.conversions - previous.conversions) / previous.conversions) * 100;

    if (percentChange < -threshold) {
        return {
            type: 'conversion_drop',
            severity: percentChange < -60 ? 'critical' : percentChange < -50 ? 'high' : 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: campaign.platform,
            title: `Conversions dropped ${Math.abs(percentChange).toFixed(1)}%`,
            description: `Conversions fell from ${previous.conversions} to ${recent.conversions}. Check landing page performance and conversion tracking.`,
            metricName: 'Conversions',
            previousValue: previous.conversions,
            currentValue: recent.conversions,
            percentChange,
            threshold,
            detectedAt: new Date(),
            metadata: { conversionRate: recent.conversionRate },
        };
    }

    return null;
}

function detectROASDecline(
    campaign: CampaignInfo,
    recent: AggregatedMetrics,
    previous: AggregatedMetrics,
    threshold: number
): Anomaly | null {
    if (previous.roas === 0) return null;

    const percentChange = ((recent.roas - previous.roas) / previous.roas) * 100;

    if (percentChange < -threshold) {
        return {
            type: 'roas_decline',
            severity: recent.roas < 1 ? 'critical' : percentChange < -40 ? 'high' : 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: campaign.platform,
            title: `ROAS declined ${Math.abs(percentChange).toFixed(1)}%`,
            description: `Return on ad spend dropped from ${previous.roas.toFixed(2)}x to ${recent.roas.toFixed(2)}x. Review audience quality and conversion value.`,
            metricName: 'ROAS',
            previousValue: previous.roas,
            currentValue: recent.roas,
            percentChange,
            threshold,
            detectedAt: new Date(),
            metadata: { revenue: recent.revenue, spend: recent.spend },
        };
    }

    return null;
}

function detectCPASpike(
    campaign: CampaignInfo,
    recent: AggregatedMetrics,
    previous: AggregatedMetrics,
    threshold: number
): Anomaly | null {
    if (previous.cpa === 0 || recent.conversions < 3) return null;

    const percentChange = ((recent.cpa - previous.cpa) / previous.cpa) * 100;

    if (percentChange > threshold) {
        return {
            type: 'cpa_spike',
            severity: percentChange > 60 ? 'high' : 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: campaign.platform,
            title: `CPA increased ${percentChange.toFixed(1)}%`,
            description: `Cost per acquisition rose from $${previous.cpa.toFixed(2)} to $${recent.cpa.toFixed(2)}. Consider audience refinement or bid adjustments.`,
            metricName: 'CPA',
            previousValue: previous.cpa,
            currentValue: recent.cpa,
            percentChange,
            threshold,
            detectedAt: new Date(),
            metadata: { conversions: recent.conversions },
        };
    }

    return null;
}

function detectImpressionDrop(
    campaign: CampaignInfo,
    recent: AggregatedMetrics,
    previous: AggregatedMetrics,
    threshold: number
): Anomaly | null {
    if (previous.impressions < 1000) return null;

    const percentChange = ((recent.impressions - previous.impressions) / previous.impressions) * 100;

    if (percentChange < -threshold) {
        return {
            type: 'impression_drop',
            severity: percentChange < -70 ? 'critical' : percentChange < -60 ? 'high' : 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: campaign.platform,
            title: `Impressions dropped ${Math.abs(percentChange).toFixed(1)}%`,
            description: `Impression volume decreased significantly. Check budget exhaustion, bid competitiveness, or audience size issues.`,
            metricName: 'Impressions',
            previousValue: previous.impressions,
            currentValue: recent.impressions,
            percentChange,
            threshold,
            detectedAt: new Date(),
            metadata: { previousImpressions: previous.impressions },
        };
    }

    return null;
}

// =============================================================================
// SAVE ANOMALIES TO DATABASE
// =============================================================================

/**
 * Save detected anomalies to the database
 */
export async function saveAnomalies(companyId: string, anomalies: Anomaly[]): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const records = anomalies.map(a => ({
        company_id: companyId,
        campaign_id: a.campaignId,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        metric_name: a.metricName,
        metric_before: a.previousValue,
        metric_after: a.currentValue,
        percent_change: a.percentChange,
        threshold_breached: a.threshold,
        detected_at: a.detectedAt.toISOString(),
        metadata: a.metadata,
    }));

    if (records.length === 0) return;

    const { error } = await supabase
        .from('anomaly_alerts')
        .insert(records);

    if (error) {
        console.error('Error saving anomalies:', error);
    }
}

/**
 * Get unresolved anomalies for a company
 */
export async function getUnresolvedAnomalies(companyId: string): Promise<Anomaly[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('anomaly_alerts')
        .select(`
            id,
            type,
            severity,
            campaign_id,
            title,
            description,
            metric_name,
            metric_before,
            metric_after,
            percent_change,
            threshold_breached,
            detected_at,
            metadata,
            campaigns!inner(name, platform)
        `)
        .eq('company_id', companyId)
        .is('resolved_at', null)
        .order('detected_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching anomalies:', error);
        return [];
    }

    return (data || []).map(row => {
        const campaign = Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns;
        return {
            type: row.type as AnomalyType,
            severity: row.severity as AnomalySeverity,
            campaignId: row.campaign_id,
            campaignName: campaign?.name || 'Unknown',
            platform: campaign?.platform || 'unknown',
            title: row.title,
            description: row.description || '',
            metricName: row.metric_name || '',
            previousValue: row.metric_before || 0,
            currentValue: row.metric_after || 0,
            percentChange: row.percent_change || 0,
            threshold: row.threshold_breached || 0,
            detectedAt: new Date(row.detected_at),
            metadata: (row.metadata || {}) as Record<string, unknown>,
        };
    });
}

/**
 * Acknowledge an anomaly
 */
export async function acknowledgeAnomaly(
    anomalyId: string,
    userId: string
): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('anomaly_alerts')
        .update({
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: userId,
        })
        .eq('id', anomalyId);

    return !error;
}

/**
 * Resolve an anomaly
 */
export async function resolveAnomaly(
    anomalyId: string,
    userId: string,
    autoResolved: boolean = false
): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('anomaly_alerts')
        .update({
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
            auto_resolved: autoResolved,
        })
        .eq('id', anomalyId);

    return !error;
}
