/**
 * OpenAI Client
 * Natural language AI capabilities for executive insights
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ROIMetrics, TrendAnalysis } from './roi-engine';
import type { Anomaly } from './anomaly-detection';
import type { Recommendation } from './recommendation-generator';

// =============================================================================
// CONFIGURATION
// =============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Cache TTL in milliseconds
const CACHE_TTL = {
    executive_briefing: 60 * 60 * 1000, // 1 hour
    recommendations: 30 * 60 * 1000, // 30 minutes
    trend_analysis: 2 * 60 * 60 * 1000, // 2 hours
    performance_summary: 60 * 60 * 1000, // 1 hour
};

// =============================================================================
// TYPES
// =============================================================================

export interface ExecutiveBriefing {
    summary: string;
    keyInsights: string[];
    topOpportunities: string[];
    warnings: string[];
    recommendedActions: string[];
    generatedAt: Date;
}

export interface CampaignAnalysis {
    campaignId: string;
    campaignName: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface OpenAIResponse {
    content: string;
    tokensUsed: number;
    model: string;
}

// =============================================================================
// OPENAI API CALLS
// =============================================================================

/**
 * Make a call to OpenAI API
 */
async function callOpenAI(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7
): Promise<OpenAIResponse | null> {
    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        return null;
    }

    try {
        const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages,
                temperature,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API error:', error);
            return null;
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            tokensUsed: data.usage?.total_tokens || 0,
            model: data.model,
        };
    } catch (error) {
        console.error('OpenAI call failed:', error);
        return null;
    }
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

async function getCachedAnalysis(
    companyId: string,
    analysisType: string
): Promise<unknown | null> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('ai_analysis_cache')
        .select('content, expires_at')
        .eq('company_id', companyId)
        .eq('analysis_type', analysisType)
        .single();

    if (error || !data) return null;

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
        return null;
    }

    return data.content;
}

async function setCachedAnalysis(
    companyId: string,
    analysisType: keyof typeof CACHE_TTL,
    content: unknown,
    tokensUsed: number,
    model: string
): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const expiresAt = new Date(Date.now() + CACHE_TTL[analysisType]);

    await supabase
        .from('ai_analysis_cache')
        .upsert({
            company_id: companyId,
            analysis_type: analysisType,
            content,
            tokens_used: tokensUsed,
            model_used: model,
            generated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
        }, {
            onConflict: 'company_id,analysis_type',
        });
}

// =============================================================================
// EXECUTIVE BRIEFING
// =============================================================================

const EXECUTIVE_SYSTEM_PROMPT = `You are an AI assistant for Escalate AI, an enterprise ad optimization platform. 
You provide executive-level insights on advertising performance for CEOs and marketing executives.
Your responses should be:
- Concise and action-oriented
- Focused on ROI, revenue impact, and strategic decisions
- Written for busy executives who need quick understanding
- Data-driven but accessible

Format your responses as JSON with the following structure:
{
  "summary": "One paragraph executive summary",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "topOpportunities": ["opportunity 1", "opportunity 2"],
  "warnings": ["warning 1", "warning 2"],
  "recommendedActions": ["action 1", "action 2", "action 3"]
}`;

/**
 * Generate an executive briefing for a company
 */
