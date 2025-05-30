import { io, Socket } from 'socket.io-client';

// Socket.IO instance
let socket: Socket | null = null;

// Ultra-compact socket initialization
export const initializeSocket = (): Socket => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://0.0.0.0:3001', {
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    reconnection: false,
    timeout: 10000
  });

  return socket;
};

// Ultra-compact socket operations
export const getSocket = (): Socket => socket || initializeSocket();

export const disconnectSocket = (): void => {
  if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; }
};

export const emitEvent = (event: string, data?: unknown, callback?: (response: unknown) => void): void => {
  const socketInstance = getSocket();
  if (callback) {
    socketInstance.emit(event, data, callback);
  } else {
    socketInstance.emit(event, data);
  }
};

export const onEvent = (event: string, callback: (data: unknown) => void): (() => void) => {
  const socketInstance = getSocket();
  socketInstance.on(event, callback);
  return () => socketInstance.off(event, callback);
};

export default { initializeSocket, getSocket, disconnectSocket, emitEvent, onEvent };
