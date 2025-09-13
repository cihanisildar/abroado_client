'use client';

/**
 * Search and Filter Controls - Client Component for interactive filtering
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, X, TrendingUp } from 'lucide-react';
import type {PostTag } from '@/lib/types';
import { PostCountry, PostsUIFilters } from '@/lib/types/api.types';
import { Country } from '@/hooks/useCountries';

interface SearchFiltersProps {
  initialFilters: PostsUIFilters;
  postCountries: PostCountry[];
  countries: Country[];
}

const POPULAR_TAGS: PostTag[] = ['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING'];

export function SearchFilters({ 
  initialFilters, 
  postCountries, 
  countries 
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>(
    initialFilters.sortBy || 'recent'
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(
    initialFilters.country || 'all'
  );
  const [selectedTags, setSelectedTags] = useState<PostTag[]>(
    initialFilters.tags || []
  );
  const [showFilters, setShowFilters] = useState(false);

  // Update URL when filters change
  const updateFilters = (updates: Partial<PostsUIFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update sort
    if (updates.sortBy !== undefined) {
      if (updates.sortBy === 'recent') {
        params.delete('sortBy');
      } else {
        params.set('sortBy', updates.sortBy);
      }
    }
    
    // Update country
    if (updates.country !== undefined) {
      if (updates.country === 'all') {
        params.delete('country');
      } else {
        params.set('country', updates.country);
      }
    }
    
    // Update tags
    if (updates.tags !== undefined) {
      if (updates.tags.length === 0) {
        params.delete('tags');
      } else {
        params.set('tags', updates.tags.join(','));
      }
    }
    
    // Reset page when filtering
    params.delete('page');
    
    router.push(`/?${params.toString()}`);
  };

  const handleSortChange = (value: 'recent' | 'popular' | 'trending') => {
    setSortBy(value);
    updateFilters({ sortBy: value });
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    updateFilters({ country: value });
  };

  const toggleTag = (tag: PostTag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateFilters({ tags: newTags });
  };

  const clearFilters = () => {
    setSortBy('recent');
    setSelectedCountry('all');
    setSelectedTags([]);
    updateFilters({ sortBy: 'recent', country: 'all', tags: [] });
  };

  // Combine countries with post counts
  const combinedCountries = countries.map(country => {
    const postCountry = postCountries.find(pc => pc.country === country.code);
    return {
      ...country,
      count: postCountry?.count || 0,
    };
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  return (
    <>
      {/* Sorting & Basic Filters */}
      <Card className="border border-gray-100 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Sort Selection */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>

            {/* Country Filter */}
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Countries</SelectItem>
                {combinedCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{country.flag}</span>
                      <span className="text-sm">{country.name}</span>
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
              className="h-9 px-4 text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>

            {/* Clear Filters */}
            {(selectedCountry !== 'all' || selectedTags.length > 0 || sortBy !== 'recent') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-4 text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="space-y-4">
                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Popular Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className="h-7 px-3 text-xs"
                      >
                        #{tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Filters Display */}
          {selectedTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Countries */}
      {combinedCountries.length > 0 && (
        <Card className="border border-gray-100 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-4 h-4" />
              Trending Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {combinedCountries.slice(0, 6).map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountryChange(country.code)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{country.flag}</span>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                      {country.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{country.count}</span>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}