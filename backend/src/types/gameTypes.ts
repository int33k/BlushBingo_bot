/**
 * Game-related type definitions - Ultra-optimized with consolidated types
 */

import { Document } from 'mongoose';
import { IPlayer, PlayerRole } from './playerTypes';

// Core game types using union types for optimization
export type GameStatus = 'waiting' | 'lobby' | 'playing' | 'completed';
export type WinReason = 'bingo' | 'disconnection' | 'forfeit';

// Optimized interfaces using inline types and method chaining patterns
export interface IMove { playerId: string; position: { row: number; col: number; }; value: number; timestamp: Date; }
export interface IDisconnectionTimer { playerId: string; role: string; startTime: Date; expiryTime: Date; }
export interface IRematchRequests { challenger: boolean; acceptor: boolean; }

// Core game interface with optimized structure
export interface IGame {
  gameId: string; status: GameStatus; statusMessage?: string; currentTurn: string | null; moves: IMove[];
  players: { challenger?: IPlayer; acceptor?: IPlayer; }; winner?: string | null; winReason?: WinReason;
  rematchRequests?: IRematchRequests; rematchGameId?: string; disconnectionTimer?: IDisconnectionTimer;
  connectedPlayers?: string[]; createdAt: Date; lastActivityAt: Date; lookupTable?: number[][];
}

// Game document interface with ultra-optimized method signatures using fluent interface pattern
export interface GameDocument extends IGame, Document {
  // Game state methods with method chaining
  areBothPlayersReady(): boolean; startGame(): GameDocument; isPlayerTurn(playerRole: PlayerRole): boolean;
  switchTurn(): GameDocument; endGame(winnerRole: PlayerRole, reason?: WinReason): GameDocument;
  updateStatusMessage(currentPlayerId?: string): GameDocument;

  // Move methods with optimized signatures
  recordMove(role: PlayerRole, number: number): GameDocument; markCellForBothPlayers(number: number): GameDocument;
  checkCompletedLines(role: PlayerRole): number; checkWin(role: PlayerRole): boolean;
  getOpponentCard(role: PlayerRole): number[][] | null;

  // Connection methods with fluent interface
  startDisconnectionTimer(playerId: string, role: PlayerRole, seconds?: number): GameDocument;
  clearDisconnectionTimer(): GameDocument; isDisconnectionTimerExpired(): boolean;
  addConnectedPlayer(playerId: string): GameDocument; removeConnectedPlayer(playerId: string): GameDocument;
  isPlayerConnected(playerId: string): boolean;
}
