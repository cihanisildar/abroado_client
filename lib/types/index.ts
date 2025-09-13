/**
 * Main types export file
 * Re-exports all types from individual modules for easy importing
 */

// Entity types
export type {
  User,
  UserRole,
  Post,
  PostAuthor,
  PostTag,
  PostCategory,
  PostStats,
  Comment,
  Room,
  RoomType,
  Message,
  City,
  Country,
  Badge,
  CityReview,
  VoteType,
} from './entities.types';

// API types
export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UpdateProfileRequest,
  PostsFilters,
  CreatePostRequest,
  UpdatePostRequest,
  VoteRequest,
  SavePostRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentsResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
  JoinRoomRequest,
  SendMessageRequest,
  MessagesFilters,
  CitiesFilters,
  CreateCityReviewRequest,
  UpdateCityReviewRequest,
  PostCountry,
  UserStats,
  AppStats,
  SocketMessage,
  OnlineMembersUpdate,
  NewMessageData,
  TypingData,
  UploadResponse,
  FileUploadRequest,
} from './api.types';

// Auth types
export type {
  AuthState,
  LoginCredentials,
  RegisterData,
  AuthContextValue,
  AuthGateProps,
  ProtectedActionOptions,
  UseAuthActionResult,
  SessionData,
  TokenPayload,
  AuthError,
  AuthRedirect,
  ServerAuthState,
  AuthCookies,
  AuthMiddlewareOptions,
} from './auth.types';

// UI types
export type {
  LoadingState,
  AsyncState,
  FormFieldError,
  FormState,
  PostCardProps,
  CommentItemProps,
  RoomCardProps,
  UserAvatarProps,
  BadgeProps,
  SearchFilters,
  FilterOption,
  SearchState,
  NavItem,
  BreadcrumbItem,
  ModalProps,
  ConfirmDialogProps,
  ToastType,
  ToastMessage,
  Column,
  TableProps,
  PaginationProps,
  ChatMessage,
  TypingIndicator,
  OnlineStatus,
  ErrorInfo,
  ErrorBoundaryState,
  ErrorFallbackProps,
  PageMetadata,
  ThemeMode,
  ThemeConfig,
  Breakpoint,
  ResponsiveValue,
} from './ui.types';

// Legacy compatibility - re-export from old types file
// This allows gradual migration without breaking existing imports
// export type {
//   User as LegacyUser,
//   Post as LegacyPost,
//   Comment as LegacyComment,
// } from '../types';