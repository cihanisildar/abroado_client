/**
 * Core domain entities with strict typing
 */

export type UserRole = 'EXPLORER' | 'ABROADER';

export interface User {
  readonly id: string;
  username: string;
  email: string;
  role: UserRole;
  currentCity: string | null;
  currentCountry: string | null;
  targetCountry: string | null;
  techStack: string | null;
  bio: string | null;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
  googleId?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type PostTag = 'JOB' | 'VISA' | 'CULTURE' | 'REMOTE' | 'STUDY' | 'HOUSING' | 'LANGUAGE' | 'NETWORKING' | 'INTERVIEW' | 'SALARY';

export type PostCategory = 'REVIEW' | 'GUIDE' | 'EXPERIENCE' | 'QUESTION' | 'DISCUSSION' | 'TIP';

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface PostAuthor {
  readonly id: string;
  username: string;
  avatar: string | null;
  role: UserRole;
}

export interface City {
  readonly id: string;
  name: string;
  country: string;
}

export interface PostStats {
  upvotes: number;
  downvotes: number;
  score: number;
  commentsCount: number;
}

export interface Post {
  readonly id: string;
  title: string;
  content: string;
  readonly userId: string;
  cityId: string | null;
  category: PostCategory;
  tags: PostTag[];
  hashtags: string[];
  images: string[];
  location: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  
  // Computed fields
  upvotes: number;
  downvotes: number;
  score: number;
  commentsCount: number;
  
  // Relationships
  user: PostAuthor;
  city: City | null;
  
  // User-specific data (only present when authenticated)
  userVote?: VoteType | null;
  isSaved?: boolean;
}

export interface Comment {
  readonly id: string;
  content: string;
  readonly postId: string;
  parentCommentId: string | null;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  
  // Computed fields
  upvotes: number;
  downvotes: number;
  score: number;
  
  // Relationships
  user: PostAuthor;
  replies?: Comment[];
  
  // User-specific data
  userVote?: VoteType | null;
}

export type RoomType = 'PUBLIC' | 'PRIVATE';

export interface Room {
  readonly id: string;
  name: string;
  description: string;
  type: RoomType;
  country: string;
  readonly createdById: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  
  // Computed fields
  memberCount: number;
  onlineCount: number;
  
  // Relationships
  createdBy: PostAuthor;
  members?: User[];
  onlineMembers?: User[];
  
  // User-specific data
  isMember?: boolean;
  isCreator?: boolean;
}

export interface Message {
  readonly id: string;
  content: string;
  readonly roomId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  
  // Relationships
  user: PostAuthor;
  room?: Room;
}

export interface Country {
  readonly code: string;
  name: string;
  flag: string;
}

export interface Badge {
  name: string;
  icon: string;
  color: string;
}

export interface CityReview {
  readonly id: string;
  rating: number;
  content: string;
  readonly cityId: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  
  // Relationships
  user: PostAuthor;
  city: City;
}