export async function generateExecutiveBriefing(
    companyId: string,
    campaigns: ROIMetrics[],
    trends: TrendAnalysis,
    anomalies: Anomaly[],
    recommendations: Recommendation[]
): Promise<ExecutiveBriefing | null> {
    // Check cache first
    const cached = await getCachedAnalysis(companyId, 'executive_briefing') as ExecutiveBriefing | null;
    if (cached) {
        return { ...cached, generatedAt: new Date(cached.generatedAt) };
    }

    // Prepare context for AI
    const totalSpend = campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    const topPerformers = campaigns
        .filter(c => c.roas > avgRoas)
        .sort((a, b) => b.roas - a.roas)
        .slice(0, 3);

    const underPerformers = campaigns
        .filter(c => c.roas < avgRoas * 0.5)
        .slice(0, 3);

    const prompt = `Generate an executive briefing for an advertising portfolio with the following metrics:

PORTFOLIO OVERVIEW:
- Total Spend: $${totalSpend.toLocaleString()}
- Total Revenue: $${totalRevenue.toLocaleString()}
- Average ROAS: ${avgRoas.toFixed(2)}x
- Active Campaigns: ${campaigns.length}

TREND ANALYSIS (${trends.period}):
- Spend Trend: ${trends.spendTrend}
- ROAS Trend: ${trends.roasTrend}
- CPA Trend: ${trends.cpaTrend}
${trends.insights.map(i => `- ${i}`).join('\n')}

TOP PERFORMERS:
${topPerformers.map(c => `- ${c.campaignName} (${c.platform}): ROAS ${c.roas.toFixed(2)}x, Spend $${c.totalSpend.toLocaleString()}`).join('\n') || '- No standout performers'}

UNDERPERFORMERS:
${underPerformers.map(c => `- ${c.campaignName} (${c.platform}): ROAS ${c.roas.toFixed(2)}x`).join('\n') || '- All campaigns performing well'}

ACTIVE ANOMALIES: ${anomalies.length}
${anomalies.slice(0, 5).map(a => `- ${a.title} (${a.severity})`).join('\n') || '- No anomalies detected'}

PENDING RECOMMENDATIONS: ${recommendations.length}
${recommendations.slice(0, 3).map(r => `- ${r.title}`).join('\n') || '- No recommendations'}

Provide an executive briefing that a CEO can read in 60 seconds.`;

    const response = await callOpenAI(prompt, EXECUTIVE_SYSTEM_PROMPT, 0.4);
    if (!response) {
        // Return fallback briefing
        return generateFallbackBriefing(campaigns, trends, anomalies);
    }

    try {
        const parsed = JSON.parse(response.content) as ExecutiveBriefing;
        const briefing = { ...parsed, generatedAt: new Date() };

        // Cache the result
        await setCachedAnalysis(companyId, 'executive_briefing', briefing, response.tokensUsed, response.model);

        return briefing;
    } catch {
        console.error('Failed to parse OpenAI response:', response.content);
        return generateFallbackBriefing(campaigns, trends, anomalies);
    }
}

/**
 * Generate fallback briefing without AI
 */
function generateFallbackBriefing(
    campaigns: ROIMetrics[],
    trends: TrendAnalysis,
    anomalies: Anomaly[]
): ExecutiveBriefing {
    const totalSpend = campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
        summary: `Your ad portfolio of ${campaigns.length} campaigns has generated $${totalRevenue.toLocaleString()} in revenue from $${totalSpend.toLocaleString()} spend, achieving an overall ROAS of ${avgRoas.toFixed(2)}x. ${anomalies.length > 0 ? `There are ${anomalies.length} anomalies requiring attention.` : 'No critical issues detected.'}`,
        keyInsights: [
            `${trends.roasTrend === 'improving' ? '✅' : trends.roasTrend === 'declining' ? '⚠️' : '➡️'} ROAS is ${trends.roasTrend}`,
            `${trends.cpaTrend === 'improving' ? '✅' : trends.cpaTrend === 'worsening' ? '⚠️' : '➡️'} CPA is ${trends.cpaTrend}`,
            `${campaigns.filter(c => c.roas > 3).length} campaigns performing above target ROAS`,
        ],
        topOpportunities: [
            campaigns.filter(c => c.roas > avgRoas * 1.5).length > 0
                ? `Scale top ${campaigns.filter(c => c.roas > avgRoas * 1.5).length} high-performers`
                : 'Review audience targeting across campaigns',
        ],
        warnings: anomalies
            .filter(a => a.severity === 'critical' || a.severity === 'high')
            .slice(0, 3)
            .map(a => a.title),
        recommendedActions: [
            'Review pending AI recommendations',
            'Check campaigns with declining ROAS',
            'Verify conversion tracking is active',
        ],
        generatedAt: new Date(),
    };
}

// =============================================================================
// ANOMALY EXPLANATION
// =============================================================================

/**
 * Generate a human-readable explanation for an anomaly
 */
