/**
 * Server-side Posts API
 */

import type { Post, Comment } from '@/lib/types';
import type { PostsFilters, PostsUIFilters, PostCountry } from '@/lib/types/api.types';
import { serverFetch } from '../utils';
import { buildQueryString } from '../utils';

export async function getPosts(uiFilters?: PostsUIFilters): Promise<Post[]> {
  // Convert UI filters to API filters
  const apiFilters: PostsFilters = {};
  
  if (uiFilters?.search) apiFilters.search = uiFilters.search;
  if (uiFilters?.country && uiFilters.country !== 'all') apiFilters.cityId = uiFilters.country;
  if (uiFilters?.tags?.length) {
    // Map PostTag to API category - need to handle this mapping properly
    const firstTag = uiFilters.tags[0];
    if (['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP'].includes(firstTag as string)) {
      apiFilters.category = firstTag as PostsFilters['category'];
    }
  }
  if (uiFilters?.page) apiFilters.page = uiFilters.page;
  if (uiFilters?.limit) apiFilters.limit = uiFilters.limit;
  
  const queryString = buildQueryString(apiFilters as Record<string, string | number | boolean | string[] | number[] | boolean[] | null | undefined>);
  const endpoint = `/posts${queryString}`;
  
  return serverFetch<Post[]>(endpoint, { requireAuth: false });
}

export async function getPost(postId: string): Promise<Post | null> {
  try {
    return await serverFetch<Post>(`/posts/${postId}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    return await serverFetch<Comment[]>(`/posts/${postId}/comments`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getPostCountries(): Promise<PostCountry[]> {
  return serverFetch<PostCountry[]>('/posts/countries', { requireAuth: false });
}