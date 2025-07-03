"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageSlider } from "@/components/ui/image-slider";
import { CommentItem } from "@/components/ui/comment-item";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  MapPin,
  Hash,
  Send,
  Edit,
  Trash2,
  MoreVertical,
  Bookmark,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState, use } from "react";
import {
  usePost,
  useDeletePost,
  useUpvotePost,
  useDownvotePost,
  useRemoveVote,
  useSavePost,
  useUnsavePost,
} from "@/hooks/usePosts";
import { useComments, useCreateComment } from "@/hooks/useComments";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostPage({ params }: PostPageProps) {
  const [newComment, setNewComment] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);

  // Ensure params.id is valid before making API calls
  const postId = resolvedParams?.id;
  const isValidId = postId && postId !== "undefined" && postId.trim() !== "";

  const {
    data: post,
    isLoading: isLoadingPost,
    error: postError,
  } = usePost(postId);
  const { data: commentsResponse, isLoading: isLoadingComments } = useComments({
    postId,
  });

  // Use the nested structure directly from the API (no need to build tree)
  const comments = commentsResponse?.data ?? [];
  const pagination = commentsResponse?.pagination;

  const createCommentMutation = useCreateComment();
  const deletePostMutation = useDeletePost();
  const upvotePostMutation = useUpvotePost();
  const downvotePostMutation = useDownvotePost();
  const removeVoteMutation = useRemoveVote();
  const savePostMutation = useSavePost();
  const unsavePostMutation = useUnsavePost();
  const { user } = useAuth();
  const router = useRouter();

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    const loadingToast = toast.loading("Adding comment...");

    try {
      await createCommentMutation.mutateAsync({
        postId: postId,
        content: newComment.trim(),
      });

      setNewComment("");
      toast.dismiss(loadingToast);
      toast.success("Comment added successfully! 💬");
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast.dismiss(loadingToast);

      const apiError = error as ApiError;
      const errorMessage =
        apiError?.response?.data?.message ||
        apiError?.message ||
        "Failed to add comment";
      toast.error(`Failed to add comment: ${errorMessage}`);
    }
  };

  const handleDeletePost = async () => {
    const loadingToast = toast.loading("Deleting post...");

    try {
      await deletePostMutation.mutateAsync({ postId: postId });

      toast.dismiss(loadingToast);
      toast.success("Post deleted successfully! 🗑️");
      setShowDeleteDialog(false);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.dismiss(loadingToast);

      const apiError = error as ApiError;
      const errorMessage =
        apiError?.response?.data?.message ||
        apiError?.message ||
        "Failed to delete post";
      toast.error(`Failed to delete post: ${errorMessage}`);
    }
  };

  const handleVote = async (voteType: "UPVOTE" | "DOWNVOTE") => {
    if (!user) {
      toast.error("Please login to vote on posts");
      return;
    }

    if (!post) return;

    const isUpvote = voteType === "UPVOTE";
    const loadingToast = toast.loading(
      `${isUpvote ? "Upvoting" : "Downvoting"} post...`
    );

    try {
      // Check if we need to remove the vote
      if (
        (isUpvote && post.userVote === "UPVOTE") ||
        (!isUpvote && post.userVote === "DOWNVOTE")
      ) {
        await removeVoteMutation.mutateAsync({ postId });
        toast.dismiss(loadingToast);
        toast.success("Vote removed! 🔄");
      } else {
        // Apply new vote
        if (isUpvote) {
          await upvotePostMutation.mutateAsync({ postId });
        } else {
          await downvotePostMutation.mutateAsync({ postId });
        }
        toast.dismiss(loadingToast);
        toast.success(`Post ${isUpvote ? "upvoted! 👍" : "downvoted! 👎"}`);
      }
    } catch (error) {
      console.error(
        `Failed to ${isUpvote ? "upvote" : "downvote"} post:`,
        error
      );
      toast.dismiss(loadingToast);

      const apiError = error as ApiError;
      const errorMessage =
        apiError?.response?.data?.message ||
        apiError?.message ||
        `Failed to ${isUpvote ? "upvote" : "downvote"} post`;
      toast.error(`Failed to vote on post: ${errorMessage}`);
    }
  };

  const handleSave = async () => {
    if (!post) return;
    if (post.isSaved) {
      await unsavePostMutation.mutateAsync({ postId });
      toast.success("Post unsaved");
    } else {
      await savePostMutation.mutateAsync({ postId });
      toast.success("Post saved");
    }
  };

  // Returns human-readable relative time (e.g., "3m ago", "2h ago", "Apr 3, 2025")
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

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if current user is the owner of the post
  const isPostOwner =
    user && post && (user.id === post.userId || user.id === post.user?.id);

  // Show error for invalid post ID
  if (!isValidId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Post ID
          </h1>
          <p className="text-gray-600 mb-4">
            The post ID provided is not valid.
          </p>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  // Handle server errors (500) or other API errors
  if (postError) {
    const isServerError = (postError as ApiError)?.response?.status === 500;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isServerError ? "Server Error" : "Post Unavailable"}
          </h1>
          <p className="text-gray-600 mb-4">
            {isServerError
              ? "There was a server error loading this post. This might be a data issue that needs to be fixed on the backend."
              : "The post you&apos;re looking for is currently unavailable."}
          </p>
          <div className="text-sm text-gray-500 mb-4">Post ID: {postId}</div>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Post not found
          </h1>
          <p className="text-gray-600 mb-4">
            The post you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Content */}
        <Card className="mb-8 bg-white border-0 rounded-2xl shadow-lg relative px-8">
          {/* Back button - Inside card */}
          <div className="absolute top-8 left-4 z-10">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-slate-100 w-8 h-8 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Three-dot menu for post owner - Top Right */}
          {isPostOwner && (
            <div className="absolute top-8 right-4 z-10">
              <DropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-8 h-8 hover:bg-gray-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                }
              >
                <Link href={`/posts/${postId}/edit`}>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit post
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenu>

              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Post</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this post? This action
                      cannot be undone and will permanently remove the post and
                      all its comments.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeletePost}
                      disabled={deletePostMutation.isPending}
                    >
                      {deletePostMutation.isPending
                        ? "Deleting..."
                        : "Delete Post"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <CardContent className="p-8">
            {/* Post Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Post Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Posted {formatDate(post.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.upvotes || 0} upvotes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {pagination?.total || post.commentsCount || 0} comments
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(post.city?.name || post.cityName) && (
                  <Badge
                    variant="outline"
                    className="border-orange-200 text-orange-700"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {post.city?.name || post.cityName}
                  </Badge>
                )}
                {post.tags &&
                  post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Post Images - Prominently displayed at top */}
            {post.images && post.images.length > 0 && (
              <div className="mb-6">
                <ImageSlider images={post.images} />
              </div>
            )}

            {/* Post Content */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 mb-6">
                  {/* Vote Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant={
                        post.userVote === "UPVOTE" ? "default" : "outline"
                      }
                      className={
                        post.userVote === "UPVOTE"
                          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg rounded-xl"
                          : "border-green-200 text-green-600 hover:bg-green-50 rounded-xl"
                      }
                      onClick={() => handleVote("UPVOTE")}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Upvote</span>
                      <span className="ml-1">({post.upvotes || 0})</span>
                    </Button>
                    <Button
                      variant={
                        post.userVote === "DOWNVOTE" ? "default" : "outline"
                      }
                      className={
                        post.userVote === "DOWNVOTE"
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-lg rounded-xl"
                          : "border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                      }
                      onClick={() => handleVote("DOWNVOTE")}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Downvote</span>
                      <span className="ml-1">({post.downvotes || 0})</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className={`${
                      post.isSaved
                        ? "border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    } rounded-xl flex items-center space-x-1`}
                    onClick={handleSave}
                    disabled={
                      savePostMutation.isPending || unsavePostMutation.isPending
                    }
                  >
                    <Bookmark
                      className="w-4 h-4"
                      fill={post.isSaved ? "currentColor" : "none"}
                    />
                    <span>{post.isSaved ? "Saved" : "Save"}</span>
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Post #{post.id?.slice(0, 8) || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-white border-0 rounded-2xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-gray-800">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
              Comments ({pagination?.total || comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment */}
            {user && (
              <div className="mb-6 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-10 h-10 ring-2 ring-orange-200">
                    <AvatarImage src={user.avatar || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-4 resize-none border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl bg-white"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCreateComment}
                        disabled={
                          !newComment.trim() || createCommentMutation.isPending
                        }
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {createCommentMutation.isPending
                          ? "Posting..."
                          : "💬 Post Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                // Filter to show only top-level comments (parentCommentId === null)
                // The nested replies will be rendered within each CommentItem
                comments
                  .filter((comment) => comment.parentCommentId === null)
                  .map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={postId}
                      replies={comment.replies || []}
                      depth={0}
                      maxDepth={3}
                    />
                  ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No comments yet
                  </h3>
                  <p className="text-gray-600">
                    Be the first to comment on this post!
                  </p>
                </div>
              )}

              {/* Pagination info */}
              {pagination && pagination.pages > 1 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  Page {pagination.page} of {pagination.pages}(
                  {pagination.total} total comments)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
