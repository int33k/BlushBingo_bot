/**
 * Game-related type definitions - Using shared types to eliminate duplication
 */

import { Document } from 'mongoose';
import { IPlayer, PlayerRole } from './playerTypes';
import { 
  GameStatus, 
  WinReason, 
  Move, 
  DisconnectionTimer, 
  RematchRequests,
  Game as SharedGame 
} from '../../../shared/types/game';

// Re-export shared types for backend compatibility
export { GameStatus, WinReason };

// Backend-specific interfaces that extend shared types
export interface IMove extends Move {}
export interface IDisconnectionTimer extends DisconnectionTimer {}
export interface IRematchRequests extends RematchRequests {}

// Core game interface extending shared interface
export interface IGame extends SharedGame {
  lookupTable?: number[][];
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
