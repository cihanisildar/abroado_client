import { Comment, CommentsResponse } from "@/lib/types";

// GET /posts/:postId/comments
export interface CommentsRequest {
  postId: string;
  page?: number;
  limit?: number;
}

// Re-export the updated CommentsResponse type
export type { CommentsResponse };

// POST /posts/:postId/comments
export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string; // For nested replies
}

export interface CreateCommentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    content: string;
    authorId: string;
    postId: string;
    parentCommentId?: string;
    createdAt: string;
  };
}

// PUT /comments/:commentId
export interface UpdateCommentRequest {
  commentId: string;
  content: string;
}

export interface UpdateCommentResponse {
  success: boolean;
  message: string;
  data: Comment;
}

// DELETE /comments/:commentId
export interface DeleteCommentRequest {
  commentId: string;
}

export interface DeleteCommentResponse {
  success: boolean;
  message: string;
}

// POST /api/comments/{id}/upvote
// POST /api/comments/{id}/downvote
// DELETE /api/comments/{id}/vote
export interface VoteCommentRequest {
  commentId: string;
}

export interface VoteCommentResponse {
  success: boolean;
  message: string;
  data: string; // Based on the API documentation, data is a string
} 