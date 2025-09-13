'use client';

/**
 * Comments List - Client Component for interactive commenting
 */

import { useState } from 'react';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { CommentItem } from '@/components/ui/comment-item';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthGate } from './AuthGate';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Comment } from '@/lib/types';

interface CommentsListProps {
  postId: string;
  initialComments: Comment[];
}

export function CommentsList({ postId, initialComments }: CommentsListProps) {
  const [newComment, setNewComment] = useState('');
  const { requireAuth, isAuthenticated } = useAuthGate();

  // Use React Query for client-side updates, but start with server data
  const { data: commentsResponse, isLoading } = useComments({ postId });
  const comments = commentsResponse?.data || initialComments;

  const createCommentMutation = useCreateComment();

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    requireAuth(() => {
      createCommentMutation.mutate(
        {
          content: newComment.trim(),
          postId,
        },
        {
          onSuccess: () => {
            setNewComment('');
          },
        }
      );
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (isLoading && !initialComments.length) {
    return <LoadingSpinner text="Loading comments..." />;
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <div className="space-y-4">
        <Textarea
          placeholder={isAuthenticated ? "Share your thoughts..." : "Login to comment..."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isAuthenticated}
          className="min-h-[100px] resize-none"
        />
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {isAuthenticated ? 'Press Ctrl+Enter to post' : 'Login to comment'}
          </p>
          
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || createCommentMutation.isPending || !isAuthenticated}
            className="px-6"
          >
            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              replies={comment.replies || []}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}
    </div>
  );
}