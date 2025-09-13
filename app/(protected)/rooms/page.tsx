"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { useAuthAction } from "@/utils/authHelpers";
import { useCountries } from "@/hooks/useCountries";
import {
  useJoinRoom,
  useLeaveRoom,
  useRoomCountries,
  useRooms,
} from "@/hooks/useRooms";
import { User } from "@/lib/types";
import {
  Clock,
  Globe,
  Hash,
  Lock,
  MessageSquare,
  Plus,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import toast from "react-hot-toast";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

function RoomsPageContent() {
  const searchParamsHook = useSearchParams();
  const initialQuery = searchParamsHook.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  const { data: countries = [] } = useCountries();
  const { data: roomCountries = [] } = useRoomCountries();

  const { data: rooms = [], isLoading } = useRooms({
    search: searchTerm || undefined,
    country:
      selectedCountry && selectedCountry !== "all"
        ? selectedCountry
        : undefined,
  });

  const joinRoomMutation = useJoinRoom();
  const leaveRoomMutation = useLeaveRoom();
  useAuth();
  const { requireAuth } = useAuthAction();

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

 
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "new">("recent");

  // Combine country data from rooms with full country info
  const availableCountries = useMemo(() => {
    const countryMap = new Map<
      string,
      { name: string; flag: string; count: number }
    >();

    // Add countries from rooms with counts
    roomCountries.forEach(({ country, count }) => {
      const countryInfo = countries.find(
        (c) => c.code === country || c.name === country
      );
      if (countryInfo) {
        countryMap.set(country, {
          name: countryInfo.name,
          flag: countryInfo.flag,
          count,
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([code, data]) => ({
        code,
        name: data.name,
        flag: data.flag,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [roomCountries, countries]);

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const sortedRooms = (Array.isArray(rooms) ? rooms : []).sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.memberCount - a.memberCount;
      case "new":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "recent":
      default:
        // Use updatedAt if lastActivity is not available
        const aTime = a.lastActivity
          ? new Date(a.lastActivity)
          : new Date(a.updatedAt);
        const bTime = b.lastActivity
          ? new Date(b.lastActivity)
          : new Date(b.updatedAt);
        return bTime.getTime() - aTime.getTime();
    }
  });

  // Join room with authentication check
  const handleJoinRoom = (roomId: string) => {
    requireAuth(async () => {
      const loadingToast = toast.loading("Joining room...");

      try {
        await joinRoomMutation.mutateAsync(roomId);
        toast.dismiss(loadingToast);
        toast.success("Successfully joined the room! 🎉");
      } catch (error: unknown) {
        console.error("Failed to join room:", error);
        toast.dismiss(loadingToast);

        const apiError = error as ApiError;
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Failed to join room";
        toast.error(`Failed to join room: ${errorMessage}`);
      }
    });
  };

  // Leave room with authentication check
  const handleLeaveRoom = (roomId: string) => {
    requireAuth(async () => {
      const loadingToast = toast.loading("Leaving room...");

      try {
        await leaveRoomMutation.mutateAsync(roomId);
        toast.dismiss(loadingToast);
        toast.success("Successfully left the room");
      } catch (error: unknown) {
        console.error("Failed to leave room:", error);
        toast.dismiss(loadingToast);

        const apiError = error as ApiError;
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Failed to leave room";
        toast.error(`Failed to leave room: ${errorMessage}`);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-center">Loading chat rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .select-content::-webkit-scrollbar {
            width: 8px;
          }
          .select-content::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }
          .select-content::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          .select-content::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `,
        }}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header (hidden, replaced by sidebar actions) */}
        <div className="hidden bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm mb-4 sm:mb-6 md:mb-8">
          {/* Header info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg sm:rounded-xl">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Chat Rooms
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Connect with people from your country or region
                </p>
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger className="w-full sm:w-48 lg:w-56 h-8 sm:h-10 border-gray-200 text-xs sm:text-sm">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent className="select-content max-h-48 sm:max-h-60">
                    <SelectItem value="all">All Countries</SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm">
                            {country.flag}
                          </span>
                          <span className="text-xs sm:text-sm">
                            {country.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({country.count})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value: "recent" | "popular" | "new") =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-32 lg:w-36 h-8 sm:h-10 border-gray-200 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="new">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Link href="/rooms/create" className="shrink-0">
                <Button className="w-full sm:w-auto h-8 sm:h-10 px-4 sm:px-6 text-sm sm:text-base">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Create Room
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Rooms Grid */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Loading chat rooms...
                    </p>
                  </div>
                </div>
              ) : sortedRooms.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      No rooms found
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Be the first to create a room!"}
                    </p>
                    <Link href="/rooms/create">
                      <Button className="text-sm sm:text-base px-4 sm:px-6">
                        Create First Room
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                sortedRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-lg transition-all duration-200 border border-gray-100 bg-white"
                  >
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Room Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <Link href={`/rooms/${room.id}`}>
                                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
                                  {room.name}
                                </h3>
                              </Link>

                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {room.country}
                                  </span>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-400">
                                  •
                                </span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {room.memberCount}{" "}
                                    {room.memberCount === 1
                                      ? "member"
                                      : "members"}
                                  </span>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-400">
                                  •
                                </span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {formatDate(
                                      room.lastActivity || room.updatedAt
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              {!room.isPublic && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {room.type || "General"}
                              </Badge>
                            </div>
                          </div>

                          {/* Description */}
                          {room.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                              {room.description}
                            </p>
                          )}

                          {/* Members Preview */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex -space-x-1 sm:-space-x-2">
                                {room.members
                                  ?.slice(0, 3)
                                  .map((member: User) => (
                                    <Avatar
                                      key={member.id}
                                      className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white"
                                    >
                                      <AvatarImage
                                        src={member.avatar || undefined}
                                        alt={member.username}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {member.username
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                {room.memberCount > 3 && (
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-600">
                                      +{room.memberCount - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {room.memberCount === 1
                                  ? "1 member"
                                  : `${room.memberCount} members`}
                              </span>
                            </div>

                            {/* Action Button */}
                            <div className="flex gap-2">
                              {room.isMember ? (
                                <>
                                  <Link href={`/rooms/${room.id}`}>
                                    <Button
                                      size="sm"
                                      className="h-7 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm"
                                    >
                                      View Room
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleLeaveRoom(room.id)}
                                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm space-x-2 bg-red-500 hover:bg-red-600 text-white hover:text-white"
                                  >
                                    <span className="hidden sm:block">
                                      Leave
                                    </span>
                                    <UserMinus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleJoinRoom(room.id)}
                                  className="h-7 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm"
                                >
                                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Join
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-6 space-y-4 sm:space-y-6">
              {/* Filters & Actions */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Sort By
                    </label>
                    <Select
                      value={sortBy}
                      onValueChange={(value: "recent" | "popular" | "new") =>
                        setSortBy(value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="new">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Country
                    </label>
                    <Select
                      value={selectedCountry}
                      onValueChange={setSelectedCountry}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">All Countries</SelectItem>
                        {availableCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Link href="/rooms/create">
                    <Button className="w-full mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      Create Room
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Room Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Total Rooms
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {rooms.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Active Members
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {rooms.reduce((sum, room) => sum + room.memberCount, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Countries
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {availableCountries.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Room Categories */}
              <Card className="border border-gray-100 bg-white">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
                    <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {["General", "Tech", "Study", "Travel", "Food", "Work"].map(
                      (category) => (
                        <button
                          key={category}
                          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md sm:rounded-lg transition-colors"
                        >
                          {category}
                        </button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-center">Loading chat rooms...</p>
        </div>
      </div>
    }>
      <RoomsPageContent />
    </Suspense>
  );
}
