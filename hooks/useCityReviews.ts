import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CityReview } from "@/lib/types";
import {
  CityReviewsPagination,
  CityReviewsResponse,
  CreateCityReviewRequest,
  CreateCityReviewResponse,
  UpdateCityReviewRequest,
  UpdateCityReviewResponse,
  DeleteCityReviewRequest,
  DeleteCityReviewResponse,
  VoteCityReviewRequest,
  VoteCityReviewResponse,
  CityReviewCommentsRequest,
  CityReviewCommentsResponse,
  CreateCityReviewCommentRequest,
  CreateCityReviewCommentResponse,
  UpdateCityReviewCommentRequest,
  UpdateCityReviewCommentResponse,
  DeleteCityReviewCommentRequest,
  DeleteCityReviewCommentResponse,
  VoteCityReviewCommentRequest,
  VoteCityReviewCommentResponse,
} from "../schemas/cityReview.schemas";

export const useCityReviews = (params: {
  reviewId?: string;
  cityId?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<CityReviewsResponse>({
    queryKey: ["cityReviews", params],
    queryFn: async () => {
      // If we are fetching a single review by id
      if (params.reviewId) {
        const response = await api.get(`/reviews/${params.reviewId}`);
        const single = response.data?.data;
        return {
          success: response.data.success,
          // Fallback message if backend doesn't include one
          message: response.data.message ?? "Fetched review",
          data: single ? [single] : [],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            totalPages: 1,
          },
        } as CityReviewsResponse;
      }

      // If we are fetching all reviews for a specific city
      if (params.cityId) {
        const { page, limit } = params;
        const response = await api.get(`/cities/${params.cityId}/reviews`, {
          params: { page, limit },
        });
        return response.data;
      }

      // Fallback – fetch all reviews (legacy or aggregated endpoint)
      const response = await api.get("/reviews", {
        params: { page: params.page, limit: params.limit },
      });
      return response.data;
    },
    enabled: Boolean(params.reviewId || params.cityId),
  });
};

export const useCreateCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateCityReviewResponse, Error, CreateCityReviewRequest>({
    mutationFn: async (review) => {
      const response = await api.post(`/cities/${review.cityId}/reviews`, review);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.cityId) {
        queryClient.invalidateQueries({
          queryKey: ["cityReviews", { cityId: variables.cityId }],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      }
    },
  });
};

export const useUpdateCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<UpdateCityReviewResponse, Error, UpdateCityReviewRequest>({
    mutationFn: async (review) => {
      const response = await api.put(`/reviews/${review.reviewId}`, review);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.cityId) {
        queryClient.invalidateQueries({
          queryKey: ["cityReviews", { cityId: variables.cityId }],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      }
      // Also invalidate the single review query
      queryClient.invalidateQueries({ queryKey: ["cityReview", variables.reviewId] });
    },
  });
};

export const useDeleteCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<DeleteCityReviewResponse, Error, DeleteCityReviewRequest>({
    mutationFn: async (body) => {
      const response = await api.delete(`/reviews/${body.cityId}`);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.cityId) {
        queryClient.invalidateQueries({
          queryKey: ["cityReviews", { cityId: variables.cityId }],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      }
    },
  });
};

// Voting hooks
export const useUpvoteCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewResponse, Error, VoteCityReviewRequest>({
    mutationFn: async (body) => {
      const response = await api.post(`/reviews/${body.cityReviewId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all city reviews queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
    },
  });
};

export const useDownvoteCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewResponse, Error, VoteCityReviewRequest>({
    mutationFn: async (body) => {
      const response = await api.post(`/reviews/${body.cityReviewId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all city reviews queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
    },
  });
};

export const useRemoveCityReviewVote = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewResponse, Error, VoteCityReviewRequest>({
    mutationFn: async (body) => {
      const response = await api.delete(`/reviews/${body.cityReviewId}/vote`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all city reviews queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
    },
  });
};

// Save/Unsave hooks
export const useSaveCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewResponse, Error, { cityReviewId: string }>({
    mutationFn: async (body) => {
      const response = await api.post(`/reviews/${body.cityReviewId}/save`);
      return response.data;
    },
    onSuccess: () => {
      // Refresh city reviews so isSaved updates
      queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["cityReview"] });
    },
  });
};

