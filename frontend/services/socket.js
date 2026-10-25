/**
 * Socket.IO client singleton service
 */
import { io } from 'socket.io-client';

let socket = null;

// Determine backend URL from VITE_BACKEND_URL environment variable or fallback to current origin
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');

export function getApiUrl(endpoint) {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!import.meta.env.VITE_BACKEND_URL) {
    return cleanPath;
  }
  return `${BACKEND_URL}${cleanPath}`;
}

export function getSocket() {
  if (!socket) {
    const targetUrl = BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server at:', targetUrl, 'with ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }
  return socket;
}
