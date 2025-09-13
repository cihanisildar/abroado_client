import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { InteractivePost } from '@/components/client/InteractivePost';
import type { Post } from '@/lib/types';
import { PostsFilters } from '@/lib/types/api.types';

interface PostsListProps {
  initialPosts: Post[];
  filters: PostsFilters;
}

export function PostsList({ initialPosts, filters }: PostsListProps) {
  if (initialPosts.length === 0) {
    return <EmptyState filters={filters} />;
  }

  return (
    <div className="space-y-6">
      {initialPosts.map((post) => (
        <InteractivePost 
          key={post.id} 
          post={post} 
          showActions={true}
        />
      ))}
      
      {/* Load More - This would be handled by client component */}
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          Showing {initialPosts.length} posts
        </p>
      </div>
    </div>
  );
}

function EmptyState({ filters }: { filters: PostsFilters }) {
  const hasFilters = filters.search || filters.cityId || filters.category;
  
  return (
    <div className="text-center py-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-gray-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {hasFilters ? 'No posts found' : 'No posts yet'}
        </h3>
        
        <p className="text-base text-gray-600 mb-6">
          {hasFilters
            ? 'Try adjusting your search terms or filters'
            : 'Be the first to share your experience!'}
        </p>
        
        {!hasFilters && (
          <Link 
            href="/auth/login?redirectTo=/posts/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg"
          >
            Create First Post
          </Link>
        )}
      </div>
    </div>
  );
}