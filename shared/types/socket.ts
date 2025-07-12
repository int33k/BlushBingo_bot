/**
 * Shared Socket Types - Consolidated from frontend and backend
 * Eliminates socket event type duplication
 */

// Socket event data types
export interface GameCreateEventData {
  identifier?: string;
  name?: string;
}

export interface GameJoinEventData {
  gameId: string;
  identifier?: string;
  name?: string;
}

export interface PlayerReadyEventData {
  gameId: string;
  playerId: string;
  name?: string;
  card?: number[][];
}

export interface AuthEventData {
  identifier: string;
  name?: string;
}

export interface MoveMadeEventData {
  gameId: string;
  playerId: string;
  position: { row: number; col: number };
  value: number;
}

export interface PlayerDisconnectedEventData {
  gameId: string;
  playerId: string;
  role: string;
}

export interface PlayerReconnectedEventData {
  gameId: string;
  playerId: string;
  role: string;
}

export interface GameEndedEventData {
  gameId: string;
  winner: string;
  winReason: string;
}

// Missing socket event types referenced in backend
export interface GameMoveEventData {
  gameId: string;
  playerId: string;
  number: number;
}

export interface MarkLineEventData {
  gameId: string;
  playerId: string;
  numbers: number[];
  lineIndex: number;
}

export interface ClaimBingoEventData {
  gameId: string;
  playerId: string;
}

export interface RequestRematchEventData {
  gameId: string;
  playerId: string;
}

export interface GameDisconnectEventData {
  gameId: string;
  playerId: string;
}

export interface ReconnectEventData {
  gameId: string;
  playerId?: string;
}

// Socket context interface
export interface SocketContextType {
  socket: unknown;
  isConnected: boolean;
  isReconnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown, callback?: (response: unknown) => void) => void;
  on: (event: string, callback: (data: unknown) => void) => () => void;
}
