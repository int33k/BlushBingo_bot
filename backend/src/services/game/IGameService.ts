/**
 * Game service interface
 * Defines the contract for game-related business logic
 */

import { GameDocument } from '../../types/gameTypes';
import { IPlayer } from '../../types/playerTypes';

/**
 * Unified interface for game service operations
 */
export interface IGameService {
  // Base operations
  getGameById(gameId: string): Promise<GameDocument>;
  findActiveGameByPlayerId(playerId: string): Promise<GameDocument | null>;

  // Game creation operations
  createGame(playerData: Partial<IPlayer>): Promise<GameDocument>;
  joinGame(gameId: string, playerData: Partial<IPlayer>): Promise<GameDocument>;
  setPlayerReady(gameId: string, playerId: string, card?: number[][] | null): Promise<GameDocument>;
  requestRematch(gameId: string, playerId: string): Promise<{ game: GameDocument; rematchGame?: GameDocument }>;

  // Game play operations
  makeMove(gameId: string, playerId: string, number: number): Promise<GameDocument>;
  markLine(gameId: string, playerId: string, numbers: number[]): Promise<GameDocument>;
  claimBingo(gameId: string, playerId: string): Promise<GameDocument>;

  // Connection operations
  handleDisconnection(gameId: string, playerId: string): Promise<GameDocument>;
  handleReconnection(gameId: string, playerId: string): Promise<GameDocument>;
  // checkExpiredDisconnectionTimers removed - immediate disconnection handling
}

// Keep these interfaces for backward compatibility
export interface IGameCreationService extends Pick<IGameService,
  'createGame' | 'joinGame' | 'setPlayerReady' | 'requestRematch'> {}

export interface IGamePlayService extends Pick<IGameService,
  'makeMove' | 'markLine' | 'claimBingo'> {}

export interface IGameConnectionService extends Pick<IGameService,
  'findActiveGameByPlayerId' | 'handleDisconnection' | 'handleReconnection'> {}
