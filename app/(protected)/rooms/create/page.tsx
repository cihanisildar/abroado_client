'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCities } from '@/hooks/useCities';
import { useCountries } from '@/hooks/useCountries';
import { useCreateRoom } from '@/hooks/useRooms';
import { ArrowLeft, Globe, Hash, Lock, MessageSquare, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

const ROOM_TYPE_OPTIONS = [
  { 
    value: 'GENERAL', 
    label: '💬 General Chat', 
    description: 'Open discussions about any topic',
    icon: '💬'
  },
  { 
    value: 'COUNTRY', 
    label: '🌍 Country Specific', 
    description: 'Connect with people from specific countries',
    icon: '🌍'
  },
  { 
    value: 'STUDY', 
    label: '📚 Study & Education', 
    description: 'Academic discussions and study groups',
    icon: '📚'
  },
  { 
    value: 'INTERVIEW', 
    label: '💼 Job Interview Help', 
    description: 'Practice interviews and career advice',
    icon: '💼'
  },
  { 
    value: 'LANGUAGE', 
    label: '🗣️ Language Exchange', 
    description: 'Practice languages with native speakers',
    icon: '🗣️'
  },
];

type RoomType = 'GENERAL' | 'COUNTRY' | 'STUDY' | 'INTERVIEW' | 'LANGUAGE';

export default function CreateRoomPage() {
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    countryName: '',
    cityId: '',
    type: '' as RoomType | '',
    tags: '',
    isPublic: true
  });

  const [citySearch, setCitySearch] = useState('');

  const { data: countries = [] } = useCountries();
  const { data: citiesResponse = { data: [] }, isLoading: citiesLoading } = useCities(
    newRoom.countryName,
    { search: citySearch }
  );
  const cities = citiesResponse.data;

  const createRoomMutation = useCreateRoom();
  const router = useRouter();

  const handleCountryChange = (value: string) => {
    setNewRoom(prev => ({
      ...prev,
      countryName: value === 'none' ? '' : value,
      cityId: ''
    }));
    setCitySearch('');
  };

  const handleCreateRoom = async () => {
    const loadingToast = toast.loading('Creating room...');
    
    try {
      if (!newRoom.name || !newRoom.description || !newRoom.type) {
        throw new Error('Name, description, and type are required');
      }

      const result = await createRoomMutation.mutateAsync({
        name: newRoom.name,
        description: newRoom.description,
        type: newRoom.type,
        country: newRoom.countryName !== 'none' ? countries.find(c => c.name === newRoom.countryName)?.name : undefined,
        cityId: newRoom.cityId || undefined,
        tags: newRoom.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPublic: newRoom.isPublic
      });
      
      setNewRoom({
        name: '',
        description: '',
        countryName: '',
        cityId: '',
        type: '',
        tags: '',
        isPublic: true
      });
      
      toast.dismiss(loadingToast);
      toast.success(`Room "${result.name}" created successfully! 🎉`);
      router.push(`/rooms/${result.id}`);
    } catch (error: Error | unknown) {
      console.error('Failed to create room:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create room';
      toast.error(`Failed to create room: ${errorMessage}`);
    }
  };

  const tagList = newRoom.tags.split(',').map(tag => tag.trim()).filter(Boolean);

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tagList.filter(tag => tag !== tagToRemove).join(', ');
    setNewRoom(prev => ({ ...prev, tags: updatedTags }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/rooms">
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rooms
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Room</h1>
            <p className="text-lg text-gray-600">Create a space for people to connect and chat about topics you care about</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 rounded-2xl shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-gray-800">
                  <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                  Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="room-name" className="text-sm font-medium text-gray-700">
                    Room Name *
                  </Label>
                  <Input
                    id="room-name"
                    placeholder="e.g., Berlin Tech Workers"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="mt-1 h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="room-description" className="text-sm font-medium text-gray-700">
                    Description *
                  </Label>
                  <Textarea
                    id="room-description"
                    placeholder="What's this room about?"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    rows={4}
                    className="mt-1 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="room-type" className="text-sm font-medium text-gray-700">
                    Room Type *
                  </Label>
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ROOM_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewRoom(prev => ({ ...prev, type: option.value as RoomType }))}
                        className={`p-4 text-left rounded-xl border transition-all duration-200 ${
                          newRoom.type === option.value
                            ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-300'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <div className="font-medium text-sm text-gray-900">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="room-country">Country (Optional)</Label>
                  <Select
                    value={newRoom.countryName || 'none'}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="mt-1 h-12 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="none" value="none">No specific country</SelectItem>
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
                  <Label htmlFor="room-city" className="text-sm font-medium text-gray-700">
                    City (Optional)
                    {newRoom.countryName && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({citiesLoading ? 'Loading cities...' : `${cities.length} cities available`})
                      </span>
                    )}
                  </Label>
                  <Select
                    value={newRoom.cityId || 'none'}
                    onValueChange={(value) => {
                      setNewRoom(prev => ({
                        ...prev,
                        cityId: value === 'none' ? '' : value
                      }));
                    }}
                    disabled={!newRoom.countryName || citiesLoading}
                  >
                    <SelectTrigger className="mt-1 h-12 border-gray-200 rounded-xl">
                      <SelectValue placeholder={
                        !newRoom.countryName 
                          ? 'Select a country first' 
                          : citiesLoading 
                            ? 'Loading cities...' 
                            : cities.length === 0 
                              ? 'No cities found' 
                              : 'Select a city'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="no-city" value="none">No specific city</SelectItem>
                      {Array.isArray(cities) && cities.length > 0 ? (
                        cities.map((city) => (
                          <SelectItem key={`city-${city.id}`} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="no-cities-available" value="none" disabled>No cities available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="room-tags" className="text-sm font-medium text-gray-700">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id="room-tags"
                    placeholder="e.g., tech, jobs, networking"
                    value={newRoom.tags}
                    onChange={(e) => setNewRoom({ ...newRoom, tags: e.target.value })}
                    className="mt-1 h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  />
                  {tagList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tagList.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="public-room"
                    checked={newRoom.isPublic}
                    onChange={(e) => setNewRoom({ ...newRoom, isPublic: e.target.checked })}
                    className="rounded w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <Label htmlFor="public-room" className="flex items-center space-x-2 cursor-pointer">
                    {newRoom.isPublic ? (
                      <>
                        <Globe className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">Public Room - Anyone can join</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">Private Room - Invite only</span>
                      </>
                    )}
                  </Label>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!newRoom.name || !newRoom.description || !newRoom.type || createRoomMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg h-12 rounded-xl transition-all duration-200 hover:shadow-xl"
                  >
                    {createRoomMutation.isPending ? 'Creating...' : '✨ Create Room'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/rooms')}
                    className="flex-1 h-12 text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Tips Card */}
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <span className="mr-2">💡</span>
                    Room Creation Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 text-sm">
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <h4 className="font-medium text-orange-800 mb-1">🎯 Clear Purpose</h4>
                      <p className="text-orange-600">Make the room&apos;s purpose obvious in the name and description</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-1">🏷️ Use Tags</h4>
                      <p className="text-blue-600">Add relevant tags to help people discover your room</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <h4 className="font-medium text-green-800 mb-1">🌍 Location Matters</h4>
                      <p className="text-green-600">Add country/city for location-specific discussions</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <h4 className="font-medium text-purple-800 mb-1">🚀 Stay Active</h4>
                      <p className="text-purple-600">Keep the conversation going to build a community</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Room Types Guide */}
              <Card className="bg-white rounded-2xl shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <span className="mr-2">🏠</span>
                    Room Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm">
                    {ROOM_TYPE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                        <span className="text-lg">{option.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{option.label.replace('💬 ', '').replace('🌍 ', '').replace('📚 ', '').replace('💼 ', '').replace('🗣️ ', '')}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              {(newRoom.name || newRoom.description) && (
                <Card className="bg-white rounded-2xl shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-800 flex items-center">
                      <span className="mr-2">👀</span>
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        {newRoom.isPublic ? (
                          <Globe className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                        {newRoom.name && (
                          <h3 className="font-semibold text-gray-900">{newRoom.name}</h3>
                        )}
                      </div>
                      {newRoom.description && (
                        <p className="text-sm text-gray-600">
                          {newRoom.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {newRoom.type && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                            {ROOM_TYPE_OPTIONS.find(opt => opt.value === newRoom.type)?.icon} {newRoom.type}
                          </span>
                        )}
                        {newRoom.countryName && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                            📍 {newRoom.countryName}
                          </span>
                        )}
                        {tagList.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>0 members</span>
                        </div>
                        <span>•</span>
                        <span>Just created</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 