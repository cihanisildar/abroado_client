/**
 * Server-side Rooms API
 */

import type { Room } from '@/lib/types';
import { serverFetch } from '../utils';

export async function getRooms(): Promise<Room[]> {
  return serverFetch<Room[]>('/rooms');
}

export async function getRoom(roomId: string): Promise<Room | null> {
  try {
    return await serverFetch<Room>(`/rooms/${roomId}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}