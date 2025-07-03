'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Bookmark, Filter, Hash, MapPin, MessageSquare, Share2, Star, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { usePosts, useUpvotePost, useDownvotePost, useRemoveVote, useSavePost, useUnsavePost, usePostCountries } from '@/hooks/usePosts';
import { useAllCityReviews, useUpvoteCityReview, useDownvoteCityReview, useRemoveCityReviewVote, useReviewCountries } from '@/hooks/useCityReviews';
import { useCountries } from '@/hooks/useCountries';
import { Post, CityReview } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

type ReviewPost = Omit<CityReview, 'id' | 'title'> & {
  id: string;
  type: 'review';
  category: 'REVIEW';
  tags: string[];
  commentsCount: number;
  content: string;
  _count: { comments: number };
  title: string;
};

type CombinedPost = Post | ReviewPost;

// Type guard for regular posts
const isRegularPost = (post: CombinedPost): post is Post => {
  return !post.id.startsWith('review-');
};

const getAverageRating = (review: CityReview | undefined): number | null => {
  if (!review) return null;
  return (
    review.jobOpportunities +
    review.costOfLiving +
    review.safety +
    review.transport +
    review.community +
    review.healthcare +
    review.education +
    review.nightlife +
    review.weather +
    review.internet
  ) / 10;
};

// Category color mapping
const CATEGORY_COLOR_MAP: Record<string, string> = {
  REVIEW: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
  GUIDE: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
  EXPERIENCE: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
  QUESTION: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
  DISCUSSION: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200',
  TIP: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
  DEFAULT: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
};

