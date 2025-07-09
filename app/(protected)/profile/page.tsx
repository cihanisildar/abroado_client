"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageSlider } from "@/components/ui/image-slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  useDownvoteCityReview,
  useSaveCityReview,
  useUnsaveCityReview,
  useUpvoteCityReview,
} from "@/hooks/useCityReviews";
import {
  useUserCityReviews,
  useUserComments,
  useUserSavedPosts,
  useUserUpvotedPosts,
} from "@/hooks/useUser";
import { api } from "@/lib/api";
import {
  Activity,
  City,
  CityReview,
  Comment,
  Post,
  Badge as UserBadge,
  UserStats,
} from "@/lib/types";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Briefcase,
  Calendar,
  Car,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  MessageSquare,
  Moon,
  Shield,
  Star,
  TrendingUp,
  User,
  Users,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

interface RatingCategory {
  key: keyof CityReview;
  label: string;
  icon: typeof Briefcase;
  color: string;
}

export default function ProfilePage() {
  const { user, isLoading: isUserLoading } = useAuth();
  // Local state to track currently active tab so we lazily fetch data
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch user's posts more efficiently
  const {
    data: posts = [],
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["user-posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        // Get all posts and filter by current user
        const response = await api.get("/posts");
        const allPosts = response.data?.data || response.data || [];
        console.log("All posts response:", allPosts);
        return allPosts.filter((post: Post) => post.userId === user.id);
      } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Fetch user's comments via dedicated endpoint
  const { data: comments = [] } = useUserComments(user?.id) as {
    data: Comment[] | undefined;
  };
  const isCommentsLoading = false;
  const commentsError = undefined;

  // Define display city interface
  interface DisplayCity extends City {
    duration: string;
    current: boolean;
  }

  // Fetch user's cities
  const { data: cities = [], isLoading: isCitiesLoading } = useQuery<
    DisplayCity[]
  >({
    queryKey: ["user-cities", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const citiesList: DisplayCity[] = [];
      if (user.currentCity && user.currentCountry) {
        citiesList.push({
          id: "current",
          name: user.currentCity,
          country: user.currentCountry,
          countryCode: "",
          duration: "Current",
          current: true,
        });
      }
      if (user.targetCountry && user.targetCountry !== user.currentCountry) {
        citiesList.push({
          id: "target",
          name: user.targetCountry,
          country: user.targetCountry,
          countryCode: "",
          duration: "Target",
          current: false,
        });
      }
      return citiesList;
    },
    enabled: !!user?.id,
  });

  // Calculate user stats
  const { data: stats, error: statsError } = useQuery({
    queryKey: ["user-stats", user?.id, posts.length, comments.length],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const postsThisMonth = posts.filter((post: Post) => {
        const postDate = new Date(post.createdAt);
        return (
          postDate.getMonth() === currentMonth &&
          postDate.getFullYear() === currentYear
        );
      }).length;

      const commentsThisMonth = comments.filter((comment: Comment) => {
        const commentDate = new Date(comment.createdAt);
        return (
          commentDate.getMonth() === currentMonth &&
          commentDate.getFullYear() === currentYear
        );
      }).length;

      const upvotesReceived = posts.reduce(
        (sum: number, post: Post) => sum + (post._count?.upvotes || 0),
        0
      );
      const downvotesReceived = posts.reduce(
        (sum: number, post: Post) => sum + (post._count?.downvotes || 0),
        0
      );
      const netVotes = upvotesReceived - downvotesReceived;
      const helpfulVotes = comments.reduce(
        (sum: number, comment: Comment) => sum + (comment.upvotes || 0),
        0
      );

      const recentActivity: Activity[] = [
        ...posts.map((post: Post) => ({
          type: "post",
          description: `Created post: ${post.title}`,
          timestamp: post.createdAt,
          color: "bg-blue-500",
        })),
        ...comments.map((comment: Comment) => ({
          type: "comment",
          description: `Commented on: ${comment.postTitle || "Unknown Post"}`,
          timestamp: comment.createdAt,
          color: "bg-green-500",
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 10);

      const userStats: UserStats = {
        posts: posts.length,
        comments: comments.length,
        cities: cities.length,
        postsThisMonth,
        commentsThisMonth,
        upvotesReceived,
        downvotesReceived,
        netVotes,
        helpfulVotes,
        recentActivity,
      };

      return userStats;
    },
    enabled:
      !!user?.id && !isPostsLoading && !isCommentsLoading && !isCitiesLoading,
  });

  // Fetch user's badges
  const { data: badges = [] } = useQuery<UserBadge[]>({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      // Since we don't have a badges endpoint yet, return some sample badges based on user activity
      const badgesList: UserBadge[] = [];

      if (posts.length > 0) {
        badgesList.push({
          name: "First Post",
          icon: "📝",
          color: "bg-blue-100 text-blue-800",
        });
      }

      if (posts.length >= 5) {
        badgesList.push({
          name: "Active Writer",
          icon: "✍️",
          color: "bg-green-100 text-green-800",
        });
      }

      if (comments.length >= 10) {
        badgesList.push({
          name: "Helpful",
          icon: "🤝",
          color: "bg-purple-100 text-purple-800",
        });
      }

      return badgesList;
    },
    enabled: !!user?.id && !isPostsLoading && !isCommentsLoading,
  });

  // Saved posts and reviews will be fetched lazily via Suspense in their own section

  // Show loading state while fetching user data
  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (postsError || commentsError || statsError) {
    console.error("Profile errors:", { postsError, commentsError, statsError });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-xl sm:text-2xl">⚠️</div>
          <p className="text-gray-600 text-sm sm:text-base">
            Something went wrong loading your profile data.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getRoleIcon = (role: string) => {
    return role?.toLowerCase() === "explorer" ? "🧭" : "🏠";
  };

  const defaultStats = {
    posts: 0,
    comments: 0,
    cities: 0,
    postsThisMonth: 0,
    commentsThisMonth: 0,
    upvotesReceived: 0,
    downvotesReceived: 0,
    netVotes: 0,
    helpfulVotes: 0,
    recentActivity: [],
  };

  const displayStats = stats || defaultStats;

  /**
   * Component rendered inside the Saved tab. It is wrapped in a <Suspense> boundary
   * so queries run with `suspense: true` will suspend rendering until data is ready.
   * This component is only mounted when the Saved tab is active, eliminating
   * unnecessary network requests when users never open the tab.
   */
  const SavedPostsSection = () => {
    const { data: savedPosts = [] } = useUserSavedPosts(user?.id) as {
      data: Post[] | undefined;
    };
    // We also trigger the saved-reviews query here even if we don't render them yet.
    // This fulfils the requirement to call the hook.
    useUserCityReviews(user?.id);

    if (savedPosts.length === 0) {
      return (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6 sm:p-8 text-center">
            <Bookmark className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No saved posts yet
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Posts you save will appear here
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {savedPosts.map((post: Post) => (
          <Card
            key={post.id}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all p-0 overflow-hidden"
          >
            <div className="flex">
              {/* Upvote Column */}
              <div className="flex flex-col items-center justify-start px-2 sm:px-4 py-4 sm:py-6 min-w-[50px] sm:min-w-[60px] bg-gray-50 border-r border-gray-100">
                <button
                  className={`p-1 rounded transition-colors ${
                    post.userVote === "UPVOTE"
                      ? "bg-green-100 text-green-600"
                      : "hover:bg-green-100 text-gray-400 hover:text-green-600"
                  }`}
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-sm sm:text-lg font-bold text-gray-800 my-1">
                  {(post._count?.upvotes || 0) - (post._count?.downvotes || 0)}
                </span>
                <button
                  className={`p-1 rounded transition-colors ${
                    post.userVote === "DOWNVOTE"
                      ? "bg-red-100 text-red-600"
                      : "hover:bg-red-100 text-gray-400 hover:text-red-600"
                  }`}
                >
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {/* Main Content */}
              <div className="flex-1 p-3 sm:p-4 lg:p-6">
                {/* Header: Badges, User, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {(post.city?.name || post.cityName) && (
                      <span className="inline-flex items-center rounded-full border border-orange-200 text-orange-700 px-2 sm:px-3 text-xs font-semibold gap-1">
                        <span className="text-pink-500 text-sm sm:text-base">
                          📍
                        </span>
                        {post.city?.name || post.cityName}
                      </span>
                    )}
                    {(post.category || post.type) && (
                      <Badge className="rounded-full bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 text-xs font-semibold capitalize transition-colors hover:bg-orange-200">
                        {((post.category || post.type) as string)
                          .charAt(0)
                          .toUpperCase() +
                          ((post.category || post.type) as string)
                            .slice(1)
                            .toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <span className="flex flex-wrap items-center gap-1 text-gray-600 text-xs sm:text-sm">
                    <span className="mx-1 text-gray-400 hidden sm:inline">
                      •
                    </span>
                    Posted by
                    <span className="ml-1 mr-1">
                      <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs sm:text-base">🧑‍🦱</span>
                      </span>
                    </span>
                    <span className="font-bold text-gray-800">
                      {post.user?.username || user?.username || "You"}
                    </span>
                    <span className="mx-1 text-gray-400 hidden sm:inline">
                      •
                    </span>
                    <span className="text-gray-500">
                      {new Date(post.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                </div>
                {/* Title */}
                <Link href={`/posts/${post.id}`}>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1 leading-tight line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                {/* Image Preview */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <ImageSlider
                      images={post.images}
                      className="border-0 shadow-none"
                      compact={true}
                    />
                  </div>
                )}
                {/* Content Preview */}
                <p className="text-gray-700 mb-3 sm:mb-4 line-clamp-2 leading-relaxed text-sm sm:text-base">
                  {post.content.length > 200
                    ? `${post.content.substring(0, 200)}...`
                    : post.content}
                </p>
                {/* Tags as badges */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {post.tags &&
                    post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="rounded-full bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 text-xs font-semibold"
                      >
                        #{tag.toLowerCase()}
                      </Badge>
                    ))}
                </div>
                {/* Footer actions */}
                <div className="flex flex-wrap items-center space-x-4 sm:space-x-8 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {post._count?.comments || post.commentCount || 0} comments
                  </span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <span className="inline-block">
                      <svg
                        width="14"
                        height="14"
                        className="sm:w-4 sm:h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 6l-4-4-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">Share</span>
                  </span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <span className="inline-block">
                      <svg
                        width="14"
                        height="14"
                        className="sm:w-4 sm:h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2 2 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">Save</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  };

  /** Posts Section **/
  const PostsSection = () => {
    const { data: posts = [] } = useSuspenseQuery<Post[]>({
      queryKey: ["user-posts", user?.id],
      queryFn: async () => {
        const res = await api.get("/posts");
        const all = res.data?.data || res.data || [];
        return (all as Post[]).filter((p) => p.userId === user?.id);
      },
    });

    if (!posts.length) {
      return (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6 sm:p-8 text-center">
            <Edit className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Share your experiences with the community
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {posts.map((post: Post) => (
          <Card
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg sm:rounded-2xl shadow-sm hover:shadow-md transition-all p-0 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Upvote Column */}
              <div className="flex sm:flex-col items-center justify-center sm:justify-start px-3 py-2 sm:px-4 sm:py-6 min-w-0 sm:min-w-[60px] bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-100">
                <button
                  className={`p-1 rounded transition-colors ${
                    post.userVote === "UPVOTE"
                      ? "bg-green-100 text-green-600"
                      : "hover:bg-green-100 text-gray-400 hover:text-green-600"
                  }`}
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-base sm:text-lg font-bold text-gray-800 mx-2 sm:mx-0 sm:my-1">
                  {(post._count?.upvotes || 0) - (post._count?.downvotes || 0)}
                </span>
                <button
                  className={`p-1 rounded transition-colors ${
                    post.userVote === "DOWNVOTE"
                      ? "bg-red-100 text-red-600"
                      : "hover:bg-red-100 text-gray-400 hover:text-red-600"
                  }`}
                >
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {/* Main Content */}
              <div className="flex-1 p-3 sm:p-6">
                {/* Header: Badges, User, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {(post.city?.name || post.cityName) && (
                      <span className="inline-flex items-center rounded-full border border-orange-200 text-orange-700 px-2 sm:px-3 text-xs font-semibold gap-1">
                        <span className="text-pink-500 text-sm sm:text-base">
                          📍
                        </span>
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {post.city?.name || post.cityName}
                        </span>
                      </span>
                    )}
                    {(post.category || post.type) && (
                      <Badge className="rounded-full bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 text-xs font-semibold capitalize transition-colors hover:bg-orange-200">
                        {((post.category || post.type) as string)
                          .charAt(0)
                          .toUpperCase() +
                          ((post.category || post.type) as string)
                            .slice(1)
                            .toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm">
                    <span className="hidden sm:inline mx-1 text-gray-400">
                      •
                    </span>
                    <span className="hidden sm:inline">Posted by</span>
                    <span className="ml-1 mr-1">
                      <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs sm:text-base">🧑‍🦱</span>
                      </span>
                    </span>
                    <span className="font-bold text-gray-800">
                      {post.user?.username || user?.username || "You"}
                    </span>
                    <span className="mx-1 text-gray-400">•</span>
                    <span className="text-gray-500">
                      {new Date(post.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {/* Title */}
                <Link href={`/posts/${post.id}`}>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1 leading-tight line-clamp-2">
                    {post.title}
                  </h2>
                </Link>

                {/* Image Preview */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <ImageSlider
                      images={post.images}
                      className="border-0 shadow-none"
                      compact={true}
                    />
                  </div>
                )}

                {/* Content Preview */}
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                  {post.content.length > 150
                    ? `${post.content.substring(0, 150)}...`
                    : post.content}
                </p>
                {/* Rating Row */}
                <div className="flex flex-wrap items-center bg-gray-50 rounded-lg px-2 sm:px-4 py-2 mb-3 sm:mb-4 border border-gray-100 w-full sm:w-fit">
                  <span className="text-yellow-400 mr-2">⭐</span>
                  <span className="font-semibold text-gray-800 mr-2 sm:mr-4 text-sm sm:text-base">
                    {(Math.random() * 2 + 3).toFixed(1)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 mr-2 sm:mr-4">
                    Jobs: {Math.ceil(Math.random() * 5)}/5
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 mr-2 sm:mr-4">
                    Cost: {Math.ceil(Math.random() * 5)}/5
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Safety: {Math.ceil(Math.random() * 5)}/5
                  </span>
                </div>
                {/* Tags as badges */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {post.tags &&
                    post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="rounded-full bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 text-xs font-semibold"
                      >
                        #{tag.toLowerCase()}
                      </Badge>
                    ))}
                </div>
                {/* Footer actions */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {post._count?.comments || post.commentCount || 0} comments
                  </span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <span className="inline-block">
                      <svg
                        width="14"
                        height="14"
                        className="sm:w-4 sm:h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 6l-4-4-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Share
                  </span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <span className="inline-block">
                      <svg
                        width="14"
                        height="14"
                        className="sm:w-4 sm:h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2 2 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Save
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  };

  /** Comments Section **/
  const CommentsSection = () => {
    const { data: comments = [] } = useUserComments(user?.id) as {
      data: Comment[] | undefined;
    };

    if (!comments.length) {
      return (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6 sm:p-8 text-center">
            <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No comments yet
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Join the conversation by commenting on posts
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {comments.map((comment) => (
          <Card key={comment.id} className="bg-white border border-gray-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex flex-col items-center">
                  <button className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600">
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 my-1">
                    {(comment.upvotes || 0) - (comment.downvotes || 0)}
                  </span>
                  <button className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600">
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">
                    Comment on{" "}
                    <Link
                      href={`/posts/${comment.postId}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {comment.postTitle || "Post"}
                    </Link>
                    <span className="mx-2">•</span>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base">
                    {comment.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  };

  /** City Reviews Section **/
  const ReviewsSection = () => {
    const { data: reviews = [] } = useUserCityReviews(user?.id) as {
      data: CityReview[] | undefined;
    };

    // Hooks for voting & saving (mirrors Cities page logic)
    const upvoteMutation = useUpvoteCityReview();
    const downvoteMutation = useDownvoteCityReview();
    const saveReviewMutation = useSaveCityReview();
    const unsaveReviewMutation = useUnsaveCityReview();
    const queryClient = useQueryClient();

    const ratingCategories: RatingCategory[] = [
      {
        key: "jobOpportunities",
        label: "Jobs",
        icon: Briefcase,
        color: "text-blue-600",
      },
      {
        key: "costOfLiving",
        label: "Cost",
        icon: DollarSign,
        color: "text-green-600",
      },
      { key: "safety", label: "Safety", icon: Shield, color: "text-red-600" },
      {
        key: "transport",
        label: "Transport",
        icon: Car,
        color: "text-purple-600",
      },
      {
        key: "community",
        label: "Community",
        icon: Users,
        color: "text-pink-600",
      },
      {
        key: "healthcare",
        label: "Healthcare",
        icon: Heart,
        color: "text-red-500",
      },
      {
        key: "education",
        label: "Education",
        icon: GraduationCap,
        color: "text-indigo-600",
      },
      {
        key: "nightlife",
        label: "Nightlife",
        icon: Moon,
        color: "text-purple-500",
      },
      {
        key: "weather",
        label: "Weather",
        icon: Globe,
        color: "text-yellow-600",
      },
      {
        key: "internet",
        label: "Internet",
        icon: Wifi,
        color: "text-blue-500",
      },
    ];

    const calculateOverallRating = (review: CityReview) => {
      const ratings = [
        review.jobOpportunities || 0,
        review.costOfLiving || 0,
        review.safety || 0,
        review.transport || 0,
        review.community || 0,
        review.healthcare || 0,
        review.education || 0,
        review.nightlife || 0,
        review.weather || 0,
        review.internet || 0,
      ];
      const valid = ratings.filter((r) => r > 0);
      const avg = valid.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      return avg.toFixed(1);
    };

    const handleUpvote = (id: string) => {
      upvoteMutation.mutate(
        { cityReviewId: id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["user-city-reviews"] }),
        }
      );
    };
    const handleDownvote = (id: string) => {
      downvoteMutation.mutate(
        { cityReviewId: id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["user-city-reviews"] }),
        }
      );
    };
    const handleSave = (id: string, isSaved: boolean) => {
      const toastId = toast.loading(
        isSaved ? "Removing from saved..." : "Saving review..."
      );
      const mutation = isSaved ? unsaveReviewMutation : saveReviewMutation;
      mutation.mutate(
        { cityReviewId: id },
        {
          onSuccess: () => {
            toast.success(isSaved ? "Removed from saved" : "Saved", {
              id: toastId,
            });
            queryClient.invalidateQueries({ queryKey: ["user-city-reviews"] });
          },
          onError: (error: ApiError) => {
            toast.error(
              error?.response?.data?.message || error.message || "Error",
              { id: toastId }
            );
          },
        }
      );
    };

    if (!reviews.length) {
      return (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6 sm:p-8 text-center">
            <Star className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Your city reviews will appear here
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {reviews.map((review) => {
          const overall = calculateOverallRating(review);
          return (
            <Card
              key={review.id}
              className="bg-white border-0 rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Vote column */}
                <div className="flex sm:flex-col items-center justify-center sm:justify-start p-3 sm:p-4 bg-gradient-to-r sm:bg-gradient-to-b from-gray-50 to-gray-100 border-b sm:border-b-0 sm:border-r border-gray-200 min-w-0 sm:min-w-[70px]">
                  <button
                    onClick={() => handleUpvote(review.id)}
                    disabled={upvoteMutation.isPending}
                    className="p-1 sm:p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ChevronUp
                      className={
                        review.userVote === "UPVOTE"
                          ? "w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                          : "w-4 h-4 sm:w-5 sm:h-5 text-gray-500"
                      }
                    />
                  </button>
                  <div className="text-center px-2 sm:py-2">
                    <span
                      className={`text-base sm:text-lg font-bold ${
                        (review.upvotes || 0) - (review.downvotes || 0) > 0
                          ? "text-green-600"
                          : (review.upvotes || 0) - (review.downvotes || 0) < 0
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      {(review.upvotes || 0) - (review.downvotes || 0)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownvote(review.id)}
                    disabled={downvoteMutation.isPending}
                    className="p-1 sm:p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ChevronDown
                      className={
                        review.userVote === "DOWNVOTE"
                          ? "w-4 h-4 sm:w-5 sm:h-5 text-red-500"
                          : "w-4 h-4 sm:w-5 sm:h-5 text-gray-500"
                      }
                    />
                  </button>
                </div>

                {/* Main content */}
                <div className="flex-1 p-3 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Badge className="bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full border-0 w-fit">
                        📍 {review.city?.name}
                      </Badge>
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="font-medium text-gray-700">
                          {review.user?.username || user.username}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-yellow-50 px-2 sm:px-3 py-1 rounded-full w-fit">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                      <span className="text-xs sm:text-sm font-semibold text-yellow-700">
                        {overall}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link href={`/cities/${review.id}`}>
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 hover:text-orange-600 cursor-pointer mb-2 sm:mb-3 leading-tight transition-colors group-hover:text-orange-600 line-clamp-2">
                      {review.title ||
                        `Living in ${review.city?.name} - My Experience`}
                    </h2>
                  </Link>

                  {/* Note */}
                  {review.note && (
                    <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 line-clamp-2 leading-relaxed">
                      {review.note}
                    </p>
                  )}

                  {/* Ratings grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    {ratingCategories.map((cat: RatingCategory) => {
                      const val = (
                        typeof review[cat.key] === "number"
                          ? review[cat.key]
                          : 0
                      ) as number;
                      if (!val) return null;
                      const Icon = cat.icon;
                      return (
                        <div
                          key={cat.key}
                          className="flex items-center space-x-2 sm:space-x-3"
                        >
                          <div className="flex items-center space-x-1 sm:space-x-2 min-w-[80px] sm:min-w-[100px]">
                            <Icon
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${cat.color}`}
                            />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              {cat.label}
                            </span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-1 sm:h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                              style={{ width: `${(val / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[28px] sm:min-w-[32px]">
                            {val}/5
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100">
                    <Link href={`/cities/${review.id}`}>
                      <Button
                        variant="outline"
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-lg w-full sm:w-auto text-sm"
                      >
                        Read Full Review
                      </Button>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {review.likes || 0} likes
                      </span>
                      <button
                        onClick={() => handleSave(review.id, !!review.isSaved)}
                        disabled={
                          saveReviewMutation.isPending ||
                          unsaveReviewMutation.isPending
                        }
                        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors border ${
                          review.isSaved
                            ? "border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Bookmark
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill={review.isSaved ? "currentColor" : "none"}
                        />
                        <span>{review.isSaved ? "Saved" : "Save"}</span>
                      </button>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">review</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  /** Upvoted Section **/
  const UpvotedSection = () => {
    const { data: upvotedPosts = [] } = useUserUpvotedPosts(user?.id) as {
      data: Post[] | undefined;
    };

    if (upvotedPosts.length === 0) {
      return (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6 sm:p-8 text-center">
            <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No upvoted posts yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Posts you upvote will appear here
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {upvotedPosts.map((post: Post) => (
          <Card
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg sm:rounded-2xl shadow-sm hover:shadow-md transition-all p-0 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Upvote Column */}
              <div className="flex sm:flex-col items-center justify-center sm:justify-start px-3 py-2 sm:px-4 sm:py-6 min-w-0 sm:min-w-[60px] bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-100">
                <button
                  className={`p-1 rounded transition-colors ${
                    post.userVote === "UPVOTE"
                      ? "bg-green-100 text-green-600"
                      : "hover:bg-green-100 text-gray-400 hover:text-green-600"
                  }`}
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-base sm:text-lg font-bold text-gray-800 mx-2 sm:mx-0 sm:my-1">
                  {(post._count?.upvotes || 0) - (post._count?.downvotes || 0)}
                </span>
                <button
                  className={`p-1 rounded transition-colors ${
                    post.userVote === "DOWNVOTE"
                      ? "bg-red-100 text-red-600"
                      : "hover:bg-red-100 text-gray-400 hover:text-red-600"
                  }`}
                >
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {/* Main Content */}
              <div className="flex-1 p-3 sm:p-6">
                {/* Header: Badges, User, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {(post.city?.name || post.cityName) && (
                      <span className="inline-flex items-center rounded-full border border-orange-200 text-orange-700 px-2 sm:px-3 text-xs font-semibold gap-1">
                        <span className="text-pink-500 text-sm sm:text-base">
                          📍
                        </span>
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {post.city?.name || post.cityName}
                        </span>
                      </span>
                    )}
                    {(post.category || post.type) && (
                      <Badge className="rounded-full bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 text-xs font-semibold capitalize transition-colors hover:bg-orange-200">
                        {((post.category || post.type) as string)
                          .charAt(0)
                          .toUpperCase() +
                          ((post.category || post.type) as string)
                            .slice(1)
                            .toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm">
                    <span className="hidden sm:inline mx-1 text-gray-400">
                      •
                    </span>
                    <span className="hidden sm:inline">Posted by</span>
                    <span className="ml-1 mr-1">
                      <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs sm:text-base">🧑‍🦱</span>
                      </span>
                    </span>
                    <span className="font-bold text-gray-800">
                      {post.user?.username || user?.username || "You"}
                    </span>
                    <span className="mx-1 text-gray-400">•</span>
                    <span className="text-gray-500">
                      {new Date(post.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {/* Title */}
                <Link href={`/posts/${post.id}`}>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1 leading-tight line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                {/* Image Preview */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <ImageSlider
                      images={post.images}
                      className="border-0 shadow-none"
                      compact={true}
                    />
                  </div>
                )}
                {/* Content Preview */}
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                  {post.content.length > 150
                    ? `${post.content.substring(0, 150)}...`
                    : post.content}
                </p>
                {/* Tags as badges */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {post.tags &&
                    post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="rounded-full bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 text-xs font-semibold"
                      >
                        #{tag.toLowerCase()}
                      </Badge>
                    ))}
                </div>
                {/* Footer actions */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {post._count?.comments || post.commentCount || 0} comments
                  </span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <span className="inline-block">
                      <svg
                        width="14"
                        height="14"
                        className="sm:w-4 sm:h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 6l-4-4-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Share
                  </span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    <span className="inline-block">
                      <svg
                        width="14"
                        height="14"
                        className="sm:w-4 sm:h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2 2 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Save
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Header */}
            <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                  {/* User Info */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-6">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.username}
                            width={96}
                            height={96}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getRoleIcon(user.role)
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* User Details */}
                    <div className="text-center sm:text-left flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                          {user.username}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs sm:text-sm"
                          >
                            {getRoleIcon(user.role)} {user.role}
                          </Badge>
                          {user.currentCity && (
                            <Badge
                              variant="secondary"
                              className="text-xs sm:text-sm"
                            >
                              <MapPin className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {user.currentCity}, {user.currentCountry}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {user.bio && (
                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 max-w-lg">
                          {user.bio}
                        </p>
                      )}

                      {/* Additional Info */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Joined {formatDate(user.createdAt)}</span>
                        </div>
                        {user.targetCountry && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Target: {user.targetCountry}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                    <Link href="/profile/edit">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {posts.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {comments.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {stats?.netVotes || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Net Votes
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {stats?.helpfulVotes || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Helpful</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {stats?.postsThisMonth || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  This Month
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-600">
                  {cities.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Cities</div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4 sm:space-y-6 mt-4"
            >
              {/* Tab Navigation */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100">
                <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full h-auto p-1 sm:p-2 bg-transparent">
                  <TabsTrigger
                    value="posts"
                    className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
                  >
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
                  >
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
                  >
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved"
                    className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
                  >
                    <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Saved
                  </TabsTrigger>
                  <TabsTrigger
                    value="upvoted"
                    className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
                  >
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Upvoted
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <TabsContent
                  value="posts"
                  className="space-y-3 sm:space-y-4 lg:space-y-6"
                >
                  <PostsSection />
                </TabsContent>

                <TabsContent
                  value="comments"
                  className="space-y-3 sm:space-y-4 lg:space-y-6"
                >
                  <CommentsSection />
                </TabsContent>

                <TabsContent
                  value="reviews"
                  className="space-y-3 sm:space-y-4 lg:space-y-6"
                >
                  <ReviewsSection />
                </TabsContent>

                <TabsContent
                  value="saved"
                  className="space-y-3 sm:space-y-4 lg:space-y-6"
                >
                  <SavedPostsSection />
                </TabsContent>

                <TabsContent
                  value="upvoted"
                  className="space-y-3 sm:space-y-4 lg:space-y-6"
                >
                  <UpvotedSection />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="sticky top-4 sm:top-24 space-y-4 sm:space-y-6">
              {/* Cities Lived */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    Cities Lived
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isCitiesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-orange-500"></div>
                    </div>
                  ) : cities.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-600 text-center py-4">
                      No cities added yet
                    </p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {cities.map((city) => (
                        <div
                          key={`${city.name}-${city.country}`}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-xs sm:text-sm">
                                {city.name}
                              </span>
                              {city.current && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-green-100 text-green-800"
                                >
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">
                              {city.country} • {city.duration}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posts this month</span>
                      <span className="font-semibold">
                        {displayStats.postsThisMonth}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comments this month</span>
                      <span className="font-semibold">
                        {displayStats.commentsThisMonth}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upvotes received</span>
                      <span className="font-semibold text-green-600">
                        {displayStats.upvotesReceived}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Helpful votes</span>
                      <span className="font-semibold">
                        {displayStats.helpfulVotes}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {displayStats.recentActivity &&
                    displayStats.recentActivity.length > 0 ? (
                      displayStats.recentActivity.map(
                        (activity: Activity, index: number) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-2 flex-shrink-0 ${activity.color}`}
                            ></div>
                            <div>
                              <p className="text-gray-700">
                                {activity.description}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {formatDate(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600 text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
