/**
 * Shared Game Types - Consolidated from frontend and backend
 * Eliminates type duplication across platforms
 */

// Core game status types
export type GameStatus = 'waiting' | 'lobby' | 'playing' | 'completed';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'disconnected';
export type PlayerRole = 'challenger' | 'acceptor';
export type WinReason = 'bingo' | 'disconnection' | 'forfeit';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Player interface - unified from both platforms
export interface Player {
  playerId: string;
  name: string;
  username?: string;
  telegramId?: string;
  status: PlayerStatus;
  connected: boolean;
  card?: number[][];
  markedCells?: number[];
  completedLines?: number;
  markedLetters?: string[];
}

// Move interface - consistent across platforms
export interface Move {
  playerId: string;
  position: { row: number; col: number };
  value: number;
  timestamp: Date;
}

// Rematch requests interface
export interface RematchRequests {
  challenger: boolean;
  acceptor: boolean;
}

// Disconnection timer interface
export interface DisconnectionTimer {
  playerId: string;
  role: string;
  startTime: Date;
  expiryTime: Date;
}

// Core game interface - consolidated from both platforms
export interface Game {
  gameId: string;
  status: GameStatus;
  statusMessage?: string;
  currentTurn: string | null;
  moves: Move[];
  players: {
    challenger?: Player;
    acceptor?: Player;
  };
  winner?: string | null;
  winReason?: WinReason;
  rematchRequests?: RematchRequests;
  rematchGameId?: string;
  disconnectionTimer?: DisconnectionTimer;
  connectedPlayers?: string[];
  createdAt: Date;
  lastActivityAt: Date;
  lookupTable?: number[][];
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameResponse extends ApiResponse {
  game?: Game;
  gameId?: string;
}

// Notification interface
export interface Notification {
  id?: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// User interface with Telegram compatibility
export interface User {
  identifier: string;
  name: string;
  username?: string;
  telegramId?: string;
  isAuthenticated: boolean;
}
