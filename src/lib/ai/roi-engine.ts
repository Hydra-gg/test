/**
 * ROI Engine
 * Core analytics and optimization calculations for ad campaigns
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

export interface ROIMetrics {
    campaignId: string;
    campaignName: string;
    platform: string;
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    roi: number; // (revenue - spend) / spend * 100
    roas: number; // revenue / spend
    cpa: number; // spend / conversions
    ctr: number; // clicks / impressions * 100
    conversionRate: number; // conversions / clicks * 100
    efficiencyScore: number; // 0-100 composite score
}

export interface WasteReport {
    campaignId: string;
    campaignName: string;
    platform: string;
    wasteType: 'low_roas' | 'high_cpa' | 'low_ctr' | 'no_conversions' | 'budget_inefficient';
    severity: 'low' | 'medium' | 'high' | 'critical';
    wastedSpend: number;
    potentialSavings: number;
    recommendation: string;
    details: Record<string, unknown>;
}

export interface TrendData {
    date: string;
    spend: number;
    revenue: number;
    conversions: number;
    roas: number;
    cpa: number;
    impressions: number;
    clicks: number;
}

export interface TrendAnalysis {
    period: string;
    trends: TrendData[];
    spendTrend: 'increasing' | 'decreasing' | 'stable';
    roasTrend: 'improving' | 'declining' | 'stable';
    cpaTrend: 'improving' | 'worsening' | 'stable';
    insights: string[];
}

export interface PerformanceBenchmark {
    campaignId: string;
    metric: string;
    currentValue: number;
    industryAverage: number;
    percentile: number; // 0-100
    status: 'below' | 'average' | 'above' | 'top';
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

// =============================================================================
// INDUSTRY BENCHMARKS (Default values - should be configurable per industry)
// =============================================================================

const INDUSTRY_BENCHMARKS = {
    ecommerce: { ctr: 2.69, conversionRate: 2.81, cpa: 45.27, roas: 4.0 },
    saas: { ctr: 2.41, conversionRate: 3.04, cpa: 141.01, roas: 3.0 },
    finance: { ctr: 2.91, conversionRate: 5.01, cpa: 81.93, roas: 3.5 },
    healthcare: { ctr: 3.27, conversionRate: 3.36, cpa: 78.09, roas: 3.2 },
    technology: { ctr: 2.09, conversionRate: 2.92, cpa: 133.52, roas: 3.5 },
    default: { ctr: 2.5, conversionRate: 3.0, cpa: 75.0, roas: 3.5 },
};

// =============================================================================
// ROI CALCULATIONS
// =============================================================================

/**
 * Calculate ROI metrics for a specific campaign
 */
export async function calculateCampaignROI(
    campaignId: string,
    dateRange?: DateRange
): Promise<ROIMetrics | null> {
    const supabase = await createServerSupabaseClient();

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, platform, company_id')
        .eq('id', campaignId)
        .single();

    if (campaignError || !campaign) {
        console.error('Error fetching campaign:', campaignError);
        return null;
    }

    // Get aggregated metrics
    let metricsQuery = supabase
        .from('metrics_timeseries')
        .select('impressions, clicks, conversions, spend, revenue')
        .eq('campaign_id', campaignId);

    if (dateRange) {
        metricsQuery = metricsQuery
            .gte('date', dateRange.startDate.toISOString())
            .lte('date', dateRange.endDate.toISOString());
    }

    const { data: metrics, error: metricsError } = await metricsQuery;

    if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        return null;
    }

    // Aggregate metrics
    const totals = (metrics || []).reduce(
        (acc, m) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            conversions: acc.conversions + (m.conversions || 0),
            spend: acc.spend + (m.spend || 0),
            revenue: acc.revenue + (m.revenue || 0),
        }),
        { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    );

    // Calculate metrics (avoid division by zero)
    const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
    const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

    // Calculate efficiency score (0-100)
    const efficiencyScore = calculateEfficiencyScore({ roas, cpa, ctr, conversionRate });

    return {
        campaignId,
        campaignName: campaign.name,
        platform: campaign.platform,
        totalSpend: totals.spend,
        totalRevenue: totals.revenue,
        totalConversions: totals.conversions,
        roi,
        roas,
        cpa,
        ctr,
        conversionRate,
        efficiencyScore,
    };
}

