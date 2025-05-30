/**
 * Ultra-optimized Player repository with consolidated error handling
 */
import { PlayerDocument, Player } from '../../models/Player';
import { IPlayerRepository } from './IPlayerRepository';
import { IPlayer } from '../../types/playerTypes';
import { BaseRepository } from './BaseRepository';

export class PlayerRepository extends BaseRepository implements IPlayerRepository {
  async findById(playerId: string): Promise<PlayerDocument | null> {
    return this.execute(() => Player.findOne({ playerId }), 'Error finding player by ID');
  }

  async findBySocketId(socketId: string): Promise<PlayerDocument | null> {
    return this.execute(() => Player.findOne({ socketId }), 'Error finding player by socket ID');
  }

  async create(playerData: Partial<IPlayer>): Promise<PlayerDocument> {
    return this.executeOrThrow(() => Player.create(playerData), 'Error creating player');
  }

  async updateById(playerId: string, updateData: Partial<IPlayer>): Promise<PlayerDocument | null> {
    return this.execute(() => Player.findOneAndUpdate({ playerId }, updateData, { new: true }), 'Error updating player');
  }

  async save(player: PlayerDocument): Promise<PlayerDocument> {
    return this.executeOrThrow(() => player.save(), 'Error saving player');
  }
}
