/**
 * Ultra-optimized Game repository interface with proper typing
 */
import { GameDocument, IGame } from '../../types/gameTypes';

export interface IGameRepository {
  findById(gameId: string): Promise<GameDocument | null>;
  findActiveByPlayerId(playerId: string): Promise<GameDocument | null>;
  // findWithExpiredDisconnectionTimers removed - immediate disconnection handling
  save(game: GameDocument): Promise<GameDocument>;
  create(gameData: Partial<IGame>): Promise<GameDocument>;
  updateById(gameId: string, updateData: Partial<IGame>): Promise<GameDocument | null>;
  deleteById(gameId: string): Promise<boolean>;
  deleteAllByPlayerId(playerId: string): Promise<number>;
  findCompletedByPlayerId(playerId: string): Promise<GameDocument[]>;
}
