/**
 * Socket service index
 * Exports the socket initialization function
 */

import { Server } from 'socket.io';
import { logger } from '../../config';
import { gameConnectionService } from '../game';
import { registerEventHandlers } from './handlers';

/**
 * Initialize Socket.IO server and register event handlers
 * @param io - Socket.IO server instance
 * @returns {NodeJS.Timeout} Timer reference for cleanup
 */
export const initializeSocket = (io: Server): NodeJS.Timeout => {
  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    registerEventHandlers(socket, io);
  });

  // Disconnection timer heartbeat mechanism removed
  // Games will handle disconnections immediately without periodic checks
  
  // Return null since no timer needs cleanup
  return null as any;
};
