"use strict";
/**
 * Optimized connection handlers with aggressive code reduction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDisconnect = exports.handleReconnect = exports.handleAuth = exports.connectionEventHandlers = void 0;
const config_1 = require("../../../config");
const player_1 = require("../../player");
const game_1 = require("../../game");
const math_1 = require("../../../utils/math");
const gameLogic_1 = require("../../../utils/gameLogic");
// Ultra-compact connection handler factory with inline operations
const createConnectionHandler = (op, eventName, successEvent, errorEvent) => async (socket, io, data) => {
    try {
        const result = await op(socket, io, data);
        successEvent && socket.emit(successEvent, result);
        config_1.logger.info(`${eventName} completed for ${socket.data.identifier || socket.id}`);
    }
    catch (error) {
        (0, math_1.handleSocketError)(error, socket, eventName);
        errorEvent && socket.emit(errorEvent, { message: error instanceof Error ? error.message : String(error) });
    }
};
// Ultra-compact authentication with inline operations
const authOp = async (socket, _io, data) => {
    if (!data.identifier)
        throw new Error('Invalid identifier provided');
    if (socket.data.identifier)
        return { identifier: socket.data.identifier, name: socket.data.name };
    Object.assign(socket.data, { identifier: data.identifier, name: data.name || `Player_${data.identifier.substring(0, 5)}` });
    await player_1.playerConnectionService.handleConnection(data.identifier, socket.id);
    return { identifier: data.identifier, name: socket.data.name };
};
// Ultra-compact reconnection with inline validation and parallel operations
const reconnectOp = async (socket, io, data) => {
    const { gameId } = data;
    const playerId = socket.data.identifier || data.playerId;
    if (!gameId)
        throw new Error('Game ID is required for reconnection');
    if (!playerId)
        throw new Error('Player identifier is required. Please authenticate first.');
    await player_1.playerConnectionService.handleConnection(playerId, socket.id, gameId);
    const game = await game_1.gameConnectionService.handleReconnection(gameId, playerId);
    socket.data.gameId = gameId;
    socket.join(gameId);
    // Send player-specific status messages to each player in the room
    const socketsInRoom = await io.in(gameId).fetchSockets();
    for (const roomSocket of socketsInRoom) {
        const socketPlayerId = roomSocket.data.identifier;
        if (socketPlayerId) {
            // Generate player-specific status message and game state
            const playerSpecificGame = {
                ...game.toObject(),
                statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
            };
            roomSocket.emit('player:reconnected', {
                game: playerSpecificGame,
                playerId,
                success: true
            });
        }
    }
    // Also send specific events to the reconnecting player
    await Promise.all([
        socket.emit('game:state', { game: { ...game.toObject(), statusMessage: (0, gameLogic_1.generateStatusMessage)(game, playerId) }, success: true }),
        socket.emit('connection:reconnect:success', { success: true, game: { ...game.toObject(), statusMessage: (0, gameLogic_1.generateStatusMessage)(game, playerId) } })
    ]);
    return game;
};
// Ultra-compact disconnection with inline error handling
const disconnectOp = async (socket, io) => {
    const { gameId, identifier: playerId } = socket.data;
    if (!gameId || !playerId)
        return;
    try {
        const [, game] = await Promise.all([
            player_1.playerConnectionService.handleDisconnection(playerId),
            game_1.gameConnectionService.handleDisconnection(gameId, playerId)
        ]);
        // Send player-specific status messages to each player in the room
        const socketsInRoom = await io.in(gameId).fetchSockets();
        for (const roomSocket of socketsInRoom) {
            const socketPlayerId = roomSocket.data.identifier;
            if (socketPlayerId) {
                // Generate player-specific status message and game state
                const playerSpecificGame = {
                    ...game.toObject(),
                    statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
                };
                roomSocket.emit('player:disconnected', {
                    game: playerSpecificGame,
                    playerId,
                    reconnectionTimeout: 60
                });
            }
        }
        config_1.logger.info(`Disconnection handled: ${playerId} from ${gameId}`);
    }
    catch (error) {
        config_1.logger.error(`Disconnection error: ${error instanceof Error ? error.message : String(error)}`, { socketId: socket.id, gameId, playerId, timestamp: new Date().toISOString() });
    }
};
// Ultra-compact event handlers with inline error handling
exports.connectionEventHandlers = {
    'auth': createConnectionHandler(authOp, 'authentication', 'auth:success', 'auth:error'),
    'connection:reconnect': async (socket, io, data) => {
        try {
            await reconnectOp(socket, io, data);
        }
        catch (error) {
            (0, math_1.handleSocketValidationError)(socket, error, 'reconnection');
            socket.emit('connection:reconnect:failure', { success: false, error: error instanceof Error ? error.message : String(error) });
        }
    },
    'disconnect': disconnectOp
};
// Ultra-compact backward compatibility exports
exports.handleAuth = exports.connectionEventHandlers["auth"], exports.handleReconnect = exports.connectionEventHandlers["connection:reconnect"], exports.handleDisconnect = exports.connectionEventHandlers["disconnect"];
