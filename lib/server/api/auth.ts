/**
 * Server-side Auth API
 */

import type { User } from '@/lib/types';
import { serverFetch } from '../utils';

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await serverFetch<User>('/auth/profile', { requireAuth: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error) {
      const errorWithStatus = error as { status: number };
      if (errorWithStatus.status === 401 || errorWithStatus.status === 403) {
        return null;
      }
    }
    throw error;
  }
}