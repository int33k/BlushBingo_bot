/**
 * Ultra-optimized Game repository interface with proper typing
 */
import { GameDocument, IGame } from '../../types/gameTypes';

export interface IGameRepository {
  findById(gameId: string): Promise<GameDocument | null>;
  findActiveByPlayerId(playerId: string): Promise<GameDocument | null>;
  findWithExpiredDisconnectionTimers(): Promise<GameDocument[]>;
  save(game: GameDocument): Promise<GameDocument>;
  create(gameData: Partial<IGame>): Promise<GameDocument>;
  updateById(gameId: string, updateData: Partial<IGame>): Promise<GameDocument | null>;
  deleteById(gameId: string): Promise<boolean>;
  findCompletedByPlayerId(playerId: string): Promise<GameDocument[]>;
}
