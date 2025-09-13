import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Post,
  Comment,
  PostTag,
  PostCategory,
} from '@/lib/types';
import { PostsFilters } from '@/lib/types/api.types';

// Helper function to update all posts queries optimistically
const updateAllPostsQueries = (queryClient: any, postId: string, updateFn: (post: Post) => Post) => {
  const previousData = new Map();

  queryClient.getQueryCache().getAll().forEach((query: any) => {
    if (query.queryKey[0] === 'posts') {
      const queryKey = query.queryKey;
      const oldData = queryClient.getQueryData<Post[]>(queryKey);

      if (oldData) {
        previousData.set(JSON.stringify(queryKey), oldData);
        const newData = oldData.map((post) => post.id === postId ? updateFn(post) : post);
        queryClient.setQueryData(queryKey, newData);
      }
    }
  });

  return previousData;
};

// Helper function to rollback all posts queries
const rollbackAllPostsQueries = (queryClient: any, previousData: Map<string, Post[]>) => {
  previousData.forEach((data, queryKeyStr) => {
    const queryKey = JSON.parse(queryKeyStr);
    queryClient.setQueryData(queryKey, data);
  });
};

export const usePosts = (filters?: PostsFilters) => {
  return useQuery<Post[]>({
    queryKey: ['posts', filters],
    queryFn: async () => {
      const response = await api.get('/posts', {
        params: filters
      });
      
      // Handle the API response structure: {success: true, message: "...", data: {...}}
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Fallback for direct data response
      return response.data;
    },
  });
};

