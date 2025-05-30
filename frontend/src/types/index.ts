// Ultra-compact type definitions
export type GameStatus = 'waiting' | 'lobby' | 'playing' | 'completed';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'disconnected';
export type PlayerRole = 'challenger' | 'acceptor';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Core interfaces with inline types
export interface Player {
  playerId: string; name: string; username?: string; telegramId?: string; status: PlayerStatus;
  connected: boolean; card?: number[][]; markedCells?: number[]; completedLines?: number; markedLetters?: string[];
}

export interface Move { playerId: string; position: { row: number; col: number; }; value: number; timestamp: Date; }
export interface RematchRequests { challenger: boolean; acceptor: boolean; }

// Game interface with compact structure
export interface Game {
  gameId: string; status: GameStatus; statusMessage?: string; currentTurn: string | null; moves: Move[];
  players: { challenger?: Player; acceptor?: Player; }; winner?: string | null; winReason?: string | null;
  rematchRequests?: RematchRequests; rematchGameId?: string; connectedPlayers?: string[];
  createdAt: Date; lastActivityAt: Date;
}

// Compact socket event data types
export interface GameCreateEventData { identifier?: string; name?: string; }
export interface GameJoinEventData { gameId: string; identifier?: string; name?: string; }
export interface PlayerReadyEventData { gameId: string; playerId: string; name?: string; card?: number[][]; }
export interface AuthEventData { identifier: string; name?: string; }

// Compact API & utility types
export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; message?: string; }
export interface GameResponse extends ApiResponse { game?: Game; gameId?: string; }
export interface Notification { id?: string; message: string; type: NotificationType; duration?: number; }

// User types with Telegram compatibility
export interface User { identifier: string; name: string; username?: string; telegramId?: string; isAuthenticated: boolean; }

// Context types with compact method signatures
export interface UserContextType {
  user: User | null; setUser: (user: User | null) => void; isAuthenticated: boolean;
  login: (identifier: string, name?: string) => void; logout: () => void;
}

export interface SocketContextType {
  socket: unknown; isConnected: boolean; isReconnecting: boolean; connect: () => void; disconnect: () => void;
  emit: (event: string, data?: unknown, callback?: (response: unknown) => void) => void;
  on: (event: string, callback: (data: unknown) => void) => () => void;
}

export interface GameContextType {
  currentGame: Game | null; isLoading: boolean; error: string | null;
  createGame: () => Promise<GameResponse>; joinGame: (gameId: string) => Promise<GameResponse>;
  setPlayerReady: (card: number[][]) => Promise<GameResponse>; fetchGame: (gameId: string) => Promise<GameResponse>;
  requestRematch: () => Promise<GameResponse>; leaveGame: () => void;
}
