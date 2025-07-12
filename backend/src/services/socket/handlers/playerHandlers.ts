// Ultra-optimized player handlers with aggressive functional composition
import { Server, Socket } from 'socket.io';
import { logger } from '../../../config';
import { playerGameService, playerConnectionService } from '../../player';
import { SocketEventHandler, PlayerReadyEventData } from '../../../types/socketTypes';
import { validateSocketGameParams, handleSocketError } from '../../../utils/math';
import { generateStatusMessage } from '../../../utils/gameLogic';

// Ultra-compact player ready handler with inline validation and error handling
const handlePlayerReadyStatus = async (socket: Socket, io: Server, data: PlayerReadyEventData, callback?: (response: any) => void) => {
  try {
    const params = validateSocketGameParams(socket, data);
    if (!params) return callback?.({ error: 'Invalid game parameters' });

    const { card } = data;
    if (card && (!Array.isArray(card) || !card.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'number'))))
      return callback?.({ error: 'Invalid card format. Expected number[][] array.' });

    await playerConnectionService.associateWithGame(params.playerId, params.gameId, socket.data.name || data.name);
    const game = await playerGameService.setPlayerReady(params.gameId, params.playerId, card || null);

    // Send player-specific status messages to each player
    const socketsInRoom = await io.in(params.gameId).fetchSockets();
    for (const roomSocket of socketsInRoom) {
      const socketPlayerId = roomSocket.data.identifier;
      if (socketPlayerId) {
        // Generate player-specific status message
        const playerSpecificGame = { 
          ...game.toObject(), 
          statusMessage: generateStatusMessage(game, socketPlayerId) 
        };
        roomSocket.emit('player:readyStatus', { 
          game: playerSpecificGame, 
          playerId: params.playerId, 
          ready: true 
        });
      }
    }
    
    game?.status === 'playing' && io.to(params.gameId).emit('game:started', { game });
    callback?.({ game: { ...game.toObject(), statusMessage: generateStatusMessage(game, params.playerId) } });
    logger.info(`Player ${params.playerId} is ready in game ${params.gameId}`);
  } catch (error) {
    callback ? callback({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }) : handleSocketError(error, socket, 'player ready');
  }
};

// Ultra-compact exports with functional composition
export const playerEventHandlers = { 'player:ready': handlePlayerReadyStatus };
export const handlePlayerReady: SocketEventHandler<PlayerReadyEventData> = playerEventHandlers['player:ready'];