export const useUnsaveCityReview = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewResponse, Error, { cityReviewId: string }>({
    mutationFn: async (body) => {
      const response = await api.delete(`/reviews/${body.cityReviewId}/save`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["cityReview"] });
    },
  });
};

export const useAllCityReviews = (params?: { page?: number; limit?: number }) => {
  // Use a stable query key: if params are provided include them, otherwise keep the key simple so
  // that callers using `["allCityReviews"]` (e.g. for optimistic updates) point to the same cache entry.
  const queryKey = params ? ["allCityReviews", params] : ["allCityReviews"] as const;

  return useQuery<CityReviewsResponse>({
    queryKey,
    queryFn: async () => {
      const response = await api.get("/reviews/all", { params });
      return response.data;
    },
  });
};

// City Review Comments hooks
export const useCityReviewComments = (params: {
  cityReviewId: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<CityReviewCommentsResponse>({
    queryKey: ["cityReviewComments", params],
    queryFn: async () => {
      const response = await api.get(`/reviews/${params.cityReviewId}/comments`, {
        params: {
          page: params.page,
          limit: params.limit,
        },
      });
      return response.data;
    },
    enabled: !!params.cityReviewId && params.cityReviewId !== 'undefined' && params.cityReviewId.trim() !== '',
  });
};

export const useCreateCityReviewComment = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateCityReviewCommentResponse, Error, CreateCityReviewCommentRequest>({
    mutationFn: async (comment) => {
      const requestBody: any = { content: comment.content };
      if (comment.parentCommentId) {
        requestBody.parentCommentId = comment.parentCommentId;
      }
      
      const response = await api.post(`/reviews/${comment.cityReviewId}/comments`, requestBody);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["cityReviewComments", { cityReviewId: variables.cityReviewId }],
      });
      queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
      queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
    },
  });
};

export const useUpdateCityReviewComment = () => {
  const queryClient = useQueryClient();
  return useMutation<UpdateCityReviewCommentResponse, Error, UpdateCityReviewCommentRequest>({
    mutationFn: async ({ commentId, content }) => {
      const response = await api.put(`/city-review-comments/${commentId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityReviewComments"] });
    },
  });
};

export const useDeleteCityReviewComment = () => {
  const queryClient = useQueryClient();
  return useMutation<DeleteCityReviewCommentResponse, Error, DeleteCityReviewCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(`/city-review-comments/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityReviewComments"] });
    },
  });
};

// City Review Comment Voting hooks
export const useUpvoteCityReviewComment = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewCommentResponse, Error, VoteCityReviewCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.post(`/city-review-comments/${commentId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityReviewComments"] });
    },
  });
};

export const useDownvoteCityReviewComment = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewCommentResponse, Error, VoteCityReviewCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.post(`/city-review-comments/${commentId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityReviewComments"] });
    },
  });
};

export const useRemoveCityReviewCommentVote = () => {
  const queryClient = useQueryClient();
  return useMutation<VoteCityReviewCommentResponse, Error, VoteCityReviewCommentRequest>({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(`/city-review-comments/${commentId}/vote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cityReviewComments"] });
    },
  });
};

export const useSingleCityReview = (reviewId: string) => {
  return useQuery<{ success: boolean; message: string; data: CityReview }>({
    queryKey: ["cityReview", reviewId],
    queryFn: async () => {
      const response = await api.get(`/reviews/${reviewId}`);
      return response.data;
    },
    enabled: !!reviewId,
  });
};

export const useReviewCountries = () => {
  return useQuery<{ country: string; count: number }[]>({
    queryKey: ['review-countries'],
    queryFn: async () => {
      const response = await api.get('/reviews/countries');
      return response.data.success ? response.data.data : response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
