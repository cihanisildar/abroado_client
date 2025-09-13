/**
 * Server-side City Reviews API
 */

import { serverFetch } from '../utils';

export interface CityReview {
  id: string;
  title: string;
  note?: string;
  city: {
    id: string;
    name: string;
    country: string;
  };
  user: {
    id: string;
    username: string;
  };
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: "UPVOTE" | "DOWNVOTE" | null;
  isSaved: boolean;
  jobOpportunities?: number;
  costOfLiving?: number;
  safety?: number;
  transport?: number;
  community?: number;
  healthcare?: number;
  education?: number;
  nightlife?: number;
  weather?: number;
  internet?: number;
}

export interface CityReviewsResponse {
  data: CityReview[];
}

export async function getAllCityReviews(): Promise<CityReviewsResponse> {
  return serverFetch<CityReviewsResponse>('/reviews/all', { requireAuth: true });
}

export async function getCityReview(reviewId: string): Promise<CityReview | null> {
  try {
    return await serverFetch<CityReview>(`/reviews/${reviewId}`, { requireAuth: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getReviewCountries(): Promise<{ country: string; count: number }[]> {
  return serverFetch<{ country: string; count: number }[]>('/reviews/countries', { requireAuth: true });
}