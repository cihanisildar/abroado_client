"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { ArrowLeft, Briefcase, Car, DollarSign, FileText, Globe, GraduationCap, Heart, MapPin, Moon, Plus, Shield, Star, TrendingUp, Users, Wifi, X } from 'lucide-react';

// Hooks and Types
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useCities';
import { useCityReviews, useCreateCityReview } from '@/hooks/useCityReviews';
import { useCountries } from '@/hooks/useCountries';
import type { CreateCityReviewRequest } from '@/schemas/cityReview.schemas';

interface RatingCategory {
  key: keyof CreateCityReviewRequest;
  label: string;
  icon: React.ElementType;
  description: string;
}

const ratingCategories: RatingCategory[] = [
  { key: 'jobOpportunities', label: 'Job Opportunities', icon: Briefcase, description: 'Career prospects and employment market' },
  { key: 'costOfLiving', label: 'Cost of Living', icon: DollarSign, description: 'Affordability of daily expenses' },
  { key: 'safety', label: 'Safety', icon: Shield, description: 'Personal security and crime levels' },
  { key: 'transport', label: 'Transportation', icon: Car, description: 'Public transport and mobility' },
  { key: 'community', label: 'Community', icon: Users, description: 'Social life and community feel' },
  { key: 'healthcare', label: 'Healthcare', icon: Heart, description: 'Medical services and facilities' },
  { key: 'education', label: 'Education', icon: GraduationCap, description: 'Schools and learning opportunities' },
  { key: 'nightlife', label: 'Nightlife', icon: Moon, description: 'Entertainment and evening activities' },
  { key: 'weather', label: 'Weather', icon: Globe, description: 'Climate and seasonal conditions' },
  { key: 'internet', label: 'Internet', icon: Wifi, description: 'Connectivity and digital infrastructure' },
];

const TITLE_MAX_LENGTH = 100;
const NOTE_MAX_LENGTH = 500;
const PROS_CONS_MAX_LENGTH = 100;

