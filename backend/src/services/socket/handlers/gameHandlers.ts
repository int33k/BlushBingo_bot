import { Server, Socket } from 'socket.io';
import { logger } from '../../../config';
import { gameService, gameCreationService, gamePlayService } from '../../game';
import { RequestRematchEventData, GameCreateEventData, GameJoinEventData, GameMoveEventData, MarkLineEventData } from '../../../types/socketTypes';
import { validatePlayerAuth, validateSocketGameParams, handleSocketValidationError, handleSocketError } from '../../../utils/math';

// Higher-order function for common handler patterns
const createHandler = <T>(
  operation: (socket: Socket, io: Server, data: T, params?: any) => Promise<any>,
  eventName: string,
  needsValidation = true
) => async (socket: Socket, io: Server, data: T, callback?: (response: any) => void) => {
  try {
    const result = needsValidation
      ? await operation(socket, io, data, validateSocketGameParams(socket, data))
      : await operation(socket, io, data);

    callback ? callback({ game: result }) : socket.emit(`game:${eventName}`, { game: result });
    logger.info(`${eventName} completed for ${socket.data.identifier || 'unknown'}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
    callback ? callback({ error: errorMsg }) : handleSocketError(error, socket, eventName);
  }
};

// Optimized auth + player data extraction
const getPlayerData = (socket: Socket, data: any) => {
  const identifier = validatePlayerAuth(socket, data);
  return identifier ? { identifier, name: socket.data.name || data.name } : null;
};

// Socket room operations helper
const joinGameRoom = (socket: Socket, gameId: string) => {
  socket.data.gameId = gameId;
  socket.join(gameId);
};

// Game operations with functional composition
const gameOps = {
  create: async (socket: Socket, io: Server, data: GameCreateEventData) => {
    const playerData = getPlayerData(socket, data);
    if (!playerData) throw new Error('Authentication failed');

    const game = await gameCreationService.createGame(playerData);
    joinGameRoom(socket, game.gameId);
    return game;
  },

  fetch: async (socket: Socket, io: Server, data: GameJoinEventData) => {
    const gameId = data?.gameId;
    const identifier = validatePlayerAuth(socket, data);
    if (!gameId || !identifier) throw new Error('Validation failed');

    const game = await gameService.getGameById(gameId);
    joinGameRoom(socket, gameId);
    return game;
  },

  join: async (socket: Socket, io: Server, data: GameJoinEventData) => {
    const gameId = data?.gameId;
    const playerData = getPlayerData(socket, data);
    if (!gameId || !playerData) throw new Error('Validation failed');

    const game = await gameCreationService.joinGame(gameId, playerData);
    joinGameRoom(socket, gameId);
    game.updateStatusMessage();

    io.to(gameId).emit('game:playerJoined', { game, playerId: playerData.identifier });
    return game;
  }
};

// game play handlers using functional composition
const gamePlayOps = {
  move: (params: any, data: GameMoveEventData) =>
    data.number !== undefined
      ? gamePlayService.makeMove(params.gameId, params.playerId, data.number)
      : Promise.reject(new Error('Number is required')),

  markLine: (params: any, data: MarkLineEventData) =>
    data.numbers?.length
      ? gamePlayService.markLine(params.gameId, params.playerId, data.numbers)
      : Promise.reject(new Error('Numbers array is required')),

  claimBingo: (params: any) => gamePlayService.claimBingo(params.gameId, params.playerId)
};

// Generic handler for game play operations
const createGamePlayHandler = (operation: keyof typeof gamePlayOps, emitEvent: string) =>
  async (socket: Socket, io: Server, data: any) => {
    try {
      const params = validateSocketGameParams(socket, data);
      if (!params) return;

      const game = await gamePlayOps[operation](params, data);
      io.to(params.gameId).emit(emitEvent, { game, playerId: params.playerId });
      logger.info(`${operation} by ${params.playerId} in ${params.gameId}`);
    } catch (error) {
      handleSocketValidationError(socket, error as Error, operation);
    }
  };

const handleRematch = async (socket: Socket, io: Server, data: RequestRematchEventData) => {
  try {
    const params = validateSocketGameParams(socket, data);
    if (!params) return;

    const result = await gameCreationService.requestRematch(params.gameId, params.playerId);

    // Always emit rematch requested to update UI state
    io.to(params.gameId).emit('game:rematchRequested', {
      game: result.game,
      requestedBy: params.playerId
    });

    // If both players have requested rematch, create new game and emit acceptance
    if (result.rematchGame) {
      const rematchData = {
        originalGameId: params.gameId,
        newGameId: result.rematchGame.gameId,
        newGame: result.rematchGame
      };

      // Get all sockets in the original room and migrate them to the new room
      const socketsInRoom = await io.in(params.gameId).fetchSockets();

      for (const roomSocket of socketsInRoom) {
        // Leave old room and join new room
        roomSocket.leave(params.gameId);
        roomSocket.join(result.rematchGame.gameId);
        roomSocket.data.gameId = result.rematchGame.gameId;
      }

      // Emit to original room with complete rematch data (before migration)
      io.to(params.gameId).emit('game:rematchAccepted', rematchData);

      // Also emit to new room to ensure all players receive the event
      io.to(result.rematchGame.gameId).emit('game:rematchAccepted', rematchData);
    }

    logger.info(`Rematch ${result.rematchGame ? 'accepted' : 'requested'} by ${params.playerId} in ${params.gameId}`);
  } catch (error) {
    handleSocketValidationError(socket, error as Error, 'rematch');
  }
};

export const gameEventHandlers = {
  'game:create': createHandler(gameOps.create, 'created', false),
  'game:fetch': createHandler(gameOps.fetch, 'fetched', false),
  'game:join': createHandler(gameOps.join, 'joined', false),
  'game:move': createGamePlayHandler('move', 'game:updated'),
  'game:markLine': createGamePlayHandler('markLine', 'game:updated'),
  'game:claimBingo': createGamePlayHandler('claimBingo', 'game:bingoClaimedBy'),
  'game:requestRematch': handleRematch
};

export const {
  'game:create': handleGameCreate,
  'game:join': handleGameJoin,
  'game:move': handleGameMove,
  'game:markLine': handleMarkLine,
  'game:claimBingo': handleClaimBingo,
  'game:requestRematch': handleRequestRematch
} = gameEventHandlers;
