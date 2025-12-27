-- Escalate AI Schema Fixes
-- Version: 002
-- Description: Add missing RLS policies and fix function search_path

-- =============================================================================
-- FIX: Function search_path security
-- =============================================================================

-- Drop and recreate with explicit search_path
DROP FUNCTION IF EXISTS update_updated_at_column () CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers
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
-- ADD: Missing RLS policies for ad_creatives
-- =============================================================================

CREATE POLICY "Company members can view ad creatives" ON ad_creatives FOR
SELECT USING (
        campaign_id IN (
            SELECT c.id
            FROM campaigns c
            WHERE
                c.company_id IN (
                    SELECT company_id
                    FROM profiles
                    WHERE
                        profiles.id = auth.uid ()
                )
        )
    );

CREATE POLICY "Company operators can manage ad creatives" ON ad_creatives FOR ALL USING (
    campaign_id IN (
        SELECT c.id
        FROM campaigns c
        WHERE
            c.company_id IN (
                SELECT company_id
                FROM profiles
                WHERE
                    profiles.id = auth.uid ()
                    AND profiles.role IN ('ceo', 'operator')
            )
    )
);

-- =============================================================================
-- ADD: Missing RLS policies for audiences
-- =============================================================================

CREATE POLICY "Company members can view audiences" ON audiences FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

CREATE POLICY "Company operators can manage audiences" ON audiences FOR ALL USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('ceo', 'operator')
    )
);

-- =============================================================================
-- ADD: Missing RLS policies for metrics_timeseries
-- =============================================================================

CREATE POLICY "Company members can view metrics" ON metrics_timeseries FOR
SELECT USING (
        campaign_id IN (
            SELECT c.id
            FROM campaigns c
            WHERE
                c.company_id IN (
                    SELECT company_id
                    FROM profiles
                    WHERE
                        profiles.id = auth.uid ()
                )
        )
    );

-- Metrics are typically inserted by system/sync, not users directly
-- Add insert policy for service role only if needed

-- =============================================================================
-- ADD: Missing RLS policies for workflows
-- =============================================================================

CREATE POLICY "Company members can view workflows" ON workflows FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

CREATE POLICY "Company operators can manage workflows" ON workflows FOR ALL USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('ceo', 'operator')
    )
);

-- =============================================================================
-- ADD: Missing RLS policies for executive_reports
-- =============================================================================

CREATE POLICY "Company members can view reports" ON executive_reports FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
        )
    );

CREATE POLICY "CEOs can manage reports" ON executive_reports FOR ALL USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role = 'ceo'
    )
);