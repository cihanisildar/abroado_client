'use client';

/**
 * Interactive Post Component - Handles voting, saving, and other user actions
 * This is a Client Component that manages post interactions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Bookmark, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthGate } from './AuthGate';
import { 
  useUpvotePost, 
  useDownvotePost, 
  useRemoveVote, 
  useSavePost, 
  useUnsavePost 
} from '@/hooks/usePosts';
import type { Post } from '@/lib/types';
import { PostCardProps } from '@/lib/types/ui.types';

interface InteractivePostProps extends Omit<PostCardProps, 'onVote' | 'onSave' | 'onShare'> {
  post: Post;
  showActions?: boolean;
  compact?: boolean;
}

export function InteractivePost({ 
  post, 
  showActions = true, 
  compact = false 
}: InteractivePostProps) {
  const { requireAuth, isAuthenticated } = useAuthGate();
  const [isSharing, setIsSharing] = useState(false);

  // Mutation hooks
  const upvoteMutation = useUpvotePost();
  const downvoteMutation = useDownvotePost();
  const removeVoteMutation = useRemoveVote();
  const saveMutation = useSavePost();
  const unsaveMutation = useUnsavePost();

  const handleVote = (type: 'UPVOTE' | 'DOWNVOTE') => {
    requireAuth(() => {
      if (type === 'UPVOTE' && post.userVote === 'UPVOTE') {
        removeVoteMutation.mutate({ postId: post.id });
      } else if (type === 'DOWNVOTE' && post.userVote === 'DOWNVOTE') {
        removeVoteMutation.mutate({ postId: post.id });
      } else if (type === 'UPVOTE') {
        upvoteMutation.mutate({ postId: post.id });
      } else {
        downvoteMutation.mutate({ postId: post.id });
      }
    });
  };

  const handleSave = () => {
    requireAuth(() => {
      if (post.isSaved) {
        unsaveMutation.mutate({ postId: post.id });
      } else {
        saveMutation.mutate({ postId: post.id });
      }
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareData = {
        title: post.title,
        text: post.content.substring(0, 200) + '...',
        url: `${window.location.origin}/posts/${post.id}`,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        // You might want to show a toast here
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Handle error - maybe show a toast
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRoleIcon = (role: string) => {
    return role === 'EXPLORER' ? '🧭' : '🏠';
  };

  const getPostTypeColor = (category: string) => {
    const colors = {
      REVIEW: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
      GUIDE: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
      EXPERIENCE: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
      QUESTION: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
      DISCUSSION: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200',
      TIP: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
    } as const;
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
  };

  const isVoting = upvoteMutation.isPending || downvoteMutation.isPending || removeVoteMutation.isPending;
  const isSaving = saveMutation.isPending || unsaveMutation.isPending;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex gap-4">
        {/* Voting Section */}
        {showActions && (
          <div className="flex flex-col items-center min-w-[60px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('UPVOTE')}
              disabled={isVoting}
              className={`h-8 w-8 p-0 hover:bg-green-50 ${
                post.userVote === 'UPVOTE' ? 'text-green-600 bg-green-50' : 'text-gray-500'
              } ${!isAuthenticated ? 'opacity-75' : ''}`}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            
            <span className={`text-sm font-medium my-1 ${
              post.userVote === 'UPVOTE' ? 'text-green-600' : 
              post.userVote === 'DOWNVOTE' ? 'text-red-600' : 
              'text-gray-900'
            }`}>
              {(post.upvotes || 0) - (post.downvotes || 0)}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('DOWNVOTE')}
              disabled={isVoting}
              className={`h-8 w-8 p-0 hover:bg-red-50 ${
                post.userVote === 'DOWNVOTE' ? 'text-red-600 bg-red-50' : 'text-gray-500'
              } ${!isAuthenticated ? 'opacity-75' : ''}`}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <Link href={`/posts/${post.id}`}>
                <h3 className={`font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2 ${
                  compact ? 'text-sm' : 'text-base lg:text-lg'
                }`}>
                  {post.title}
                </h3>
              </Link>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPostTypeColor(post.category)}`}
                >
                  {post.category}
                </Badge>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(post.user.role)}
                    <span>{post.user.username}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  {post.city && (
                    <>
                      <span>•</span>
                      <span>{post.city.name}, {post.city.country}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          {!compact && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {post.content}
              </p>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, compact ? 2 : 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {post.tags.length > (compact ? 2 : 4) && (
                <Badge variant="secondary" className="text-xs">
                  +{post.tags.length - (compact ? 2 : 4)} more
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/posts/${post.id}`}>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-gray-600">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {post.commentsCount || 0} {(post.commentsCount || 0) === 1 ? 'comment' : 'comments'}
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className={`h-8 px-3 text-xs ${
                  post.isSaved ? 'text-orange-600' : 'text-gray-600'
                } ${!isAuthenticated ? 'opacity-75' : ''}`}
              >
                <Bookmark className={`w-4 h-4 mr-2 ${post.isSaved ? 'fill-current' : ''}`} />
                {post.isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                disabled={isSharing}
                className="h-8 px-3 text-xs text-gray-600"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}