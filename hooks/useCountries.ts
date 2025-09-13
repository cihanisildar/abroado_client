import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Country {
  name: string;
  code: string;
  flag: string;
}

interface CountriesResponse {
  success: boolean;
  message: string;
  data: Country[];
}

export const useCountries = () => {
  return useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await api.get<CountriesResponse>('/countries');

      // Check for duplicate codes
      const countries = response.data.data;
      const codeCount = countries.reduce((acc, country) => {
        acc[country.code] = (acc[country.code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const duplicates = Object.entries(codeCount)
        .filter(([_, count]) => count > 1)
        .map(([code]) => ({
          code,
          countries: countries.filter(c => c.code === code).map(c => c.name)
        }));

      if (duplicates.length > 0) {
        console.warn('⚠️ Duplicate country codes found:', duplicates);
      }

      return countries;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
  });
}; 