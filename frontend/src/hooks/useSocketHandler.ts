import { useCallback, useRef } from 'react';
import { useSocket, useUser } from './index';

export const useSocketHandler = () => {
  const { isConnected, emit } = useSocket();
  const { user } = useUser();
  const isRematchingRef = useRef<boolean>(false);

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  const sendSocketMessage = useCallback((
    event: string, 
    data: Record<string, unknown>, 
    callback?: (ack: unknown) => void
  ) => {
    console.log('[DEBUG] sendSocketMessage called:', { event, data, userAvailable: !!user });
    
    if (!user) {
      console.error('Cannot send socket message: User not authenticated', { user });
      return false;
    }
    
    if (emit) { 
      const messageData = { 
        ...data, 
        identifier: user.identifier,
        name: user.name,
        _messageId: generateId(), 
        _clientTimestamp: Date.now() 
      };
      
      console.log('[DEBUG] Emitting socket event with auth:', { event, messageData });
      
      emit(event, messageData, callback); 
      return true; 
    }
    
    console.error('Cannot send socket message: emit function not available');
    return false;
  }, [emit, user]);

  const setRematchingFlag = useCallback((value: boolean) => {
    isRematchingRef.current = value;
  }, []);

  const getRematchingFlag = useCallback(() => {
    return isRematchingRef.current;
  }, []);

  return {
    isConnected,
    sendSocketMessage,
    setRematchingFlag,
    getRematchingFlag
  };
};
