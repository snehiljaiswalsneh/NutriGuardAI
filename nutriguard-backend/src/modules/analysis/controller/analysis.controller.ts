import type { Context } from 'hono';
import { analysisService } from '../service/analysis.service.js';
import { successResponse } from '@shared/utils/response.js';
import type { TriggerAnalysisRequest } from '../validator/analysis.validator.js';
import type { AppEnv } from '@shared/types/hono-env.js';
import { TokenInvalidError } from '@shared/errors/app-error.js';

function requireUserId(c: Context<AppEnv>): string {
  const user = c.get('user');
  if (!user) throw new TokenInvalidError('Authentication required');
  return user.id;
}

export class AnalysisController {
  async trigger(c: Context<AppEnv>, input: TriggerAnalysisRequest) {
    const userId = requireUserId(c);
    const { scanId } = await analysisService.triggerAnalysis(userId, input);
    return c.json(successResponse({ scan_id: scanId, status: 'processing' }, 'Analysis started'), 202);
  }

  async getDashboard(c: Context<AppEnv>, scanId: string) {
    const userId = requireUserId(c);
    const dashboard = await analysisService.getDashboard(scanId, userId);
    return c.json(successResponse(dashboard), 200);
  }

  async getSafetyScore(c: Context<AppEnv>, scanId: string) {
    const userId = requireUserId(c);
    const score = await analysisService.getSafetyScore(scanId, userId);
    return c.json(successResponse(score), 200);
  }

  async getAiSummary(c: Context<AppEnv>, scanId: string) {
    const userId = requireUserId(c);
    const summary = await analysisService.getAiSummary(scanId, userId);
    return c.json(successResponse(summary), 200);
  }

  async getRecommendations(c: Context<AppEnv>, scanId: string) {
    const userId = requireUserId(c);
    const recommendations = await analysisService.getRecommendations(scanId, userId);
    return c.json(successResponse(recommendations), 200);
  }

  async getConsumptionAdvice(c: Context<AppEnv>, scanId: string) {
    const userId = requireUserId(c);
    const advice = await analysisService.getConsumptionAdvice(scanId, userId);
    return c.json(successResponse(advice), 200);
  }

  async deleteScan(c: Context<AppEnv>, scanId: string) {
    const userId = requireUserId(c);
    await analysisService.deleteScan(scanId, userId);
    return c.body(null, 204);
  }
}

export const analysisController = new AnalysisController();
