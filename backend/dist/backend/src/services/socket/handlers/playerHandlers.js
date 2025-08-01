"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayerReady = exports.playerEventHandlers = void 0;
const config_1 = require("../../../config");
const player_1 = require("../../player");
const math_1 = require("../../../utils/math");
const gameLogic_1 = require("../../../utils/gameLogic");
// Ultra-compact player ready handler with inline validation and error handling
const handlePlayerReadyStatus = async (socket, io, data, callback) => {
    try {
        const params = (0, math_1.validateSocketGameParams)(socket, data);
        if (!params)
            return callback?.({ error: 'Invalid game parameters' });
        const { card } = data;
        if (card && (!Array.isArray(card) || !card.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'number'))))
            return callback?.({ error: 'Invalid card format. Expected number[][] array.' });
        await player_1.playerConnectionService.associateWithGame(params.playerId, params.gameId, socket.data.name || data.name);
        const game = await player_1.playerGameService.setPlayerReady(params.gameId, params.playerId, card || null);
        // Send player-specific status messages to each player
        const socketsInRoom = await io.in(params.gameId).fetchSockets();
        for (const roomSocket of socketsInRoom) {
            const socketPlayerId = roomSocket.data.identifier;
            if (socketPlayerId) {
                // Generate player-specific status message
                const playerSpecificGame = {
                    ...game.toObject(),
                    statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
                };
                roomSocket.emit('player:readyStatus', {
                    game: playerSpecificGame,
                    playerId: params.playerId,
                    ready: true
                });
            }
        }
        game?.status === 'playing' && io.to(params.gameId).emit('game:started', { game });
        callback?.({ game: { ...game.toObject(), statusMessage: (0, gameLogic_1.generateStatusMessage)(game, params.playerId) } });
        config_1.logger.info(`Player ${params.playerId} is ready in game ${params.gameId}`);
    }
    catch (error) {
        callback ? callback({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }) : (0, math_1.handleSocketError)(error, socket, 'player ready');
    }
};
// Ultra-compact exports with functional composition
exports.playerEventHandlers = { 'player:ready': handlePlayerReadyStatus };
exports.handlePlayerReady = exports.playerEventHandlers['player:ready'];