export default function HomePage() {
  const searchParamsHook = useSearchParams();
  const searchTermParam = searchParamsHook.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(searchTermParam);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTermParam);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [countrySearch, setCountrySearch] = useState('');

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm(searchTermParam);
    setDebouncedSearchTerm(searchTermParam);
  }, [searchTermParam]);

  const { data: posts = [], isLoading: postsLoading } = usePosts({
    search: debouncedSearchTerm || undefined,
    country: selectedCountry && selectedCountry !== 'all' ? selectedCountry : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined
  });
  const { data: cityReviewsData, isLoading: reviewsLoading } = useAllCityReviews({ limit: 50 });
  const { data: countries = [] } = useCountries();
  
  // Get country data with counts from backend
  const { data: postCountries = [] } = usePostCountries();
  const { data: reviewCountries = [] } = useReviewCountries();
  
  const upvotePost = useUpvotePost();
  const downvotePost = useDownvotePost();
  const removeVote = useRemoveVote();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  // Review voting hooks
  const upvoteReview = useUpvoteCityReview();
  const downvoteReview = useDownvoteCityReview();
  const removeVoteReview = useRemoveCityReviewVote();

  const isLoading = postsLoading || reviewsLoading;
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Convert city reviews to post-like format for unified display
  const cityReviews = cityReviewsData?.data || [];
  
  const trimmedSearch = debouncedSearchTerm.trim().toLowerCase();

  // Filter posts based on debounced search term (title only)
  const filteredPosts = posts.filter(post => {
    if (!trimmedSearch) return true;
    return post.title.toLowerCase().includes(trimmedSearch);
  });

  // Filter city reviews based on search term
  const filteredCityReviews = cityReviews.filter(review => {
    if (!trimmedSearch) return true;
    return review.title?.toLowerCase().includes(trimmedSearch);
  });
  
  const reviewPosts: ReviewPost[] = filteredCityReviews.map(review => ({
    ...review,
    id: `review-${review.id}`,
    title: review.title || `Life in ${review.city.name}: My perspective`,
    content: review.note || `Rating: ${getAverageRating(review)}/5`,
    category: 'REVIEW',
    type: 'review',
    tags: ['review'],
    commentsCount: 0,
    _count: { comments: 0 }
  }));

  // Combine and sort all content
  const allContent: CombinedPost[] = [...filteredPosts, ...reviewPosts];

  // Apply sorting
  const sortedContent = allContent.sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0));
      case 'trending':
        // Simple trending: net votes + comments weighted by recency
        const aNetVotes = (a.upvotes || 0) - (a.downvotes || 0);
        const bNetVotes = (b.upvotes || 0) - (b.downvotes || 0);
        const aScore = (aNetVotes * 2 + (a.commentsCount || 0)) / Math.max(1, Math.floor((new Date().getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const bScore = (bNetVotes * 2 + (b.commentsCount || 0)) / Math.max(1, Math.floor((new Date().getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        return bScore - aScore;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Get displayed content based on current display count
  const displayedContent = sortedContent.slice(0, displayCount);
  const hasMore = sortedContent.length > displayCount;

  const handleVote = (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    // Handle voting for review posts
    if (postId.startsWith('review-')) {
      const reviewId = postId.replace('review-', '');
      const targetReview = cityReviews.find(r => r.id === reviewId);
      if (!targetReview) return;

      if (voteType === 'UPVOTE') {
        if (targetReview.userVote === 'UPVOTE') {
          removeVoteReview.mutate({ cityReviewId: reviewId });
        } else {
          upvoteReview.mutate({ cityReviewId: reviewId });
        }
      } else {
        if (targetReview.userVote === 'DOWNVOTE') {
          removeVoteReview.mutate({ cityReviewId: reviewId });
        } else {
          downvoteReview.mutate({ cityReviewId: reviewId });
        }
      }
      return;
    }
    
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    if (voteType === 'UPVOTE' && targetPost.userVote === 'UPVOTE') {
      removeVote.mutate({ postId });
    } else if (voteType === 'DOWNVOTE' && targetPost.userVote === 'DOWNVOTE') {
      removeVote.mutate({ postId });
    } else if (voteType === 'UPVOTE') {
      upvotePost.mutate({ postId });
    } else {
      downvotePost.mutate({ postId });
    }
  };

  const handleSave = (postId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    if (targetPost.isSaved) {
      unsavePost.mutate({ postId });
    } else {
      savePost.mutate({ postId });
    }
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCountry('all');
    setSelectedTags([]);
    setCountrySearch('');
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Combine country data from posts and reviews with counts
  const combinedCountries = useMemo(() => {
    const countryMap = new Map<string, { name: string; flag: string; count: number }>();
    
    // Add countries from posts
    postCountries.forEach(({ country, count }) => {
      const countryInfo = countries.find(c => c.code === country || c.name === country);
      if (countryInfo) {
        countryMap.set(country, {
          name: countryInfo.name,
          flag: countryInfo.flag,
          count: (countryMap.get(country)?.count || 0) + count
        });
      }
    });
    
    // Add countries from reviews
    reviewCountries.forEach(({ country, count }) => {
      const countryInfo = countries.find(c => c.code === country || c.name === country);
      if (countryInfo) {
        const existing = countryMap.get(country);
        countryMap.set(country, {
          name: countryInfo.name,
          flag: countryInfo.flag,
          count: (existing?.count || 0) + count
        });
      }
    });
    
    return Array.from(countryMap.entries()).map(([code, data]) => ({
      code,
      name: data.name,
      flag: data.flag,
      count: data.count
    })).sort((a, b) => b.count - a.count);
  }, [postCountries, reviewCountries, countries]);

  // Filter countries by search
  const filteredCountries = combinedCountries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Get popular tags from all content
  const popularTags = Object.entries(
    allContent.reduce((acc, post) => {
      if (post.tags) {
        post.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRoleIcon = (role: string) => {
    return role === 'EXPLORER' ? '🧭' : '🏠';
  };

  const getPostTypeColor = (category: string) => {
    return CATEGORY_COLOR_MAP[category?.toUpperCase()] || CATEGORY_COLOR_MAP.DEFAULT;
  };

  if (isLoading && !isSearching && debouncedSearchTerm === '') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-center">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 order-last lg:order-first">
            {/* Search and Filters – moved to sidebar */}
            <div className="mb-4 sm:mb-6 lg:mb-8 hidden">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* Sort Selection */}
                  <Select value={sortBy} onValueChange={(value: 'recent' | 'popular' | 'trending') => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-32 lg:w-36 h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Country Filter */}
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full sm:w-40 lg:w-44 h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 sm:max-h-60">
                      <SelectItem value="all">All Countries</SelectItem>
                      {filteredCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm">{country.flag}</span>
                            <span className="text-xs sm:text-sm">{country.name}</span>
                            <span className="text-xs text-gray-500">({country.count})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Filters
                  </Button>

                  {/* Clear Filters */}
                  {(selectedCountry !== 'all' || selectedTags.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {/* Tags Filter */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {popularTags.slice(0, 8).map(([tag]) => (
                            <Button
                              key={tag}
                              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                if (selectedTags.includes(tag)) {
                                  removeTag(tag);
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                              className="h-6 sm:h-7 px-2 sm:px-3 text-xs"
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Filters Display */}
                {selectedTags.length > 0 && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 sm:ml-2 hover:text-red-600"
                          >
                            <X className="w-2 h-2 sm:w-3 sm:h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm sm:text-base">Loading content...</p>
                  </div>
                </div>
              ) : displayedContent.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      {debouncedSearchTerm
                        ? "Try adjusting your search terms or filters"
                        : "Be the first to share your experience!"}
                    </p>
                    <Link href="/posts/create">
                      <Button className="text-sm sm:text-base px-4 sm:px-6">Create First Post</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                displayedContent.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-all duration-200 border border-gray-100 bg-white">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Voting Section */}
                        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[70px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(post.id, 'UPVOTE')}
                            className={`h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-green-50 ${
                              post.userVote === 'UPVOTE' ? 'text-green-600 bg-green-50' : 'text-gray-500'
                            }`}
                          >
                            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 my-1">
                            {(post.upvotes || 0) - (post.downvotes || 0)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(post.id, 'DOWNVOTE')}
                            className={`h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-50 ${
                              post.userVote === 'DOWNVOTE' ? 'text-red-600 bg-red-50' : 'text-gray-500'
                            }`}
                          >
                            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <Link href={isRegularPost(post) ? `/posts/${post.id}` : `/cities/reviews/${post.id.replace('review-', '')}`}>
                                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
                                  {post.title}
                                </h3>
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                                <Badge variant="outline" className={`text-xs ${getPostTypeColor(post.category)}`}>
                                  {post.category}
                                </Badge>
                                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    {getRoleIcon(post.user.role)}
                                    <span>{post.user.username}</span>
                                  </div>
                                  <span>•</span>
                                                                     <span>{formatDate(post.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Content Preview */}
                          <div className="mb-3 sm:mb-4">
                            {post.type === 'review' ? (
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                                    <span className="text-sm sm:text-base font-medium text-gray-900">
                                      {(post as ReviewPost).city.name}, {(post as ReviewPost).city.country}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm sm:text-base font-medium text-gray-900">
                                      {getAverageRating(post as ReviewPost)?.toFixed(1) || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                {post.content && (
                                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    {post.content}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
                                {post.content}
                              </p>
                            )}
                          </div>

                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {post.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{post.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <Link href={isRegularPost(post) ? `/posts/${post.id}` : `/cities/reviews/${post.id.replace('review-', '')}`}>
                              <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-gray-600">
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                {post.commentsCount || 0} {(post.commentsCount || 0) === 1 ? 'comment' : 'comments'}
                              </Button>
                            </Link>
                            {isRegularPost(post) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSave(post.id)}
                                  className={`h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm ${
                                    post.isSaved ? 'text-orange-600' : 'text-gray-600'
                                  }`}
                                >
                                  <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${post.isSaved ? 'fill-current' : ''}`} />
                                  {post.isSaved ? 'Saved' : 'Save'}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-gray-600">
                                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Share
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Load More Button */}
              {hasMore && !isLoading && (
                <div className="text-center py-4 sm:py-6">
                  <Button onClick={loadMore} variant="outline" className="text-sm sm:text-base px-6 sm:px-8">
                    Load More Posts
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="sticky top-4 sm:top-6 space-y-4 sm:space-y-6">
              {/* Sorting & Filtering */}
              <Card className="border border-gray-100 bg-white">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  {/* Filters Row */}
                  <div className="flex flex-col gap-2 sm:gap-3">
                    {/* Sort Selection */}
                    <Select value={sortBy} onValueChange={(value: 'recent' | 'popular' | 'trending') => setSortBy(value)}>
                      <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Country Filter */}
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 sm:max-h-60">
                        <SelectItem value="all">All Countries</SelectItem>
                        {filteredCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-xs sm:text-sm">{country.flag}</span>
                              <span className="text-xs sm:text-sm">{country.name}</span>
                              <span className="text-xs text-gray-500">({country.count})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Show Filters Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Filters
                    </Button>

                    {/* Clear Filters */}
                    {(selectedCountry !== 'all' || selectedTags.length > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Expandable Filters */}
                  {showFilters && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Tags Filter */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {popularTags.slice(0, 8).map(([tag]) => (
                              <Button
                                key={tag}
                                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  if (selectedTags.includes(tag)) {
                                    removeTag(tag);
                                  } else {
                                    setSelectedTags([...selectedTags, tag]);
                                  }
                                }}
                                className="h-6 sm:h-7 px-2 sm:px-3 text-xs"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Filters Display */}
                  {selectedTags.length > 0 && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 sm:ml-2 hover:text-red-600"
                            >
                              <X className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trending Countries */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    Trending Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {combinedCountries.slice(0, 6).map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country.code);
                          setShowFilters(false);
                        }}
                        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-sm sm:text-base">{country.flag}</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-orange-600">
                            {country.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-xs sm:text-sm text-gray-600">{country.count}</span>
                          <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-green-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Tags */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                    <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                                 <CardContent>
                   <div className="flex flex-wrap gap-1 sm:gap-2">
                     {popularTags.slice(0, 10).map(([tag]) => (
                       <button
                         key={tag}
                         onClick={() => {
                           if (selectedTags.includes(tag)) {
                             removeTag(tag);
                           } else {
                             setSelectedTags([...selectedTags, tag]);
                           }
                         }}
                         className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg transition-colors ${
                           selectedTags.includes(tag)
                             ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                         }`}
                       >
                         #{tag}
                       </button>
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
