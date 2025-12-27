/**
 * Recommendation Generator
 * AI-powered action recommendations for campaign optimization
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateCompanyROI, detectWaste, type ROIMetrics, type WasteReport } from './roi-engine';
import { detectAnomalies, type Anomaly } from './anomaly-detection';
import { logAuditAction } from '../api';

// =============================================================================
// TYPES
// =============================================================================

export type RecommendationType =
    | 'budget_shift'
    | 'pause'
    | 'scale'
    | 'creative_swap'
    | 'audience_adjust'
    | 'bid_optimize'
    | 'schedule_adjust';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Recommendation {
    type: RecommendationType;
    priority: RecommendationPriority;
    campaignId: string | null;
    campaignName: string | null;
    platform: string | null;
    title: string;
    description: string;
    rationale: string;
    predictedROIImpact: number; // Expected ROI change in %
    confidenceScore: number; // 0-1 confidence in recommendation
    actionRequired: string;
    estimatedSavings?: number;
    estimatedGain?: number;
    metadata: Record<string, unknown>;
}

export interface RecommendationContext {
    campaigns: ROIMetrics[];
    wasteReports: WasteReport[];
    anomalies: Anomaly[];
    companyMetrics: {
        totalSpend: number;
        totalRevenue: number;
        avgRoas: number;
        avgCpa: number;
    };
}

// =============================================================================
// RECOMMENDATION GENERATOR
// =============================================================================

/**
 * Generate all recommendations for a company
 */
export async function generateRecommendations(companyId: string): Promise<Recommendation[]> {
    // Gather context
    const campaigns = await calculateCompanyROI(companyId);
    const wasteReports = await detectWaste(companyId);
    const anomalies = await detectAnomalies(companyId);

    // Calculate company-level metrics
    const companyMetrics = calculateCompanyMetrics(campaigns);

    const context: RecommendationContext = {
        campaigns,
        wasteReports,
        anomalies,
        companyMetrics,
    };

    const recommendations: Recommendation[] = [];

    // Generate recommendations from waste reports
    recommendations.push(...generateWasteRecommendations(wasteReports));

    // Generate recommendations from anomalies
    recommendations.push(...generateAnomalyRecommendations(anomalies));

    // Generate budget optimization recommendations
    recommendations.push(...generateBudgetRecommendations(campaigns, companyMetrics));

    // Generate scaling recommendations
    recommendations.push(...generateScalingRecommendations(campaigns, companyMetrics));

    // Sort by priority and confidence
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.confidenceScore - a.confidenceScore
    );
}

/**
 * Calculate company-level metrics
 */
function calculateCompanyMetrics(campaigns: ROIMetrics[]) {
    const totalSpend = campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.totalConversions, 0);

    return {
        totalSpend,
        totalRevenue,
        avgRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        avgCpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    };
}

// =============================================================================
// WASTE-BASED RECOMMENDATIONS
// =============================================================================

