/**
 * Ultra-optimized Game repository with consolidated operations and smart query patterns
 */
import { Game } from '../../models/Game';
import { GameDocument, IGame } from '../../types/gameTypes';
import { IGameRepository } from './IGameRepository';
import { BaseRepository } from './BaseRepository';

export class GameRepository extends BaseRepository implements IGameRepository {
  // Smart query patterns with consolidated logic
  private readonly activeGameQuery = (playerId: string) => ({
    $and: [
      { status: { $in: ['waiting', 'lobby', 'playing'] } },
      { $or: [{ 'players.challenger.playerId': playerId }, { 'players.acceptor.playerId': playerId }] }
    ]
  });

  private readonly playerGameQuery = (playerId: string) => ({
    $or: [{ 'players.challenger.playerId': playerId }, { 'players.acceptor.playerId': playerId }]
  });

  async findById(gameId: string): Promise<GameDocument | null> {
    return this.executeOrThrow(() => Game.findOne({ gameId }), 'Error finding game by ID');
  }

  async findActiveByPlayerId(playerId: string): Promise<GameDocument | null> {
    return this.executeOrThrow(() => Game.findOne(this.activeGameQuery(playerId)), 'Error finding active game by player ID');
  }

  // findWithExpiredDisconnectionTimers removed - immediate disconnection handling

  async save(game: GameDocument): Promise<GameDocument> {
    return this.executeOrThrow(() => game.save(), 'Error saving game');
  }

  async create(gameData: Partial<IGame>): Promise<GameDocument> {
    return this.executeOrThrow(() => new Game(gameData).save(), 'Error creating game');
  }

  async updateById(gameId: string, updateData: Partial<IGame>): Promise<GameDocument | null> {
    return this.executeOrThrow(() => Game.findOneAndUpdate({ gameId }, { $set: updateData }, { new: true }), 'Error updating game by ID');
  }

  async deleteById(gameId: string): Promise<boolean> {
    return this.executeOrThrow(async () => (await Game.deleteOne({ gameId })).deletedCount > 0, 'Error deleting game by ID');
  }

  async deleteAllByPlayerId(playerId: string): Promise<number> {
    return this.executeOrThrow(async () => {
      const result = await Game.deleteMany(this.playerGameQuery(playerId));
      return result.deletedCount || 0;
    }, 'Error deleting games by player ID');
  }

  async findCompletedByPlayerId(playerId: string): Promise<GameDocument[]> {
    return this.executeOrThrow(() => Game.find({ status: 'completed', ...this.playerGameQuery(playerId) }).sort({ createdAt: -1 }), 'Error finding completed games by player ID');
  }
}
