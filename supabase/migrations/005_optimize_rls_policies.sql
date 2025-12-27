-- ============================================================================
-- Migration: 005_optimize_rls_policies.sql
-- Description: Fix RLS performance issues:
--   1. Use (select auth.uid()) instead of auth.uid() for initplan optimization
--   2. Consolidate multiple permissive SELECT policies into single policies
-- ============================================================================

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (
        id = (
            select auth.uid ()
        )
    );

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (
    id = (
        select auth.uid ()
    )
);

CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT
WITH
    CHECK (
        id = (
            select auth.uid ()
        )
    );

-- =============================================================================
-- COMPANIES TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own company" ON companies;

CREATE POLICY "Users can view own company" ON companies FOR
SELECT USING (
        id IN (
            SELECT company_id
            FROM profiles
            WHERE
                id = (
                    select auth.uid ()
                )
        )
    );

-- =============================================================================
-- AD_PLATFORM_CONNECTIONS TABLE
-- Consolidate two SELECT policies into one
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view connections" ON ad_platform_connections;

DROP POLICY IF EXISTS "Company admins can manage connections" ON ad_platform_connections;

DROP POLICY IF EXISTS "Company admins can insert connections" ON ad_platform_connections;

DROP POLICY IF EXISTS "Company admins can update connections" ON ad_platform_connections;

DROP POLICY IF EXISTS "Company admins can delete connections" ON ad_platform_connections;

-- Single SELECT policy for viewing
CREATE POLICY "Company members can view connections" ON ad_platform_connections FOR
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

-- Separate policies for INSERT/UPDATE/DELETE (admin only)
CREATE POLICY "Company admins can insert connections" ON ad_platform_connections
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid()) 
            AND (role = 'ceo' OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company admins can update connections" ON ad_platform_connections
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid()) 
            AND (role = 'ceo' OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company admins can delete connections" ON ad_platform_connections FOR DELETE USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            id = (
                select auth.uid ()
            )
            AND role = 'ceo'
    )
);

-- =============================================================================
-- CAMPAIGNS TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view campaigns" ON campaigns;

CREATE POLICY "Company members can view campaigns" ON campaigns FOR
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

-- =============================================================================
-- AI_RECOMMENDATIONS TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view recommendations" ON ai_recommendations;

DROP POLICY IF EXISTS "Approvers can update recommendations" ON ai_recommendations;

CREATE POLICY "Company members can view recommendations" ON ai_recommendations FOR
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

CREATE POLICY "Approvers can update recommendations" ON ai_recommendations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid()) 
            AND (role IN ('ceo', 'operator') OR (permissions->>'approve')::boolean = true)
        )
    );

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (
        user_id = (
            select auth.uid ()
        )
    );

CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (
    user_id = (
        select auth.uid ()
    )
);

-- =============================================================================
-- AUDIT_LOGS TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view audit logs" ON audit_logs;

CREATE POLICY "Company members can view audit logs" ON audit_logs FOR
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

-- =============================================================================
-- AD_CREATIVES TABLE
-- Consolidate two SELECT policies into one
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view ad creatives" ON ad_creatives;

DROP POLICY IF EXISTS "Company operators can manage ad creatives" ON ad_creatives;

DROP POLICY IF EXISTS "Company operators can insert ad creatives" ON ad_creatives;

DROP POLICY IF EXISTS "Company operators can update ad creatives" ON ad_creatives;

DROP POLICY IF EXISTS "Company operators can delete ad creatives" ON ad_creatives;

CREATE POLICY "Company members can view ad creatives" ON ad_creatives FOR
SELECT USING (
        campaign_id IN (
            SELECT c.id
            FROM campaigns c
                JOIN profiles p ON c.company_id = p.company_id
            WHERE
                p.id = (
                    select auth.uid ()
                )
        )
    );