function generateWasteRecommendations(wasteReports: WasteReport[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const waste of wasteReports) {
        switch (waste.wasteType) {
            case 'low_roas':
                recommendations.push({
                    type: 'pause',
                    priority: waste.severity === 'critical' ? 'urgent' : waste.severity === 'high' ? 'high' : 'medium',
                    campaignId: waste.campaignId,
                    campaignName: waste.campaignName,
                    platform: waste.platform,
                    title: `Pause underperforming campaign`,
                    description: `"${waste.campaignName}" has a ROAS of ${(waste.details.currentRoas as number).toFixed(2)}x, well below the target of ${(waste.details.targetRoas as number).toFixed(1)}x.`,
                    rationale: `This campaign is losing money with each dollar spent. Pausing will stop the bleed while we analyze root causes.`,
                    predictedROIImpact: waste.potentialSavings > 0 ? (waste.potentialSavings / (waste.wastedSpend || 1)) * 100 : 50,
                    confidenceScore: 0.85,
                    actionRequired: 'Pause campaign',
                    estimatedSavings: waste.potentialSavings,
                    metadata: waste.details,
                });
                break;

            case 'high_cpa':
                recommendations.push({
                    type: 'audience_adjust',
                    priority: waste.severity === 'high' ? 'high' : 'medium',
                    campaignId: waste.campaignId,
                    campaignName: waste.campaignName,
                    platform: waste.platform,
                    title: `Optimize audience targeting`,
                    description: `CPA of $${(waste.details.currentCpa as number).toFixed(2)} is ${((waste.details.currentCpa as number) / (waste.details.benchmarkCpa as number) * 100 - 100).toFixed(0)}% above benchmark.`,
                    rationale: `High CPA often indicates poor audience targeting or low-quality traffic sources. Refining the audience can significantly reduce acquisition costs.`,
                    predictedROIImpact: 25,
                    confidenceScore: 0.75,
                    actionRequired: 'Review and refine audience targeting',
                    estimatedSavings: waste.potentialSavings,
                    metadata: waste.details,
                });
                break;

            case 'low_ctr':
                recommendations.push({
                    type: 'creative_swap',
                    priority: 'medium',
                    campaignId: waste.campaignId,
                    campaignName: waste.campaignName,
                    platform: waste.platform,
                    title: `Refresh ad creatives`,
                    description: `CTR of ${(waste.details.currentCtr as number).toFixed(2)}% is significantly below the ${(waste.details.benchmarkCtr as number).toFixed(2)}% benchmark.`,
                    rationale: `Low CTR suggests ad fatigue or poor creative-audience fit. Testing new creatives can revitalize engagement.`,
                    predictedROIImpact: 15,
                    confidenceScore: 0.70,
                    actionRequired: 'Create and test new ad variations',
                    metadata: waste.details,
                });
                break;

            case 'no_conversions':
                recommendations.push({
                    type: 'pause',
                    priority: 'urgent',
                    campaignId: waste.campaignId,
                    campaignName: waste.campaignName,
                    platform: waste.platform,
                    title: `Pause zero-conversion campaign`,
                    description: `$${(waste.details.totalSpend as number).toFixed(2)} spent with zero conversions.`,
                    rationale: `This campaign is burning budget without any return. Immediate pause recommended while investigating conversion tracking and landing page issues.`,
                    predictedROIImpact: 100,
                    confidenceScore: 0.95,
                    actionRequired: 'Pause immediately and investigate',
                    estimatedSavings: waste.wastedSpend,
                    metadata: waste.details,
                });
                break;
        }
    }

    return recommendations;
}

// =============================================================================
// ANOMALY-BASED RECOMMENDATIONS
// =============================================================================

function generateAnomalyRecommendations(anomalies: Anomaly[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const anomaly of anomalies) {
        switch (anomaly.type) {
            case 'ctr_drop':
                recommendations.push({
                    type: 'creative_swap',
                    priority: anomaly.severity === 'critical' ? 'high' : 'medium',
                    campaignId: anomaly.campaignId,
                    campaignName: anomaly.campaignName,
                    platform: anomaly.platform,
                    title: `Address CTR decline in ${anomaly.campaignName}`,
                    description: anomaly.description,
                    rationale: `Sudden CTR drops often indicate ad fatigue or increased competition. Testing fresh creatives can restore performance.`,
                    predictedROIImpact: 20,
                    confidenceScore: 0.75,
                    actionRequired: 'Review creatives and launch new tests',
                    metadata: anomaly.metadata,
                });
                break;

            case 'spend_spike':
                recommendations.push({
                    type: 'bid_optimize',
                    priority: anomaly.severity === 'critical' ? 'urgent' : 'high',
                    campaignId: anomaly.campaignId,
                    campaignName: anomaly.campaignName,
                    platform: anomaly.platform,
                    title: `Review unexpected spend increase`,
                    description: anomaly.description,
                    rationale: `Unexpected spend spikes may indicate bid strategy issues or budget cap problems. Immediate review recommended.`,
                    predictedROIImpact: 30,
                    confidenceScore: 0.80,
                    actionRequired: 'Check bid settings and budget caps',
                    metadata: anomaly.metadata,
                });
                break;

            case 'conversion_drop':
                recommendations.push({
                    type: 'audience_adjust',
                    priority: anomaly.severity === 'critical' ? 'urgent' : 'high',
                    campaignId: anomaly.campaignId,
                    campaignName: anomaly.campaignName,
                    platform: anomaly.platform,
                    title: `Investigate conversion decline`,
                    description: anomaly.description,
                    rationale: `Conversion drops often signal landing page issues, tracking problems, or audience saturation.`,
                    predictedROIImpact: 40,
                    confidenceScore: 0.70,
                    actionRequired: 'Audit conversion funnel and tracking',
                    metadata: anomaly.metadata,
                });
                break;

            case 'roas_decline':
                recommendations.push({
                    type: 'budget_shift',
                    priority: anomaly.severity === 'critical' ? 'urgent' : 'high',
                    campaignId: anomaly.campaignId,
                    campaignName: anomaly.campaignName,
                    platform: anomaly.platform,
                    title: `Reallocate budget from declining campaign`,
                    description: anomaly.description,
                    rationale: `ROAS decline indicates reduced efficiency. Consider shifting budget to better-performing campaigns.`,
                    predictedROIImpact: 25,
                    confidenceScore: 0.75,
                    actionRequired: 'Analyze and shift budget allocation',
                    metadata: anomaly.metadata,
                });
                break;
        }
    }

    return recommendations;
}