/**
 * Calculate ROI metrics for all campaigns in a company
 */
export async function calculateCompanyROI(
    companyId: string,
    dateRange?: DateRange
): Promise<ROIMetrics[]> {
    const supabase = await createServerSupabaseClient();

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id')
        .eq('company_id', companyId);

    if (error || !campaigns) {
        console.error('Error fetching campaigns:', error);
        return [];
    }

    const results = await Promise.all(
        campaigns.map(c => calculateCampaignROI(c.id, dateRange))
    );

    return results.filter((r): r is ROIMetrics => r !== null);
}

/**
 * Calculate composite efficiency score (0-100)
 */
function calculateEfficiencyScore(metrics: {
    roas: number;
    cpa: number;
    ctr: number;
    conversionRate: number;
}): number {
    const benchmarks = INDUSTRY_BENCHMARKS.default;

    // Score each metric relative to benchmark (0-25 each)
    const roasScore = Math.min(25, (metrics.roas / benchmarks.roas) * 25);
    const cpaScore = metrics.cpa > 0
        ? Math.min(25, (benchmarks.cpa / metrics.cpa) * 25)
        : 0;
    const ctrScore = Math.min(25, (metrics.ctr / benchmarks.ctr) * 25);
    const crScore = Math.min(25, (metrics.conversionRate / benchmarks.conversionRate) * 25);

    return Math.round(roasScore + cpaScore + ctrScore + crScore);
}

// =============================================================================
// WASTE DETECTION
// =============================================================================

/**
 * Detect wasted ad spend across all campaigns for a company
 */
