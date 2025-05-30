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

  // Check for expired disconnection timers every 10 seconds
  const disconnectionTimerInterval = setInterval(async () => {
    try {
      const expiredGames = await gameConnectionService.checkExpiredDisconnectionTimers();

      // Notify clients about expired games
      expiredGames.forEach(game => {
        if (game?.gameId) {
          io.to(game.gameId).emit('game:expired', {
            game,
            reason: 'disconnection',
            timestamp: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      logger.error(`Error checking disconnection timers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, 10000);

  // Return the timer reference for cleanup
  return disconnectionTimerInterval;
};
