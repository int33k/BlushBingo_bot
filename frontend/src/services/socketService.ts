import { io, Socket } from 'socket.io-client';

// Socket.IO instance
let socket: Socket | null = null;

// Socket initialization with improved logging
export const initializeSocket = (): Socket => {
  if (socket) {
    console.log("Socket already initialized, reusing existing connection");
    return socket;
  }

  // Get the socket URL from environment variables or use a fallback
  // For production/Telegram: use same origin, for development: use explicit backend port
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 
    (import.meta.env.PROD ? window.location.origin : `http://${window.location.hostname}:3001`);
  console.log(`Initializing socket connection to: ${socketUrl}`);

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });

  // Add event listeners for connection status
  socket.on('connect', () => {
    console.log('Socket connected successfully');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });

  return socket;
};

// Ultra-compact socket operations
export const getSocket = (): Socket => socket || initializeSocket();

export const disconnectSocket = (): void => {
  if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; }
};

export const emitEvent = (event: string, data?: unknown, callback?: (response: unknown) => void): void => {
  try {
    const socketInstance = getSocket();
    console.log(`Emitting socket event: ${event}`, data);
    
    if (!socketInstance.connected) {
      console.warn(`Socket not connected when trying to emit ${event}. Connected status:`, socketInstance.connected);
    }
    
    if (callback) {
      socketInstance.emit(event, data, (response: unknown) => {
        console.log(`Received response for ${event}:`, response);
        callback(response);
      });
    } else {
      socketInstance.emit(event, data);
    }
  } catch (error) {
    console.error(`Error emitting socket event ${event}:`, error);
    if (callback) {
      callback({ error: 'Socket communication failed' });
    }
  }
};

export const onEvent = (event: string, callback: (data: unknown) => void): (() => void) => {
  const socketInstance = getSocket();
  socketInstance.on(event, callback);
  return () => socketInstance.off(event, callback);
};

export default { initializeSocket, getSocket, disconnectSocket, emitEvent, onEvent };
