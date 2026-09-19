import { apiClient } from './client';
import type { Ingredient, CountryStatus, Alternative } from '@/data/types';

export const ingredientsApi = {
  /**
   * Search and list catalogued ingredients from the DB
   */
  search: (query: string) =>
    apiClient.get<Ingredient[]>(`/ingredients?search=${encodeURIComponent(query)}`),

  /**
   * Get canonical ingredient detail card values by ID
   */
  getById: (id: string) =>
    apiClient.get<Ingredient>(`/ingredients/${id}`),

  /**
   * Fetch global bans / status restrictions for an ingredient
   */
  getRegulations: (id: string) =>
    apiClient.get<CountryStatus[]>(`/ingredients/${id}/regulations`),

  /**
   * Fetch recommended safer alternatives for a flagged ingredient
   */
  getAlternatives: (id: string) =>
    apiClient.get<Alternative[]>(`/ingredients/${id}/alternatives`),

  /**
   * Fetch categories of ingredients
   */
  getCategories: () =>
    apiClient.get<any[]>('/ingredient-categories'),
};
