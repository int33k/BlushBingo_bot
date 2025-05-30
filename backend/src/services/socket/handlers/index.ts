/**
 * Socket event handlers module
 *
 * This module provides a centralized registry of socket event handlers and
 * a function to register all handlers with a socket instance.
 *
 * The handlers are organized by domain (game, player, connection) and combined
 * into a single map for easier registration.
 *
 * Usage:
 * import { registerEventHandlers } from './services/socket/handlers';
 *
 * // In your socket connection handler:
 * io.on('connection', (socket) => {
 *   registerEventHandlers(socket, io);
 * });
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../../../config';
import { gameEventHandlers } from './gameHandlers';
import { playerEventHandlers } from './playerHandlers';
import { connectionEventHandlers } from './connectionHandlers';
import { handleSocketValidationError } from '../../../utils/math';

/**
 * Combined event handler map for declarative event registration
 * Merges all event handlers from different domains
 */
export const eventHandlers = {
  // Merge all event handlers
  ...gameEventHandlers,
  ...playerEventHandlers,
  ...connectionEventHandlers
};

/**
 * Register all event handlers for a socket
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.IO server instance
 */
export const registerEventHandlers = (socket: Socket, io: Server): void => {
  // Register all event handlers from the map
  Object.entries(eventHandlers).forEach(([event, handler]) => {
    if (event === 'disconnect') {
      // Register disconnect handler separately (it doesn't have data)
      socket.on('disconnect', () => {
        try {
          // Call the disconnect handler directly to avoid type issues
          connectionEventHandlers['disconnect'](socket, io);
        } catch (error) {
          logger.error(`Error handling disconnect event: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    } else {
      // Register regular event handlers with callback support
      socket.on(event, (data, callback) => {
        try {
          handler(socket, io, data, callback);
        } catch (error) {
          handleSocketValidationError(socket, error as Error, `socket event ${event}`);
        }
      });
    }
  });
};
