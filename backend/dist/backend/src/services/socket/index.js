"use strict";
/**
 * Socket service index
 * Exports the socket initialization function
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const config_1 = require("../../config");
const handlers_1 = require("./handlers");
/**
 * Initialize Socket.IO server and register event handlers
 * @param io - Socket.IO server instance
 * @returns {NodeJS.Timeout} Timer reference for cleanup
 */
const initializeSocket = (io) => {
    // Connection event
    io.on('connection', (socket) => {
        config_1.logger.info(`Socket connected: ${socket.id}`);
        (0, handlers_1.registerEventHandlers)(socket, io);
    });
    // Disconnection timer heartbeat mechanism removed
    // Games will handle disconnections immediately without periodic checks
    // Return null since no timer needs cleanup
    return null;
};
exports.initializeSocket = initializeSocket;
