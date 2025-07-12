/**
 * Adapter file to smoothly import shared module components
 * Re-exports needed constants and types from the shared module
 */

// Import only what's used in the frontend from the shared module
import { LINE_PATTERNS, BINGO_LETTERS, CARD_SIZE } from '../../shared';

// Import all types from shared module
import type { 
  // Game types
  LinePattern,
  Player, Game, GameStatus, PlayerStatus, PlayerRole, WinReason, 
  NotificationType, Move, RematchRequests, ApiResponse,
  GameResponse, Notification, User,
  // Socket types
  GameCreateEventData, GameJoinEventData, PlayerReadyEventData, AuthEventData,
  GameDisconnectEventData, SocketContextType
} from '../../shared';

// Re-export for use in the frontend
export {
  LINE_PATTERNS,
  BINGO_LETTERS,
  CARD_SIZE
};

// Re-export types
export type {
  LinePattern,
  Player,
  Game,
  GameStatus,
  PlayerStatus,
  PlayerRole,
  WinReason,
  NotificationType,
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
