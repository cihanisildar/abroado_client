"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Car,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  MessageSquare,
  Moon,
  Send,
  Shield,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi
} from "lucide-react";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import {
  useCityReviewComments,
  useCreateCityReviewComment,
  useDeleteCityReview,
  useDownvoteCityReview,
  useSaveCityReview,
  useSingleCityReview,
  useUnsaveCityReview,
  useUpvoteCityReview,
} from "@/hooks/useCityReviews";

// Components
import { CityReviewCommentItem } from "@/components/ui/city-review-comment-item";

// Types
interface RatingCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface CityReview {
  id: string;
  cityId: string;
  title?: string;
  note?: string;
  upvotes: number;
  downvotes: number;
  isSaved: boolean;
  pros?: string[];
  cons?: string[];
  jobOpportunities?: number;
  costOfLiving?: number;
  safety?: number;
  transport?: number;
  community?: number;
  healthcare?: number;
  education?: number;
  nightlife?: number;
  weather?: number;
  internet?: number;
  createdAt: string;
  city?: {
    name: string;
    country: string;
  };
  user?: {
    username: string;
    avatar?: string;
  };
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
}

interface Comment {
  id: string;
  content: string;
  parentCommentId: string | null;
  cityReviewId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

const ratingCategories: RatingCategory[] = [
  { key: 'jobOpportunities', label: 'Job Opportunities', icon: Briefcase, color: 'text-blue-600' },
  { key: 'costOfLiving', label: 'Cost of Living', icon: DollarSign, color: 'text-green-600' },
  { key: 'safety', label: 'Safety', icon: Shield, color: 'text-red-600' },
  { key: 'transport', label: 'Transportation', icon: Car, color: 'text-purple-600' },
  { key: 'community', label: 'Community', icon: Users, color: 'text-pink-600' },
  { key: 'healthcare', label: 'Healthcare', icon: Heart, color: 'text-red-500' },
  { key: 'education', label: 'Education', icon: GraduationCap, color: 'text-indigo-600' },
  { key: 'nightlife', label: 'Nightlife', icon: Moon, color: 'text-purple-500' },
  { key: 'weather', label: 'Weather', icon: Globe, color: 'text-yellow-600' },
  { key: 'internet', label: 'Internet', icon: Wifi, color: 'text-blue-500' },
];

export default function CityReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const { data: reviewResponse } = useSingleCityReview(params.id as string);
  const review = reviewResponse?.data as CityReview;
  const isLoading = !reviewResponse;
  
  const { user } = useAuth();

  // Determine if the current user is the owner of the review (compare usernames)
  const isPostOwner = user && review && user.username === review.user?.username;
  
  // Comment hooks
  const { 
    data: commentsData,
    isLoading: isLoadingComments,
  } = useCityReviewComments({ 
    cityReviewId: review?.id || '' 
  });
  const comments = (commentsData?.data ?? []) as Comment[];

  const upvoteMutation = useUpvoteCityReview();
  const downvoteMutation = useDownvoteCityReview();
  const deleteMutation = useDeleteCityReview();
  const saveReviewMutation = useSaveCityReview();
  const unsaveReviewMutation = useUnsaveCityReview();
  const createCommentMutation = useCreateCityReviewComment();

  const queryClient = useQueryClient();