export async function explainAnomaly(anomaly: Anomaly): Promise<string> {
    const prompt = `Explain this advertising anomaly to a marketing executive in 2-3 sentences:

Anomaly: ${anomaly.title}
Type: ${anomaly.type}
Severity: ${anomaly.severity}
Campaign: ${anomaly.campaignName} (${anomaly.platform})
Metric: ${anomaly.metricName}
Change: ${anomaly.percentChange > 0 ? '+' : ''}${anomaly.percentChange.toFixed(1)}%
Previous Value: ${anomaly.previousValue}
Current Value: ${anomaly.currentValue}

Provide a brief, actionable explanation focusing on potential causes and immediate next steps.`;

    const response = await callOpenAI(prompt, undefined, 0.5);

    return response?.content || anomaly.description;
}

// =============================================================================
// CAMPAIGN OPTIMIZATION SUGGESTIONS
// =============================================================================

/**
 * Generate optimization suggestions for a specific campaign
 */
export async function suggestOptimizations(campaign: ROIMetrics): Promise<string[]> {
    const prompt = `Suggest 3-5 specific optimizations for this digital advertising campaign:

Campaign: ${campaign.campaignName}
Platform: ${campaign.platform}
Spend: $${campaign.totalSpend.toLocaleString()}
Revenue: $${campaign.totalRevenue.toLocaleString()}
ROAS: ${campaign.roas.toFixed(2)}x
CPA: $${campaign.cpa.toFixed(2)}
CTR: ${campaign.ctr.toFixed(2)}%
Conversion Rate: ${campaign.conversionRate.toFixed(2)}%
Efficiency Score: ${campaign.efficiencyScore}/100

Provide specific, actionable suggestions. Format as a JSON array of strings.`;

    const response = await callOpenAI(prompt, undefined, 0.6);

    if (!response) {
        return [
            'Review and refresh ad creatives',
            'Analyze audience demographics and adjust targeting',
            'Test different bid strategies',
        ];
    }

    try {
        return JSON.parse(response.content) as string[];
    } catch {
        // Try to extract bullet points from response
        const lines = response.content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
        return lines.map(l => l.replace(/^[-•]\s*/, '').trim()).slice(0, 5);
    }
}

// =============================================================================
// Q&A ABOUT PERFORMANCE
// =============================================================================

/**
 * Answer a natural language question about ad performance
 */
export async function answerQuestion(
    question: string,
    context: {
        campaigns: ROIMetrics[];
        trends: TrendAnalysis;
        recommendations: Recommendation[];
    }
): Promise<string> {
    const totalSpend = context.campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
    const totalRevenue = context.campaigns.reduce((sum, c) => sum + c.totalRevenue, 0);

    const prompt = `Answer this question about our advertising performance:

Question: "${question}"

CONTEXT:
- Total Campaigns: ${context.campaigns.length}
- Total Spend: $${totalSpend.toLocaleString()}
- Total Revenue: $${totalRevenue.toLocaleString()}
- Average ROAS: ${totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0}x
- Trend Period: ${context.trends.period}
- ROAS Trend: ${context.trends.roasTrend}
- CPA Trend: ${context.trends.cpaTrend}
- Pending Recommendations: ${context.recommendations.length}

TOP CAMPAIGNS BY ROAS:
${context.campaigns.sort((a, b) => b.roas - a.roas).slice(0, 5).map(c => `- ${c.campaignName}: ROAS ${c.roas.toFixed(2)}x, Spend $${c.totalSpend.toLocaleString()}`).join('\n')}

Answer concisely and include specific numbers where relevant.`;

    const systemPrompt = `You are an AI assistant for Escalate AI. Answer questions about advertising performance data. 
Be specific, cite numbers, and provide actionable insights. Keep answers under 200 words.`;

    const response = await callOpenAI(prompt, systemPrompt, 0.6);

    return response?.content || 'I apologize, but I cannot answer that question at the moment. Please try again.';
}

// =============================================================================
// EXPORTS INDEX
// =============================================================================

export {
    callOpenAI,
    getCachedAnalysis,
    setCachedAnalysis,
};