-- Separate INSERT/UPDATE/DELETE for operators (no SELECT to avoid duplicate)
CREATE POLICY "Company operators can insert ad creatives" ON ad_creatives
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN profiles p ON c.company_id = p.company_id
            WHERE p.id = (select auth.uid())
            AND (p.role IN ('ceo', 'operator') OR (p.permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company operators can update ad creatives" ON ad_creatives
    FOR UPDATE USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN profiles p ON c.company_id = p.company_id
            WHERE p.id = (select auth.uid())
            AND (p.role IN ('ceo', 'operator') OR (p.permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company operators can delete ad creatives" ON ad_creatives
    FOR DELETE USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            JOIN profiles p ON c.company_id = p.company_id
            WHERE p.id = (select auth.uid())
            AND (p.role IN ('ceo', 'operator') OR (p.permissions->>'override')::boolean = true)
        )
    );

-- =============================================================================
-- AUDIENCES TABLE
-- Consolidate two SELECT policies into one
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view audiences" ON audiences;

DROP POLICY IF EXISTS "Company operators can manage audiences" ON audiences;

DROP POLICY IF EXISTS "Company operators can insert audiences" ON audiences;

DROP POLICY IF EXISTS "Company operators can update audiences" ON audiences;

DROP POLICY IF EXISTS "Company operators can delete audiences" ON audiences;

CREATE POLICY "Company members can view audiences" ON audiences FOR
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

-- Separate INSERT/UPDATE/DELETE for operators (no SELECT to avoid duplicate)
CREATE POLICY "Company operators can insert audiences" ON audiences
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company operators can update audiences" ON audiences
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company operators can delete audiences" ON audiences
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

-- =============================================================================
-- METRICS_TIMESERIES TABLE
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view metrics" ON metrics_timeseries;

CREATE POLICY "Company members can view metrics" ON metrics_timeseries FOR
SELECT USING (
        campaign_id IN (
            SELECT c.id
            FROM campaigns c
                JOIN profiles p ON c.company_id = p.company_id
            WHERE
                p.id = (
                    select auth.uid ()
                )
        )
    );

-- =============================================================================
-- WORKFLOWS TABLE
-- Consolidate two SELECT policies into one
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view workflows" ON workflows;

DROP POLICY IF EXISTS "Company operators can manage workflows" ON workflows;

DROP POLICY IF EXISTS "Company operators can insert workflows" ON workflows;

DROP POLICY IF EXISTS "Company operators can update workflows" ON workflows;

DROP POLICY IF EXISTS "Company operators can delete workflows" ON workflows;

CREATE POLICY "Company members can view workflows" ON workflows FOR
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

-- Separate INSERT/UPDATE/DELETE for operators (no SELECT to avoid duplicate)
CREATE POLICY "Company operators can insert workflows" ON workflows
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company operators can update workflows" ON workflows
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "Company operators can delete workflows" ON workflows
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid())
            AND (role IN ('ceo', 'operator') OR (permissions->>'override')::boolean = true)
        )
    );

-- =============================================================================
-- EXECUTIVE_REPORTS TABLE
-- Consolidate two SELECT policies into one
-- =============================================================================
DROP POLICY IF EXISTS "Company members can view reports" ON executive_reports;

DROP POLICY IF EXISTS "CEOs can manage reports" ON executive_reports;

DROP POLICY IF EXISTS "CEOs can insert reports" ON executive_reports;

DROP POLICY IF EXISTS "CEOs can update reports" ON executive_reports;

DROP POLICY IF EXISTS "CEOs can delete reports" ON executive_reports;

CREATE POLICY "Company members can view reports" ON executive_reports FOR
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

-- Separate INSERT/UPDATE/DELETE for CEOs (no SELECT to avoid duplicate)
CREATE POLICY "CEOs can insert reports" ON executive_reports FOR
INSERT
WITH
    CHECK (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                id = (
                    select auth.uid ()
                )
                AND role = 'ceo'
        )
    );

CREATE POLICY "CEOs can update reports" ON executive_reports FOR
UPDATE USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            id = (
                select auth.uid ()
            )
            AND role = 'ceo'
    )
);

CREATE POLICY "CEOs can delete reports" ON executive_reports FOR DELETE USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            id = (
                select auth.uid ()
            )
            AND role = 'ceo'
    )
);

-- =============================================================================
-- COMPANY_OAUTH_APPS TABLE
-- =============================================================================
DROP POLICY IF EXISTS "company_oauth_apps_read" ON company_oauth_apps;

DROP POLICY IF EXISTS "company_oauth_apps_insert" ON company_oauth_apps;

DROP POLICY IF EXISTS "company_oauth_apps_update" ON company_oauth_apps;

DROP POLICY IF EXISTS "company_oauth_apps_delete" ON company_oauth_apps;

CREATE POLICY "company_oauth_apps_read" ON company_oauth_apps FOR
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

CREATE POLICY "company_oauth_apps_insert" ON company_oauth_apps
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid()) 
            AND (role = 'ceo' OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "company_oauth_apps_update" ON company_oauth_apps
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = (select auth.uid()) 
            AND (role = 'ceo' OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "company_oauth_apps_delete" ON company_oauth_apps FOR DELETE USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            id = (
                select auth.uid ()
            )
            AND role = 'ceo'
    )
);