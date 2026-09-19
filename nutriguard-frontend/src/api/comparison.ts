import { apiClient } from './client';
import type { ComparisonResultType } from '@/data/types';

export const comparisonApi = {
  /**
   * Compares two products/scans to find the safer option
   */
  compare: (scanAId: string, scanBId: string) =>
    apiClient.post<ComparisonResultType>('/comparisons', {
      scan_a_id: scanAId,
      scan_b_id: scanBId,
    }),

  /**
   * Fetch all past comparisons performed by the user
   */
  list: (page = 1, limit = 20) =>
    apiClient.get<ComparisonResultType[]>(`/comparisons?page=${page}&limit=${limit}`),

  /**
   * Delete a past comparison entry
   */
  delete: (id: string) =>
    apiClient.delete<void>(`/comparisons/${id}`),
};
