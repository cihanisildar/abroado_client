import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Room, Message } from '@/lib/types';

export const useRooms = (filters?: {
  country?: string;
  tags?: string[];
  search?: string;
}) => {
  return useQuery<Room[]>({
    queryKey: ['rooms', filters],
    queryFn: async () => {
      const response = await api.get('/rooms', {
        params: filters
      });
      return response.data.data || response.data; // Handle both response formats
    },
    staleTime: 3 * 60 * 1000, // Consider fresh for 3 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export const useRoom = (roomId: string) => {
  return useQuery<Room>({
    queryKey: ['rooms', roomId],
    queryFn: async () => {
      const response = await api.get(`/rooms/${roomId}`);
      return response.data.data || response.data; // Handle both response formats
    },
    enabled: !!roomId,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: false, // Disable automatic refetching
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation<Room, Error, {
    name: string;
    description: string;
    cityId?: string;
    country?: string;
    tags: string[];
    isPublic: boolean;
    type?: 'GENERAL' | 'COUNTRY' | 'STUDY' | 'INTERVIEW' | 'LANGUAGE';
  }>({
    mutationFn: async (roomData) => {
      // Transform data to match API expectations
      const apiData = {
        name: roomData.name,
        description: roomData.description,
        type: roomData.type || "GENERAL", // Default to GENERAL if not specified
        ...(roomData.cityId && { cityId: roomData.cityId }),
        ...(roomData.country && { country: roomData.country }),
        tags: roomData.tags,
        isPublic: roomData.isPublic
      };
      
      const response = await api.post('/rooms', apiData);
      return response.data.data || response.data; // Handle both response formats
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useJoinRoom = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (roomId) => {
      await api.post(`/rooms/${roomId}/join`);
    },
    onSuccess: (data, roomId) => {
      // Optimistically update the room list
      queryClient.setQueryData(['rooms'], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map(room => 
          room.id === roomId 
            ? { ...room, isMember: true, memberCount: room.memberCount + 1 } 
            : room
        );
      });
      
      // Update all room list queries with different filters
      queryClient.setQueriesData({ queryKey: ['rooms'] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map(room => 
          room.id === roomId 
            ? { ...room, isMember: true, memberCount: room.memberCount + 1 } 
            : room
        );
      });
      
      // Optimistically update the specific room query
      queryClient.setQueryData(['rooms', roomId], (oldData: Room | undefined) => 
        oldData ? { ...oldData, isMember: true, memberCount: oldData.memberCount + 1 } : oldData
      );

      // Invalidate and refetch all room queries to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['rooms'],
        refetchType: 'all'
      });
    },
  });
};

export const useLeaveRoom = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (roomId) => {
      await api.post(`/rooms/${roomId}/leave`);
    },
    onSuccess: (data, roomId) => {
      // Optimistically update the room list
      queryClient.setQueryData(['rooms'], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map(room => 
          room.id === roomId 
            ? { ...room, isMember: false, memberCount: room.memberCount - 1 } 
            : room
        );
      });
      
      // Update all room list queries with different filters
      queryClient.setQueriesData({ queryKey: ['rooms'] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map(room => 
          room.id === roomId 
            ? { ...room, isMember: false, memberCount: room.memberCount - 1 } 
            : room
        );
      });
      
      // Optimistically update the specific room query
      queryClient.setQueryData(['rooms', roomId], (oldData: Room | undefined) => 
        oldData ? { ...oldData, isMember: false, memberCount: oldData.memberCount - 1 } : oldData
      );
      
      // Invalidate and refetch all room queries to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['rooms'],
        refetchType: 'all'
      });
    },
  });
};

export const useMessages = (roomId: string, enabled: boolean = true) => {
  return useQuery<Message[]>({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      const response = await api.get(`/rooms/${roomId}/messages`);
      return response.data.data || response.data; // Handle both response formats
    },
    enabled: !!roomId && enabled,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if we have cached data
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { roomId: string; content: string }>({
    mutationFn: async ({ roomId, content }) => {
      const response = await api.post(`/rooms/${roomId}/messages`, { content });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.roomId] });
    },
  });
};

export const useRoomCountries = () => {
  return useQuery<{ country: string; count: number }[]>({
    queryKey: ['room-countries'],
    queryFn: async () => {
      const response = await api.get('/rooms/countries');
      return response.data.success ? response.data.data : response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}; 