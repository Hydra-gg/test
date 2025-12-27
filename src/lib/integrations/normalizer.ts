/**
 * Data Normalization Layer
 * Converts platform-specific data formats to unified Escalate AI format
 */

import type {
    Campaign,
    CampaignStatus,
    MetricsTimeseries,
    AdCreative,
    CreativeFormat,
} from '@/types/database';

import type { GoogleAdsCampaign, GoogleAdsMetrics } from './google-ads';
import type { MetaCampaign, MetaInsight } from './meta-ads';

// =============================================================================
// CAMPAIGN NORMALIZATION
// =============================================================================

export function normalizeGoogleCampaign(
    campaign: GoogleAdsCampaign,
    companyId: string,
    connectionId: string
): Omit<Campaign, 'id' | 'created_at' | 'updated_at'> {
    // Map Google status to unified status
    const statusMap: Record<string, CampaignStatus> = {
        'ENABLED': 'active',
        'PAUSED': 'paused',
        'REMOVED': 'ended',
        'PENDING': 'draft',
        'ENDED': 'ended',
    };

    // Map channel type to readable format
    const channelMap: Record<string, string> = {
        'SEARCH': 'Search',
        'DISPLAY': 'Display',
        'SHOPPING': 'Shopping',
        'VIDEO': 'Video',
        'MULTI_CHANNEL': 'Performance Max',
        'LOCAL': 'Local',
        'SMART': 'Smart',
        'PERFORMANCE_MAX': 'Performance Max',
    };

    // Convert micros to dollars
    const budgetDaily = parseInt(campaign.budgetAmountMicros || '0') / 1_000_000;

    return {
        company_id: companyId,
        platform_connection_id: connectionId,
        platform_campaign_id: campaign.id,
        name: campaign.name,
        platform: 'google',
        channel: channelMap[campaign.advertisingChannelType] || campaign.advertisingChannelType,
        objective: campaign.advertisingChannelType,
        status: statusMap[campaign.status] || 'draft',
        budget_daily: budgetDaily,
        budget_total: null,
        bid_strategy: null,
        start_date: campaign.startDate || null,
        end_date: campaign.endDate || null,
        health_score: null, // Will be calculated by AI
    };
}

export function normalizeMetaCampaign(
    campaign: MetaCampaign,
    companyId: string,
    connectionId: string
): Omit<Campaign, 'id' | 'created_at' | 'updated_at'> {
    // Map Meta status to unified status
    const statusMap: Record<string, CampaignStatus> = {
        'ACTIVE': 'active',
        'PAUSED': 'paused',
        'DELETED': 'ended',
        'ARCHIVED': 'ended',
        'IN_PROCESS': 'draft',
        'WITH_ISSUES': 'error',
    };

    // Map objective to readable format
    const objectiveMap: Record<string, string> = {
        'OUTCOME_AWARENESS': 'Awareness',
        'OUTCOME_ENGAGEMENT': 'Engagement',
        'OUTCOME_LEADS': 'Leads',
        'OUTCOME_SALES': 'Sales',
        'OUTCOME_TRAFFIC': 'Traffic',
        'OUTCOME_APP_PROMOTION': 'App Promotion',
        'LINK_CLICKS': 'Traffic',
        'CONVERSIONS': 'Sales',
        'LEAD_GENERATION': 'Leads',
    };

    // Convert cents to dollars
    const budgetDaily = campaign.dailyBudget ? parseInt(campaign.dailyBudget) / 100 : null;
    const budgetTotal = campaign.lifetimeBudget ? parseInt(campaign.lifetimeBudget) / 100 : null;

    return {
        company_id: companyId,
        platform_connection_id: connectionId,
        platform_campaign_id: campaign.id,
        name: campaign.name,
        platform: 'meta',
        channel: 'Facebook/Instagram',
        objective: objectiveMap[campaign.objective] || campaign.objective,
        status: statusMap[campaign.status] || 'draft',
        budget_daily: budgetDaily,
        budget_total: budgetTotal,
        bid_strategy: null,
        start_date: null, // Not returned in simplified API
        end_date: null,
        health_score: null,
    };
}

// =============================================================================
// METRICS NORMALIZATION
// =============================================================================

