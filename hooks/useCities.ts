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

        // Debug: Request details
        console.group('🌆 Cities API Request');
        console.log('URL:', '/cities' + (params.country ? `?country=${encodeURIComponent(params.country)}` : ''));
        console.log('Parameters:', params);
        console.groupEnd();

        const response = await api.get<CitiesResponse>('/cities', { params });

        // Debug: Response details
        console.group('🌆 Cities API Response');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
        if (!response.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid response format from cities API');
        }

        console.log('Cities Count:', response.data.data.length);
        
        if (response.data.data.length > 0) {
          console.log('First City:', response.data.data[0]);
          console.log('Last City:', response.data.data[response.data.data.length - 1]);
        } else {
          console.log('⚠️ No cities found with parameters:', params);
        }
        console.groupEnd();

        return {
          data: response.data.data
        };
      } catch (error: any) {
        // Debug: Error details
        console.group('❌ Cities API Error');
        console.error('Error:', error);
        console.error('Message:', error?.message);
        if (error?.response) {
          console.error('Response Data:', error.response.data);
          console.error('Response Status:', error.response.status);
        }
        console.groupEnd();
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