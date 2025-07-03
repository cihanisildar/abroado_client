"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAllCityReviews,
  useDownvoteCityReview,
  useReviewCountries,
  useSaveCityReview,
  useUnsaveCityReview,
  useUpvoteCityReview,
} from "@/hooks/useCityReviews";
import { useCountries } from "@/hooks/useCountries";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Briefcase,
  Car,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Globe,
  Shield,
  Star,
  TrendingUp,
  User
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface City {
  id: string;
  name: string;
  country: string;
}

interface User {
  id: string;
  username: string;
}

interface CityReview {
  id: string;
  title: string;
  note?: string;
  city: City;
  user: User;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: "UPVOTE" | "DOWNVOTE";
  isSaved: boolean;
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
}

interface ReviewCountry {
  country: string;
  count: number;
}

interface CityReviewsResponse {
  data: CityReview[];
}

export default function CitiesPage() {
  const searchParamsHook = useSearchParams();
  const initialQuery = searchParamsHook.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("newest");

  const { data: countries = [] } = useCountries();
  // Get country data with counts from backend
  const { data: reviewCountries = [] } = useReviewCountries();

  // Use the new hook to fetch all city reviews
  const { data: cityReviewsResponse = { data: [] }, isLoading } =
    useAllCityReviews();
  const cityReviews = cityReviewsResponse.data as CityReview[];

  // Voting hooks
  const upvoteMutation = useUpvoteCityReview();
  const downvoteMutation = useDownvoteCityReview();

  // Save hooks
  const saveReviewMutation = useSaveCityReview();
  const unsaveReviewMutation = useUnsaveCityReview();

  const queryClient = useQueryClient();

  // Voting handlers
  const handleUpvote = (cityReviewId: string) => {
    upvoteMutation.mutate(
      { cityReviewId },
      {
        onSuccess: (data) => {
          console.log("Upvote successful:", data.message);
        },
        onError: (error) => {
          console.error("Upvote failed:", error.message);
        },
      }
    );
  };

  const handleDownvote = (cityReviewId: string) => {
    downvoteMutation.mutate(
      { cityReviewId },
      {
        onSuccess: (data) => {
          console.log("Downvote successful:", data.message);
        },
        onError: (error) => {
          console.error("Downvote failed:", error.message);
        },
      }
    );
  };

  // Save handlers
  const handleSave = (cityReviewId: string) => {
    // Find the specific review to check current saved state
    const targetReview = cityReviews.find((r) => r.id === cityReviewId);
    if (!targetReview) return;

    if (targetReview.isSaved) {
      const toastId = toast.loading("Removing from saved...");
      // Optimistically update UI
      queryClient.setQueryData(
        ["allCityReviews"],
        (old: CityReviewsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((r) =>
              r.id === cityReviewId ? { ...r, isSaved: false } : r
            ),
          };
        }
      );
      unsaveReviewMutation.mutate(
        { cityReviewId },
        {
          onSuccess: () => {
            toast.success("Review removed from saved", { id: toastId });
          },
          onError: (error: {
            response?: {
              data?: {
                message?: string;
                error?: string;
              };
            };
            message?: string;
          }) => {
            toast.error(
              error?.response?.data?.message ||
                error.message ||
                "Failed to unsave",
              { id: toastId }
            );
            // Revert optimistic update
            queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
          },
        }
      );
    } else {
      const toastId = toast.loading("Saving review...");
      queryClient.setQueryData(
        ["allCityReviews"],
        (old: CityReviewsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((r) =>
              r.id === cityReviewId ? { ...r, isSaved: true } : r
            ),
          };
        }
      );
      saveReviewMutation.mutate(
        { cityReviewId },
        {
          onSuccess: () => {
            toast.success("Review saved", { id: toastId });
          },
          onError: (error: {
            response?: {
              data?: {
                message?: string;
                error?: string;
              };
            };
            message?: string;
          }) => {
            const alreadySaved = error?.response?.data?.error
              ?.toLowerCase()
              .includes("already saved");
            if (alreadySaved) {
              toast.success("Review already saved", { id: toastId });
            } else {
              toast.error(
                error?.response?.data?.message ||
                  error.message ||
                  "Failed to save",
                { id: toastId }
              );
              queryClient.invalidateQueries({ queryKey: ["allCityReviews"] });
            }
          },
        }
      );
    }
  };

  // Combine country data from reviews with full country info
  const availableCountries = useMemo(() => {
    const countryMap = new Map<
      string,
      { name: string; flag: string; count: number }
    >();

    // Add countries from reviews with counts
    reviewCountries.forEach(({ country, count }: ReviewCountry) => {
      const countryInfo = countries.find(
        (c) => c.code === country || c.name === country
      );
      if (countryInfo) {
        countryMap.set(country, {
          name: countryInfo.name,
          flag: countryInfo.flag,
          count,
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([code, data]) => ({
        code,
        name: data.name,
        flag: data.flag,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [reviewCountries, countries]);

  // Filter reviews based on search and country
  const filteredReviews = cityReviews.filter((review) => {
    const trimmedQuery = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !trimmedQuery || review.title?.toLowerCase().includes(trimmedQuery);

    const matchesCountry =
      selectedCountry === "all" ||
      review.city?.country === selectedCountry ||
      // Also check if the selected country matches by code
      availableCountries.find((c) => c.code === selectedCountry)?.name ===
        review.city?.country;

    return matchesSearch && matchesCountry;
  });

  // Sort reviews based on selected option
  const sortedFilteredReviews = useMemo(() => {
    const reviews = [...filteredReviews];
    switch (sortOption) {
      case "highest":
        return reviews.sort(
          (a, b) => calculateOverallRating(b) - calculateOverallRating(a)
        );
      case "oldest":
        return reviews.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );
      case "newest":
      default:
        return reviews.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
    }
  }, [filteredReviews, sortOption]);

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
    return average;
  };

  // Top cities by average rating
  const topCities = useMemo(() => {
    const cityStats = new Map<
      string,
      { name: string; country: string; total: number; count: number }
    >();

    cityReviews.forEach((rev) => {
      const avg = calculateOverallRating(rev);
      const key = `${rev.city.name}-${rev.city.country}`;
      const existing = cityStats.get(key);
      if (existing) {
        existing.total += avg;
        existing.count += 1;
      } else {
        cityStats.set(key, {
          name: rev.city.name,
          country: rev.city.country,
          total: avg,
          count: 1,
        });
      }
    });

    return Array.from(cityStats.values())
      .map((c) => ({ ...c, avgRating: c.total / c.count }))
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [cityReviews]);

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
      <div
        className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}
      >
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="hidden bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg sm:rounded-xl">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  City Reviews
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Discover what it&apos;s like to live in cities around the
                  world
                </p>
              </div>
            </div>
            <Link href="/cities/create" className="shrink-0">
              <Button className="w-full sm:w-auto h-8 sm:h-10 px-4 sm:px-6 text-sm sm:text-base">
                Write Review
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Reviews Grid */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Loading reviews...
                    </p>
                  </div>
                </div>
              ) : sortedFilteredReviews.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      No reviews found
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Be the first to review a city!"}
                    </p>
                    <Link href="/cities/create">
                      <Button className="text-sm sm:text-base px-4 sm:px-6">
                        Write First Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                sortedFilteredReviews.map((review) => (
                  <Card
                    key={review.id}
                    className="hover:shadow-lg transition-all duration-200 border border-gray-100 bg-white"
                  >
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Voting Section */}
                        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[70px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpvote(review.id)}
                            className={`h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-green-50 ${
                              review.userVote === "UPVOTE"
                                ? "text-green-600 bg-green-50"
                                : "text-gray-500"
                            }`}
                          >
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 my-1">
                            {review.upvotes - review.downvotes}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownvote(review.id)}
                            className={`h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-50 ${
                              review.userVote === "DOWNVOTE"
                                ? "text-red-600 bg-red-50"
                                : "text-gray-500"
                            }`}
                          >
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <Link href={`/cities/reviews/${review.id}`}>
                                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
                                  {review.title}
                                </h3>
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {review.user.username}
                                  </span>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-400">
                                  •
                                </span>
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* City Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                              <span className="text-sm sm:text-base font-medium text-gray-900">
                                {review.city.name}, {review.city.country}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                              <span className="text-sm sm:text-base font-medium text-gray-900">
                                {calculateOverallRating(review).toFixed(1)}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                overall rating
                              </span>
                            </div>
                          </div>

                          {/* Rating Categories */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="grid grid-cols-[110px_1fr_auto] items-center gap-2 sm:gap-3 w-full">
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  Jobs
                                </span>
                              </div>
                              <RatingBar
                                rating={review.jobOpportunities || 0}
                              />
                              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-right">
                                {review.jobOpportunities}/5
                              </span>
                            </div>
                            <div className="grid grid-cols-[110px_1fr_auto] items-center gap-2 sm:gap-3 w-full">
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  Cost
                                </span>
                              </div>
                              <RatingBar rating={review.costOfLiving || 0} />
                              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-right">
                                {review.costOfLiving}/5
                              </span>
                            </div>
                            <div className="grid grid-cols-[110px_1fr_auto] items-center gap-2 sm:gap-3 w-full">
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  Safety
                                </span>
                              </div>
                              <RatingBar rating={review.safety || 0} />
                              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-right">
                                {review.safety}/5
                              </span>
                            </div>
                            <div className="grid grid-cols-[110px_1fr_auto] items-center gap-2 sm:gap-3 w-full">
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <Car className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  Transport
                                </span>
                              </div>
                              <RatingBar rating={review.transport || 0} />
                              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-right">
                                {review.transport}/5
                              </span>
                            </div>
                          </div>

                          {/* Review Content */}
                          {review.note && (
                            <div className="mb-3 sm:mb-4">
                              <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">
                                {review.note}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <Link href={`/cities/reviews/${review.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-gray-600"
                              >
                                Read Full Review
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSave(review.id)}
                              className={`h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm ${
                                review.isSaved
                                  ? "text-orange-600"
                                  : "text-gray-600"
                              }`}
                            >
                              <Bookmark
                                className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${
                                  review.isSaved ? "fill-current" : ""
                                }`}
                              />
                              {review.isSaved ? "Saved" : "Save"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-6 space-y-4 sm:space-y-6">
              {/* Filters & Actions */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Sort By
                    </label>
                    <Select value={sortOption} onValueChange={setSortOption}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="highest">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div >
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Country
                    </label>
                    <Select
                      value={selectedCountry}
                      onValueChange={setSelectedCountry}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {availableCountries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Link href="/cities/create">
                    <Button className="w-full mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">Write Review</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Review Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Total Reviews
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {cityReviews.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Countries
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {reviewCountries.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Cities
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {new Set(cityReviews.map((r) => r.city.name)).size}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Trending Cities */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    Trending Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {topCities.slice(0, 5).map((city, index) => (
                      <div
                        key={`${city.name}-${city.country}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 min-w-[1.5rem]">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {city.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {city.country}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {city.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
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
