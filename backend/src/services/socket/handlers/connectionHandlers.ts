/**
 * Optimized connection handlers with aggressive code reduction
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../../../config';
import { playerConnectionService } from '../../player';
import { gameConnectionService } from '../../game';
import { AuthEventData, ReconnectEventData } from '../../../types/socketTypes';
import { handleSocketError, handleSocketValidationError } from '../../../utils/math';

// Ultra-compact connection handler factory with inline operations
const createConnectionHandler = <T>(op: (socket: Socket, io: Server, data: T) => Promise<any>, eventName: string, successEvent?: string, errorEvent?: string) =>
  async (socket: Socket, io: Server, data: T) => {
    try {
      const result = await op(socket, io, data);
      successEvent && socket.emit(successEvent, result);
      logger.info(`${eventName} completed for ${socket.data.identifier || socket.id}`);
    } catch (error) {
      handleSocketError(error, socket, eventName);
      errorEvent && socket.emit(errorEvent, { message: error instanceof Error ? error.message : String(error) });
    }
  };

// Ultra-compact authentication with inline operations
const authOp = async (socket: Socket, _io: Server, data: AuthEventData) => {
  if (!data.identifier) throw new Error('Invalid identifier provided');
  if (socket.data.identifier) return { identifier: socket.data.identifier, name: socket.data.name };

  Object.assign(socket.data, { identifier: data.identifier, name: data.name || `Player_${data.identifier.substring(0, 5)}` });
  await playerConnectionService.handleConnection(data.identifier, socket.id);
  return { identifier: data.identifier, name: socket.data.name };
};

// Ultra-compact reconnection with inline validation and parallel operations
const reconnectOp = async (socket: Socket, io: Server, data: ReconnectEventData) => {
  const { gameId } = data;
  const playerId = socket.data.identifier || data.playerId;
  if (!gameId) throw new Error('Game ID is required for reconnection');
  if (!playerId) throw new Error('Player identifier is required. Please authenticate first.');

  await playerConnectionService.handleConnection(playerId, socket.id, gameId);
  const game = await gameConnectionService.handleReconnection(gameId, playerId);

  socket.data.gameId = gameId;
  socket.join(gameId);
  await Promise.all([
    io.to(gameId).emit('player:reconnected', { game, playerId, success: true }),
    socket.emit('game:state', { game, success: true }),
    socket.emit('connection:reconnect:success', { success: true, game })
  ]);
  return game;
};

// Ultra-compact disconnection with inline error handling
const disconnectOp = async (socket: Socket, io: Server) => {
  const { gameId, identifier: playerId } = socket.data;
  if (!gameId || !playerId) return;

  try {
    const [, game] = await Promise.all([
      playerConnectionService.handleDisconnection(playerId),
      gameConnectionService.handleDisconnection(gameId, playerId)
    ]);
    io.to(gameId).emit('player:disconnected', { game, playerId, reconnectionTimeout: 60 });
    logger.info(`Disconnection handled: ${playerId} from ${gameId}`);
  } catch (error) {
    logger.error(`Disconnection error: ${error instanceof Error ? error.message : String(error)}`, { socketId: socket.id, gameId, playerId, timestamp: new Date().toISOString() });
  }
};

// Ultra-compact event handlers with inline error handling
export const connectionEventHandlers = {
  'auth': createConnectionHandler(authOp, 'authentication', 'auth:success', 'auth:error'),
  'connection:reconnect': async (socket: Socket, io: Server, data: ReconnectEventData) => {
    try {
      await reconnectOp(socket, io, data);
    } catch (error) {
      handleSocketValidationError(socket, error as Error, 'reconnection');
      socket.emit('connection:reconnect:failure', { success: false, error: error instanceof Error ? error.message : String(error) });
    }
  },
  'disconnect': disconnectOp
};

// Ultra-compact backward compatibility exports
export const { 'auth': handleAuth, 'connection:reconnect': handleReconnect, 'disconnect': handleDisconnect } = connectionEventHandlers;
