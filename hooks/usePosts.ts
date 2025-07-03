import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Post, Comment, PostTag, PostCategory } from '@/lib/types';

export const usePosts = (filters?: {
  tags?: string[];
  country?: string;
  search?: string;
}) => {
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
      } catch (error: any) {
        console.error(`Failed to fetch post ${postId}:`, error?.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!postId && postId !== 'undefined' && postId.trim() !== '',
    retry: (failureCount, error: any) => {
      // Don't retry on 500 errors (server issues) or 404 (not found)
      if (error?.response?.status === 500 || error?.response?.status === 404) {
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

        console.log('Creating post with FormData (including images)');
        
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

        console.log('Creating post with JSON data:', requestBody);
        
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
    { success: boolean; post: Post }, 
    Error, 
    { postId: string }
  >({
    mutationFn: async ({ postId }) => {
      const response = await api.post(`/posts/${postId}/upvote`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all post-related queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useDownvotePost = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; post: Post }, 
    Error, 
    { postId: string }
  >({
    mutationFn: async ({ postId }) => {
      const response = await api.post(`/posts/${postId}/downvote`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all post-related queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useRemoveVote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; post: Post }, 
    Error, 
    { postId: string }
  >({
    mutationFn: async ({ postId }) => {
      const response = await api.delete(`/posts/${postId}/vote`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all post-related queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
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