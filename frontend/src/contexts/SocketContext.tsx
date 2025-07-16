import React, { createContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket, emitEvent, onEvent } from '../services/socketService';
import { useUser } from '../hooks';
import type { SocketContextType } from '../types';

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [state, setState] = useState({ socket: null as Socket | null, isConnected: false, isConnecting: false, hasConnectedBefore: false });
  const { user } = useUser();

  useEffect(() => {
    // Connect socket immediately, don't wait for user authentication
    if (!state.socket && !state.isConnecting) {
      connect();
    }
    
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send auth when user becomes available
  useEffect(() => {
    if (state.socket && state.isConnected && user && user.identifier) {
      console.log('[DEBUG] Sending auth for user:', user);
      state.socket.emit('auth', { identifier: user.identifier, name: user.name });
    }
  }, [user, state.socket, state.isConnected]);

  const connect = () => {
    if (state.socket || state.isConnecting) return;

    setState(s => ({ ...s, isConnecting: true }));
    const socketInstance = initializeSocket();
    setState(s => ({ ...s, socket: socketInstance }));

    socketInstance.on('connect', () => {
      setState(s => ({ ...s, isConnected: true, isConnecting: false, hasConnectedBefore: true }));
      if (user) socketInstance.emit('auth', { identifier: user.identifier, name: user.name });
    });

    socketInstance.on('disconnect', () => setState(s => ({ ...s, isConnected: false, isConnecting: false })));
    socketInstance.on('connect_error', () => setState(s => ({ ...s, isConnecting: false })));
    socketInstance.on('reconnect_failed', () => setState(s => ({ ...s, isConnecting: false, socket: null })));
  };

  const disconnect = () => {
    if (state.socket) {
      disconnectSocket();
      setState(s => ({ ...s, socket: null, isConnected: false, isConnecting: false, hasConnectedBefore: false }));
    }
  };

  const emit = useCallback((event: string, data?: unknown, callback?: (response: unknown) => void) => {
    emitEvent(event, data, callback);
  }, []);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    return onEvent(event, callback);
  }, []);

  const value: SocketContextType = {
    socket: state.socket,
    isConnected: state.isConnected,
    isReconnecting: !state.isConnected && state.hasConnectedBefore,
    connect,
    disconnect,
    emit,
    on
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};