// =============================================================================
// BUDGET OPTIMIZATION RECOMMENDATIONS
// =============================================================================

function generateBudgetRecommendations(
    campaigns: ROIMetrics[],
    companyMetrics: { avgRoas: number; totalSpend: number }
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find campaigns with ROAS significantly above average
    const highPerformers = campaigns.filter(c =>
        c.roas > companyMetrics.avgRoas * 1.5 &&
        c.totalSpend > 100
    );

    // Find campaigns with ROAS significantly below average
    const lowPerformers = campaigns.filter(c =>
        c.roas < companyMetrics.avgRoas * 0.5 &&
        c.roas > 0 &&
        c.totalSpend > 100
    );

    if (highPerformers.length > 0 && lowPerformers.length > 0) {
        const totalShiftable = lowPerformers.reduce((sum, c) => sum + c.totalSpend * 0.3, 0);
        const bestPerformer = highPerformers.sort((a, b) => b.roas - a.roas)[0];

        recommendations.push({
            type: 'budget_shift',
            priority: 'high',
            campaignId: null,
            campaignName: null,
            platform: null,
            title: `Shift $${totalShiftable.toFixed(0)} to top performers`,
            description: `Reallocate 30% of budget from ${lowPerformers.length} underperforming campaigns to "${bestPerformer.campaignName}" and other high-ROAS campaigns.`,
            rationale: `Portfolio optimization can improve overall ROAS by concentrating spend on proven winners while limiting exposure to underperformers.`,
            predictedROIImpact: 35,
            confidenceScore: 0.80,
            actionRequired: 'Review and approve budget reallocation',
            estimatedGain: totalShiftable * (bestPerformer.roas - companyMetrics.avgRoas),
            metadata: {
                fromCampaigns: lowPerformers.map(c => c.campaignId),
                toCampaigns: highPerformers.map(c => c.campaignId),
                shiftAmount: totalShiftable,
            },
        });
    }

    return recommendations;
}

// =============================================================================
// SCALING RECOMMENDATIONS
// =============================================================================

function generateScalingRecommendations(
    campaigns: ROIMetrics[],
    companyMetrics: { avgRoas: number }
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find campaigns ready to scale
    const scaleReadyCampaigns = campaigns.filter(c =>
        c.roas > 3.0 && // Strong ROAS
        c.efficiencyScore > 70 && // High efficiency
        c.totalConversions >= 10 // Enough data
    );

    for (const campaign of scaleReadyCampaigns.slice(0, 3)) { // Top 3
        recommendations.push({
            type: 'scale',
            priority: 'medium',
            campaignId: campaign.campaignId,
            campaignName: campaign.campaignName,
            platform: campaign.platform,
            title: `Scale "${campaign.campaignName}"`,
            description: `With ROAS of ${campaign.roas.toFixed(2)}x and efficiency score of ${campaign.efficiencyScore}, this campaign is ready for budget increase.`,
            rationale: `Campaigns with consistent high performance can often absorb 20-50% budget increases while maintaining efficiency.`,
            predictedROIImpact: 15,
            confidenceScore: 0.70,
            actionRequired: 'Increase daily budget by 20%',
            estimatedGain: campaign.totalSpend * 0.2 * campaign.roas,
            metadata: {
                currentSpend: campaign.totalSpend,
                currentRoas: campaign.roas,
                efficiencyScore: campaign.efficiencyScore,
            },
        });
    }

    return recommendations;
}

