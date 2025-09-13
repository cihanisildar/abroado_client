'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCountries } from '@/hooks/useCountries';
import { useCities } from '@/hooks/useCities';
import GoogleAccountSection from '@/components/ui/GoogleAccountSection';
import { 
  ArrowLeft, 
  MapPin, 
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const { user, isLoading: isUserLoading, updateProfile } = useAuth();
  const { data: countries = [] } = useCountries();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    currentCity: user?.currentCity || '',
    currentCityId: '',
    currentCountry: user?.currentCountry || '',
    targetCountry: user?.targetCountry || '',
    techStack: user?.techStack || '',
    role: user?.role || 'explorer'
  });

  // Add search state for city dropdown
  const [citySearch, setCitySearch] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch cities for the current country
  const { 
    data: citiesResponse,
    isLoading: isCitiesLoading 
  } = useCities(formData.currentCountry, {
    search: citySearch
  });

  const cities = citiesResponse?.data || [];

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        currentCity: user.currentCity || '',
        currentCityId: '',
        currentCountry: user.currentCountry || '',
        targetCountry: user.targetCountry || '',
        techStack: user.techStack || '',
        role: user.role || 'explorer'
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCountryChange = (value: string) => {
    // Reset city when country changes
    setFormData(prev => ({
      ...prev,
      currentCountry: value === 'none' ? '' : value,
      currentCity: '',
      currentCityId: ''
    }));
    
    // Reset city search when country changes
    setCitySearch('');
  };

  const handleCityChange = (cityId: string) => {
    if (cityId === 'none') {
      setFormData(prev => ({
        ...prev,
        currentCity: '',
        currentCityId: ''
      }));
      return;
    }

    const selectedCity = cities.find(city => city.id === cityId);
    if (selectedCity) {
      setFormData(prev => ({
        ...prev,
        currentCity: selectedCity.name,
        currentCityId: selectedCity.id
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      // Build multipart form data
      const form = new FormData();
      form.append('username', formData.username);
      form.append('bio', formData.bio);
      form.append('currentCity', formData.currentCity);
      form.append('currentCityId', formData.currentCityId);
      form.append('currentCountry', formData.currentCountry === 'none' ? '' : formData.currentCountry);
      form.append('targetCountry', formData.targetCountry === 'none' ? '' : formData.targetCountry);
      if (formData.techStack) form.append('techStack', formData.techStack);
      form.append('role', formData.role);
      // avatar file (field name MUST be "avatar")
      const fileInput = (e.currentTarget.elements.namedItem('avatar') as HTMLInputElement) || undefined;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        form.append('avatar', fileInput.files[0]);
      }
      await updateProfile.mutateAsync(form);
      toast.success('Profile updated successfully! ✨');
      router.push('/profile');
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    return role?.toLowerCase() === 'explorer' ? '🧭' : '🏠';
  };

  // Show loading state while fetching user data
  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link href="/profile">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Profile</h1>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Profile Header Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  {user.avatar ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
                      <Image 
                        src={user.avatar} 
                        alt={formData.username || 'User'} 
                        className="w-full h-full object-cover"
                        width={96}
                        height={96}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xl sm:text-2xl font-semibold">
                      {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <Input type="file" name="avatar" accept="image/*" className="text-xs sm:text-sm" />
                </div>

                <div className="flex-1 space-y-3 sm:space-y-4">
                  {/* Username */}
                  <div>
                    <Label htmlFor="username" className="text-sm">Username *</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter your username"
                      className={`text-sm sm:text-base ${errors.username ? 'border-red-500' : ''}`}
                    />
                    {errors.username && (
                      <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.username}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <Label htmlFor="role" className="text-sm">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="explorer">
                          <div className="flex items-center">
                            <span className="mr-2">{getRoleIcon('explorer')}</span>
                            Explorer
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <span className="mr-2">{getRoleIcon('admin')}</span>
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio" className="text-sm">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={500}
                      className={`text-sm sm:text-base ${errors.bio ? 'border-red-500' : ''}`}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.bio && (
                        <p className="text-xs sm:text-sm text-red-600">{errors.bio}</p>
                      )}
                      <div className="text-xs text-gray-500 ml-auto">
                        {formData.bio.length}/500 characters
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Current Country */}
              <div>
                <Label htmlFor="currentCountry" className="text-sm">Current Country (Optional)</Label>
                <Select
                  value={formData.currentCountry || 'none'}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select your current country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No country selected</SelectItem>
                    {countries.map((country, index) => (
                      <SelectItem key={country.code || country.name || index} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current City */}
              <div>
                <Label htmlFor="currentCity" className="text-sm">Current City (Optional)</Label>
                {formData.currentCountry && formData.currentCountry !== 'none' ? (
                  <Select
                    value={formData.currentCityId || 'none'}
                    onValueChange={handleCityChange}
                    disabled={isCitiesLoading}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder={isCitiesLoading ? "Loading cities..." : "Select your current city"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No city selected</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-gray-50">
                    Please select a country first to choose a city
                  </div>
                )}
              </div>

              {/* Target Country */}
              <div>
                <Label htmlFor="targetCountry" className="text-sm">Target Country (Optional)</Label>
                <Select
                  value={formData.targetCountry || 'none'}
                  onValueChange={(value) => handleInputChange('targetCountry', value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select where you want to move" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No target country</SelectItem>
                    {countries.map((country, index) => (
                      <SelectItem key={country.code || country.name || index} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tech Stack */}
              <div>
                <Label htmlFor="techStack" className="text-sm">Tech Stack / Skills (Optional)</Label>
                <Input
                  id="techStack"
                  type="text"
                  value={formData.techStack}
                  onChange={(e) => handleInputChange('techStack', e.target.value)}
                  placeholder="e.g., React, Node.js, Python, etc."
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Google Account Section */}
          <GoogleAccountSection />

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Link href="/profile">
              <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                Cancel
              </Button>
            </Link>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-800">{errors.general}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 