export function normalizeGoogleMetrics(
    metrics: GoogleAdsMetrics,
    campaignId: string
): Omit<MetricsTimeseries, 'id' | 'created_at'> {
    const spend = metrics.costMicros / 1_000_000;
    const revenue = metrics.conversionsValue;
    const clicks = metrics.clicks;
    const conversions = metrics.conversions;

    return {
        campaign_id: campaignId,
        creative_id: null,
        audience_id: null,
        date: metrics.date,
        granularity: 'day',
        impressions: metrics.impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr: metrics.impressions > 0 ? (clicks / metrics.impressions) * 100 : null,
        cpc: clicks > 0 ? spend / clicks : null,
        cpa: conversions > 0 ? spend / conversions : null,
        roas: spend > 0 ? revenue / spend : null,
        roi: spend > 0 ? ((revenue - spend) / spend) * 100 : null,
        cac: conversions > 0 ? spend / conversions : null,
        ltv: null, // Requires external data
    };
}

export function normalizeMetaMetrics(
    insight: MetaInsight,
    campaignId: string
): Omit<MetricsTimeseries, 'id' | 'created_at'> {
    const spend = insight.spend;
    const revenue = insight.purchaseValue;
    const clicks = insight.clicks;
    const conversions = insight.conversions;
    const impressions = insight.impressions;

    return {
        campaign_id: campaignId,
        creative_id: null,
        audience_id: null,
        date: insight.dateStart,
        granularity: 'day',
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
        cpc: clicks > 0 ? spend / clicks : null,
        cpa: conversions > 0 ? spend / conversions : null,
        roas: spend > 0 ? revenue / spend : null,
        roi: spend > 0 ? ((revenue - spend) / spend) * 100 : null,
        cac: conversions > 0 ? spend / conversions : null,
        ltv: null,
    };
}

// =============================================================================
// CREATIVE NORMALIZATION (for future use)
// =============================================================================

export interface RawCreativeData {
    id: string;
    name?: string;
    headline?: string;
    primaryText?: string;
    ctaText?: string;
    imageUrl?: string;
    videoUrl?: string;
    format?: string;
    status?: string;
}

export function normalizeCreative(
    creative: RawCreativeData,
    campaignId: string,
    platform: 'google' | 'meta'
): Omit<AdCreative, 'id' | 'created_at' | 'updated_at'> {
    const formatMap: Record<string, CreativeFormat> = {
        'IMAGE': 'image',
        'VIDEO': 'video',
        'CAROUSEL': 'carousel',
        'COLLECTION': 'collection',
        'TEXT': 'text',
        'RESPONSIVE_DISPLAY_AD': 'image',
        'RESPONSIVE_SEARCH_AD': 'text',
    };

    return {
        campaign_id: campaignId,
        platform_creative_id: creative.id,
        name: creative.name || null,
        headline: creative.headline || null,
        primary_text: creative.primaryText || null,
        cta_text: creative.ctaText || null,
        image_url: creative.imageUrl || null,
        video_url: creative.videoUrl || null,
        format: formatMap[creative.format?.toUpperCase() || ''] || null,
        placement: null,
        status: creative.status || 'active',
        fatigue_score: null, // Will be calculated by AI
    };
}

// =============================================================================
// BATCH NORMALIZATION HELPERS
// =============================================================================

export function normalizeGoogleCampaigns(
    campaigns: GoogleAdsCampaign[],
    companyId: string,
    connectionId: string
): Array<Omit<Campaign, 'id' | 'created_at' | 'updated_at'>> {
    return campaigns.map(c => normalizeGoogleCampaign(c, companyId, connectionId));
}

export function normalizeMetaCampaigns(
    campaigns: MetaCampaign[],
    companyId: string,
    connectionId: string
): Array<Omit<Campaign, 'id' | 'created_at' | 'updated_at'>> {
    return campaigns.map(c => normalizeMetaCampaign(c, companyId, connectionId));
}

export function normalizeGoogleMetricsBatch(
    metrics: GoogleAdsMetrics[],
    campaignIdMap: Map<string, string> // platformCampaignId -> internalCampaignId
): Array<Omit<MetricsTimeseries, 'id' | 'created_at'>> {
    return metrics
        .filter(m => campaignIdMap.has(m.campaignId))
        .map(m => normalizeGoogleMetrics(m, campaignIdMap.get(m.campaignId)!));
}

export function normalizeMetaMetricsBatch(
    insights: MetaInsight[],
    campaignIdMap: Map<string, string>
): Array<Omit<MetricsTimeseries, 'id' | 'created_at'>> {
    return insights
        .filter(i => campaignIdMap.has(i.campaignId))
        .map(i => normalizeMetaMetrics(i, campaignIdMap.get(i.campaignId)!));
}