  const handleUpvote = () => {
    if (!review) return;
    
    // Optimistic update for the single review cache
    queryClient.setQueryData(["cityReview", review.id], (old: { data: CityReview } | undefined) => {
      if (!old) return old;
      const currentVote = old.data.userVote;
      const newUpvotes = currentVote === 'UPVOTE' ? old.data.upvotes - 1 : old.data.upvotes + 1;
      const newDownvotes = currentVote === 'DOWNVOTE' ? old.data.downvotes - 1 : old.data.downvotes;
      const newUserVote = currentVote === 'UPVOTE' ? null : 'UPVOTE';
      
      return {
        ...old,
        data: { 
          ...old.data, 
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote
        },
      };
    });

    // Optimistic update for list caches
    queryClient.setQueryData(["cityReviews", { cityId: review.cityId }], (old: { data: CityReview[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((r) => {
          if (r.id === review.id) {
            const currentVote = r.userVote;
            const newUpvotes = currentVote === 'UPVOTE' ? r.upvotes - 1 : r.upvotes + 1;
            const newDownvotes = currentVote === 'DOWNVOTE' ? r.downvotes - 1 : r.downvotes;
            const newUserVote = currentVote === 'UPVOTE' ? null : 'UPVOTE';
            return { ...r, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
          }
          return r;
        }),
      };
    });

    queryClient.setQueryData(["allCityReviews"], (old: { data: CityReview[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((r) => {
          if (r.id === review.id) {
            const currentVote = r.userVote;
            const newUpvotes = currentVote === 'UPVOTE' ? r.upvotes - 1 : r.upvotes + 1;
            const newDownvotes = currentVote === 'DOWNVOTE' ? r.downvotes - 1 : r.downvotes;
            const newUserVote = currentVote === 'UPVOTE' ? null : 'UPVOTE';
            return { ...r, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
          }
          return r;
        }),
      };
    });

    upvoteMutation.mutate(
      { cityReviewId: review.id },
      {
        onError: (error) => {
          console.error("Upvote failed:", error.message);
          // Revert optimistic updates on error
          queryClient.invalidateQueries({ queryKey: ["cityReview", review.id] });
          queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
          queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
        },
      }
    );
  };

  const handleDownvote = () => {
    if (!review) return;
    
    // Optimistic update for the single review cache
    queryClient.setQueryData(["cityReview", review.id], (old: { data: CityReview } | undefined) => {
      if (!old) return old;
      const currentVote = old.data.userVote;
      const newUpvotes = currentVote === 'UPVOTE' ? old.data.upvotes - 1 : old.data.upvotes;
      const newDownvotes = currentVote === 'DOWNVOTE' ? old.data.downvotes - 1 : old.data.downvotes + 1;
      const newUserVote = currentVote === 'DOWNVOTE' ? null : 'DOWNVOTE';
      
      return {
        ...old,
        data: { 
          ...old.data, 
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote
        },
      };
    });

    // Optimistic update for list caches
    queryClient.setQueryData(["cityReviews", { cityId: review.cityId }], (old: { data: CityReview[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((r) => {
          if (r.id === review.id) {
            const currentVote = r.userVote;
            const newUpvotes = currentVote === 'UPVOTE' ? r.upvotes - 1 : r.upvotes;
            const newDownvotes = currentVote === 'DOWNVOTE' ? r.downvotes - 1 : r.downvotes + 1;
            const newUserVote = currentVote === 'DOWNVOTE' ? null : 'DOWNVOTE';
            return { ...r, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
          }
          return r;
        }),
      };
    });

    queryClient.setQueryData(["allCityReviews"], (old: { data: CityReview[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((r) => {
          if (r.id === review.id) {
            const currentVote = r.userVote;
            const newUpvotes = currentVote === 'UPVOTE' ? r.upvotes - 1 : r.upvotes;
            const newDownvotes = currentVote === 'DOWNVOTE' ? r.downvotes - 1 : r.downvotes + 1;
            const newUserVote = currentVote === 'DOWNVOTE' ? null : 'DOWNVOTE';
            return { ...r, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
          }
          return r;
        }),
      };
    });

    downvoteMutation.mutate(
      { cityReviewId: review.id },
      {
        onError: (error) => {
          console.error("Downvote failed:", error.message);
          // Revert optimistic updates on error
          queryClient.invalidateQueries({ queryKey: ["cityReview", review.id] });
          queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
          queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
        },
      }
    );
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ cityId: params.id as string });
      router.push('/cities');
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  const handleSave = () => {
    if (!review) return;
    const toastId = toast.loading(review.isSaved ? "Removing from saved..." : "Saving review...");

    // Optimistic update for detail page (and list cache if any)
    const toggleSaved = (rev: CityReview) => ({ ...rev, isSaved: !rev.isSaved });
    queryClient.setQueryData(["cityReviews", { cityId: review.cityId }], (old: { data: CityReview[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((r) => (r.id === review.id ? toggleSaved(r) : r)),
      };
    });
    queryClient.setQueryData(["allCityReviews"], (old: { data: CityReview[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((r) => (r.id === review.id ? toggleSaved(r) : r)),
      };
    });

    // Optimistic update for the single review cache
    queryClient.setQueryData(["cityReview", review.id], (old: { data: CityReview } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: { ...old.data, isSaved: !old.data.isSaved },
      };
    });

    const onSuccess = () => {
      toast.success(review.isSaved ? "Review removed from saved" : "Review saved", { id: toastId });
    };
    const onError = (error: Error & { response?: { data?: { error?: string; message?: string } } }) => {
      const alreadySaved = error?.response?.data?.error?.toLowerCase().includes("already saved");
      if (alreadySaved) {
        toast.success("Review already saved", { id: toastId });
      } else {
        toast.error(error?.response?.data?.message || error.message || "Error", { id: toastId });
        // Revert
        queryClient.invalidateQueries({ queryKey: ["cityReviews"] });
        queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
      }
    };

    if (review.isSaved) {
      unsaveReviewMutation.mutate({ cityReviewId: review.id }, { onSuccess, onError });
    } else {
      saveReviewMutation.mutate({ cityReviewId: review.id }, { onSuccess, onError });
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim() || !review?.id) return;
    
    const loadingToast = toast.loading('Adding comment...');
    
    try {
      await createCommentMutation.mutateAsync({
        cityReviewId: review.id,
        content: newComment.trim()
      });
      
      setNewComment('');
      toast.dismiss(loadingToast);
      toast.success('Comment added successfully! 💬');
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.dismiss(loadingToast);
      
      // Type guard for error object
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add comment';
      toast.error(`Failed to add comment: ${errorMessage}`);
    }
  };

  // Calculate overall rating
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
    const validRatings = ratings.filter((rating) => rating > 0);
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    const average = validRatings.length > 0 ? sum / ratings.length : 0;
    return average.toFixed(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Rating Bar Component
  const RatingBar = ({
    rating,
    max = 5,
    className = "",
  }: {
    rating: number;
    max?: number;
    className?: string;
  }) => {
    const percentage = (rating / max) * 100;
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 min-w-[32px]">
          {rating}/5
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <span className="mt-4 text-lg text-gray-600">Loading review...</span>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Review not found
            </h3>
            <p className="text-gray-600 mb-8">
              The review you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/cities">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Back to Cities
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const overallRating = calculateOverallRating(review);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/cities">
            <Button variant="outline" size="sm" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back to Cities
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Review Content */}
          <div className="space-y-4 sm:space-y-6">
            {/* Review Header */}
            <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                    <AvatarImage src={review?.user?.avatar} />
                    <AvatarFallback className="text-sm sm:text-base">
                      {review?.user?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                          {review?.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">{review?.user?.username}</span>
                          <span>•</span>
                          <span>{formatDate(review?.createdAt || '')}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{review?.city?.name}, {review?.city?.country}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSave}
                          className="text-xs sm:text-sm"
                        >
                          <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${review?.isSaved ? 'fill-current' : ''}`} />
                          {review?.isSaved ? 'Saved' : 'Save'}
                        </Button>
                        
                        {isPostOwner && (
                          <div className="flex gap-1 sm:gap-2">
                            <Link href={`/cities/${params.id}/edit`}>
                              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </Link>
                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs sm:text-sm text-red-600 hover:text-red-700">
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-lg">Delete Review</DialogTitle>
                                  <DialogDescription className="text-sm">
                                    Are you sure you want to delete this review? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="text-sm">
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="text-sm"
                                  >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Voting Section */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <Button
                          variant={review?.userVote === 'UPVOTE' ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleUpvote}
                          disabled={upvoteMutation.isPending || downvoteMutation.isPending}
                          className="text-xs sm:text-sm"
                        >
                          {upvoteMutation.isPending ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                              Voting...
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                              Upvote ({review?.upvotes || 0})
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant={review?.userVote === 'DOWNVOTE' ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleDownvote}
                          disabled={upvoteMutation.isPending || downvoteMutation.isPending}
                          className="text-xs sm:text-sm"
                        >
                          {downvoteMutation.isPending ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                              Voting...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                              Downvote ({review?.downvotes || 0})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Review */}
            {review?.note && (
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                    Detailed Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {review.note}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Overall Rating */}
            <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-bold text-orange-500">
                      {overallRating}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Overall Rating</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
                      {ratingCategories.map((category) => {
                        const rating = review?.[category.key as keyof CityReview] as number;
                        const IconComponent = category.icon;
                        
                        return (
                          <div key={category.key} className="text-center">
                            <div className="flex justify-center mb-1">
                              <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${category.color}`} />
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {rating}/5
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {category.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Ratings */}
            <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Detailed Ratings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {ratingCategories.map((category) => {
                    const rating = review?.[category.key as keyof CityReview] as number;
                    const IconComponent = category.icon;
                    
                    return (
                      <div key={category.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${category.color}`} />
                            <span className="text-sm sm:text-base font-medium text-gray-900">
                              {category.label}
                            </span>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-orange-500">
                            {rating}/5
                          </span>
                        </div>
                        <RatingBar rating={rating} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pros and Cons */}
            {((review?.pros?.length ?? 0) > 0 || (review?.cons?.length ?? 0) > 0) && (
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Pros & Cons</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {review?.pros && review.pros.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-green-700 mb-2 sm:mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Pros
                        </h3>
                        <ul className="space-y-1 sm:space-y-2">
                          {review.pros.map((pro, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {review?.cons && review.cons.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-red-700 mb-2 sm:mb-3 flex items-center">
                          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Cons
                        </h3>
                        <ul className="space-y-1 sm:space-y-2">
                          {review.cons.map((con, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Comments Section */}
            <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* Add Comment */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this review..."
                      className="flex-1 min-h-[80px] text-sm sm:text-base"
                    />
                    <Button
                      onClick={handleCreateComment}
                      disabled={!newComment.trim() || createCommentMutation.isPending}
                      className="self-end sm:self-start text-xs sm:text-sm"
                    >
                      {createCommentMutation.isPending ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3 sm:space-y-4">
                  {isLoadingComments ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500 mx-auto mb-2 sm:mb-4"></div>
                      <p className="text-xs sm:text-sm text-gray-500">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
                      <p className="text-sm sm:text-base">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <CityReviewCommentItem
                        key={comment.id}
                        comment={comment}
                        cityReviewId={review?.id || ''}
                        replies={comment.replies || []}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 