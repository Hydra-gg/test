-- ============================================================================
-- Migration: 004_foreign_key_indexes.sql
-- Description: Add missing indexes for foreign key columns to improve performance
-- ============================================================================

-- ad_creatives: campaign_id foreign key
CREATE INDEX IF NOT EXISTS idx_ad_creatives_campaign_id ON ad_creatives (campaign_id);

-- ai_recommendations: multiple foreign keys
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_campaign_id ON ai_recommendations (campaign_id);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_creative_id ON ai_recommendations (creative_id);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_approved_by ON ai_recommendations (approved_by);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_rejected_by ON ai_recommendations (rejected_by);

-- audiences: company_id foreign key
CREATE INDEX IF NOT EXISTS idx_audiences_company_id ON audiences (company_id);

-- campaigns: platform_connection_id foreign key
CREATE INDEX IF NOT EXISTS idx_campaigns_connection_id ON campaigns (platform_connection_id);

-- company_oauth_apps: created_by foreign key
CREATE INDEX IF NOT EXISTS idx_company_oauth_apps_created_by ON company_oauth_apps (created_by);

-- executive_reports: generated_by foreign key
CREATE INDEX IF NOT EXISTS idx_executive_reports_generated_by ON executive_reports (generated_by);

-- metrics_timeseries: creative_id and audience_id foreign keys
CREATE INDEX IF NOT EXISTS idx_metrics_timeseries_creative_id ON metrics_timeseries (creative_id);

CREATE INDEX IF NOT EXISTS idx_metrics_timeseries_audience_id ON metrics_timeseries (audience_id);

-- notifications: company_id foreign key
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications (company_id);

-- profiles: company_id foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles (company_id);

-- workflows: company_id foreign key
CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON workflows (company_id);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON INDEX idx_ad_creatives_campaign_id IS 'Foreign key index for campaign lookups';

COMMENT ON INDEX idx_ai_recommendations_campaign_id IS 'Foreign key index for campaign recommendations';

COMMENT ON INDEX idx_audiences_company_id IS 'Foreign key index for company audience filtering';

COMMENT ON INDEX idx_profiles_company_id IS 'Foreign key index for company user lookups';