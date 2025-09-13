/**
 * UI Component and interaction types
 */

import type { 
  Post, 
  Comment, 
  Room, 
  Message, 
  User,
  PostCategory,
  PostTag,
  VoteType 
} from './entities.types';

// Generic UI States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<TData = unknown, TError = Error> {
  data: TData | null;
  error: TError | null;
  loading: boolean;
  status: LoadingState;
}

// Form Types
export interface FormFieldError {
  message: string;
  code?: string;
}

export interface FormState<TData = Record<string, unknown>> {
  data: TData;
  errors: Partial<Record<keyof TData, FormFieldError>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Component Props
export interface PostCardProps {
  post: Post;
  showActions?: boolean;
  compact?: boolean;
  onVote?: (postId: string, type: VoteType) => void;
  onSave?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export interface CommentItemProps {
  comment: Comment;
  showReplies?: boolean;
  onVote?: (commentId: string, type: VoteType) => void;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
}

export interface RoomCardProps {
  room: Room;
  showActions?: boolean;
  onJoin?: (roomId: string) => void;
  onLeave?: (roomId: string) => void;
}

export interface UserAvatarProps {
  user: Pick<User, 'id' | 'username' | 'avatar' | 'role'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRole?: boolean;
  showOnlineStatus?: boolean;
  className?: string;
}

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

// Search and Filter Types
export interface SearchFilters {
  query: string;
  tags: PostTag[];
  category: PostCategory | 'all';
  country: string | 'all';
  sortBy: 'recent' | 'popular' | 'trending';
}

export interface FilterOption<TValue = string> {
  label: string;
  value: TValue;
  count?: number;
  disabled?: boolean;
}

export interface SearchState extends SearchFilters {
  isSearching: boolean;
  hasResults: boolean;
  totalResults: number;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// Modal and Dialog Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

// Toast and Notification Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Table and List Types
export interface Column<TData = unknown> {
  key: keyof TData;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: TData) => React.ReactNode;
}

export interface TableProps<TData = unknown> {
  data: TData[];
  columns: Column<TData>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: keyof TData, direction: 'asc' | 'desc') => void;
  sortKey?: keyof TData;
  sortDirection?: 'asc' | 'desc';
}

// Pagination Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSize?: boolean;
}

// Real-time Types
export interface ChatMessage extends Message {
  isOwn: boolean;
  isSystem?: boolean;
  pending?: boolean;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Error Boundary Types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: ErrorInfo;
}

// SEO Types
export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    image?: string;
  };
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  radius: number;
}

// Responsive Types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}