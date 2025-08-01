"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventHandlers = exports.eventHandlers = void 0;
const config_1 = require("../../../config");
const gameHandlers_1 = require("./gameHandlers");
const playerHandlers_1 = require("./playerHandlers");
const connectionHandlers_1 = require("./connectionHandlers");
const math_1 = require("../../../utils/math");
/**
 * Combined event handler map for declarative event registration
 * Merges all event handlers from different domains
 */
exports.eventHandlers = {
    // Merge all event handlers
    ...gameHandlers_1.gameEventHandlers,
    ...playerHandlers_1.playerEventHandlers,
    ...connectionHandlers_1.connectionEventHandlers
};
/**
 * Register all event handlers for a socket
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.IO server instance
 */
const registerEventHandlers = (socket, io) => {
    // Register all event handlers from the map
    Object.entries(exports.eventHandlers).forEach(([event, handler]) => {
        if (event === 'disconnect') {
            // Register disconnect handler separately (it doesn't have data)
            socket.on('disconnect', () => {
                try {
                    // Call the disconnect handler directly to avoid type issues
                    connectionHandlers_1.connectionEventHandlers['disconnect'](socket, io);
                }
                catch (error) {
                    config_1.logger.error(`Error handling disconnect event: ${error instanceof Error ? error.message : String(error)}`);
                }
            });
        }
        else {
            // Register regular event handlers with callback support
            socket.on(event, (data, callback) => {
                try {
                    handler(socket, io, data, callback);
                }
                catch (error) {
                    (0, math_1.handleSocketValidationError)(socket, error, `socket event ${event}`);
                }
            });
        }
    });
};
exports.registerEventHandlers = registerEventHandlers;
