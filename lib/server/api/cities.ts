/**
 * Server-side Cities API
 */

import type { City } from '@/lib/types';
import { serverFetch } from '../utils';

export async function getCities(): Promise<City[]> {
  return serverFetch<City[]>('/cities');
}

export async function getCity(cityId: string): Promise<City | null> {
  try {
    return await serverFetch<City>(`/cities/${cityId}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}