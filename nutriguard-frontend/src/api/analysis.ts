import { apiClient } from './client';
import type { Analysis, Alternative } from '@/data/types';

export interface TriggerAnalysisInput {
  ingredient_text: string;
  product_name?: string;
  brand_name?: string;
  input_source: 'manual' | 'ocr' | 'barcode';
}

export const analysisApi = {
  /**
   * Live AI scan that analyzes ingredients in real-time
   */
  analyzeLive: (input: { product_name?: string; ingredient_text: string; brand_name?: string }) =>
    apiClient.post<Analysis>('/analysis/live', input),

  /**
   * Dispatches the input ingredients to trigger the AI Agent scan process
   */
  trigger: (input: TriggerAnalysisInput) =>
    apiClient.post<{ scanId: string }>('/analysis', input),

  /**
   * Fetches the complete scan details (dashboard payload structure)
   */
  getScanDashboard: (scanId: string) =>
    apiClient.get<Analysis>(`/scans/${scanId}`),

  /**
   * Get the history of previous scans (paginated)
   */
  getHistory: (page = 1, limit = 20) =>
    apiClient.get<Analysis[]>(`/scans?page=${page}&limit=${limit}`),

  /**
   * Fetch specific safety score dimensions
   */
  getSafetyScore: (scanId: string) =>
    apiClient.get<any>(`/scans/${scanId}/safety-score`),

  /**
   * Fetch specific AI generated explanation summary card
   */
  getAiSummary: (scanId: string) =>
    apiClient.get<any>(`/scans/${scanId}/ai-summary`),

  /**
   * Fetch safety recommendation alternatives for a scan
   */
  getRecommendations: (scanId: string) =>
    apiClient.get<Alternative[]>(`/scans/${scanId}/recommendations`),

  /**
   * Delete a scan from the user's history
   */
  deleteScan: (scanId: string) =>
    apiClient.delete<void>(`/scans/${scanId}`),

  /**
   * Fetch all live scans saved in persistent backend storage
   */
  getLiveHistory: () =>
    apiClient.get<Analysis[]>('/analysis/history'),

  /**
   * Delete a live scan from persistent backend storage
   */
  deleteLiveScan: (scanId: string) =>
    apiClient.delete<{ deleted: boolean; scanId: string }>(`/analysis/history/${scanId}`),

  /**
   * Clear all live scans from persistent backend storage
   */
  clearLiveHistory: () =>
    apiClient.delete<{ cleared: boolean }>('/analysis/history'),
};
