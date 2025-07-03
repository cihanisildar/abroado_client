import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Post, CityReview, Comment } from '@/lib/types';

/**
 * Fetch the posts that the given user has saved.
 *
 * @param userId  ID of the user whose saved posts should be fetched
 * @param options Optional flags controlling query behaviour (e.g. enabled)
 */
export const useUserSavedPosts = (
  userId?: string,
  options?: { enabled?: boolean }
) => {
  return useSuspenseQuery<Post[]>({
    queryKey: ['saved-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/users/${userId}/saved-posts`);
      // API may return { success, data } or the raw array directly
      return (res.data?.data ?? res.data) || [];
    },
    // Suspense-specific hook guarantees data presence; early-return covers undefined userId
  });
};

/**
 * Fetch the city‐reviews that the given user has saved.
 *
 * @param userId  ID of the user whose saved reviews should be fetched
 * @param options Optional flags controlling query behaviour (e.g. enabled)
 */
export const useUserSavedReviews = (
  userId?: string,
  options?: { enabled?: boolean }
) => {
  return useSuspenseQuery<CityReview[]>({
    queryKey: ['saved-reviews', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/users/${userId}/saved-reviews`);
      return (res.data?.data ?? res.data) || [];
    },
    // Suspense-specific; early-return handles undefined userId
  });
};

/**
 * Fetch the posts a user has up-voted.
 */
export const useUserUpvotedPosts = (userId?: string) => {
  return useSuspenseQuery<Post[]>({
    queryKey: ['upvoted-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/users/${userId}/upvoted-posts`);
      return (res.data?.data ?? res.data?.posts ?? res.data) || [];
    },
  });
};

/**
 * Fetch comments made by the user (with optional pagination / post filter).
 */
export const useUserComments = (
  userId?: string,
  params?: { page?: number; limit?: number; postId?: string }
) => {
  return useSuspenseQuery<Comment[]>({
    queryKey: ['user-comments', userId, params],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/users/${userId}/comments`, { params });
      return (res.data?.data ?? res.data?.comments ?? res.data) || [];
    },
  });
};

/**
 * Fetch city reviews created by the user.
 */
export const useUserCityReviews = (
  userId?: string,
  params?: { page?: number; limit?: number }
) => {
  return useSuspenseQuery<CityReview[]>({
    queryKey: ['user-city-reviews', userId, params],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/users/${userId}/city-reviews`, { params });
      return (res.data?.data ?? res.data?.reviews ?? res.data) || [];
    },
  });
}; 