// =============================================================================
// SAVE RECOMMENDATIONS TO DATABASE
// =============================================================================

/**
 * Save recommendations to database
 */
export async function saveRecommendations(
    companyId: string,
    recommendations: Recommendation[]
): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const records = recommendations.map(r => ({
        company_id: companyId,
        campaign_id: r.campaignId,
        type: r.type,
        title: r.title,
        description: r.description,
        predicted_roi_impact: r.predictedROIImpact,
        confidence_score: r.confidenceScore,
        status: 'pending',
        metadata: {
            priority: r.priority,
            rationale: r.rationale,
            actionRequired: r.actionRequired,
            estimatedSavings: r.estimatedSavings,
            estimatedGain: r.estimatedGain,
            ...r.metadata,
        },
    }));

    if (records.length === 0) return;

    const { error } = await supabase
        .from('ai_recommendations')
        .insert(records);

    if (error) {
        console.error('Error saving recommendations:', error);
    }
}

/**
 * Get pending recommendations for a company
 */
export async function getPendingRecommendations(companyId: string): Promise<Recommendation[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('ai_recommendations')
        .select(`
            id,
            type,
            title,
            description,
            predicted_roi_impact,
            confidence_score,
            metadata,
            campaign_id,
            campaigns(name, platform)
        `)
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }

    return (data || []).map(row => {
        const campaign = Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns;
        return {
            type: row.type as RecommendationType,
            priority: (row.metadata as Record<string, unknown>)?.priority as RecommendationPriority || 'medium',
            campaignId: row.campaign_id,
            campaignName: campaign?.name || null,
            platform: campaign?.platform || null,
            title: row.title,
            description: row.description || '',
            rationale: (row.metadata as Record<string, unknown>)?.rationale as string || '',
            predictedROIImpact: row.predicted_roi_impact || 0,
            confidenceScore: row.confidence_score || 0,
            actionRequired: (row.metadata as Record<string, unknown>)?.actionRequired as string || '',
            estimatedSavings: (row.metadata as Record<string, unknown>)?.estimatedSavings as number,
            estimatedGain: (row.metadata as Record<string, unknown>)?.estimatedGain as number,
            metadata: (row.metadata || {}) as Record<string, unknown>,
        };
    });
}

/**
 * Approve a recommendation
 */
export async function approveRecommendation(
    recommendationId: string,
    userId: string
): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    // Fetch rec to get company_id
    const { data: rec } = await supabase.from('ai_recommendations').select('company_id').eq('id', recommendationId).single();
    if (!rec) return false;

    const { error } = await supabase
        .from('ai_recommendations')
        .update({
            status: 'approved',
            approved_by: userId,
            approved_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

    if (!error) {
        await logAuditAction({
            companyId: rec.company_id,
            userId,
            action: 'approve_recommendation',
            entityType: 'recommendation',
            entityId: recommendationId,
            changes: { status: 'approved' }
        });
    }

    return !error;
}

/**
 * Reject a recommendation
 */
export async function rejectRecommendation(
    recommendationId: string,
    userId: string,
    reason?: string
): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    // First get current metadata
    const { data: existing } = await supabase
        .from('ai_recommendations')
        .select('metadata, company_id')
        .eq('id', recommendationId)
        .single();

    if (!existing) return false;

    const currentMetadata = (existing?.metadata || {}) as Record<string, unknown>;
    const updatedMetadata = { ...currentMetadata, rejectionReason: reason, rejected_by: userId };

    const { error } = await supabase
        .from('ai_recommendations')
        .update({
            status: 'rejected',
            metadata: updatedMetadata,
        })
        .eq('id', recommendationId);

    if (!error) {
        await logAuditAction({
            companyId: existing.company_id,
            userId,
            action: 'reject_recommendation',
            entityType: 'recommendation',
            entityId: recommendationId,
            changes: { status: 'rejected' },
            details: { reason }
        });
    }

    return !error;
}
