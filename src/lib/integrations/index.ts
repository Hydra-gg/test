/**
 * Integrations Library Index
 * Central export file for all ad platform integrations
 */

// OAuth Configuration (Per-Company)
export {
    getCompanyOAuthApp,
    getAllCompanyOAuthApps,
    saveCompanyOAuthApp,
    deleteCompanyOAuthApp,
    isPlatformConfigured,
    encodeOAuthState,
    decodeOAuthState,
    validateOAuthState,
    getGoogleAuthUrl,
    getMetaAuthUrl,
    getTikTokAuthUrl,
    getLinkedInAuthUrl,
    getAuthUrl,
    type AdPlatformType,
    type CompanyOAuthApp,
    type OAuthState,
    type SaveOAuthAppParams,
} from './oauth-config';

// Google Ads
export {
    exchangeGoogleCode,
    refreshGoogleToken,
    getGoogleAdsAccounts,
    getGoogleAdsCampaigns,
    getGoogleAdsMetrics,
    saveGoogleConnection,
    type GoogleTokenResponse,
    type GoogleAdsAccount,
    type GoogleAdsCampaign,
    type GoogleAdsMetrics,
} from './google-ads';

// Meta Ads
export {
    exchangeMetaCode,
    getLongLivedToken,
    getMetaAdAccounts,
    getMetaCampaigns,
    getMetaCampaignInsights,
    saveMetaConnection,
    type MetaTokenResponse,
    type MetaLongLivedTokenResponse,
    type MetaAdAccount,
    type MetaCampaign,
    type MetaInsight,
} from './meta-ads';

// TikTok Ads
export {
    exchangeTikTokCode,
    getTikTokAdvertisers,
    getTikTokCampaigns,
    getTikTokMetrics,
    saveTikTokConnection,
    type TikTokTokenResponse,
    type TikTokAdvertiser,
    type TikTokCampaign,
    type TikTokMetrics,
} from './tiktok-ads';

// LinkedIn Ads
export {
    exchangeLinkedInCode,
    refreshLinkedInToken,
    getLinkedInAdAccounts,
    getLinkedInCampaigns,
    getLinkedInMetrics,
    saveLinkedInConnection,
    type LinkedInTokenResponse,
    type LinkedInAdAccount,
    type LinkedInCampaign,
    type LinkedInMetrics,
} from './linkedin-ads';

// Data Normalization
export {
    normalizeGoogleCampaign,
    normalizeMetaCampaign,
    normalizeGoogleMetrics,
    normalizeMetaMetrics,
    normalizeCreative,
    normalizeGoogleCampaigns,
    normalizeMetaCampaigns,
    normalizeGoogleMetricsBatch,
    normalizeMetaMetricsBatch,
} from './normalizer';
