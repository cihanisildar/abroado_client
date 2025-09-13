'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Socket.io server URL
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !socket) {
      const newSocket = io(SOCKET_URL, {
        autoConnect: true,
        transports: ['websocket'],
        withCredentials: true,
      });

      // Set up global event handlers
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('Socket disconnected:', reason);
        toast.error('Lost connection to server. Reconnecting...');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        if (err.message.includes('Authentication token required')) {
          toast.error('Session expired. Please refresh the page.');
        } else {
          toast.error('Connection error. Retrying...');
        }
      });

      setSocket(newSocket);
    } else if (!isAuthenticated && socket) {
      // Clean up socket when user logs out
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, user, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const emit = useCallback((event: string, data: unknown) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, [socket]);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  }, [socket]);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
