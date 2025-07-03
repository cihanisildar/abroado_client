import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

// Socket.io server URL
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

console.log('[Socket] Creating socket instance for URL:', SOCKET_URL);

// Create the socket instance BUT do **not** connect immediately.
// We will explicitly connect after we have a token available on the client.
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
  // let the browser include its cookies (access & refresh tokens) in the
  // initial HTTP handshake – they are HttpOnly so we cannot read them in JS
  withCredentials: true,
});

/**
 * Establishes the websocket connection once the user is authenticated.
 * We no longer read the access token cookie in JS because it is HttpOnly.
 * The browser will automatically attach it to the handshake request, and
 * the backend will grab it from `socket.handshake.headers.cookie`.
 */
export const connectSocket = () => {
  if (socket.connected) return; // already up

  console.log('[Socket] Connecting to server (token supplied via HttpOnly cookie)…');
  socket.connect();
};

// Socket event handlers
socket.on('connect', () => {
  // No need to show toast for successful connection to avoid spamming
  console.log('[Socket] Connected! Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  // Show toast for disconnection as it's important for user awareness
  toast.error('Lost connection to server. Reconnecting...');
  console.log('[Socket] Disconnected!');
});

socket.on('connect_error', (err) => {
  // Show toast for connection errors
  if (err.message.includes('Authentication token required')) {
    toast.error('Session expired. Please refresh the page.');
  } else {
    toast.error('Connection error. Retrying...');
  }
  // Removed console.error to avoid console error output for socket issues
  // Authentication failure will still happen if cookie is missing/expired.
  // Let the caller decide whether to refresh tokens – just log here.
}); 