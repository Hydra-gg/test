-- Escalate AI Core Schema Migration
-- Version: 001
-- Description: Core tables for multi-tenant ad optimization platform

-- =============================================================================
-- COMPANIES TABLE (Multi-tenant foundation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    industry TEXT,
    region TEXT,
    size TEXT CHECK (
        size IN (
            'startup',
            'smb',
            'mid-market',
            'enterprise'
        )
    ),
    monthly_spend_min NUMERIC,
    monthly_spend_max NUMERIC,
    subscription_tier TEXT DEFAULT 'pilot',
    delegation_level TEXT DEFAULT 'advisory' CHECK (
        delegation_level IN (
            'advisory',
            'supervised',
            'autonomous'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EXTEND PROFILES TABLE (Add company & role)
-- =============================================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies (id);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'analyst' CHECK (
    role IN ('ceo', 'operator', 'analyst')
);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"read": true, "approve": false, "override": false}';

-- =============================================================================
-- AD PLATFORM CONNECTIONS (OAuth tokens for Google, Meta, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ad_platform_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (
        platform IN (
            'google',
            'meta',
            'tiktok',
            'linkedin'
        )
    ),
    account_id TEXT,
    account_name TEXT,
    access_token TEXT, -- Should be encrypted at rest
    refresh_token TEXT, -- Should be encrypted at rest
    token_expires_at TIMESTAMPTZ,
    permission_scope TEXT DEFAULT 'read' CHECK (
        permission_scope IN ('read', 'execute')
    ),
    sync_status TEXT DEFAULT 'pending' CHECK (
        sync_status IN (
            'pending',
            'syncing',
            'healthy',
            'error'
        )
    ),
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (
        company_id,
        platform,
        account_id
    )
);

-- =============================================================================
-- CAMPAIGNS (Synced from ad platforms)
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    platform_connection_id UUID REFERENCES ad_platform_connections (id) ON DELETE SET NULL,
    platform_campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    channel TEXT,
    objective TEXT,
    status TEXT DEFAULT 'active' CHECK (
        status IN (
            'active',
            'paused',
            'ended',
            'draft',
            'error'
        )
    ),
    budget_daily NUMERIC,
    budget_total NUMERIC,
    bid_strategy TEXT,
    start_date DATE,
    end_date DATE,
    health_score NUMERIC CHECK (
        health_score >= 0
        AND health_score <= 100
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (
        company_id,
        platform,
        platform_campaign_id
    )
);

-- =============================================================================
-- AD CREATIVES (Creative assets linked to campaigns)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ad_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    campaign_id UUID REFERENCES campaigns (id) ON DELETE CASCADE,
    platform_creative_id TEXT,
    name TEXT,
    headline TEXT,
    primary_text TEXT,
    cta_text TEXT,
    image_url TEXT,
    video_url TEXT,
    format TEXT CHECK (
        format IN (
            'image',
            'video',
            'carousel',
            'collection',
            'text'
        )
    ),
    placement TEXT,
    status TEXT DEFAULT 'active',
    fatigue_score NUMERIC CHECK (
        fatigue_score >= 0
        AND fatigue_score <= 100
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIENCES (Platform audience segments)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_audience_id TEXT,
    name TEXT NOT NULL,
    segment_type TEXT CHECK (
        segment_type IN (
            'custom',
            'lookalike',
            'interest',
            'retargeting',
            'broad'
        )
    ),
    size_estimate BIGINT,
    performance_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- METRICS TIMESERIES (Performance data at various granularities)
-- =============================================================================
CREATE TABLE IF NOT EXISTS metrics_timeseries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    campaign_id UUID REFERENCES campaigns (id) ON DELETE CASCADE,
    creative_id UUID REFERENCES ad_creatives (id) ON DELETE SET NULL,
    audience_id UUID REFERENCES audiences (id) ON DELETE SET NULL,
    date DATE NOT NULL,
    granularity TEXT DEFAULT 'day' CHECK (
        granularity IN ('hour', 'day', 'week')
    ),
    -- Core metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend NUMERIC DEFAULT 0,
    revenue NUMERIC DEFAULT 0,
    -- Derived metrics (calculated on sync)
    ctr NUMERIC, -- click-through rate
    cpc NUMERIC, -- cost per click
    cpa NUMERIC, -- cost per acquisition
    roas NUMERIC, -- return on ad spend
    roi NUMERIC, -- return on investment
    cac NUMERIC, -- customer acquisition cost
    ltv NUMERIC, -- lifetime value (if available)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (
        campaign_id,
        creative_id,
        audience_id,
        date,
        granularity
    )
);

-- =============================================================================
-- AI RECOMMENDATIONS (The Protocol's suggestions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns (id) ON DELETE SET NULL,
    creative_id UUID REFERENCES ad_creatives (id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'budget_shift',
            'pause',
            'scale',
            'creative_swap',
            'audience_adjust',
            'bid_adjust',
            'creative_refresh'
        )
    ),
    priority TEXT DEFAULT 'medium' CHECK (
        priority IN (
            'low',
            'medium',
            'high',
            'critical'
        )
    ),
    title TEXT NOT NULL,
    description TEXT,
    action_summary TEXT, -- Human-readable action description
    -- ROI Prediction
    predicted_roi_impact NUMERIC,
    predicted_cost_savings NUMERIC,
    predicted_revenue_increase NUMERIC,
    confidence_score NUMERIC CHECK (
        confidence_score >= 0
        AND confidence_score <= 1
    ),
    confidence_band_low NUMERIC,
    confidence_band_high NUMERIC,
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'executed',
            'rejected',
            'expired',
            'failed'
        )
    ),
    approved_by UUID REFERENCES profiles (id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES profiles (id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    executed_at TIMESTAMPTZ,
    execution_result JSONB,
    -- Metadata
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WORKFLOWS (N8N workflow tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    n8n_workflow_id TEXT,
    trigger_type TEXT CHECK (
        trigger_type IN (
            'manual',
            'scheduled',
            'threshold',
            'event'
        )
    ),
    trigger_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS (Complete action history)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT, -- 'campaign', 'recommendation', 'workflow', etc.
    entity_id UUID,
    changes JSONB DEFAULT '{}', -- Before/after values
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);

-- =============================================================================
-- NOTIFICATIONS (Alerts & approval requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN (
            'alert',
            'approval_request',
            'anomaly',
            'report',
            'system'
        )
    ),
    priority TEXT DEFAULT 'medium' CHECK (
        priority IN (
            'low',
            'medium',
            'high',
            'critical'
        )
    ),
    title TEXT NOT NULL,
    message TEXT,
    link_to TEXT, -- URL path to relevant page
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (
    user_id,
    is_read,
    created_at DESC
);

-- =============================================================================
-- EXECUTIVE REPORTS (Scheduled & ad-hoc reports)
-- =============================================================================
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    generated_by UUID REFERENCES profiles (id),
    report_type TEXT NOT NULL CHECK (
        report_type IN (
            'weekly',
            'monthly',
            'quarterly',
            'custom',
            'pilot_summary'
        )
    ),
    title TEXT NOT NULL,
    date_from DATE,
    date_to DATE,
    -- Key metrics snapshot
    total_spend NUMERIC,
    total_revenue NUMERIC,
    total_roi NUMERIC,
    total_roas NUMERIC,
    -- Content
    summary TEXT,
    insights JSONB DEFAULT '[]',
    recommendations_executed INTEGER DEFAULT 0,
    roi_from_recommendations NUMERIC,
    -- Storage
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE ad_platform_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;

ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;

ALTER TABLE metrics_timeseries ENABLE ROW LEVEL SECURITY;

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies FOR
SELECT USING (
        id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

-- Ad Platform Connections: Company members only
CREATE POLICY "Company members can view connections" ON ad_platform_connections FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

CREATE POLICY "Company admins can manage connections" ON ad_platform_connections FOR ALL USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('ceo', 'operator')
    )
);

-- Campaigns: Company members only
CREATE POLICY "Company members can view campaigns" ON campaigns FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

-- AI Recommendations: Company members, approval requires permission
CREATE POLICY "Company members can view recommendations" ON ai_recommendations FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

CREATE POLICY "Approvers can update recommendations" ON ai_recommendations
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.permissions->>'approve')::boolean = true
    )
  );

-- Notifications: User can only see their own
CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (user_id = auth.uid ());

CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (user_id = auth.uid ());

-- Audit Logs: Read-only for company members
CREATE POLICY "Company members can view audit logs" ON audit_logs FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_platform_connections_updated_at BEFORE UPDATE ON ad_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_creatives_updated_at BEFORE UPDATE ON ad_creatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audiences_updated_at BEFORE UPDATE ON audiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON campaigns (company_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns (platform, status);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_date ON metrics_timeseries (campaign_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics_timeseries (date DESC);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_company ON ai_recommendations (company_id, status);

CREATE INDEX IF NOT EXISTS idx_recommendations_status ON ai_recommendations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_pending ON ai_recommendations (company_id)
WHERE
    status = 'pending';

-- Reports index
CREATE INDEX IF NOT EXISTS idx_reports_company ON executive_reports (company_id, created_at DESC);