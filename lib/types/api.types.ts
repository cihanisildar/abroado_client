/**
 * API-specific types for requests and responses
 */

import type { 
  User, 
  Comment, 
  Message, 
  PostTag,
  PostCategory,
  VoteType 
} from './entities.types';

// Generic API Response Structure
export interface ApiResponse<TData = unknown> {
  success: boolean;
  message: string;
  data: TData;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<TData> extends ApiResponse<TData> {
  meta: PaginationMeta;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'EXPLORER' | 'ABROADER';
}

export interface AuthResponse extends ApiResponse<{
  user: User;
  accessToken?: string; // Optional for cookie-based auth
}> {
  data: {
    user: User;
    accessToken?: string;
  };
}

export interface UpdateProfileRequest {
  username: string;
  bio?: string;
  currentCity: string;
  currentCountry: string;
  targetCountry?: string;
  techStack?: string;
  avatar?: string;
}

// Posts API Types - Matches backend API exactly
export interface PostsFilters {
  search?: string;
  cityId?: string;
  category?: 'REVIEW' | 'GUIDE' | 'EXPERIENCE' | 'QUESTION' | 'DISCUSSION' | 'TIP';
  page?: number;
  limit?: number;
}

// Frontend UI filters (converted to PostsFilters)
export interface PostsUIFilters {
  search?: string;
  country?: string; // Maps to cityId in backend
  tags?: PostTag[]; // Maps to category in backend  
  sortBy?: 'recent' | 'popular' | 'trending'; // Not supported by backend yet
  page?: number;
  limit?: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: PostCategory;
  tags: PostTag[];
  hashtags?: string[];
  images?: string[];
  location?: string;
  cityId?: string;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  readonly id: string;
}

export interface VoteRequest {
  postId: string;
  type?: VoteType; // Optional for remove vote
}

export interface SavePostRequest {
  postId: string;
}

// Comments API Types
export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  readonly id: string;
  content: string;
}

export interface CommentsResponse extends ApiResponse<Comment[]> {
  meta?: PaginationMeta;
}

// Rooms API Types
export interface CreateRoomRequest {
  name: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE';
  country: string;
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {
  readonly id: string;
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface SendMessageRequest {
  content: string;
  roomId: string;
}

export interface MessagesFilters {
  roomId: string;
  page?: number;
  limit?: number;
  before?: string; // ISO date string
}

// Cities API Types
export interface CitiesFilters {
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface CreateCityReviewRequest {
  rating: number;
  content: string;
  cityId: string;
}

export interface UpdateCityReviewRequest extends Partial<CreateCityReviewRequest> {
  readonly id: string;
}

// Statistics and Analytics
export interface PostCountry {
  country: string;
  count: number;
}

export interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalUpvotes: number;
  totalDownvotes: number;
  joinedRooms: number;
}

export interface AppStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalRooms: number;
  activeUsers: number;
}

// Socket/Real-time Types
export interface SocketMessage {
  id: string;
  type: 'message' | 'typing' | 'user_joined' | 'user_left';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface OnlineMembersUpdate {
  roomId: string;
  onlineMembers: User[];
}

export interface NewMessageData {
  roomId: string;
  message: Message;
}

export interface TypingData {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

// File Upload Types
export interface UploadResponse extends ApiResponse<{
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}> {
  data: {
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  };
}

export interface FileUploadRequest {
  file: File;
  type: 'avatar' | 'post-image' | 'attachment';
}