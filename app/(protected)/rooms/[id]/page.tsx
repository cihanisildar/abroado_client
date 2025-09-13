'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { Users, Globe, Lock, ArrowLeft, MapPin, Hash, UserPlus, MessageCircle, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { useRoom, useJoinRoom } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import { useAuthAction } from '@/utils/authHelpers';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface RoomDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RoomDetailsPage({ params }: RoomDetailsPageProps) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  
  const { user } = useAuth();
  const { requireAuth } = useAuthAction();
  const router = useRouter();

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const isMember = room?.isMember ?? (room?.createdById === user?.id) ?? false;
  const joinRoomMutation = useJoinRoom();


  const handleJoinRoom = () => {
    requireAuth(async () => {
      if (!room) return;
      
      const loadingToast = toast.loading('Joining room...');
      
      try {
        await joinRoomMutation.mutateAsync(room.id);
        toast.dismiss(loadingToast);
        toast.success(`Successfully joined "${room.name}"! 🎉`);
        // Redirect to chat page after joining
        router.push(`/rooms/${room.id}/chat`);
      } catch (error: unknown) {
        console.error('Failed to join room:', error);
        toast.dismiss(loadingToast);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
        toast.error(`Failed to join room: ${errorMessage}`);
      }
    });
  };

  const handleEnterChat = () => {
    router.push(`/rooms/${roomId}/chat`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Room not found</h2>
            <p className="text-gray-600 mb-6">This room doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Link href="/rooms">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rooms
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 rounded-2xl shadow-lg">
              {/* Room Header */}
              <CardHeader className="border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/rooms">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 rounded-xl">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Rooms
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl font-bold">
                    {room.type === 'GENERAL' && '💬'}
                    {room.type === 'COUNTRY' && '🌍'}
                    {room.type === 'STUDY' && '📚'}
                    {room.type === 'INTERVIEW' && '💼'}
                    {room.type === 'LANGUAGE' && '🗣️'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
                      {room.isPublic ? (
                        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{room.memberCount} members</span>
                      </div>
                      {room.country && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium">{room.country}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Created {formatDate(room.createdAt)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">{room.description}</p>
                  </div>
                </div>
                
                {/* Room Type & Tags */}
                <div className="flex flex-wrap gap-2 mt-6">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {room.type}
                  </Badge>
                  {room.tags && room.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-gray-700">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              {/* Action Buttons */}
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {isMember ? (
                    <Button
                      onClick={handleEnterChat}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg h-12 rounded-xl transition-all duration-200 hover:shadow-xl"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Enter Chat
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinRoom}
                      disabled={joinRoomMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg h-12 rounded-xl transition-all duration-200 hover:shadow-xl"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Join Room
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 h-12 px-6 rounded-xl"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Members
                  </Button>
                </div>
                
                {!isMember && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm font-medium">You need to join this room to participate in conversations</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Room Stats */}
              <Card className="bg-white border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <span className="mr-2">📊</span>
                    Room Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Members</span>
                      <span className="text-lg font-bold text-orange-600">{room.memberCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Online Now</span>
                      <span className="text-lg font-bold text-green-600">
                        {room.onlineMembers?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Room Type</span>
                      <Badge variant="outline" className="text-xs">{room.type}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Activity</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(room.lastActivity || room.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Online Members */}
              {room.onlineMembers && room.onlineMembers.length > 0 && (
                <Card className="bg-white border-0 rounded-2xl shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-800 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Online Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {[...room.onlineMembers].sort((a, b) => {
                        if (a.id === room.createdById) return -1;
                        if (b.id === room.createdById) return 1;
                        return 0;
                      }).slice(0, 8).map((member: import('@/lib/types').User & { isOnline: boolean }) => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-xs bg-orange-500 text-white">
                              {member.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{member.username}</span>
                              {member.id === room.createdById && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                                  Owner
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      ))}
                      {room.onlineMembers.length > 8 && (
                        <div className="text-center pt-2">
                          <span className="text-xs text-gray-500">
                            +{room.onlineMembers.length - 8} more online
                          </span>
                        </div>
                      )}
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