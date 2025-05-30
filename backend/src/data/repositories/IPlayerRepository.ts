/**
 * Ultra-optimized Player repository interface with consolidated method signatures
 */
import { PlayerDocument } from '../../models/Player';
import { IPlayer } from '../../types/playerTypes';

export interface IPlayerRepository {
  findById(playerId: string): Promise<PlayerDocument | null>;
  findBySocketId(socketId: string): Promise<PlayerDocument | null>;
  create(playerData: Partial<IPlayer>): Promise<PlayerDocument>;
  updateById(playerId: string, updateData: Partial<IPlayer>): Promise<PlayerDocument | null>;
  save(player: PlayerDocument): Promise<PlayerDocument>;
}
