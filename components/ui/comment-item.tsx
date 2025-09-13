'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Comment } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCreateComment, useUpvoteComment, useDownvoteComment, useRemoveCommentVote, useDeleteComment } from '@/hooks/useComments';
import toast from 'react-hot-toast';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  replies: Comment[]; // Pass replies from parent
  depth?: number;
  maxDepth?: number;
}

export function CommentItem({ comment, postId, replies, depth = 0, maxDepth = 3 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  
  const { user } = useAuth();
  const createCommentMutation = useCreateComment();
  const upvoteCommentMutation = useUpvoteComment();
  const downvoteCommentMutation = useDownvoteComment();
  const removeCommentVoteMutation = useRemoveCommentVote();
  const deleteCommentMutation = useDeleteComment();

  // Check if current user owns this comment
  const isCommentOwner = user && comment && (user.id === comment.userId || user.id === comment.user?.id);
  const canReply = depth < maxDepth;

  // Format date - similar to the one in the post page
  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    const loadingToast = toast.loading('Adding reply...');
    
    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: replyContent.trim(),
        parentCommentId: comment.id
      });
      
      setReplyContent('');
      setShowReplyForm(false);
      toast.dismiss(loadingToast);
      toast.success('Reply added successfully! 💬');
    } catch (error: unknown) {
      console.error('Failed to create reply:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add reply';
      toast.error(`Failed to add reply: ${errorMessage}`);
    }
  };

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      // Redirect to login without showing toast
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    const isUpvote = voteType === 'UPVOTE';
    const loadingToast = toast.loading(`${isUpvote ? 'Upvoting' : 'Downvoting'} comment...`);
    
    try {
      // Check if we need to remove the vote
      if ((isUpvote && comment.userVote === 'UPVOTE') || (!isUpvote && comment.userVote === 'DOWNVOTE')) {
        await removeCommentVoteMutation.mutateAsync({ commentId: comment.id });
        toast.dismiss(loadingToast);
        toast.success('Vote removed! 🔄');
      } else {
        // Apply new vote
        if (isUpvote) {
          await upvoteCommentMutation.mutateAsync({ commentId: comment.id });
        } else {
          await downvoteCommentMutation.mutateAsync({ commentId: comment.id });
        }
        toast.dismiss(loadingToast);
        toast.success(`Comment ${isUpvote ? 'upvoted! 👍' : 'downvoted! 👎'}`);
      }
    } catch (error: unknown) {
      console.error(`Failed to ${isUpvote ? 'upvote' : 'downvote'} comment:`, error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : `Failed to ${isUpvote ? 'upvote' : 'downvote'} comment`;
      toast.error(`Failed to vote on comment: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    const loadingToast = toast.loading('Deleting comment...');
    
    try {
      await deleteCommentMutation.mutateAsync({ commentId: comment.id });
      toast.dismiss(loadingToast);
      toast.success('Comment deleted successfully! 🗑️');
    } catch (error: unknown) {
      console.error('Failed to delete comment:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment';
      toast.error(`Failed to delete comment: ${errorMessage}`);
    }
  };

  // Get upvote/downvote counts - prioritize direct API fields
  const upvoteCount = comment.upvotes ?? comment._count?.upvotes ?? 0;
  const downvoteCount = comment.downvotes ?? comment._count?.downvotes ?? 0;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-6' : ''}`}>
      <div className="flex items-start space-x-4 p-6 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative">
        {/* Avatar - using same approach as Header component */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          {comment.user?.avatar ? (
            <Image
              src={comment.user.avatar}
              alt={comment.user.username || 'User'}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {(comment.user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">{comment.user?.username || 'User'}</span>
            <span className="text-sm text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
            {depth > 0 && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Reply
              </span>
            )}
          </div>
          
          <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.content}</p>
          
          <div className="flex items-center space-x-4">
            {/* Vote buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`transition-all duration-200 ${
                  comment.userVote === 'UPVOTE' 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200' 
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => handleVote('UPVOTE')}
                disabled={upvoteCommentMutation.isPending || downvoteCommentMutation.isPending || removeCommentVoteMutation.isPending}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {upvoteCount}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`transition-all duration-200 ${
                  comment.userVote === 'DOWNVOTE' 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200' 
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
                onClick={() => handleVote('DOWNVOTE')}
                disabled={upvoteCommentMutation.isPending || downvoteCommentMutation.isPending || removeCommentVoteMutation.isPending}
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                {downvoteCount}
              </Button>
            </div>
            
            {/* Reply button */}
            {canReply && user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-blue-600"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
            
            {/* Show/Hide replies button */}
            {replies && replies.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
        </div>

        {/* Three-dot menu for comment owner */}
        {isCommentOwner && (
          <div className="absolute top-4 right-4">
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-gray-100">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              }
            >
              <DropdownMenuItem>
                <Edit className="w-3 h-3 mr-2" />
                Edit comment
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete comment
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && user && (
        <div className="mt-4 ml-12 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-3">
            {/* Avatar for reply form - same approach as above */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-200">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Textarea
                placeholder={`Reply to ${comment.user?.username || 'this comment'}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-3 resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl bg-white"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || createCommentMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                >
                  <Send className="w-3 h-3 mr-2" />
                  {createCommentMutation.isPending ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {showReplies && replies && replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              replies={reply.replies || []} // Use the nested replies from the API
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
} 