/**
 * AI Module Index
 * Exports all AI-related functionality
 */

// ROI Engine
export {
    calculateCampaignROI,
    calculateCompanyROI,
    detectWaste,
    calculateTrends,
    benchmarkPerformance,
    type ROIMetrics,
    type WasteReport,
    type TrendData,
    type TrendAnalysis,
    type PerformanceBenchmark,
} from './roi-engine';

// Anomaly Detection
export {
    detectAnomalies,
    saveAnomalies,
    getUnresolvedAnomalies,
    acknowledgeAnomaly,
    resolveAnomaly,
    type Anomaly,
    type AnomalyType,
    type AnomalySeverity,
    type AnomalyDetectionConfig,
} from './anomaly-detection';

// Recommendation Generator
export {
    generateRecommendations,
    saveRecommendations,
    getPendingRecommendations,
    approveRecommendation,
    rejectRecommendation,
    type Recommendation,
    type RecommendationType,
    type RecommendationPriority,
} from './recommendation-generator';

// OpenAI Client (Legacy - specific OpenAI integration)
export {
    generateExecutiveBriefing,
    explainAnomaly,
    suggestOptimizations,
    answerQuestion,
    type ExecutiveBriefing,
    type CampaignAnalysis,
} from './openai-client';

// Multi-Provider Router (Hybrid AI Stack)
export {
    callAI,
    getProviderForTask,
    analyzeWithReasoning,
    analyzeConservative,
    groundFacts,
    generateCreative,
    generateImage,
    type AIProvider,
    type AITask,
    type AIRequest,
    type AIResponse,
} from './provider-router';
