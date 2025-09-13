import { Suspense } from 'react';
import { generateHomeMetadata } from '@/lib/server/metadata';
import { getPosts, getPostCountries, getCountries } from '@/lib/server/api';
import { PostsList } from '@/components/server/PostsList';
import { SearchFilters } from '@/components/client/SearchFilters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary, PostsErrorFallback, SearchErrorFallback } from '@/components/ErrorBoundary';
import type { PostsUIFilters } from '@/lib/types/api.types';
import type { PostTag } from '@/lib/types/entities.types';

export const metadata = generateHomeMetadata();

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    tags?: string;
    sortBy?: 'recent' | 'popular' | 'trending';
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Await the search parameters (Next.js 15 change)
  const params = await searchParams;
  // Parse search parameters into UI filters
  const uiFilters: PostsUIFilters = {
    search: params.q,
    country: params.country && params.country !== 'all' ? params.country : undefined,
    tags: params.tags ? params.tags.split(',') as PostTag[] : undefined,
    sortBy: params.sortBy || 'recent',
    page: params.page ? Math.max(1, parseInt(params.page) || 1) : 1,
    limit: 20,
  };

  // Fetch initial data on the server - let components handle their own error states
  const [posts, postCountries, countries] = await Promise.allSettled([
    getPosts(uiFilters),
    getPostCountries(),
    getCountries(),
  ]);

  // Handle partial failures more gracefully
  const postsResult = posts.status === 'fulfilled' ? posts.value : [];
  // Log errors for monitoring
  if (posts.status === 'rejected') {
    console.error('Failed to fetch posts:', posts.reason);
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 order-last lg:order-first">
            <ErrorBoundary fallback={PostsErrorFallback}>
              <Suspense fallback={<LoadingSpinner />}>
                <PostsList 
                  initialPosts={postsResult}
                  filters={uiFilters}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="sticky top-6 space-y-6">
              <ErrorBoundary fallback={SearchErrorFallback}>
                <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>}>
                  <SearchFilters
                    initialFilters={uiFilters}
                    postCountries={postCountries.status === 'fulfilled' ? postCountries.value : []}
                    countries={countries.status === 'fulfilled' ? countries.value : []}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}