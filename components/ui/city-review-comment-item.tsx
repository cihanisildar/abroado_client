'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { 
  DropdownMenu,
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { 
  useCreateCityReviewComment, 
  useUpvoteCityReviewComment, 
  useDownvoteCityReviewComment, 
  useRemoveCityReviewCommentVote, 
  useDeleteCityReviewComment,
  useUpdateCityReviewComment
} from '@/hooks/useCityReviews';
import { CityReviewComment } from '@/schemas/cityReview.schemas';
import toast from 'react-hot-toast';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface CityReviewCommentItemProps {
  comment: CityReviewComment;
  cityReviewId: string;
  replies: CityReviewComment[];
  depth?: number;
  maxDepth?: number;
}

export function CityReviewCommentItem({ 
  comment, 
  cityReviewId, 
  replies, 
  depth = 0, 
  maxDepth = 3 
}: CityReviewCommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  
  const { user } = useAuth();
  const createCommentMutation = useCreateCityReviewComment();
  const upvoteCommentMutation = useUpvoteCityReviewComment();
  const downvoteCommentMutation = useDownvoteCityReviewComment();
  const removeCommentVoteMutation = useRemoveCityReviewCommentVote();
  const deleteCommentMutation = useDeleteCityReviewComment();
  const updateCommentMutation = useUpdateCityReviewComment();

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
        cityReviewId,
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
      
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to add reply';
      toast.error(`Failed to add reply: ${errorMessage}`);
    }
  };

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      toast.error('Please login to vote on comments');
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
      
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || `Failed to ${isUpvote ? 'upvote' : 'downvote'} comment`;
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
      
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to delete comment';
      toast.error(`Failed to delete comment: ${errorMessage}`);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    
    const loadingToast = toast.loading('Updating comment...');
    
    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        content: editContent.trim()
      });
      
      setIsEditing(false);
      toast.dismiss(loadingToast);
      toast.success('Comment updated successfully! ✏️');
    } catch (error: unknown) {
      console.error('Failed to update comment:', error);
      toast.dismiss(loadingToast);
      
      const apiError = error as ApiError;
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to update comment';
      toast.error(`Failed to update comment: ${errorMessage}`);
    }
  };

  // Get upvote/downvote counts
  const upvoteCount = comment.upvotes ?? 0;
  const downvoteCount = comment.downvotes ?? 0;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-6' : ''}`}>
      <div className="flex items-start space-x-4 p-6 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative">
        {/* Avatar */}
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
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[100px] resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim() || editContent === comment.content || updateCommentMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {updateCommentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.content}</p>
          )}
          
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
        {isCommentOwner && !isEditing && (
          <div className="absolute top-6 right-6">
            <DropdownMenu
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
            >
              <DropdownMenuItem onClick={() => setIsEditing(true)} className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && user && (
        <div className="mt-4 ml-12 p-4 bg-gray-50 rounded-xl border">
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="mb-3 resize-none border-gray-200 focus:border-orange-300 focus:ring-orange-200"
            rows={3}
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
              size="sm"
              onClick={handleReply}
              disabled={!replyContent.trim() || createCommentMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Send className="w-3 h-3 mr-1" />
              {createCommentMutation.isPending ? 'Posting...' : 'Reply'}
            </Button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {showReplies && replies && replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
            <CityReviewCommentItem
              key={reply.id}
              comment={reply}
              cityReviewId={cityReviewId}
              replies={reply.replies || []}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
} 