export default function CreateCityReviewPage() {
  const router = useRouter();
  const { data: countries = [] } = useCountries();
  const createReview = useCreateCityReview();
  const { user } = useAuth();
  const [form, setForm] = useState<CreateCityReviewRequest>({
    cityId: '',
    cityName: '',
    country: '',
    title: '',
    jobOpportunities: 3,
    costOfLiving: 3,
    safety: 3,
    transport: 3,
    community: 3,
    healthcare: 3,
    education: 3,
    nightlife: 3,
    weather: 3,
    internet: 3,
    pros: [],
    cons: [],
    note: '',
    images: [],
    likes: 0,
  });

  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [error, setError] = useState('');

  // Get cities for selected country
  const { 
    data: citiesResponse
  } = useCities(form.country);

  const cities = citiesResponse?.data || [];

  // Fetch reviews for the selected city
  const {
    data: cityReviewsData,
  } = useCityReviews({ cityId: form.cityId });

  // Check if the current user already has a review for this city
  const hasUserReviewed = !!(
    user &&
    form.cityId &&
    Array.isArray(cityReviewsData?.data) &&
    cityReviewsData.data.some((review) => review.userId === user.id)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (value: string) => {
    // Reset city when country changes
    setForm(prev => ({
      ...prev,
      country: value === 'none' ? '' : value,
      cityId: '',
      cityName: ''
    }));
    
    // Reset city when country changes
  };

  const handleCityChange = (value: string) => {
    const selectedCity = cities.find(city => city.id === value);
    setForm(prev => ({
      ...prev,
      cityId: value === 'none' ? '' : value,
      cityName: selectedCity?.name || ''
    }));
  };

  const handleRatingChange = (category: keyof CreateCityReviewRequest, value: number) => {
    setForm({ ...form, [category]: value });
  };

  const handleAddPros = () => {
    if (prosInput.trim()) {
      if (prosInput.length > PROS_CONS_MAX_LENGTH) {
        setError(`Each pro item must be at most ${PROS_CONS_MAX_LENGTH} characters.`);
        return;
      }
      setForm({ ...form, pros: [...form.pros, prosInput.trim()] });
      setProsInput('');
      setError('');
    }
  };

  const handleAddCons = () => {
    if (consInput.trim()) {
      if (consInput.length > PROS_CONS_MAX_LENGTH) {
        setError(`Each con item must be at most ${PROS_CONS_MAX_LENGTH} characters.`);
        return;
      }
      setForm({ ...form, cons: [...form.cons, consInput.trim()] });
      setConsInput('');
      setError('');
    }
  };

  const removePro = (index: number) => {
    setForm({ ...form, pros: form.pros.filter((_, i) => i !== index) });
  };

  const removeCon = (index: number) => {
    setForm({ ...form, cons: form.cons.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Frontend validation for title and note length
    if (form.title.length > TITLE_MAX_LENGTH) {
      setError(`Title must be at most ${TITLE_MAX_LENGTH} characters.`);
      return;
    }
    if ((form.note?.length ?? 0) > NOTE_MAX_LENGTH) {
      setError(`Note must be at most ${NOTE_MAX_LENGTH} characters.`);
      return;
    }

    const loadingToast = toast.loading('Creating review...');

    try {
      await createReview.mutateAsync(form);
      toast.dismiss(loadingToast);
      toast.success('Review created successfully! 🎉');
      setTimeout(() => router.push('/cities'), 1200);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to create review. Please try again.');
      setError('Failed to create review.');
    }
  };

  const calculateAverageRating = () => {
    const ratings = [
      form.jobOpportunities,
      form.costOfLiving,
      form.safety,
      form.transport,
      form.community,
      form.healthcare,
      form.education,
      form.nightlife,
      form.weather,
      form.internet,
    ];
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
            <div>
              <Link href="/cities">
                <Button variant="outline" size="sm" className="mb-3 sm:mb-4 text-xs sm:text-sm">
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Back to Cities
                </Button>
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Create City Review</h1>
              <p className="text-base sm:text-lg text-gray-600">Share your experience and help others discover amazing cities</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Country *
                    </Label>
                    <Select
                      value={form.country || 'none'}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger className="mt-1 h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="none" value="none">Select a country</SelectItem>
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
                    <Label className="text-sm font-medium text-gray-700">
                      City *
                    </Label>
                    <Select
                      value={form.cityId || 'none'}
                      onValueChange={handleCityChange}
                      disabled={!form.country}
                    >
                      <SelectTrigger className="mt-1 h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <SelectValue placeholder={
                          !form.country 
                            ? 'Select a country first' 
                            : cities.length === 0 
                              ? 'No cities found' 
                              : 'Select a city'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="none" value="none">Select a city</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={`city-${city.id}`} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.country && cities.length === 0 && (
                      <p className="mt-2 text-sm text-yellow-600">
                        No cities found for this country. Please try a different country.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Review Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Give your review a compelling title..."
                      maxLength={TITLE_MAX_LENGTH}
                      required
                      className="mt-1 text-sm sm:text-base"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {form.title.length}/{TITLE_MAX_LENGTH} characters
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating Categories */}
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    Rate Your Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {ratingCategories.map((category) => {
                      const IconComponent = category.icon;
                      const rating = form[category.key] as number;
                      
                      return (
                        <div key={category.key} className="space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                            <div>
                              <h3 className="font-medium text-sm sm:text-base text-gray-900">{category.label}</h3>
                              <p className="text-xs sm:text-sm text-gray-500">{category.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingChange(category.key, star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                    star <= rating
                                      ? 'fill-orange-400 text-orange-400'
                                      : 'text-gray-300'
                                  } hover:text-orange-400 transition-colors`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm sm:text-base font-medium text-gray-700">
                              {rating}/5
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Pros and Cons */}
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                    Pros and Cons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Pros */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      What did you love about this city?
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={prosInput}
                        onChange={(e) => setProsInput(e.target.value)}
                        placeholder="Add a positive aspect..."
                        maxLength={PROS_CONS_MAX_LENGTH}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPros();
                          }
                        }}
                        className="flex-1 text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        onClick={handleAddPros}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Add Pro
                      </Button>
                    </div>
                    {form.pros.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                        {form.pros.map((pro, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm"
                          >
                            {pro}
                            <button
                              type="button"
                              onClick={() => removePro(index)}
                              className="ml-1 sm:ml-2"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cons */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      What could be improved?
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={consInput}
                        onChange={(e) => setConsInput(e.target.value)}
                        placeholder="Add an area for improvement..."
                        maxLength={PROS_CONS_MAX_LENGTH}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCons();
                          }
                        }}
                        className="flex-1 text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCons}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Add Con
                      </Button>
                    </div>
                    {form.cons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                        {form.cons.map((con, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 text-xs sm:text-sm"
                          >
                            {con}
                            <button
                              type="button"
                              onClick={() => removeCon(index)}
                              className="ml-1 sm:ml-2"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="Share any additional thoughts, tips, or experiences that might help others..."
                    maxLength={NOTE_MAX_LENGTH}
                    rows={4}
                    className="text-sm sm:text-base"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {(form.note?.length ?? 0)}/{NOTE_MAX_LENGTH} characters
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Review Summary */}
              <Card className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-0 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Review Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-500">
                      {calculateAverageRating()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Overall Rating</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Title:</span>
                      <span className="text-gray-900 font-medium">{form.title || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">City:</span>
                      <span className="text-gray-900 font-medium">{form.cityName || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Country:</span>
                      <span className="text-gray-900 font-medium">{form.country || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Pros:</span>
                      <span className="text-gray-900 font-medium">{form.pros.length}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Cons:</span>
                      <span className="text-gray-900 font-medium">{form.cons.length}</span>
                    </div>
                  </div>

                  {hasUserReviewed && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-yellow-800">
                        ⚠️ You already have a review for this city. Submitting will update your existing review.
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-red-800">{error}</div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!form.cityId || !form.title || createReview.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-sm sm:text-base"
                  >
                    {createReview.isPending ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Review...
                      </>
                    ) : (
                      'Create Review'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 