import { useCallback, useRef } from 'react';
import { useSocket } from './index';

export const useSocketHandler = () => {
  const { isConnected, emit } = useSocket();
  const isRematchingRef = useRef<boolean>(false);

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  const sendSocketMessage = useCallback((
    event: string, 
    data: Record<string, unknown>, 
    callback?: (ack: unknown) => void
  ) => {
    if (emit) { 
      emit(event, { 
        ...data, 
        _messageId: generateId(), 
        _clientTimestamp: Date.now() 
      }, callback); 
      return true; 
    }
    return false;
  }, [emit]);

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
