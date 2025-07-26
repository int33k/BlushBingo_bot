import { Server, Socket } from 'socket.io';
import { logger } from '../../../config';
import { gameService, gameCreationService, gamePlayService, gameConnectionService } from '../../game';
import { playerConnectionService } from '../../player';
import { RequestRematchEventData, GameCreateEventData, GameJoinEventData, GameMoveEventData, MarkLineEventData, GameDisconnectEventData } from '../../../types/socketTypes';
import { validatePlayerAuth, validateSocketGameParams, handleSocketValidationError, handleSocketError } from '../../../utils/math';
import { generateStatusMessage } from '../../../utils/gameLogic';

// Higher-order function for common handler patterns
// Helper to ensure photoUrl is present for both players
function ensurePlayerPhotoUrls(gameObj: any, game: any): any {
  if (gameObj.players) {
    if (gameObj.players.challenger && !gameObj.players.challenger.photoUrl) gameObj.players.challenger.photoUrl = game.players.challenger?.photoUrl || null;
    if (gameObj.players.acceptor && !gameObj.players.acceptor.photoUrl) gameObj.players.acceptor.photoUrl = game.players.acceptor?.photoUrl || null;
    // Debug: Log both photoUrls at backend emission
    console.log('[PHOTOURL FLOW] Backend ensurePlayerPhotoUrls:', {
      challengerPhotoUrl: gameObj.players.challenger?.photoUrl,
      acceptorPhotoUrl: gameObj.players.acceptor?.photoUrl
    });
  }
  return gameObj;
}
const createHandler = <T>(
  operation: (socket: Socket, io: Server, data: T, params?: any) => Promise<any>,
  eventName: string,
  needsValidation = true
) => async (socket: Socket, io: Server, data: T, callback?: (response: any) => void) => {
  try {
    const result = needsValidation
      ? await operation(socket, io, data, validateSocketGameParams(socket, data))
      : await operation(socket, io, data);

    // Ensure photoUrl for both players before sending
    let gameObj = result && result.toObject ? result.toObject() : result;
    if (gameObj && result && result.players) {
      gameObj = ensurePlayerPhotoUrls(gameObj, result);
    }
    callback ? callback({ game: gameObj }) : socket.emit(`game:${eventName}`, { game: gameObj });
    logger.info(`${eventName} completed for ${socket.data.identifier || 'unknown'}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
    callback ? callback({ error: errorMsg }) : handleSocketError(error, socket, eventName);
  }
};

// Optimized auth + player data extraction
const getPlayerData = (socket: Socket, data: any) => {
  const identifier = validatePlayerAuth(socket, data);
  // Accept photoUrl from socket.data or data
  let photoUrl = data.photoUrl || socket.data.photoUrl || null;
  // Debug: Log photoUrl at getPlayerData
  console.log('[PHOTOURL FLOW] getPlayerData:', { identifier, name: socket.data.name || data.name, photoUrl, data, socketData: socket.data });
  return identifier ? { identifier, name: socket.data.name || data.name, photoUrl } : null;
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
    // Store photoUrl in socket.data for future events
    if (playerData.photoUrl) socket.data.photoUrl = playerData.photoUrl;
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
    // Store photoUrl in socket.data for future events
    if (playerData.photoUrl) socket.data.photoUrl = playerData.photoUrl;
    // First check if this is a rejoining player
    const existingGame = await gameService.getGameById(gameId);
    const existingRole = existingGame.players.challenger?.playerId === playerData.identifier ? 'challenger' :
                        existingGame.players.acceptor?.playerId === playerData.identifier ? 'acceptor' : null;
    let game;
    if (existingRole) {
      // Player is rejoining - use reconnection logic instead of join
      logger.info(`Player ${playerData.identifier} rejoining game ${gameId} as ${existingRole}`);
      game = await gameConnectionService.handleReconnection(gameId, playerData.identifier);
    } else {
      // New player joining
      game = await gameCreationService.joinGame(gameId, playerData);
    }
    joinGameRoom(socket, gameId);
    game.updateStatusMessage();
    // Send player-specific status messages to each player in the room
    const socketsInRoom = await io.in(gameId).fetchSockets();
    for (const roomSocket of socketsInRoom) {
      const socketPlayerId = roomSocket.data.identifier;
      if (socketPlayerId) {
        // Ensure photoUrl is present for both players
        const gameObj = game.toObject();
        if (gameObj.players) {
          if (gameObj.players.challenger && !gameObj.players.challenger.photoUrl) gameObj.players.challenger.photoUrl = game.players.challenger?.photoUrl || null;
          if (gameObj.players.acceptor && !gameObj.players.acceptor.photoUrl) gameObj.players.acceptor.photoUrl = game.players.acceptor?.photoUrl || null;
        }
        const playerSpecificGame = { 
          ...gameObj, 
          statusMessage: generateStatusMessage(game, socketPlayerId) 
        };
        roomSocket.emit('game:playerJoined', { 
          game: playerSpecificGame, 
          playerId: playerData.identifier 
        });
      }
    }
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

// Higher-order function for game play handlers
const createGamePlayHandler = (operation: keyof typeof gamePlayOps, responseEvent: string) => 
  async (socket: Socket, io: Server, data: any, callback?: (response: any) => void) => {
    try {
      const params = validateSocketGameParams(socket, data);
      if (!params) return;

      const game = await gamePlayOps[operation](params, data);
      // Send updated game state to all players in the room
      const socketsInRoom = await io.in(params.gameId).fetchSockets();
      for (const roomSocket of socketsInRoom) {
        const socketPlayerId = roomSocket.data.identifier;
        if (socketPlayerId) {
          // Generate player-specific status message
          const playerSpecificGame = { 
            ...ensurePlayerPhotoUrls(game.toObject(), game), 
            statusMessage: generateStatusMessage(game, socketPlayerId) 
          };
          roomSocket.emit(responseEvent, { 
            game: playerSpecificGame, 
            playerId: params.playerId 
          });
        }
      }
      callback?.({ game: { ...ensurePlayerPhotoUrls(game.toObject(), game), statusMessage: generateStatusMessage(game, params.playerId) } });
      logger.info(`${operation} completed for ${params.playerId} in game ${params.gameId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
      callback ? callback({ error: errorMsg }) : handleSocketError(error, socket, operation);
    }
  };

// Handle rematch request
const handleRematch = async (socket: Socket, io: Server, data: RequestRematchEventData, callback?: (response: any) => void) => {
  try {
    const params = validateSocketGameParams(socket, data);
    if (!params) return;

    const { game, rematchGame } = await gameService.requestRematch(params.gameId, params.playerId);
    
    if (rematchGame) {
      // Both players accepted - emit rematch accepted event with new game ID
      const socketsInRoom = await io.in(params.gameId).fetchSockets();
      for (const roomSocket of socketsInRoom) {
        const socketPlayerId = roomSocket.data.identifier;
        if (socketPlayerId) {
          // Join the new game room
          roomSocket.join(rematchGame.gameId);
          
          // Emit rematch accepted with new game ID
          roomSocket.emit('game:rematchAccepted', { 
            newGameId: rematchGame.gameId,
            playerId: params.playerId 
          });
        }
      }
      
      callback?.({ game: { ...ensurePlayerPhotoUrls(rematchGame.toObject(), rematchGame), statusMessage: generateStatusMessage(rematchGame, params.playerId) } });
      logger.info(`Rematch accepted - new game ${rematchGame.gameId} created from ${params.gameId}`);
    } else {
      // Only one player has requested rematch so far
      const socketsInRoom = await io.in(params.gameId).fetchSockets();
      for (const roomSocket of socketsInRoom) {
        const socketPlayerId = roomSocket.data.identifier;
        if (socketPlayerId) {
          const playerSpecificGame = { 
            ...ensurePlayerPhotoUrls(game.toObject(), game), 
            statusMessage: generateStatusMessage(game, socketPlayerId) 
          };
          roomSocket.emit('game:rematchRequested', { 
            game: playerSpecificGame, 
            playerId: params.playerId 
          });
        }
      }
      
      callback?.({ game: { ...ensurePlayerPhotoUrls(game.toObject(), game), statusMessage: generateStatusMessage(game, params.playerId) } });
      logger.info(`Rematch requested by ${params.playerId} in game ${params.gameId}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
    callback ? callback({ error: errorMsg }) : handleSocketError(error, socket, 'rematch');
  }
};

// Handle player leaving game
const handlePlayerLeaving = async (socket: Socket, io: Server, data: GameDisconnectEventData, callback?: (response: any) => void) => {
  try {
    const params = validateSocketGameParams(socket, data);
    if (!params) return;

    const [, game] = await Promise.all([
      playerConnectionService.handleDisconnection(params.playerId),
      gameConnectionService.handleDisconnection(params.gameId, params.playerId)
    ]);
    
    // Send player-specific status messages to each player in the room
    const socketsInRoom = await io.in(params.gameId).fetchSockets();
    for (const roomSocket of socketsInRoom) {
      const socketPlayerId = roomSocket.data.identifier;
      if (socketPlayerId) {
        const playerSpecificGame = { 
          ...game.toObject(), 
          statusMessage: generateStatusMessage(game, socketPlayerId) 
        };
        roomSocket.emit('player:left', { 
          game: playerSpecificGame, 
          playerId: params.playerId 
        });
      }
    }
    
    callback?.({ success: true });
    logger.info(`Player leaving handled: ${params.playerId} from ${params.gameId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
    callback ? callback({ error: errorMsg }) : handleSocketError(error, socket, 'playerLeaving');
  }
};

// Handle game disconnection
const handleGameDisconnectEvent = async (socket: Socket, io: Server, data: GameDisconnectEventData) => {
  try {
    const params = validateSocketGameParams(socket, data);
    if (!params) return;

    // Handle disconnection similar to socket disconnect
    const [, game] = await Promise.all([
      playerConnectionService.handleDisconnection(params.playerId),
      gameConnectionService.handleDisconnection(params.gameId, params.playerId)
    ]);
    
    // Send player-specific status messages to each player in the room
    const socketsInRoom = await io.in(params.gameId).fetchSockets();
    for (const roomSocket of socketsInRoom) {
      const socketPlayerId = roomSocket.data.identifier;
      if (socketPlayerId) {
        // Generate player-specific status message and game state
        const playerSpecificGame = { 
          ...game.toObject(), 
          statusMessage: generateStatusMessage(game, socketPlayerId) 
        };
        roomSocket.emit('player:disconnected', { 
          game: playerSpecificGame, 
          playerId: params.playerId, 
          reconnectionTimeout: 60 
        });
      }
    }
    
    logger.info(`Game disconnection handled: ${params.playerId} from ${params.gameId}`);
  } catch (error) {
    handleSocketValidationError(socket, error as Error, 'game:disconnect');
  }
};

// Handle instant win for testing
const handleInstantWin = async (socket: Socket, io: Server, data: any, callback?: (response: any) => void) => {
  try {
    const params = validateSocketGameParams(socket, data);
    if (!params) return;

    const game = await gameService.instantWin(params.gameId, params.playerId);
    
    // Emit game completion to all players in the room
    const socketsInRoom = await io.in(params.gameId).fetchSockets();
    for (const roomSocket of socketsInRoom) {
      const socketPlayerId = roomSocket.data.identifier;
      if (socketPlayerId) {
        const playerSpecificGame = { 
          ...game.toObject(), 
          statusMessage: generateStatusMessage(game, socketPlayerId) 
        };
        roomSocket.emit('game:bingoClaimedBy', { 
          game: playerSpecificGame, 
          winner: game.winner,
          playerId: params.playerId 
        });
      }
    }
    
    callback?.({ success: true, game: { ...game.toObject(), statusMessage: generateStatusMessage(game, params.playerId) } });
    logger.info(`Instant win completed by ${params.playerId} in game ${params.gameId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
    callback ? callback({ error: errorMsg }) : handleSocketError(error, socket, 'instantWin');
  }
};

export const gameEventHandlers = {
  'game:create': createHandler(gameOps.create, 'created', false),
  'game:fetch': createHandler(gameOps.fetch, 'fetched', false),
  'game:join': createHandler(gameOps.join, 'joined', false),
  'game:move': createGamePlayHandler('move', 'game:updated'),
  'game:markLine': createGamePlayHandler('markLine', 'game:updated'),
  'game:claimBingo': createGamePlayHandler('claimBingo', 'game:bingoClaimedBy'),
  'game:instantWin': handleInstantWin,
  'game:requestRematch': handleRematch,
  'game:disconnect': handleGameDisconnectEvent,
  'game:playerLeaving': handlePlayerLeaving
};

export const {
  'game:create': handleGameCreate,
  'game:join': handleGameJoin,
  'game:move': handleGameMove,
  'game:markLine': handleMarkLine,
  'game:claimBingo': handleClaimBingo,
  'game:requestRematch': handleRequestRematch
} = gameEventHandlers;

export const handleGameDisconnectExport = gameEventHandlers['game:disconnect'];
export const handlePlayerLeavingExport = gameEventHandlers['game:playerLeaving'];
