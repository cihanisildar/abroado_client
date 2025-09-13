export interface User {
  id: string;
  username: string;
  email: string;
  role: 'EXPLORER' | 'ABROADER';
  currentCity: string | null;
  currentCountry: string | null;
  targetCountry: string | null;
  techStack: string | null;
  bio: string | null;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
  googleId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostTag = 'JOB' | 'VISA' | 'CULTURE' | 'REMOTE' | 'STUDY' | 'HOUSING' | 'LANGUAGE' | 'NETWORKING' | 'INTERVIEW' | 'SALARY';

export type PostCategory = 'REVIEW' | 'GUIDE' | 'EXPERIENCE' | 'QUESTION' | 'DISCUSSION' | 'TIP';

export interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  cityId: string | null;
  category: PostCategory;
  tags: PostTag[];
  hashtags: string[];
  images: string[]; // URLs of images attached to the post
  location: string | null;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    role: 'EXPLORER' | 'ABROADER';
  };
  city: {
    id: string;
    name: string;
    country: string;
  } | null;
  _count?: {
    comments: number;
    votes: number;
    upvotes?: number;
    downvotes?: number;
  };
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null; // The user's vote on this post
  isSaved: boolean;
  // Legacy/computed fields for backward compatibility
  type?: string;
  cityName?: string;
  commentCount?: number;
}

export interface Badge {
  name: string;
  icon: string;
  color: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  parentCommentId: string | null; // For nested comments
  userId: string;
  createdAt: string;
  updatedAt: string;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
  _count?: {
    upvotes: number;
    downvotes: number;
  };
  // Direct vote counts from API
  upvotes?: number;
  downvotes?: number;
  score?: number;
  // Author details (now returned by the API)
  user?: {
    id: string;
    username: string;
    avatar?: string | null;
    role: 'EXPLORER' | 'ABROADER';
  };
  // Nested replies - full Comment objects, not just IDs
  replies?: Comment[];
  // Legacy fields for backward compatibility
  postTitle?: string;
}

export interface CommentsResponse {
  success: boolean;
  message?: string;
  data: Comment[];  // Comments are directly in data array
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface City {
  id: string;          // GeoNames ID
  name: string;        // City name
  country: string;     // Country name
  countryCode: string; // 2-letter country code
  population?: number; // City population
  latitude?: number;   // Geographical coordinates
  longitude?: number;  // Geographical coordinates
}

export interface CityReview {
  id: string;
  userId: string;
  cityId: string;
  title?: string; // Short summary/title for the review
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
  upvotes: number;
  downvotes: number;
  language?: string; // e.g., "en", "tr"
  isSaved?: boolean; // Whether the current user has saved this review
  createdAt: string;
  updatedAt: string;
  // Relations
  user: User;
  city: City;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null; // The user's vote on this review
}

export interface Activity {
  description: string;
  timestamp: string;
  color: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role?: 'EXPLORER' | 'ABROADER';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
  token: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface UserStats {
  posts: number;
  comments: number;
  cities: number;
  postsThisMonth: number;
  commentsThisMonth: number;
  upvotesReceived: number;
  downvotesReceived: number;
  netVotes: number;
  helpfulVotes: number;
  recentActivity: Activity[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  type: 'GENERAL' | 'COUNTRY' | 'STUDY' | 'INTERVIEW' | 'LANGUAGE';
  country?: string | null;
  tags?: string[];
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
    avatar?: string | null;
    role: 'EXPLORER' | 'ABROADER';
  };
  // Optional/computed fields
  recentMessages?: Message[];
  lastActivity?: string;
  members?: User[];
  isMember?: boolean;
  onlineMembers?: (User & { isOnline: boolean })[];
}

export interface Message {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    role: 'EXPLORER' | 'ABROADER';
  };
  createdAt: string;
  updatedAt: string;
} 