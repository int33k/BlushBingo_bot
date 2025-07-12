import { GameDocument } from '../../types/gameTypes';
import { PlayerRole, IPlayer } from '../../types/playerTypes';
import { IGameService, IGameCreationService, IGamePlayService, IGameConnectionService } from './IGameService';
import { IGameRepository } from '../../data/repositories/IGameRepository';
import { gameRepository } from '../../data/repositories';
import { createGameNotFoundError, createGameFullError, createInvalidMoveError, createNotYourTurnError, createPlayerNotFoundError } from '../../utils/errors';
import { findPlayerRole, updateLastActivity, isPlayerTurn } from '../../utils/gameLogic';
import { generateRandomCard } from '../../utils/cardUtils';
import { Game } from '../../models/Game';
import { logger } from '../../config';
import { gameCleanupService } from '../cleanup/GameCleanupService';

export class GameService implements IGameService, IGameCreationService, IGamePlayService, IGameConnectionService {
  constructor(private repository: IGameRepository = gameRepository) {}

  async getGameById(gameId: string): Promise<GameDocument> {
    const game = await this.repository.findById(gameId);
    if (!game) throw createGameNotFoundError(gameId);
    return game;
  }

  async findActiveGameByPlayerId(playerId: string) { return this.repository.findActiveByPlayerId(playerId); }

