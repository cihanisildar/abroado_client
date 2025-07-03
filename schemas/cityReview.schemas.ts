import { CityReview } from '@/lib/types';

export interface CityReviewsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CityReviewsResponse {
  success: boolean;
  data: CityReview[];
  pagination: CityReviewsPagination;
}

export interface CreateCityReviewRequest {
  cityId: string;
  cityName: string;
  country: string;
  title: string;
  jobOpportunities: number;
  costOfLiving: number;
  safety: number;
  transport: number;
  community: number;
  healthcare: number;
  education: number;
  nightlife: number;
  weather: number;
  internet: number;
  pros: string[];
  cons: string[];
  note?: string;
  images: string[];
  likes: number;
}

export interface CreateCityReviewResponse {
  success: boolean;
  message: string;
  data: CityReview;
}

export interface UpdateCityReviewRequest {
  reviewId: string;
  cityId: string;
  title: string;
  jobOpportunities: number;
  costOfLiving: number;
  safety: number;
  transport: number;
  community: number;
  healthcare: number;
  education: number;
  nightlife: number;
  weather: number;
  internet: number;
  pros: string[];
  cons: string[];
  note?: string;
  images: string[];
  likes: number;
  language: string;
}

export interface UpdateCityReviewResponse {
  success: boolean;
  message: string;
  data: CityReview;
}

export interface DeleteCityReviewRequest {
  cityId: string;
}

export interface DeleteCityReviewResponse {
  success: boolean;
  message: string;
}

// Voting schemas
export interface VoteCityReviewRequest {
  cityReviewId: string;
}

export interface VoteCityReviewResponse {
  success: boolean;
  message: string;
}

// useAllCityReviews: Fetches all city reviews from /api/cities/reviews/all
// Response type: CityReviewsResponse
// Params: { page?: number; limit?: number }
// Returns: { success: boolean; data: CityReview[]; pagination: CityReviewsPagination }

// City Review Comments schemas
export interface CityReviewCommentsRequest {
  cityReviewId: string;
  page?: number;
  limit?: number;
}

export interface CityReviewCommentsResponse {
  success: boolean;
  message: string;
  data: CityReviewComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CityReviewComment {
  id: string;
  content: string;
  cityReviewId: string;
  parentCommentId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  user?: {
    id: string;
    username: string;
    avatar?: string | null;
    role: 'EXPLORER' | 'ADMIN';
  };
  replies?: CityReviewComment[];
}

export interface CreateCityReviewCommentRequest {
  cityReviewId: string;
  content: string;
  parentCommentId?: string;
}

export interface CreateCityReviewCommentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    content: string;
    userId: string;
    cityReviewId: string;
    parentCommentId?: string;
    createdAt: string;
  };
}

export interface UpdateCityReviewCommentRequest {
  commentId: string;
  content: string;
}

export interface UpdateCityReviewCommentResponse {
  success: boolean;
  message: string;
  data: CityReviewComment;
}

export interface DeleteCityReviewCommentRequest {
  commentId: string;
}

export interface DeleteCityReviewCommentResponse {
  success: boolean;
  message: string;
}

export interface VoteCityReviewCommentRequest {
  commentId: string;
}

export interface VoteCityReviewCommentResponse {
  success: boolean;
  message: string;
  data: string;
} 