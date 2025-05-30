import { PlayerDocument } from '../../models/Player';
import { GameDocument } from '../../types/gameTypes';
import { IPlayer } from '../../types/playerTypes';
import { IPlayerService } from './IPlayerService';
import { IPlayerRepository } from '../../data/repositories/IPlayerRepository';
import { playerRepository } from '../../data/repositories';
import { gameCreationService, gamePlayService, gameConnectionService } from '../game';
import { createPlayerNotFoundError } from '../../utils/errors';
import { logger } from '../../config';

export class PlayerService implements IPlayerService {
  constructor(private repository: IPlayerRepository = playerRepository) {}

  // Ultra-compact operations with functional composition and error optimization
  private withPlayer = async <T>(playerId: string, operation: (player: PlayerDocument) => T | Promise<T>): Promise<T> =>
    operation(await this.repository.findById(playerId) ?? (() => { throw createPlayerNotFoundError({ gameId: '', playerId }); })());

  private createOrGetPlayer = async (playerId: string, name?: string, socketId?: string): Promise<PlayerDocument> =>
    this.getPlayerById(playerId).catch(() => this.repository.create({
      playerId, name: name || `Player_${playerId.substring(0, 5)}`,
      ...(socketId && { socketId }), connected: !!socketId, status: 'waiting'
    }) as Promise<PlayerDocument>);

  private handleGameOp = async (playerId: string, operation: () => Promise<GameDocument>): Promise<GameDocument> =>
    (await this.getPlayerById(playerId), operation());

  private logExec = async <T>(operation: () => Promise<T>, errorMsg: string): Promise<T> => {
    try { return await operation(); }
    catch (error) { logger.error(`${errorMsg}: ${error instanceof Error ? error.message : String(error)}`); throw error; }
  };

  // Ultra-compact public interface with arrow functions and method chaining
  getPlayerById = (playerId: string): Promise<PlayerDocument> => this.withPlayer(playerId, p => p);
  findPlayerBySocketId = (socketId: string): Promise<PlayerDocument | null> => this.repository.findBySocketId(socketId);
  updatePlayer = (playerId: string, updateData: Partial<IPlayer>): Promise<PlayerDocument> =>
    this.repository.updateById(playerId, updateData).then(p => p ?? (() => { throw createPlayerNotFoundError({ gameId: '', playerId }); })());

  // Game operations with optimized error handling
  setPlayerReady = (gameId: string, playerId: string, card: number[][] | null = null): Promise<GameDocument> =>
    this.handleGameOp(playerId, () => gameCreationService.setPlayerReady(gameId, playerId, card));
  makeMove = (gameId: string, playerId: string, number: number): Promise<GameDocument> =>
    this.handleGameOp(playerId, () => gamePlayService.makeMove(gameId, playerId, number));
  claimBingo = (gameId: string, playerId: string): Promise<GameDocument> =>
    this.handleGameOp(playerId, () => gamePlayService.claimBingo(gameId, playerId));

  // Connection operations with functional composition and logging optimization
  handleConnection = (playerId: string, socketId: string, explicitGameId?: string): Promise<PlayerDocument> =>
    this.logExec(async () => {
      const player = await this.createOrGetPlayer(playerId, undefined, socketId);
      const wasDisconnected = !player.connected;
      Object.assign(player, { socketId, connected: true });
      await this.repository.save(player);

      // Auto-reconnect optimization with conditional chaining
      if (!explicitGameId) {
        const activeGame = await gameConnectionService.findActiveGameByPlayerId(playerId);
        activeGame && wasDisconnected && (
          await gameConnectionService.handleReconnection(activeGame.gameId, playerId),
          logger.info(`Player ${playerId} auto-reconnected to game ${activeGame.gameId}`)
        );
      }
      return (logger.info(`Player ${playerId} connected with socket ${socketId}`), player);
    }, 'Error handling player connection');

  handleDisconnection = (playerId: string): Promise<PlayerDocument> =>
    this.logExec(async () => {
      const player = await this.getPlayerById(playerId);
      player.connected = false;
      await this.repository.save(player);
      const activeGame = await gameConnectionService.findActiveGameByPlayerId(playerId);
      activeGame && (
        await gameConnectionService.handleDisconnection(activeGame.gameId, playerId),
        logger.info(`Player ${playerId} disconnected from game ${activeGame.gameId}`)
      );
      return (logger.info(`Player ${playerId} disconnected`), player);
    }, 'Error handling player disconnection');

  associateWithGame = (playerId: string, gameId: string, playerName?: string): Promise<PlayerDocument> =>
    this.logExec(async () => {
      const player = await this.createOrGetPlayer(playerId, playerName);
      return (player.gameId = gameId, await this.repository.save(player),
        logger.info(`Player ${playerId} associated with game ${gameId}`), player);
    }, 'Error associating player with game');
}