export const usePost = (postId: string) => {
  return useQuery<Post>({
    queryKey: ['posts', postId],
    queryFn: async () => {
      try {
        const response = await api.get(`/posts/${postId}`);
        
        // Handle the API response structure: {success: true, message: "...", data: {...}}
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        
        // Fallback for direct data response
        return response.data;
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown error occurred';
        
        let responseData = 'No response data';
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown } };
          responseData = axiosError.response?.data ? String(axiosError.response.data) : 'No response data';
        }
        
        console.error(`Failed to fetch post ${postId}:`, responseData, errorMessage);
        throw error;
      }
    },
    enabled: !!postId && postId !== 'undefined' && postId.trim() !== '',
    retry: (failureCount, error: Error) => {
      // Don't retry on 500 errors (server issues) or 404 (not found)
      const axiosError = error as Error & { response?: { status?: number } };
      if (axiosError?.response?.status === 500 || axiosError?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, {
    title: string;
    content: string;
    category?: PostCategory;
    tags?: PostTag[];
    cityId?: string;
    images?: File[];
  }>({
    mutationFn: async (postData) => {
      // If there are images, use FormData, otherwise use JSON
      if (postData.images && postData.images.length > 0) {
        const formData = new FormData();
        formData.append('title', postData.title);
        formData.append('content', postData.content);
        if (postData.category) formData.append('category', postData.category);
        if (postData.cityId) formData.append('cityId', postData.cityId);
        if (postData.tags && postData.tags.length > 0) {
          postData.tags.forEach(tag => formData.append('tags', tag));
        }
        postData.images.forEach(image => formData.append('images', image));

        
        const response = await api.post('/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        return response.data;
      } else {
        // No images, use regular JSON
        const requestBody = {
          title: postData.title,
          content: postData.content,
          ...(postData.category && { category: postData.category }),
          ...(postData.tags?.length! > 0 && { tags: postData.tags }),
          ...(postData.cityId && { cityId: postData.cityId })
        };

        
        const response = await api.post('/posts', requestBody);
        
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useUpvotePost = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    { postId: string }
  >({
    mutationFn: async ({ postId }) => {
      const response = await api.post(`/posts/${postId}/upvote`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousData = updateAllPostsQueries(queryClient, postId, (post) => ({
        ...post,
        userVote: post.userVote === 'UPVOTE' ? null : 'UPVOTE' as const,
        upvotes: post.userVote === 'UPVOTE'
          ? Math.max(0, (post.upvotes || 0) - 1)
          : (post.upvotes || 0) + 1,
        downvotes: post.userVote === 'DOWNVOTE'
          ? Math.max(0, (post.downvotes || 0) - 1)
          : post.downvotes || 0
      }));

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        rollbackAllPostsQueries(queryClient, context.previousData);
      }
    },
    // No onSuccess or onSettled - trust the optimistic update
  });
};

export const useDownvotePost = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    { postId: string }
  >({
    mutationFn: async ({ postId }) => {
      const response = await api.post(`/posts/${postId}/downvote`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousData = updateAllPostsQueries(queryClient, postId, (post) => ({
        ...post,
        userVote: post.userVote === 'DOWNVOTE' ? null : 'DOWNVOTE' as const,
        downvotes: post.userVote === 'DOWNVOTE'
          ? Math.max(0, (post.downvotes || 0) - 1)
          : (post.downvotes || 0) + 1,
        upvotes: post.userVote === 'UPVOTE'
          ? Math.max(0, (post.upvotes || 0) - 1)
          : post.upvotes || 0
      }));

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        rollbackAllPostsQueries(queryClient, context.previousData);
      }
    },
    // No onSuccess or onSettled - trust the optimistic update
  });
};

export const useRemoveVote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    { postId: string }
  >({
    mutationFn: async ({ postId }) => {
      const response = await api.delete(`/posts/${postId}/vote`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousData = updateAllPostsQueries(queryClient, postId, (post) => ({
        ...post,
        userVote: null,
        upvotes: post.userVote === 'UPVOTE'
          ? Math.max(0, (post.upvotes || 0) - 1)
          : post.upvotes || 0,
        downvotes: post.userVote === 'DOWNVOTE'
          ? Math.max(0, (post.downvotes || 0) - 1)
          : post.downvotes || 0
      }));

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        rollbackAllPostsQueries(queryClient, context.previousData);
      }
    },
    // No onSuccess or onSettled - trust the optimistic update
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, { postId: string }>({
    mutationFn: async ({ postId }) => {
      const response = await api.delete(`/posts/${postId}`);
      
      if (response.data.success) {
        return response.data;
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Remove the post from all cached queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.removeQueries({ queryKey: ['posts', variables.postId] });
      queryClient.removeQueries({ queryKey: ['comments', variables.postId] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, {
    postId: string;
    title: string;
    content: string;
    category?: PostCategory;
    tags?: PostTag[];
    cityId?: string;
    existingImages: string[]; // images already stored
    newImages?: File[]; // newly added files
  }>({
    mutationFn: async (updateData) => {
      const { postId, newImages = [], existingImages, ...postData } = updateData;

      // 1) Upload new images (if any) and get their URLs
      let allImages: string[] = [...existingImages];

      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((img) => formData.append('images', img));

        const uploadRes = await api.post(`/posts/${postId}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Response may be {success, data:{images:[...]}} or {images:[...]} or plain array
        let uploadedUrls: any = uploadRes.data?.data?.images
          ?? uploadRes.data?.images
          ?? uploadRes.data;
        if (!uploadedUrls) uploadedUrls = [];
        // Ensure we always have an array
        if (!Array.isArray(uploadedUrls)) {
          uploadedUrls = [uploadedUrls as string];
        }

        allImages = [...allImages, ...(uploadedUrls as string[])];
      }

      // 2) Send PUT with full images array & other fields
      const requestBody: any = {
        title: postData.title,
        content: postData.content,
        images: allImages, // FULL list (after deletions/additions)
      };
      if (postData.category) requestBody.category = postData.category;
      if (postData.tags && postData.tags.length) requestBody.tags = postData.tags;
      if (postData.cityId) requestBody.cityId = postData.cityId;

      const response = await api.put(`/posts/${postId}`, requestBody);
      return response.data.success && response.data.data ? response.data.data : response.data;
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['posts', updatedPost.id], updatedPost);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string; data: string }, Error, { postId: string }>({
    mutationFn: async ({ postId }) => {
      const response = await api.post(`/posts/${postId}/save`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Refresh the post caches so isSaved updates
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });
};

export const useUnsavePost = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string; data: string }, Error, { postId: string }>({
    mutationFn: async ({ postId }) => {
      const response = await api.delete(`/posts/${postId}/save`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });
};

export const usePostCountries = () => {
  return useQuery<{ country: string; count: number }[]>({
    queryKey: ['post-countries'],
    queryFn: async () => {
      const response = await api.get('/posts/countries');
      return response.data.success ? response.data.data : response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}; 