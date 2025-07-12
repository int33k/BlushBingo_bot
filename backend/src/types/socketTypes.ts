/**
 * Socket-related type definitions - Using shared types to eliminate duplication
 */

import { Socket, Server } from 'socket.io';
import { IGame } from './gameTypes';
import { 
  GameCreateEventData,
  GameJoinEventData,
  PlayerReadyEventData,
  GameMoveEventData,
  MarkLineEventData,
  ClaimBingoEventData,
  RequestRematchEventData,
  GameDisconnectEventData,
  AuthEventData,
  ReconnectEventData
} from '../../../shared/types/socket';

// Re-export shared socket types
export {
  GameCreateEventData,
  GameJoinEventData,
  PlayerReadyEventData,
  GameMoveEventData,
  MarkLineEventData,
  ClaimBingoEventData,
  RequestRematchEventData,
  GameDisconnectEventData,
  AuthEventData,
  ReconnectEventData
};

// Backend-specific socket types
export interface ServerShutdownEventData { 
  message: string; 
  reconnectAfter?: number; 
}

// Socket handler and response types with generic optimization
export type SocketEventHandler<T = any> = (socket: Socket, io: Server, data: T, callback?: (response: any) => void) => Promise<void>;
export interface SocketEventResponse { 
  success: boolean; 
  game?: IGame; 
  error?: string; 
  message?: string; 
  [key: string]: any; 
}
export interface ReconnectResponse extends SocketEventResponse { 
  playerId?: string; 
}
export interface ErrorResponse { 
  message: string; 
  code?: string; 
  details?: Record<string, any>; 
}