  // ===== Helper Methods =====
  private generateGameCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  private async generateUniqueGameId(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const id = this.generateGameCode();
      try { if (!(await this.repository.findById(id))) return id; } catch { return id; }
    }
    return this.generateGameCode();
  }

  private extractPlayerData = (data: Partial<IPlayer>, defaultName: string) => {
    const playerId = data.playerId || data.identifier;
    if (!playerId) throw new Error('Player identifier is required');
    return { playerId, name: data.name || defaultName };
  };

  private createPlayerObject = (playerId: string, name: string, status = 'waiting' as const) => ({
    playerId, name, status, connected: true, card: undefined, markedCells: [], completedLines: 0, markedLetters: []
  });

  private async executeGameOperation<T>(
    gameId: string, playerId: string,
    operation: (game: GameDocument, playerRole: PlayerRole, player: any) => Promise<T> | T,
    requiresTurn = false
  ): Promise<T> {
    const game = await this.getGameById(gameId);
    const { playerRole, player } = findPlayerRole(game, playerId);
    if (!player) throw createPlayerNotFoundError({ gameId, playerId });
    if (requiresTurn && !isPlayerTurn(game, playerRole)) throw createNotYourTurnError({ gameId, playerId });
    
    // Store original state for delta calculation and completion check
    const originalMoveCount = game.moves?.length || 0;
    const wasCompleted = game.status === 'completed';
    
    const result = await operation(game, playerRole, player);
    updateLastActivity(game);
    await this.repository.save(game);

    // Schedule deletion if game just became completed
    if (!wasCompleted && game.status === 'completed') {
      gameCleanupService.scheduleGameDeletion(gameId);
      logger.info(`Game ${gameId} completed - scheduled for deletion in 30 seconds`);
    }
    
    // Only emit new moves instead of full game state for better performance
    const newMoves = game.moves?.slice(originalMoveCount) || [];
    if (newMoves.length > 0) {
      // Emit delta update instead of full game object
      const io = require('../../index').io;
      if (io) {
        io.to(gameId).emit('game:move-update', { 
          gameId, 
          newMoves,
          currentTurn: game.currentTurn,
          status: game.status
        });
      }
    }
    
    return result;
  }

  private validateNumbers = (gameId: string, playerId: string, numbers: number | number[]) => {
    const nums = [numbers].flat();
    if (!nums.length) throw createInvalidMoveError({ gameId, playerId, move: 0, reason: 'No numbers provided' });
    nums.forEach(n => { if (n < 1 || n > 25) throw createInvalidMoveError({ gameId, playerId, move: n, reason: 'Invalid number' }); });
    return nums;
  };

  // ===== Game Creation Methods =====
  async createGame(playerData: Partial<IPlayer>) {
    const { playerId, name } = this.extractPlayerData(playerData, 'Player 1');
    
    // Clean up any existing games for this player before creating a new one
    const deletedCount = await this.repository.deleteAllByPlayerId(playerId);
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} existing games for player ${playerId} before creating new game`);
    }
    
    const game = new Game({
      gameId: await this.generateUniqueGameId(), status: 'waiting',
      players: { challenger: this.createPlayerObject(playerId, name) },
      currentTurn: null, moves: [], winner: null, winReason: null, connectedPlayers: [playerId]
    });
    game.updateStatusMessage();
    return this.repository.save(game);
  }

  async joinGame(gameId: string, playerData: Partial<IPlayer>) {
    const game = await this.getGameById(gameId);
    if (game.players.acceptor) throw createGameFullError({ gameId });
    const { playerId, name } = this.extractPlayerData(playerData, 'Player 2');
    
    // Clean up any existing games for this player before joining a new one
    const deletedCount = await this.repository.deleteAllByPlayerId(playerId);
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} existing games for player ${playerId} before joining game ${gameId}`);
    }
    
    game.players.acceptor = { ...this.createPlayerObject(playerId, name), username: name };
    game.status = 'lobby';
    game.addConnectedPlayer(playerId);
    updateLastActivity(game);
    game.updateStatusMessage();
    return this.repository.save(game);
  }

  async setPlayerReady(gameId: string, playerId: string, card?: number[][] | null) {
    return this.executeGameOperation(gameId, playerId, (game, _, player) => {
      player.status = 'ready';
      player.card = card || generateRandomCard();
      if (game.areBothPlayersReady()) game.startGame();
      game.updateStatusMessage();
      return game;
    });
  }

  async requestRematch(gameId: string, playerId: string) {
    const game = await this.getGameById(gameId);
    const { playerRole } = findPlayerRole(game, playerId);
    if (!game.rematchRequests) game.rematchRequests = { challenger: false, acceptor: false };
    game.rematchRequests[playerRole] = true;
    const rematchGame = game.rematchRequests.challenger && game.rematchRequests.acceptor
      ? await this.createRematchGame(game) : undefined;
    if (rematchGame) game.rematchGameId = rematchGame.gameId;
    updateLastActivity(game);
    await this.repository.save(game);
    return { game, rematchGame };
  }

  private async createRematchGame(originalGame: GameDocument) {
    const { challenger, acceptor } = originalGame.players;

    if (!challenger?.playerId || !acceptor?.playerId) {
      throw new Error('Cannot create rematch: missing player data');
    }

    // Create new game with swapped roles (acceptor becomes challenger, challenger becomes acceptor)
    const newGame = new Game({
      gameId: await this.generateUniqueGameId(),
      status: 'lobby', // Start in lobby state since both players are already connected
      players: {
        challenger: this.createPlayerObject(acceptor.playerId, acceptor.name),
        acceptor: this.createPlayerObject(challenger.playerId, challenger.name)
      },
      currentTurn: null,
      moves: [],
      winner: null,
      winReason: null,
      connectedPlayers: [...(originalGame.connectedPlayers || [])],
      rematchRequests: { challenger: false, acceptor: false }, // Reset rematch requests
      lookupTable: [] // Will be generated when both players are ready
    });

    // Update status message for lobby
    newGame.updateStatusMessage();

    return this.repository.save(newGame);
  }

  // ===== Game Play Methods =====
  async makeMove(gameId: string, playerId: string, number: number) {
    this.validateNumbers(gameId, playerId, number);
    return this.executeGameOperation(gameId, playerId, (game, role) => {
      game.recordMove(role, number);
      const prev = game.currentTurn;
      game.switchTurn();
      console.log(`🎮 Turn: ${prev} -> ${game.currentTurn} (Move #${game.moves.length})`);
      game.checkCompletedLines(role);
      return game;
    }, true);
  }

  async markLine(gameId: string, playerId: string, numbers: number[]) {
    return this.executeGameOperation(gameId, playerId, (game, role) => {
      // Validate numbers but don't record moves - marking a line is not individual moves
      this.validateNumbers(gameId, playerId, numbers);
      
      // Mark the cells for the line without adding to move history
      numbers.forEach(n => game.markCellForBothPlayers(n));
      
      // DON'T switch turns - marking a line is just marking completed cells, not a game action
      console.log(`🎮 Line marked: ${numbers.length} cells marked for both players (turn stays: ${game.currentTurn})`);
      game.checkCompletedLines(role);
      return game;
    }, true);
  }

  async claimBingo(gameId: string, playerId: string) {
    return this.executeGameOperation(gameId, playerId, (game, role) => {
      if (game.status !== 'playing') throw createInvalidMoveError({ gameId, playerId, move: 0, reason: 'Game not playing' });
      if (game.checkCompletedLines(role) < 5) throw createInvalidMoveError({ gameId, playerId, move: 0, reason: 'Need 5 lines' });
      game.endGame(role, 'bingo');
      console.log(`🎮 BINGO: ${role} wins ${gameId}`);
      return game;
    });
  }

  // ===== Game Connection Methods =====
  async handleDisconnection(gameId: string, playerId: string) {
    try {
      return this.executeGameOperation(gameId, playerId, (game, role, player) => {
        console.log(`[DEBUG] Before disconnection - Player ${playerId} connected status:`, player.connected);
        player.connected = false;
        player.status = 'disconnected'; // Set status to disconnected
        console.log(`[DEBUG] After disconnection - Player ${playerId} connected status:`, player.connected, 'status:', player.status);
        game.removeConnectedPlayer(playerId);
        
        // Check if lobby is now empty and schedule cleanup
        const remainingConnected = game.connectedPlayers?.length || 0;
        if (remainingConnected === 0) {
          // Schedule immediate cleanup for empty lobbies (5 seconds to allow for quick reconnections)
          gameCleanupService.scheduleGameDeletion(gameId, 5000);
          logger.info(`Game ${gameId} scheduled for cleanup - no players connected`);
        }
        
        // Immediate game ending on disconnection during playing state
        if (game.status === 'playing') {
          const opponentRole = role === 'challenger' ? 'acceptor' : 'challenger';
          game.endGame(opponentRole, 'disconnection');
          logger.info(`Game ${gameId} ended immediately due to ${playerId} disconnection - opponent wins`);
          // Note: Game completion cleanup will be handled by executeGameOperation
        }
        
        logger.info(`Player ${playerId} disconnected from ${gameId}`);
        return game;
      });
    } catch (error) {
      logger.error(`Disconnection error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async handleReconnection(gameId: string, playerId: string) {
    try {
      const result = await this.executeGameOperation(gameId, playerId, (game, role, player) => {
        console.log(`[DEBUG] Before reconnection - Player ${playerId} connected status:`, player.connected, 'status:', player.status);
        player.connected = true;
        
        // Restore appropriate status based on game state
        if (game.status === 'waiting' || game.status === 'lobby') {
          // In lobby, restore to waiting or ready based on whether they have a card
          player.status = player.card ? 'ready' : 'waiting';
        } else if (game.status === 'playing') {
          player.status = 'playing';
        }
        
        console.log(`[DEBUG] After reconnection - Player ${playerId} connected status:`, player.connected, 'status:', player.status);
        game.addConnectedPlayer(playerId);
        
        // Cancel any scheduled cleanup since someone reconnected
        gameCleanupService.cancelScheduledCleanup(gameId);
        
        logger.info(`Player ${playerId} reconnected to ${gameId} with status ${player.status}`);
        return game;
      });
      
      // Force emit to all clients to ensure status is updated
      const io = require('../../index').io;
      if (io) {
        io.to(gameId).emit('game:player-status-update', {
          gameId,
          playerId,
          connected: true,
          status: result.players.challenger?.playerId === playerId ? result.players.challenger.status : result.players.acceptor?.status
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Reconnection error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Disconnection timer checking removed - games end immediately on disconnect
}

