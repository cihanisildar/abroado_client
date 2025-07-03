'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useCities';
import { usePost, useUpdatePost } from '@/hooks/usePosts';
import { useCountries } from '@/hooks/useCountries';
import { PostTag, PostCategory } from '@/lib/types';
import { ArrowLeft, FileText, X, Hash, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
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

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Add error interface
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const postId = resolvedParams?.id;
  
  const [editedPost, setEditedPost] = useState({
    title: '',
    content: '',
    countryName: '',
    cityId: '',
    category: '' as PostCategory | '',
    tags: [] as PostTag[],
    existingImages: [] as string[],
    newImages: [] as File[]
  });

  // Remove unused country search state
  const [citySearch, setCitySearch] = useState('');

  // Remove unused countriesLoading
  const { data: countries = [] } = useCountries();
  
  // Get cities for selected country
  const { 
    data: citiesResponse,
    isLoading: citiesLoading 
  } = useCities(editedPost.countryName, {
    search: citySearch
  });

  const cities = citiesResponse?.data || [];

  // Fetch the existing post
  const { data: post, isLoading: isLoadingPost, error: postError } = usePost(postId);
  const updatePostMutation = useUpdatePost();
  const { user } = useAuth();
  const router = useRouter();

  // Initialize form with existing post data
  useEffect(() => {
    if (post) {
      setEditedPost({
        title: post.title || '',
        content: post.content || '',
        countryName: post.city?.country || '',
        cityId: post.cityId || '',
        category: post.category || '',
        tags: post.tags || [],
        existingImages: post.images || [],
        newImages: []
      });
    }
  }, [post]);

  const handleCountryChange = (value: string) => {
    // Reset city when country changes
    setEditedPost(prev => ({
      ...prev,
      countryName: value === 'none' ? '' : value,
      cityId: ''
    }));
    
    // Reset city search when country changes
    setCitySearch('');
  };

  const handleUpdatePost = async () => {
    const loadingToast = toast.loading('Updating post...');
    
    try {
      if (!editedPost.title || !editedPost.content || !editedPost.category) {
        throw new Error('Title, content, and category are required');
      }

      const updateData = {
        postId: postId,
        title: editedPost.title,
        content: editedPost.content,
        category: editedPost.category,
        ...(editedPost.tags.length > 0 && { tags: editedPost.tags }),
        ...(editedPost.cityId && { cityId: editedPost.cityId }),
        existingImages: editedPost.existingImages || [],
        ...(editedPost.newImages.length > 0 && { newImages: editedPost.newImages }),
      };

      console.log('Updating post with:', updateData);
      
      const result = await updatePostMutation.mutateAsync(updateData);
      
      toast.dismiss(loadingToast);
      toast.success('Post updated successfully! ✅');
      router.push(`/posts/${result.id}`);
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.dismiss(loadingToast);
      const typedError = error as ApiError;
      const errorMessage = typedError?.response?.data?.message || typedError?.message || 'Failed to update post';
      toast.error(`Failed to update post: ${errorMessage}`);
    }
  };

  const handleTagToggle = (tag: PostTag) => {
    setEditedPost(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : prev.tags.length >= 5 
          ? prev.tags // Don't add if already at limit
          : [...prev.tags, tag]
    }));
  };

  const removeTag = (tagToRemove: PostTag) => {
    setEditedPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Check if user is authorized to edit this post
  const isAuthorized = user && post && (user.id === post.userId || user.id === post.user?.id);

  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h1>
          <p className="text-gray-600 mb-4">The post you&apos;re trying to edit doesn&apos;t exist or has been removed.</p>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to edit this post.</p>
          <Link href={`/posts/${postId}`}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Post
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href={`/posts/${postId}`}>
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Post
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Post</h1>
            <p className="text-lg text-gray-600">Update your post content and details</p>
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
                    value={editedPost.title}
                    onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
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
                    value={editedPost.content}
                    onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
                    rows={12}
                    className="mt-1 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  />
                </div>

                <ImageUpload
                  existingImages={editedPost.existingImages}
                  newImages={editedPost.newImages}
                  onExistingImagesChange={(existingImages: string[]) => 
                    setEditedPost({ ...editedPost, existingImages })
                  }
                  onNewImagesChange={(newImages: File[]) => 
                    setEditedPost({ ...editedPost, newImages })
                  }
                  maxImages={5}
                  className="mt-1"
                />

                <div>
                  <Label htmlFor="post-category">Category *</Label>
                  <Select
                    value={editedPost.category || 'none'}
                    onValueChange={(value) => {
                      const newCategory: PostCategory | '' = value === 'none' ? '' : value as PostCategory;
                      setEditedPost(prev => ({
                        ...prev,
                        category: newCategory
                      }));
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
                    Tags ({editedPost.tags.length}/5)
                  </Label>
                  <div className="mt-1 space-y-3">
                    {/* Selected Tags */}
                    {editedPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editedPost.tags.map((tag) => {
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
                    {editedPost.tags.length >= 5 && (
                      <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <strong>Maximum tags reached!</strong> You can select up to 5 tags. Remove a tag to add a different one.
                      </div>
                    )}
                    
                    {/* Available Tags */}
                    {editedPost.tags.length < 5 && (
                      <div className="grid grid-cols-2 gap-2">
                        {TAG_OPTIONS.filter(option => !editedPost.tags.includes(option.value)).map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleTagToggle(option.value)}
                            className="flex items-center gap-2 p-3 text-left border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                          >
                            <Hash className="w-3 h-3 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <Select
                      value={editedPost.countryName || 'none'}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger className="mt-1 h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific country</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country.code + country.name} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>City</Label>
                    <Select
                      value={editedPost.cityId || 'none'}
                      onValueChange={(value) => {
                        setEditedPost(prev => ({
                          ...prev,
                          cityId: value === 'none' ? '' : value
                        }));
                      }}
                      disabled={!editedPost.countryName || cities.length === 0}
                    >
                      <SelectTrigger className="mt-1 h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder={
                          !editedPost.countryName ? "Select country first" : 
                          citiesLoading ? "Loading cities..." : 
                          cities.length === 0 ? "No cities available" : 
                          "Select city"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific city</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                  <Link href={`/posts/${postId}`}>
                    <Button variant="outline" className="h-12 text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl">Cancel</Button>
                  </Link>
                  <Button
                    onClick={handleUpdatePost}
                    disabled={!editedPost.title || !editedPost.content || !editedPost.category || updatePostMutation.isPending}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg h-12 rounded-xl transition-all duration-200 hover:shadow-xl"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updatePostMutation.isPending ? 'Updating...' : '✨ Update Post'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            {(editedPost.title || editedPost.content) && (
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <span className="mr-2">👀</span>
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {editedPost.title && (
                      <h3 className="font-semibold text-gray-900">{editedPost.title}</h3>
                    )}
                    {editedPost.content && (
                      <p className="text-sm text-gray-600 line-clamp-4">
                        {editedPost.content}
                      </p>
                    )}
                    {(editedPost.category || editedPost.cityId || editedPost.tags.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {editedPost.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                            🏷️ {CATEGORY_OPTIONS.find(opt => opt.value === editedPost.category)?.label || editedPost.category}
                          </span>
                        )}
                        {editedPost.cityId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                            📍 {cities.find(city => city.id.toString() === editedPost.cityId)?.name || editedPost.cityId}
                          </span>
                        )}
                        {editedPost.tags.map((tag) => {
                          const tagOption = TAG_OPTIONS.find(opt => opt.value === tag);
                          return (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                            >
                              # {tagOption?.label || tag}
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
  );
} 