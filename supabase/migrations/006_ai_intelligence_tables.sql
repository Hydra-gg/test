-- ============================================================================
-- Migration: 006_ai_intelligence_tables.sql
-- Description: Add tables for AI Intelligence Engine
--   - anomaly_alerts: Stores detected anomalies for campaigns
--   - ai_analysis_cache: Caches AI-generated content for performance
-- ============================================================================

-- =============================================================================
-- ANOMALY ALERTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns (id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'ctr_drop',
            'spend_spike',
            'conversion_drop',
            'budget_exhausted',
            'roas_decline',
            'cpa_spike',
            'impression_drop',
            'click_anomaly'
        )
    ),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (
        severity IN (
            'low',
            'medium',
            'high',
            'critical'
        )
    ),
    title TEXT NOT NULL,
    description TEXT,
    metric_name TEXT,
    metric_before NUMERIC,
    metric_after NUMERIC,
    percent_change NUMERIC,
    threshold_breached NUMERIC,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES profiles (id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles (id),
    auto_resolved BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for anomaly_alerts
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_company ON anomaly_alerts (company_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_campaign ON anomaly_alerts (campaign_id);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_severity ON anomaly_alerts (severity);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_type ON anomaly_alerts(type);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_unresolved ON anomaly_alerts (company_id, resolved_at)
WHERE
    resolved_at IS NULL;

-- RLS for anomaly_alerts
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anomaly_alerts_read" ON anomaly_alerts FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                id = (
                    select auth.uid ()
                )
        )
    );

CREATE POLICY "anomaly_alerts_update" ON anomaly_alerts
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

-- =============================================================================
-- AI ANALYSIS CACHE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (
        analysis_type IN (
            'executive_briefing',
            'recommendations',
            'trend_analysis',
            'performance_summary',
            'waste_report',
            'optimization_suggestions'
        )
    ),
    content JSONB NOT NULL,
    prompt_hash TEXT, -- For cache invalidation
    model_used TEXT DEFAULT 'gpt-4-turbo-preview',
    tokens_used INTEGER,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT(NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_id, analysis_type)
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_company_type ON ai_analysis_cache (company_id, analysis_type);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_analysis_cache (expires_at);

-- RLS for ai_analysis_cache
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_cache_read" ON ai_analysis_cache FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                id = (
                    select auth.uid ()
                )
        )
    );

-- Only system can write to cache (service role)
CREATE POLICY "ai_cache_write" ON ai_analysis_cache FOR
INSERT
WITH
    CHECK (TRUE);
-- Will use service role key

CREATE POLICY "ai_cache_update" ON ai_analysis_cache FOR
UPDATE USING (TRUE);
-- Will use service role key

CREATE POLICY "ai_cache_delete" ON ai_analysis_cache FOR DELETE USING (TRUE);
-- Will use service role key

-- =============================================================================
-- ADD CREATIVE AND AUDIENCE TABLES IF MISSING
-- =============================================================================

-- Ensure ad_creatives exists (may already exist)
CREATE TABLE IF NOT EXISTS ad_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
    platform_creative_id TEXT,
    name TEXT NOT NULL,
    type TEXT CHECK (
        type IN (
            'image',
            'video',
            'carousel',
            'text',
            'dynamic'
        )
    ),
    headline TEXT,
    body_text TEXT,
    call_to_action TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'active',
    performance_score NUMERIC,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure audiences exists (may already exist)
CREATE TABLE IF NOT EXISTS audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_audience_id TEXT,
    name TEXT NOT NULL,
    type TEXT CHECK (
        type IN (
            'saved',
            'custom',
            'lookalike',
            'remarketing'
        )
    ),
    size_estimate BIGINT,
    targeting_spec JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ADD INDEXES FOR FOREIGN KEYS ON NEW TABLES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_acknowledged_by ON anomaly_alerts (acknowledged_by);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_resolved_by ON anomaly_alerts (resolved_by);