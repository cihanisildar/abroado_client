/**
 * Server-side Countries API
 */

import type { Country } from '@/hooks/useCountries';
import { serverFetch } from '../utils';

export async function getCountries(): Promise<Country[]> {
  return serverFetch<Country[]>('/countries', { requireAuth: false });
}