/**
 * Shared Game Constants - Consolidated from multiple files
 * Eliminates constant duplication across platforms
 */

// Core game constants
export const CARD_SIZE = 5;
export const CARD_RANGE = { min: 1, max: 75 };
export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

// Game rules
export const DEFAULT_REQUIRED_LINES_FOR_BINGO = 5;
export const MAX_PLAYERS = 2;
export const DEFAULT_DISCONNECTION_TIMEOUT = 30; // seconds

// Card generation ranges by letter
export const LETTER_RANGES = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 }
};

// Socket event names
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Authentication events
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  
  // Game lifecycle events
  CREATE_GAME: 'create_game',
  JOIN_GAME: 'join_game',
  PLAYER_READY: 'player_ready',
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
  
  // Gameplay events
  MAKE_MOVE: 'make_move',
  MOVE_MADE: 'move_made',
  BINGO_STOP: 'bingo_stop',
  
  // Connection status events
  PLAYER_CONNECTED: 'player_connected',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  
  // Rematch events
  REQUEST_REMATCH: 'request_rematch',
  REMATCH_REQUESTED: 'rematch_requested',
  REMATCH_ACCEPTED: 'rematch_accepted',
  
  // Error events
  ERROR: 'error',
  GAME_ERROR: 'game_error'
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  CREATE_GAME: '/games',
  JOIN_GAME: '/games/join',
  GET_GAME: '/games/:gameId',
  PLAYER_READY: '/games/:gameId/ready',
  MAKE_MOVE: '/games/:gameId/move',
  BINGO_STOP: '/games/:gameId/bingo',
  REQUEST_REMATCH: '/games/:gameId/rematch'
} as const;

// Game status messages
export const STATUS_MESSAGES = {
  WAITING_FOR_PLAYERS: 'Waiting for players to join...',
  WAITING_FOR_READY: 'Waiting for players to be ready...',
  GAME_IN_PROGRESS: 'Game in progress',
  GAME_COMPLETED: 'Game completed',
  PLAYER_DISCONNECTED: 'Player disconnected',
  RECONNECTION_TIMEOUT: 'Reconnection timeout'
} as const;
