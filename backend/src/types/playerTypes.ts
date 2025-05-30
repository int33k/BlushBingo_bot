/**
 * Player-related type definitions - Ultra-optimized with consolidated types
 */

// Core player types using union types for optimization
export type PlayerRole = 'challenger' | 'acceptor';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'disconnected';

// Ultra-optimized player interface using inline types and optional chaining
export interface IPlayer {
  playerId: string; name: string; username?: string; telegramId?: string; connected: boolean;
  status: PlayerStatus; card?: number[][]; markedCells?: number[]; completedLines?: number;
  markedLetters?: string[]; identifier?: string; socketId?: string; score?: number; gameId?: string;
}