export async function detectWaste(companyId: string): Promise<WasteReport[]> {
    const campaigns = await calculateCompanyROI(companyId);
    const wasteReports: WasteReport[] = [];

    for (const campaign of campaigns) {
        // Check for low ROAS
        if (campaign.roas < 1.0 && campaign.totalSpend > 100) {
            wasteReports.push({
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                platform: campaign.platform,
                wasteType: 'low_roas',
                severity: campaign.roas < 0.5 ? 'critical' : campaign.roas < 0.8 ? 'high' : 'medium',
                wastedSpend: campaign.totalSpend - campaign.totalRevenue,
                potentialSavings: campaign.totalSpend * 0.5,
                recommendation: `Consider pausing or optimizing "${campaign.campaignName}" - current ROAS is ${campaign.roas.toFixed(2)}x`,
                details: { currentRoas: campaign.roas, targetRoas: 3.0 },
            });
        }

        // Check for high CPA
        const benchmarkCPA = INDUSTRY_BENCHMARKS.default.cpa;
        if (campaign.cpa > benchmarkCPA * 2 && campaign.totalConversions > 0) {
            wasteReports.push({
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                platform: campaign.platform,
                wasteType: 'high_cpa',
                severity: campaign.cpa > benchmarkCPA * 3 ? 'high' : 'medium',
                wastedSpend: (campaign.cpa - benchmarkCPA) * campaign.totalConversions,
                potentialSavings: campaign.totalSpend * 0.3,
                recommendation: `CPA of $${campaign.cpa.toFixed(2)} exceeds benchmark by ${((campaign.cpa / benchmarkCPA - 1) * 100).toFixed(0)}%`,
                details: { currentCpa: campaign.cpa, benchmarkCpa: benchmarkCPA },
            });
        }

        // Check for low CTR
        if (campaign.ctr < 0.5 && campaign.totalSpend > 50) {
            wasteReports.push({
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                platform: campaign.platform,
                wasteType: 'low_ctr',
                severity: campaign.ctr < 0.2 ? 'high' : 'medium',
                wastedSpend: campaign.totalSpend * 0.4,
                potentialSavings: campaign.totalSpend * 0.2,
                recommendation: `Low CTR (${campaign.ctr.toFixed(2)}%) suggests poor ad relevance or targeting`,
                details: { currentCtr: campaign.ctr, benchmarkCtr: INDUSTRY_BENCHMARKS.default.ctr },
            });
        }

        // Check for no conversions with significant spend
        if (campaign.totalConversions === 0 && campaign.totalSpend > 200) {
            wasteReports.push({
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                platform: campaign.platform,
                wasteType: 'no_conversions',
                severity: campaign.totalSpend > 500 ? 'critical' : 'high',
                wastedSpend: campaign.totalSpend,
                potentialSavings: campaign.totalSpend,
                recommendation: `$${campaign.totalSpend.toFixed(2)} spent with zero conversions - review targeting and landing page`,
                details: { totalSpend: campaign.totalSpend, clicks: campaign.ctr > 0 ? 'has clicks' : 'no clicks' },
            });
        }
    }

    // Sort by severity and wasted spend
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return wasteReports.sort((a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity] ||
        b.wastedSpend - a.wastedSpend
    );
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Calculate trends for a company over a date range
 */
export async function calculateTrends(
    companyId: string,
    daysBack: number = 30
): Promise<TrendAnalysis> {
    const supabase = await createServerSupabaseClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get all campaigns for the company
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('company_id', companyId);

    if (!campaigns || campaigns.length === 0) {
        return {
            period: `${daysBack} days`,
            trends: [],
            spendTrend: 'stable',
            roasTrend: 'stable',
            cpaTrend: 'stable',
            insights: ['No campaign data available'],
        };
    }

    const campaignIds = campaigns.map(c => c.id);

    // Get metrics aggregated by date
    const { data: metrics, error } = await supabase
        .from('metrics_timeseries')
        .select('date, impressions, clicks, conversions, spend, revenue')
        .in('campaign_id', campaignIds)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

    if (error || !metrics) {
        console.error('Error fetching trend data:', error);
        return {
            period: `${daysBack} days`,
            trends: [],
            spendTrend: 'stable',
            roasTrend: 'stable',
            cpaTrend: 'stable',
            insights: ['Error loading trend data'],
        };
    }

    // Aggregate by date
    const dailyData = new Map<string, TrendData>();

    for (const m of metrics) {
        const existing = dailyData.get(m.date) || {
            date: m.date,
            spend: 0,
            revenue: 0,
            conversions: 0,
            roas: 0,
            cpa: 0,
            impressions: 0,
            clicks: 0,
        };

        existing.spend += m.spend || 0;
        existing.revenue += m.revenue || 0;
        existing.conversions += m.conversions || 0;
        existing.impressions += m.impressions || 0;
        existing.clicks += m.clicks || 0;

        dailyData.set(m.date, existing);
    }

    // Calculate derived metrics
    const trends: TrendData[] = Array.from(dailyData.values()).map(day => ({
        ...day,
        roas: day.spend > 0 ? day.revenue / day.spend : 0,
        cpa: day.conversions > 0 ? day.spend / day.conversions : 0,
    }));

    // Determine trends
    const spendTrend = determineTrend(trends.map(t => t.spend));
    const roasTrend = determineTrend(trends.map(t => t.roas));
    const cpaTrend = determineTrend(trends.map(t => t.cpa), true); // Inverted - lower is better

    // Generate insights
    const insights = generateTrendInsights(trends, spendTrend, roasTrend, cpaTrend);

    return {
        period: `${daysBack} days`,
        trends,
        spendTrend,
        roasTrend: roasTrend === 'increasing' ? 'improving' : roasTrend === 'decreasing' ? 'declining' : 'stable',
        cpaTrend: cpaTrend === 'decreasing' ? 'improving' : cpaTrend === 'increasing' ? 'worsening' : 'stable',
        insights,
    };
}

function determineTrend(values: number[], inverted: boolean = false): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;

    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (changePercent > 10) return inverted ? 'decreasing' : 'increasing';
    if (changePercent < -10) return inverted ? 'increasing' : 'decreasing';
    return 'stable';
}

