import { GameDocument } from '../../types/gameTypes';
import { IPlayer } from '../../types/playerTypes';
import { PlayerDocument } from '../../models/Player';

export interface IPlayerService {
  getPlayerById(playerId: string): Promise<PlayerDocument>;
  findPlayerBySocketId(socketId: string): Promise<PlayerDocument | null>;
  updatePlayer(playerId: string, updateData: Partial<IPlayer>): Promise<PlayerDocument>;
  setPlayerReady(gameId: string, playerId: string, card?: number[][] | null): Promise<GameDocument>;
  makeMove(gameId: string, playerId: string, number: number): Promise<GameDocument>;
  claimBingo(gameId: string, playerId: string): Promise<GameDocument>;
  handleConnection(playerId: string, socketId: string, explicitGameId?: string): Promise<PlayerDocument>;
  handleDisconnection(playerId: string): Promise<PlayerDocument>;
  associateWithGame(playerId: string, gameId: string, playerName?: string): Promise<PlayerDocument>;
}
