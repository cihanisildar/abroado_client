import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { City, CityReview } from '@/lib/types';

interface CitiesResponse {
  success: boolean;
  message: string;
  data: City[];
}

// Map of special country name cases
const COUNTRY_NAME_MAP: Record<string, string> = {
  TR: 'Türkiye' // Use the correct Turkish name
};

export const useCities = (
  countryName?: string,
  options?: {
    search?: string;
  }
) => {
  const { search } = options || {};

  return useQuery<{data: City[]}>({
    queryKey: ['cities', countryName, search],
    queryFn: async () => {
      try {
        // Build request parameters
        const params: Record<string, string> = {};

        if (countryName) {
          params.country = countryName;
        }
        if (search) {
          params.search = search;
        }


        const response = await api.get<CitiesResponse>('/cities', { params });

        if (!response.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid response format from cities API');
        }

        return {
          data: response.data.data
        };
      } catch (error: any) {
        throw error;
      }
    },
    enabled: Boolean(countryName) || Boolean(search),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useCreateCityReview = () => {
  throw new Error('City reviews are not supported by the API');
};

export const useRecentCityReviews = () => {
  throw new Error('City reviews are not supported by the API');
}; 