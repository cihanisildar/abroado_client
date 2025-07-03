"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Icons
import {
  MapPin,
  Star,
  Plus,
  X,
  FileText,
  Globe,
  Users,
  Shield,
  Car,
  Heart,
  GraduationCap,
  Moon,
  Wifi,
  Briefcase,
  ArrowLeft,
  DollarSign,
} from "lucide-react";

// Hooks and Types
import { useSingleCityReview, useUpdateCityReview } from "@/hooks/useCityReviews";
import type { UpdateCityReviewRequest } from "@/schemas/cityReview.schemas";
import type { ErrorResponse } from "@/lib/types";

interface ApiErrorResponse {
  response?: {
    data?: ErrorResponse;
  };
  message?: string;
}

interface RatingCategory {
  key: keyof UpdateCityReviewRequest;
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

export default function EditCityReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: reviewResponse, isLoading } = useSingleCityReview(params.id as string);
  const review = reviewResponse?.data;
  const updateReview = useUpdateCityReview();

  const [form, setForm] = useState<UpdateCityReviewRequest>({
    reviewId: params.id as string,
    cityId: '',
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
    language: 'en',
  });

  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (review) {
      setForm(prev => ({
        ...prev,
        cityId: review.cityId,
        title: review.title || '',
        jobOpportunities: review.jobOpportunities || 3,
        costOfLiving: review.costOfLiving || 3,
        safety: review.safety || 3,
        transport: review.transport || 3,
        community: review.community || 3,
        healthcare: review.healthcare || 3,
        education: review.education || 3,
        nightlife: review.nightlife || 3,
        weather: review.weather || 3,
        internet: review.internet || 3,
        pros: review.pros || [],
        cons: review.cons || [],
        note: review.note || '',
        images: review.images || [],
        likes: review.likes || 0,
        language: review.language || 'en',
      }));
    }
  }, [review]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRatingChange = (category: keyof UpdateCityReviewRequest, value: number) => {
    setForm({ ...form, [category]: value });
  };

  const handleAddPros = () => {
    if (prosInput.trim()) {
      setForm({ ...form, pros: [...form.pros, prosInput.trim()] });
      setProsInput('');
    }
  };

  const handleAddCons = () => {
    if (consInput.trim()) {
      setForm({ ...form, cons: [...form.cons, consInput.trim()] });
      setConsInput('');
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
    setSuccess('');
    try {
      await updateReview.mutateAsync(form);
      setSuccess('Review updated successfully!');
      setTimeout(() => router.push(`/cities/${params.id}`), 1200);
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to update review.');
    }
  };

  if (isLoading || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <span className="mt-4 text-lg text-gray-600">Loading review...</span>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Review not found
            </h3>
            <p className="text-gray-600 mb-8">
              The review you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/cities">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Back to Cities
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href={`/cities/${params.id}`}>
                <Button variant="outline" size="sm" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Review
                </Button>
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit City Review</h1>
              <p className="text-lg text-gray-600">Update your experience in {review.city?.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Review Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Amazing city with great culture and opportunities"
                      value={form.title}
                      onChange={handleChange}
                      className="mt-1 h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                      Detailed Review
                    </Label>
                    <Textarea
                      id="note"
                      name="note"
                      placeholder="Share your detailed experience about this city..."
                      value={form.note}
                      onChange={handleChange}
                      className="mt-1 min-h-[120px] border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-orange-500" />
                    Rate Your Experience
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Rate each aspect from 1 (poor) to 5 (excellent)</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ratingCategories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <div key={category.key} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4 text-gray-500" />
                            <Label className="text-sm font-medium text-gray-700">
                              {category.label}
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500">{category.description}</p>
                          <div className="flex items-center space-x-3">
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={form[category.key as keyof UpdateCityReviewRequest] as number}
                              onChange={(e) => handleRatingChange(category.key as keyof UpdateCityReviewRequest, parseInt(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #f97316 0%, #f97316 ${((form[category.key as keyof UpdateCityReviewRequest] as number) - 1) * 25}%, #e5e7eb ${((form[category.key as keyof UpdateCityReviewRequest] as number) - 1) * 25}%, #e5e7eb 100%)`
                              }}
                            />
                            <div className="flex items-center justify-center w-12 h-8 bg-orange-100 text-orange-700 rounded text-sm font-semibold">
                              {form[category.key as keyof UpdateCityReviewRequest] as number}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Pros and Cons */}
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-orange-500" />
                    Pros & Cons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pros */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      What you loved about this city
                    </Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add a positive aspect..."
                        value={prosInput}
                        onChange={e => setProsInput(e.target.value)}
                        className="h-10 border-gray-200 focus:border-green-300 focus:ring-green-200"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPros())}
                      />
                      <Button type="button" onClick={handleAddPros} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.pros.map((pro, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1">
                          {pro}
                          <button
                            type="button"
                            onClick={() => removePro(idx)}
                            className="ml-2 hover:text-green-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Cons */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      What could be improved
                    </Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add something that needs improvement..."
                        value={consInput}
                        onChange={e => setConsInput(e.target.value)}
                        className="h-10 border-gray-200 focus:border-red-300 focus:ring-red-200"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCons())}
                      />
                      <Button type="button" onClick={handleAddCons} size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.cons.map((con, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1">
                          {con}
                          <button
                            type="button"
                            onClick={() => removeCon(idx)}
                            className="ml-2 hover:text-red-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Preview */}
                <Card className="bg-white rounded-2xl shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Review Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-semibold">{review.city?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Country</p>
                      <p className="font-semibold">{review.city?.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Title</p>
                      <p className="font-semibold text-sm">{review.title || 'No title yet'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Overall Rating</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(Number(calculateAverageRating()))
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {calculateAverageRating()}/5
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-12 shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl" 
                  disabled={updateReview.isPending || !form.title}
                >
                  {updateReview.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Updating Review...
                    </div>
                  ) : (
                    'Update Review'
                  )}
                </Button>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm shadow-sm">
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
} 