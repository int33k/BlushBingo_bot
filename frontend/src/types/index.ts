/**
 * Frontend Types - Re-exports from shared module and frontend-specific types
 */

// Import and re-export types from our adapter
import type {
  GameStatus,
  PlayerStatus,
  PlayerRole,
  WinReason,
  NotificationType,
  Player,
  Game,
  Move,
  RematchRequests,
  ApiResponse,
  GameResponse,
  Notification,
  User,
  GameCreateEventData,
  GameJoinEventData,
  PlayerReadyEventData,
  AuthEventData,
  GameDisconnectEventData,
  SocketContextType
} from '../shared-adapter';

// Re-export all types
export type {
  GameStatus,
  PlayerStatus,
  PlayerRole,
  WinReason,
  NotificationType,
  Player,
  Game,
  Move,
  RematchRequests,
  ApiResponse,
  GameResponse,
  Notification,
  User,
  GameCreateEventData,
  GameJoinEventData,
  PlayerReadyEventData,
  AuthEventData,
  GameDisconnectEventData,
  SocketContextType
};

// Frontend-specific context types
export interface UserContextType {
  user: User | null; 
  setUser: (user: User | null) => void; 
  isAuthenticated: boolean;
  login: (identifier: string, name?: string) => void; 
  logout: () => void;
}

export interface GameContextType {
  currentGame: Game | null; 
  isLoading: boolean; 
  error: string | null;
  createGame: () => Promise<GameResponse>; 
  joinGame: (gameId: string) => Promise<GameResponse>;
  setPlayerReady: (card: number[][]) => Promise<GameResponse>; 
  fetchGame: (gameId: string) => Promise<GameResponse>;
  requestRematch: () => Promise<GameResponse>; 
  leaveGame: () => void;
}
