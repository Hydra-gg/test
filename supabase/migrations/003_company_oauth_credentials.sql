-- ============================================================================
-- Migration: 003_company_oauth_credentials.sql
-- Description: Store OAuth app credentials per-company instead of global env vars
-- ============================================================================

-- Table to store each company's ad platform OAuth app credentials
CREATE TABLE IF NOT EXISTS company_oauth_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('google', 'meta', 'tiktok', 'linkedin')),

-- OAuth App Credentials (encrypted in production)
client_id TEXT NOT NULL, client_secret TEXT NOT NULL,

-- Platform-specific fields
developer_token TEXT, -- Google Ads developer token
app_id TEXT, -- Meta/TikTok app ID (sometimes different from client_id)

-- Redirect URI (can be customized per company for white-labeling)
redirect_uri TEXT,

-- Status
is_active BOOLEAN DEFAULT TRUE,
is_verified BOOLEAN DEFAULT FALSE, -- Has been tested successfully

-- Metadata
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
created_by UUID REFERENCES profiles (id),

-- Unique constraint: one app per platform per company
UNIQUE(company_id, platform) );

-- Enable RLS
ALTER TABLE company_oauth_apps ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only company members can read, only admins can write
CREATE POLICY "company_oauth_apps_read" ON company_oauth_apps FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "company_oauth_apps_insert" ON company_oauth_apps
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND (role = 'ceo' OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "company_oauth_apps_update" ON company_oauth_apps
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND (role = 'ceo' OR (permissions->>'override')::boolean = true)
        )
    );

CREATE POLICY "company_oauth_apps_delete" ON company_oauth_apps FOR DELETE USING (
    company_id IN (
        SELECT company_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'ceo'
    )
);

-- Indexes
CREATE INDEX idx_company_oauth_apps_company ON company_oauth_apps (company_id);

CREATE INDEX idx_company_oauth_apps_platform ON company_oauth_apps (platform);

-- Trigger for updated_at
CREATE TRIGGER update_company_oauth_apps_updated_at
    BEFORE UPDATE ON company_oauth_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON
TABLE company_oauth_apps IS 'Stores per-company OAuth app credentials for ad platforms. Each company registers their own apps with Google, Meta, etc.';