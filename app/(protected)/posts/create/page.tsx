'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCities } from '@/hooks/useCities';
import { useCountries } from '@/hooks/useCountries';
import { useCreatePost } from '@/hooks/usePosts';
import { PostCategory, PostTag } from '@/lib/types';
import { FileText, Hash, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const TAG_OPTIONS: { value: PostTag; label: string; description: string }[] = [
  { value: 'JOB', label: 'Job', description: 'Career opportunities and work-related topics' },
  { value: 'VISA', label: 'Visa', description: 'Visa applications and immigration processes' },
  { value: 'CULTURE', label: 'Culture', description: 'Cultural experiences and differences' },
  { value: 'REMOTE', label: 'Remote Work', description: 'Remote work opportunities and tips' },
  { value: 'STUDY', label: 'Study', description: 'Education and academic topics' },
  { value: 'HOUSING', label: 'Housing', description: 'Finding accommodation and housing tips' },
  { value: 'LANGUAGE', label: 'Language', description: 'Language learning and practice' },
  { value: 'NETWORKING', label: 'Networking', description: 'Professional networking and connections' },
  { value: 'INTERVIEW', label: 'Interview', description: 'Job interviews and preparation' },
  { value: 'SALARY', label: 'Salary', description: 'Salary negotiations and compensation' },
];

const CATEGORY_OPTIONS: { value: PostCategory; label: string; description: string }[] = [
  { value: 'REVIEW', label: 'Review', description: 'Reviews of places, services, or experiences' },
  { value: 'GUIDE', label: 'Guide', description: 'Step-by-step guides and how-to content' },
  { value: 'EXPERIENCE', label: 'Experience', description: 'Personal experiences and stories' },
  { value: 'QUESTION', label: 'Question', description: 'Questions seeking advice or information' },
  { value: 'DISCUSSION', label: 'Discussion', description: 'Open discussions and debates' },
  { value: 'TIP', label: 'Tip', description: 'Quick tips and useful advice' },
];

export default function CreatePostPage() {
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    countryName: '',
    cityId: '',
    category: '' as PostCategory | '',
    tags: [] as PostTag[],
    images: [] as File[]
  });

  const [citySearch, setCitySearch] = useState('');

  const { data: countries = [] } = useCountries();
  console.log('DEBUG: countries from useCountries:', countries);

  // Get cities for selected country
  const { 
    data: citiesResponse,
    isLoading: citiesLoading 
  } = useCities(newPost.countryName, {
    search: citySearch
  });

  const cities = useMemo(() => citiesResponse?.data || [], [citiesResponse?.data]);

  // Debug country selection state
  useEffect(() => {
    console.log('Country selection changed:', {
      countryName: newPost.countryName,
      availableCountries: countries.map(c => ({ code: c.code, name: c.name }))
    });
  }, [newPost.countryName, countries]);

  // Debug cities state
  useEffect(() => {
    console.log('Cities state:', {
      countryName: newPost.countryName,
      citiesCount: cities.length,
      cities: cities.map(c => ({ id: c.id, name: c.name }))
    });
  }, [newPost.countryName, cities]);

  const handleCountryChange = (value: string) => {
    console.log('Country selection handler:', { value, type: typeof value });
    
    // Reset city when country changes
    setNewPost(prev => ({
      ...prev,
      countryName: value === 'none' ? '' : value,
      cityId: ''
    }));
    
    // Reset city search when country changes
    setCitySearch('');
  };

  const createPostMutation = useCreatePost();
  const router = useRouter();

  const handleCreatePost = async () => {
    const loadingToast = toast.loading('Creating post...');
    
    try {
      console.log('Current form state:', newPost);
      
      if (!newPost.title || !newPost.content || !newPost.category) {
        throw new Error('Title, content, and category are required');
      }

      const postData = {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        ...(newPost.tags.length > 0 && { tags: newPost.tags }),
        ...(newPost.cityId && { cityId: newPost.cityId }),
        ...(newPost.images.length > 0 && { images: newPost.images }),
      };

      console.log('Form state before sending:', newPost);
      console.log('Sending payload:', postData);
      console.log('CityId type and value:', { 
        cityId: newPost.cityId, 
        type: typeof newPost.cityId,
        selectedCity: cities.find(c => c.id === newPost.cityId)
      });
      
      const result = await createPostMutation.mutateAsync(postData);
      
      toast.dismiss(loadingToast);
      toast.success(`Post "${result.title}" created successfully! 🎉`);
      router.push(`/posts/${result.id}`);
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      toast.error(`Failed to create post: ${errorMessage}`);
    }
  };

  const handleTagToggle = (tag: PostTag) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : prev.tags.length >= 5 
          ? prev.tags // Don't add if already at limit
          : [...prev.tags, tag]
    }));
  };

  const removeTag = (tagToRemove: PostTag) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Debug countries before rendering dropdown
  console.log('DEBUG: Rendering countries in dropdown:', countries);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {/* <Link href="/">
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link> */}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Post</h1>
            <p className="text-lg text-gray-600">Share your story, ask questions, or give advice to the community</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 rounded-2xl shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-gray-800">
                  <FileText className="w-5 h-5 mr-2 text-orange-500" />
                  Post Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="post-title" className="text-sm font-medium text-gray-700">
                    Title *
                  </Label>
                  <Input
                    id="post-title"
                    placeholder="e.g., Moving to Berlin - First Week Experiences"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="mt-1 h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="post-content" className="text-sm font-medium text-gray-700">
                    Content *
                  </Label>
                  <Textarea
                    id="post-content"
                    placeholder="Share your story, experiences, tips, or questions..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={12}
                    className="mt-1 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  />
                </div>

                <ImageUpload
                  existingImages={[]}
                  newImages={newPost.images}
                  onExistingImagesChange={() => {}} // No existing images in create mode
                  onNewImagesChange={(files: File[]) => setNewPost({ ...newPost, images: files })}
                  maxImages={5}
                  className="mt-1"
                />

                <div>
                  <Label htmlFor="post-country">Country *</Label>
                  <Select
                    value={newPost.countryName || 'none'}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="mt-1 h-12 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="none" value="none">No specific country</SelectItem>
                      {countries
                        .filter((c) => c.name)
                        .map((country, idx) => (
                          <SelectItem 
                            key={`country-${country.name}-${idx}`}
                            value={country.name}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="post-city" className="text-sm font-medium text-gray-700">
                    City (Optional)
                    {newPost.countryName && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({citiesLoading ? 'Loading cities...' : `${cities.length} cities available`})
                      </span>
                    )}
                  </Label>
                  <Select
                    value={newPost.cityId || 'none'}
                    onValueChange={(value) => {
                      console.group('🏙️ City Selection Changed');
                      console.log('Selected Value:', value);
                      console.log('Selected City:', cities.find(c => c.id === value));
                      console.groupEnd();

                      setNewPost(prev => ({
                        ...prev,
                        cityId: value === 'none' ? '' : value
                      }));
                    }}
                    disabled={!newPost.countryName || citiesLoading}
                  >
                    <SelectTrigger className="mt-1 h-12 border-gray-200">
                      <SelectValue placeholder={
                        !newPost.countryName 
                          ? 'Select a country first' 
                          : citiesLoading 
                            ? 'Loading cities...' 
                            : cities.length === 0 
                              ? 'No cities found' 
                              : 'Select a city'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="no-city" value="none">No specific city</SelectItem>
                      {Array.isArray(cities) && cities.length > 0 ? (
                        cities.map((city) => (
                          <SelectItem key={`city-${city.id}`} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="no-cities-available" value="none" disabled>No cities available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {newPost.countryName && !citiesLoading && cities.length === 0 && (
                    <p className="mt-2 text-sm text-yellow-600">
                      No cities found for this country. You can proceed with just the country selection.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="post-category">Category *</Label>
                  <Select
                    value={newPost.category || 'none'}
                    onValueChange={(value) => {
                      console.group('🏷️ Category Selection Changed');
                      console.log('Selected Value:', value);
                      console.log('Current category before change:', newPost.category);
                      console.groupEnd();

                      const newCategory: PostCategory | '' = value === 'none' ? '' : value as PostCategory;
                      
                      setNewPost(prev => {
                        const updated = {
                          ...prev,
                          category: newCategory
                        };
                        console.log('Updated post state:', updated);
                        return updated;
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1 h-12 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="none" value="none">No specific category</SelectItem>
                      {CATEGORY_OPTIONS.map((categoryOption) => (
                        <SelectItem 
                          key={categoryOption.value}
                          value={categoryOption.value}
                        >
                          {categoryOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="post-tags" className="text-sm font-medium text-gray-700">
                    Tags ({newPost.tags.length}/5)
                  </Label>
                  <div className="mt-1 space-y-3">
                    {/* Selected Tags */}
                    {newPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newPost.tags.map((tag) => {
                          const tagOption = TAG_OPTIONS.find(opt => opt.value === tag);
                          return (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {tagOption?.label || tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Tag limit message */}
                    {newPost.tags.length >= 5 && (
                      <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <strong>Maximum tags reached!</strong> You can select up to 5 tags. Remove a tag to add a different one.
                      </div>
                    )}
                    
                    {/* Available Tags */}
                    {newPost.tags.length < 5 && (
                      <div className="grid grid-cols-2 gap-2">
                        {TAG_OPTIONS.filter(option => !newPost.tags.includes(option.value)).map((tagOption) => (
                          <button
                            key={tagOption.value}
                            type="button"
                            onClick={() => handleTagToggle(tagOption.value)}
                            className="p-3 text-left rounded-xl border transition-colors border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700"
                          >
                            <div className="font-medium text-sm">{tagOption.label}</div>
                            <div className="text-xs text-gray-500">{tagOption.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {newPost.tags.length >= 5 
                      ? 'Maximum of 5 tags reached. Remove a tag to add a different one.'
                      : 'Select relevant tags to help others find your post'
                    }
                  </p>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPost.title || !newPost.content || !newPost.category || !newPost.countryName || createPostMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg h-12 rounded-xl transition-all duration-200 hover:shadow-xl"
                  >
                    {createPostMutation.isPending ? 'Creating...' : '✨ Create Post'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="flex-1 h-12 text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Tips Card */}
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <span className="mr-2">💡</span>
                    Writing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 text-sm">
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <h4 className="font-medium text-orange-800 mb-1">✨ Be specific</h4>
                      <p className="text-orange-600">Include details about your experience, location, and timeframe</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-1">🏷️ Add relevant tags</h4>
                      <p className="text-blue-600">Help others find your post with descriptive tags</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <h4 className="font-medium text-green-800 mb-1">🤝 Be helpful</h4>
                      <p className="text-green-600">Share practical advice and actionable insights</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <h4 className="font-medium text-purple-800 mb-1">💬 Stay respectful</h4>
                      <p className="text-purple-600">Keep discussions constructive and welcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              {(newPost.title || newPost.content) && (
                <Card className="bg-white rounded-2xl shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-800 flex items-center">
                      <span className="mr-2">👀</span>
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {newPost.title && (
                        <h3 className="font-semibold text-gray-900">{newPost.title}</h3>
                      )}
                      {newPost.content && (
                        <p className="text-sm text-gray-600 line-clamp-4">
                          {newPost.content}
                        </p>
                      )}
                      {newPost.images.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">{newPost.images.length} image{newPost.images.length > 1 ? 's' : ''} selected</p>
                          <div className="text-center text-gray-500 text-sm border border-gray-200 rounded-lg p-4">
                            📸 {newPost.images.length} image{newPost.images.length > 1 ? 's' : ''} ready to post
                          </div>
                        </div>
                      )}
                      {(newPost.category || newPost.cityId || newPost.tags.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {newPost.category && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                              🏷️ {CATEGORY_OPTIONS.find(opt => opt.value === newPost.category)?.label || newPost.category}
                            </span>
                          )}
                          {newPost.cityId && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                              📍 {cities.find(city => city.id.toString() === newPost.cityId)?.name || newPost.cityId}
                            </span>
                          )}
                          {newPost.tags.map((tag) => {
                            const tagOption = TAG_OPTIONS.find(opt => opt.value === tag);
                            return (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                #{tagOption?.label || tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 