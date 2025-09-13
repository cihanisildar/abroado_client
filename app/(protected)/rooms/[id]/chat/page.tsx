'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Users, Globe, Lock, Send, ArrowLeft, Hash, UserMinus, Settings, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRoom, useMessages, useLeaveRoom, useSendMessage } from '@/hooks/useRooms';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthAction } from '@/utils/authHelpers';
import toast from 'react-hot-toast';
import * as React from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';
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

export default function RoomChatPage({ params }: RoomChatPageProps) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { requireAuth } = useAuthAction();
  const queryClient = useQueryClient();
  const { isConnected, emit, on } = useSocket();

  const { data: room, isLoading: roomLoading, refetch: refetchRoom } = useRoom(roomId);
  const isMember = room?.isMember ?? (room?.createdById === user?.id) ?? false;
  const { data: messages = [], isLoading: messagesLoading } = useMessages(roomId, isMember);
  const leaveRoomMutation = useLeaveRoom();
  const sendMessageMutation = useSendMessage();
  const router = useRouter();

  // Redirect non-members to room details page
  useEffect(() => {
    if (room && !isMember) {
      router.replace(`/rooms/${roomId}`);
    }
  }, [room, isMember, roomId, router]);

  const memoizedRefetchRoom = useCallback(() => {
    refetchRoom();
  }, [refetchRoom]);

  const debouncedRefetchRoom = useCallback(() => {
    const timeoutId = setTimeout(() => {
      memoizedRefetchRoom();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [memoizedRefetchRoom]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottomInstant();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottomInstant();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  useEffect(() => {
    const handleOnlineMembersUpdate = (data: unknown) => {
      const typedData = data as OnlineMembersUpdateData;
      queryClient.setQueryData(['rooms', typedData.roomId], (oldData: Room | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          onlineMembers: typedData.onlineMembers || oldData.onlineMembers
        };
      });
    };
    
    const cleanup = on('online_members_update', handleOnlineMembersUpdate);
    return cleanup;
  }, [queryClient, on]);

  useEffect(() => {
    if (!roomId || !isConnected) return;

    const joinRoomIfMember = () => {
      if (isMember) {
        emit('join_room', { roomId });
      }
    };

    if (isConnected) {
      joinRoomIfMember();
    } else {
      const cleanup = on('connect', joinRoomIfMember);
      return cleanup;
    }

    return () => {
      if (isMember) {
        emit('leave_room', { roomId });
      }
    };
  }, [roomId, isMember, isConnected, emit, on]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !room || isSending) return;

    const messageContent = message.trim();
    setIsSending(true);
    
    // Clear input immediately for better UX
    setMessage('');
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user!.id,
      user: {
        ...user!,
        avatar: user!.avatar || undefined
      },
      roomId: room.id
    };
    
    // Add optimistic message immediately
    queryClient.setQueryData(['messages', room.id], (old: Message[] | undefined) =>
      Array.isArray(old) ? [...old, optimisticMessage] : [optimisticMessage]
    );
    
    try {
      const response = await sendMessageMutation.mutateAsync({
        roomId: room.id,
        content: messageContent,
      });
      const savedMessage = response.data;

      // Replace optimistic message with real one
      queryClient.setQueryData(['messages', room.id], (old: Message[] | undefined) =>
        Array.isArray(old) 
          ? old.map(msg => msg.id === optimisticMessage.id ? savedMessage : msg)
          : [savedMessage]
      );

      // Emit to other clients
      emit('send_message', {
        roomId: room.id,
        content: messageContent,
      });
    } catch (error: unknown) {
      console.error('Failed to send message:', error);
      
      // Remove optimistic message on error
      queryClient.setQueryData(['messages', room.id], (old: Message[] | undefined) =>
        Array.isArray(old) ? old.filter(msg => msg.id !== optimisticMessage.id) : []
      );
      
      // Restore message in input
      setMessage(messageContent);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveRoom = () => {
    requireAuth(async () => {
      if (!room) return;
      
      const loadingToast = toast.loading('Leaving room...');
      
      try {
        await leaveRoomMutation.mutateAsync(room.id);
        toast.dismiss(loadingToast);
        toast.success(`Left "${room.name}" successfully`);
        router.push(`/rooms/${room.id}`); // Redirect to room details page
      } catch (error: unknown) {
        console.error('Failed to leave room:', error);
        toast.dismiss(loadingToast);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
        toast.error(`Failed to leave room: ${errorMessage}`);
      }
    });
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

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      emit('typing', {
        roomId: room.id,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        emit('typing', {
          roomId: room.id,
          isTyping: false
        });
      }
    }, 1000);
  };

  useEffect(() => {
    if (!roomId) return;

    const handleNewMessage = (data: unknown) => {
      const typedData = data as NewMessageData;
      if (typedData.roomId !== roomId) return;
      queryClient.setQueryData(['messages', roomId], (old: Message[] | undefined) =>
        Array.isArray(old) ? [...old, typedData.message] : old
      );
    };

    const cleanup = on('new_message', handleNewMessage);
    return cleanup;
  }, [roomId, queryClient, on]);

  if (roomLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading chat...</p>
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-8 h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex-1 min-h-0">
            <Card className="h-full flex flex-col bg-white border-0 rounded-xl lg:rounded-2xl shadow-lg">
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200 pb-3 lg:pb-4 px-3 lg:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
                    <Link href={`/rooms/${roomId}`}>
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 rounded-xl p-2">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                    <div className="flex items-center space-x-2 min-w-0">
                      {room.isPublic ? (
                        <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{room.name}</h1>
                        <p className="text-xs lg:text-sm text-gray-600">
                          {room.onlineMembers?.length || 0} online • {room.memberCount} members
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLeaveRoom}
                      disabled={leaveRoomMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl text-xs lg:text-sm px-2 lg:px-3"
                    >
                      <UserMinus className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Leave</span>
                    </Button>
                    <DropdownMenu trigger={<Button variant="ghost" size="sm" className="p-2"><MoreVertical className="w-4 h-4" /></Button>}>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" />
                        Members
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Room Type & Tags - Hidden on mobile to save space */}
                <div className="hidden lg:flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {room.type === 'GENERAL' && '💬'} 
                    {room.type === 'COUNTRY' && '🌍'}
                    {room.type === 'STUDY' && '📚'}
                    {room.type === 'INTERVIEW' && '💼'}
                    {room.type === 'LANGUAGE' && '🗣️'}
                    {' '}{room.type}
                  </Badge>
                  {room.tags && room.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden min-h-0">
                <div 
                  className="chat-messages flex-1 p-3 lg:p-6 overflow-y-auto" 
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db #f3f4f6',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <div className="space-y-3 lg:space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 lg:py-12">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-12 h-12 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-sm lg:text-base text-gray-600">Be the first to start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isCurrentUser = msg.user.id === user?.id;
                        const showDate = index === 0 || 
                          new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                        
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center my-3 lg:my-4">
                                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                                  {new Date(msg.createdAt).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            )}
                            <div className={`flex items-start space-x-2 lg:space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              <Avatar className="w-7 h-7 lg:w-8 lg:h-8 flex-shrink-0">
                                <AvatarImage src={msg.user.avatar} />
                                <AvatarFallback className="text-xs">
                                  {msg.user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`flex-1 min-w-0 ${isCurrentUser ? 'text-right' : ''}`}>
                                <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                                  <span className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                                    {isCurrentUser ? `You` : msg.user.username}
                                  </span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {formatMessageTime(msg.createdAt)}
                                  </span>
                                </div>
                                <div className={`inline-block max-w-[280px] sm:max-w-xs lg:max-w-md px-3 lg:px-4 py-2 rounded-lg break-words ${
                                  isCurrentUser 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  <p className="text-sm leading-relaxed">{msg.content}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-3 lg:p-6 bg-gradient-to-r from-gray-50 to-orange-50">
                <form onSubmit={handleSendMessage} className="flex space-x-2 lg:space-x-3">
                  <Input
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Type your message..."
                    disabled={isSending}
                    className="flex-1 h-10 lg:h-12 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl bg-white text-sm lg:text-base"
                    autoComplete="off"
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim() || isSending}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold shadow-lg h-10 lg:h-12 px-4 lg:px-6 rounded-xl transition-all duration-200 hover:shadow-xl disabled:shadow-none"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Online Members Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="bg-white border-0 rounded-2xl shadow-lg h-fit max-h-[calc(100vh-10rem)] flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-gray-800">Online Now</h3>
                  <span className="ml-auto text-sm text-gray-500">
                    {room.onlineMembers?.length || 0}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {room.onlineMembers && room.onlineMembers.length > 0 ? (
                    [...room.onlineMembers].sort((a, b) => {
                      if (a.id === room.createdById) return -1;
                      if (b.id === room.createdById) return 1;
                      return 0;
                    }).map((member: import('@/lib/types').User & { isOnline: boolean }) => (
                      <div key={member.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="text-xs bg-orange-500 text-white">
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 block truncate">
                            {member.username}
                          </span>
                          {member.id === room.createdById && (
                            <span className="text-xs text-orange-600 font-medium">(owner)</span>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No online members</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}