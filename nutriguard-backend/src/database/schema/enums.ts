import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Mirrors the PostgreSQL ENUM types created in the Database Design
 * Document (schema/00_extensions.sql). Defined once here and imported
 * by every schema file that needs them — never redeclared per-table.
 */
export const appRoleEnum = pgEnum('app_role', ['user', 'moderator', 'admin', 'super_admin']);
export const riskLevelEnum = pgEnum('risk_level', ['safe', 'moderate', 'high', 'unknown']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const regulationStatusEnum = pgEnum('regulation_status', ['approved', 'restricted', 'banned', 'unregulated']);
export const allergenSeverityEnum = pgEnum('allergen_severity', ['mild', 'moderate', 'severe']);
export const comparisonWinnerEnum = pgEnum('comparison_winner', ['product_a', 'product_b', 'tie']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'scan_complete',
  'weekly_digest',
  'new_ban_alert',
  'system',
  'marketing',
]);
export const inputSourceEnum = pgEnum('input_source', ['paste', 'manual', 'ocr', 'barcode', 'voice']);
