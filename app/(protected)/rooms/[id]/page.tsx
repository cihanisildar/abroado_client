'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Users, Globe, Lock, Send, ArrowLeft, MapPin, Hash, UserPlus, UserMinus, Settings, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRoom, useMessages, useJoinRoom, useLeaveRoom, useSendMessage } from '@/hooks/useRooms';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import * as React from 'react';
import { socket, connectSocket } from '@/lib/socket'; // Adjust path as needed
import { useRouter } from 'next/navigation';
import type { User, Message, Room } from '@/lib/types';

interface RoomChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface OnlineMembersUpdateData {
  roomId: string;
  onlineMembers: User[];
}

interface NewMessageData {
  roomId: string;
  message: Message;
}


// Attach socket to window for testing in browser console
if (typeof window !== 'undefined') {
  // @ts-expect-error - Adding socket to window for debugging
  window.socket = socket;
}

export default function RoomChatPage({ params }: RoomChatPageProps) {
  // Unwrap params if it's a Promise (for Next.js app router compatibility)
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Ensure the socket only connects after we have the access token cookie
  useEffect(() => {
    connectSocket();
  }, []);

  const { data: room, isLoading: roomLoading, refetch: refetchRoom } = useRoom(roomId);
  const isMember = room?.isMember ?? (room?.createdById === user?.id) ?? false;
  const { data: messages = [], isLoading: messagesLoading } = useMessages(roomId, isMember);
  const joinRoomMutation = useJoinRoom();
  const leaveRoomMutation = useLeaveRoom();
  const sendMessageMutation = useSendMessage();
  const router = useRouter();

  // Memoize refetch function to prevent unnecessary effect re-runs
  const memoizedRefetchRoom = useCallback(() => {
    refetchRoom();
  }, [refetchRoom]);

  // Debounced room refetch to prevent too many API calls
  const debouncedRefetchRoom = useCallback(() => {
    const timeoutId = setTimeout(() => {
      memoizedRefetchRoom();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [memoizedRefetchRoom]);

  // Use debounced refetch when room data changes
  useEffect(() => {
    if (room) {
      const cleanup = debouncedRefetchRoom();
      return cleanup;
    }
  }, [room, debouncedRefetchRoom]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToBottomInstant = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Force scroll to bottom when component mounts and when messages load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottomInstant();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Additional effect to ensure scrolling works after messages load
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottomInstant();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Attach online_members_update handler globally on mount
  useEffect(() => {
    const handleOnlineMembersUpdate = (data: OnlineMembersUpdateData) => {
      console.log('[Socket] Received online_members_update event:', data);
      queryClient.setQueryData(['rooms', data.roomId], (oldData: Room | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          onlineMembers: data.onlineMembers || oldData.onlineMembers
        };
      });
    };
    socket.on('online_members_update', handleOnlineMembersUpdate);
    return () => {
      socket.off('online_members_update', handleOnlineMembersUpdate);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!roomId || !socket) return;

    const joinRoomIfMember = () => {
      if (isMember) {
        console.log('[Socket] Emitting join_room:', roomId);
        socket.emit('join_room', { roomId });
      }
    };

    if (socket.connected) {
      joinRoomIfMember();
    } else {
      socket.on('connect', joinRoomIfMember);
    }

    return () => {
      socket.off('connect', joinRoomIfMember);
      if (isMember) {
        console.log('[Socket] Emitting leave_room:', roomId);
        socket.emit('leave_room', { roomId });
      }
    };
  }, [roomId, isMember]);

  useEffect(() => {
    console.log('[Room Data] onlineMembers:', room?.onlineMembers);
  }, [room?.onlineMembers]);

  useEffect(() => {
    const handleConnect = () => {
      console.log('[Socket] Connected! Socket ID:', socket.id);
    };
    const handleDisconnect = () => {
      console.log('[Socket] Disconnected!');
    };
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !room) return;

    const messageContent = message.trim();
    
    try {
      // Persist message via REST API (returns the saved message)
      const response = await sendMessageMutation.mutateAsync({
        roomId: room.id,
        content: messageContent,
      });
      const savedMessage = response.data; // <-- Only the message object

      // Emit through websocket so other clients receive it instantly
      socket.emit('send_message', {
        roomId: room.id,
        content: messageContent,
      });

      // Optimistically append our own message to the list for instant feedback
      queryClient.setQueryData(['messages', room.id], (old: Message[] | undefined) =>
        Array.isArray(old) ? [...old, savedMessage] : old
      );

      setMessage('');

      // Only show success toast for longer messages to avoid spam
      // if (messageContent.length > 10) {
      //   toast.success('Message sent! 💬');
      // }
    } catch (error: unknown) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleJoinRoom = async () => {
    if (!room) return;
    
    const loadingToast = toast.loading('Joining room...');
    
    try {
      await joinRoomMutation.mutateAsync(room.id);
      toast.dismiss(loadingToast);
      toast.success(`Successfully joined "${room.name}"! 🎉`);
    } catch (error: unknown) {
      console.error('Failed to join room:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      toast.error(`Failed to join room: ${errorMessage}`);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    
    const loadingToast = toast.loading('Leaving room...');
    
    try {
      await leaveRoomMutation.mutateAsync(room.id);
      toast.dismiss(loadingToast);
      toast.success(`Left "${room.name}" successfully`);
      router.push('/rooms'); // Redirect after success
    } catch (error: unknown) {
      console.error('Failed to leave room:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
      toast.error(`Failed to leave room: ${errorMessage}`);
    }
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

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!room) return;

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        roomId: room.id,
        isTyping: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          roomId: room.id,
          isTyping: false
        });
      }
    }, 1000); // Stop typing indicator after 1 second of inactivity
  };

  useEffect(() => {
    if (!roomId) return;

    const handleNewMessage = (data: NewMessageData) => {
      if (data.roomId !== roomId) return;
      console.log('[Socket] Received new_message', data);
      // Append new message to cache
      queryClient.setQueryData(['messages', roomId], (old: Message[] | undefined) =>
        Array.isArray(old) ? [...old, data.message] : old
      );
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [roomId, queryClient]);

  if (roomLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading chat room...</p>
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
      <style dangerouslySetInnerHTML={{
        __html: `
          .chat-messages::-webkit-scrollbar {
            width: 8px;
          }
          .chat-messages::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }
          .chat-messages::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          .chat-messages::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `
      }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-8rem)]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col bg-white border-0 rounded-2xl shadow-lg">
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link href="/rooms">
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                    <div className="flex items-center space-x-2">
                      {room.isPublic ? (
                        <Globe className="w-5 h-5 text-green-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h1 className="text-xl font-semibold text-gray-900">{room.name}</h1>
                        <p className="text-sm text-gray-600">{room.memberCount} members</p>
                      </div>
                    </div>
                    {room.country && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <MapPin className="w-3 h-3 mr-1" />
                        {room.country}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMember ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLeaveRoom}
                        disabled={leaveRoomMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Leave Room
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleJoinRoom}
                        disabled={joinRoomMutation.isPending}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Room
                      </Button>
                    )}
                    <DropdownMenu trigger={<Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>}>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Room Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" />
                        View Members
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </div>
                                 {/* Room Type & Tags */}
                 <div className="flex flex-wrap gap-2 mt-3">
                   <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                     {room.type === 'GENERAL' && '💬'} 
                     {room.type === 'COUNTRY' && '🌍'}
                     {room.type === 'STUDY' && '📚'}
                     {room.type === 'INTERVIEW' && '💼'}
                     {room.type === 'LANGUAGE' && '🗣️'}
                     {' '}{room.type}
                   </Badge>
                   {room.tags && room.tags.map((tag) => (
                     <Badge key={tag} variant="secondary" className="text-xs">
                       <Hash className="w-3 h-3 mr-1" />
                       {tag}
                     </Badge>
                   ))}
                 </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                {isMember ? (
                  <div 
                    className="chat-messages flex-1 p-6 overflow-y-scroll" 
                    style={{ 
                      maxHeight: 'calc(100vh - 300px)',
                      minHeight: '400px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f3f4f6',
                      // WebKit scrollbar styles for better cross-browser support
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                          <p className="text-gray-600">Be the first to start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isCurrentUser = msg.user.id === user?.id;
                          const showDate = index === 0 || 
                            new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                          
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="flex justify-center my-4">
                                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                                    {new Date(msg.createdAt).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              )}
                              <div className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={msg.user.avatar} />
                                  <AvatarFallback>
                                    {msg.user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {isCurrentUser ? `You` : msg.user.username}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatMessageTime(msg.createdAt)}
                                    </span>
                                  </div>
                                  <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    isCurrentUser 
                                      ? 'bg-orange-500 text-white' 
                                      : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    <p className="text-sm">{msg.content}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    You need to join this room to view messages.
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              {isMember && (
                <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-orange-50">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <Input
                      value={message}
                      onChange={handleMessageChange}
                      placeholder="Type your message..."
                      className="flex-1 h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl bg-white"
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim()}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg h-12 px-6 rounded-xl transition-all duration-200 hover:shadow-xl"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}

              {!isMember && (
                <div className="border-t border-gray-200 p-4 text-center bg-gray-50">
                  <p className="text-gray-600 mb-3">You need to join this room to send messages</p>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={joinRoomMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Room Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Room Details */}
              <Card className="bg-white border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <span className="mr-2">ℹ️</span>
                    Room Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                      <p className="text-sm text-gray-600">{room.description}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Members</span>
                      <span className="text-sm font-semibold">{room.memberCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm font-semibold">{formatDate(room.createdAt)}</span>
                    </div>
                                         <div className="flex justify-between">
                       <span className="text-sm text-gray-600">
                         {room.lastActivity ? 'Last Active' : 'Created'}
                       </span>
                       <span className="text-sm font-semibold">
                         {formatDate(room.lastActivity || room.createdAt)}
                       </span>
                     </div>
                  </div>
                </CardContent>
              </Card>

              {/* Online Members */}
              <Card className="bg-white border-0 rounded-2xl shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online Now
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {room.onlineMembers && room.onlineMembers.length > 0 ? (
                      // Sort online members so the owner is first
                      [...room.onlineMembers].sort((a, b) => {
                        if (a.id === room.createdById) return -1;
                        if (b.id === room.createdById) return 1;
                        return 0;
                      }).slice(0, 5).map((member: import('@/lib/types').User & { isOnline: boolean }) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700 flex items-center">
                            {member.username}
                            {member.id === room.createdById && (
                              <span className="ml-1 text-xs text-orange-600 font-semibold">(owner)</span>
                            )}
                          </span>
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No online members</p>
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