function generateTrendInsights(
    trends: TrendData[],
    spendTrend: string,
    roasTrend: string,
    cpaTrend: string
): string[] {
    const insights: string[] = [];

    if (trends.length === 0) {
        return ['No data available for analysis'];
    }

    const totalSpend = trends.reduce((sum, t) => sum + t.spend, 0);
    const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    insights.push(`Total spend: $${totalSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    insights.push(`Average ROAS: ${avgRoas.toFixed(2)}x`);

    if (spendTrend === 'increasing' && roasTrend === 'declining') {
        insights.push('⚠️ Spend increasing while ROAS declining - review budget allocation');
    }

    if (cpaTrend === 'increasing') {
        insights.push('⚠️ CPA trending upward - consider audience optimization');
    }

    if (roasTrend === 'improving') {
        insights.push('✅ ROAS improving - campaigns becoming more efficient');
    }

    return insights;
}

// =============================================================================
// BENCHMARK COMPARISON
// =============================================================================

/**
 * Compare campaign performance to industry benchmarks
 */
export async function benchmarkPerformance(
    campaignId: string,
    industry: keyof typeof INDUSTRY_BENCHMARKS = 'default'
): Promise<PerformanceBenchmark[]> {
    const campaign = await calculateCampaignROI(campaignId);
    if (!campaign) return [];

    const benchmarks = INDUSTRY_BENCHMARKS[industry];
    const results: PerformanceBenchmark[] = [];

    // CTR benchmark
    const ctrPercentile = calculatePercentile(campaign.ctr, benchmarks.ctr);
    results.push({
        campaignId,
        metric: 'CTR',
        currentValue: campaign.ctr,
        industryAverage: benchmarks.ctr,
        percentile: ctrPercentile,
        status: getPercentileStatus(ctrPercentile),
    });

    // ROAS benchmark
    const roasPercentile = calculatePercentile(campaign.roas, benchmarks.roas);
    results.push({
        campaignId,
        metric: 'ROAS',
        currentValue: campaign.roas,
        industryAverage: benchmarks.roas,
        percentile: roasPercentile,
        status: getPercentileStatus(roasPercentile),
    });

    // CPA benchmark (inverted - lower is better)
    const cpaPercentile = campaign.cpa > 0
        ? calculatePercentile(benchmarks.cpa, campaign.cpa)
        : 50;
    results.push({
        campaignId,
        metric: 'CPA',
        currentValue: campaign.cpa,
        industryAverage: benchmarks.cpa,
        percentile: cpaPercentile,
        status: getPercentileStatus(cpaPercentile),
    });

    // Conversion Rate benchmark
    const crPercentile = calculatePercentile(campaign.conversionRate, benchmarks.conversionRate);
    results.push({
        campaignId,
        metric: 'Conversion Rate',
        currentValue: campaign.conversionRate,
        industryAverage: benchmarks.conversionRate,
        percentile: crPercentile,
        status: getPercentileStatus(crPercentile),
    });

    return results;
}

function calculatePercentile(value: number, benchmark: number): number {
    if (benchmark === 0) return 50;
    const ratio = value / benchmark;
    // Map ratio to percentile (0.5x = 25th, 1x = 50th, 2x = 90th)
    const percentile = Math.min(100, Math.max(0, 50 * Math.log2(ratio + 1) + 50));
    return Math.round(percentile);
}

function getPercentileStatus(percentile: number): 'below' | 'average' | 'above' | 'top' {
    if (percentile >= 90) return 'top';
    if (percentile >= 60) return 'above';
    if (percentile >= 40) return 'average';
    return 'below';
}
