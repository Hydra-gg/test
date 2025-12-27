/**
 * Escalate AI - Type Exports
 * Central export file for all type definitions
 */

export * from './database';

// Re-export commonly used types for convenience
export type {
    Company,
    Profile,
    UserRole,
    UserPermissions,
    Campaign,
    AdPlatformConnection,
    AIRecommendation,
    DashboardKPIs,
    AnomalyAlert,
    WhatChangedItem,
    Notification,
    AuditLog,
} from './database';
