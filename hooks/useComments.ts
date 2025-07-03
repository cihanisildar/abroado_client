import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CommentsResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  VoteCommentRequest,
  VoteCommentResponse,
} from "@/schemas/comment.schemas";

// Fetch comments for a particular post
export const useComments = (
  params: { postId: string; page?: number; limit?: number }
) => {
  return useQuery<CommentsResponse>({
    queryKey: ["comments", params],
    queryFn: async () => {
      const { postId, ...query } = params;
      const response = await api.get(`/posts/${postId}/comments`, {
        params: query,
      });
      return response.data;
    },
    enabled: !!params.postId && params.postId !== 'undefined' && params.postId.trim() !== '',
  });
};

// Create
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateCommentResponse, Error, CreateCommentRequest>({
    mutationFn: async (comment) => {
      const requestBody: any = { content: comment.content };
      if (comment.parentCommentId) {
        requestBody.parentCommentId = comment.parentCommentId;
      }
      
      const response = await api.post(
        `/posts/${comment.postId}/comments`,
        requestBody
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", { postId: variables.postId }],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

// Update
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation<UpdateCommentResponse, Error, UpdateCommentRequest>({
    mutationFn: async ({ commentId, content }) => {
      const response = await api.put(`/comments/${commentId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

// Delete
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation<DeleteCommentResponse, Error, DeleteCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

// Voting hooks
export const useUpvoteComment = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCommentResponse, Error, VoteCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.post(`/comments/${commentId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

export const useDownvoteComment = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCommentResponse, Error, VoteCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.post(`/comments/${commentId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};

export const useRemoveCommentVote = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCommentResponse, Error, VoteCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(`/comments/${commentId}/vote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}; 