/**
 * The Safety Score module has no HTTP routes of its own — per the API
 * Specification, `GET /scans/{scanId}/safety-score` is served by the
 * Analysis module (Phase 11), which depends on this service. This module
 * exists purely as an internal, independently-testable scoring engine.
 */
export { safetyScoreService, SafetyScoreService } from './service/safety-score.service.js';
export { safetyScoreRepository, SafetyScoreRepository } from './repository/safety-score.repository.js';
export type * from './types/safety-score.types.js';
