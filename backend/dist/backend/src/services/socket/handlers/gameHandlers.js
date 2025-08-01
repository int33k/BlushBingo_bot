"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayerLeavingExport = exports.handleGameDisconnectExport = exports.handleRequestRematch = exports.handleClaimBingo = exports.handleMarkLine = exports.handleGameMove = exports.handleGameJoin = exports.handleGameCreate = exports.gameEventHandlers = void 0;
const config_1 = require("../../../config");
const game_1 = require("../../game");
const player_1 = require("../../player");
const math_1 = require("../../../utils/math");
const gameLogic_1 = require("../../../utils/gameLogic");
// Higher-order function for common handler patterns
// Helper to ensure photoUrl is present for both players
function ensurePlayerPhotoUrls(gameObj, game) {
    if (gameObj.players) {
        if (gameObj.players.challenger && !gameObj.players.challenger.photoUrl)
            gameObj.players.challenger.photoUrl = game.players.challenger?.photoUrl || null;
        if (gameObj.players.acceptor && !gameObj.players.acceptor.photoUrl)
            gameObj.players.acceptor.photoUrl = game.players.acceptor?.photoUrl || null;
        // Debug: Log both photoUrls at backend emission
        // console.log('[PHOTOURL FLOW] Backend ensurePlayerPhotoUrls:', {
        //challengerPhotoUrl: gameObj.players.challenger?.photoUrl,
        //acceptorPhotoUrl: gameObj.players.acceptor?.photoUrl
        // }
        // );
    }
    return gameObj;
}
const createHandler = (operation, eventName, needsValidation = true) => async (socket, io, data, callback) => {
    try {
        const result = needsValidation
            ? await operation(socket, io, data, (0, math_1.validateSocketGameParams)(socket, data))
            : await operation(socket, io, data);
        // Ensure photoUrl for both players before sending
        let gameObj = result && result.toObject ? result.toObject() : result;
        if (gameObj && result && result.players) {
            gameObj = ensurePlayerPhotoUrls(gameObj, result);
        }
        callback ? callback({ game: gameObj }) : socket.emit(`game:${eventName}`, { game: gameObj });
        config_1.logger.info(`${eventName} completed for ${socket.data.identifier || 'unknown'}`);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
        callback ? callback({ error: errorMsg }) : (0, math_1.handleSocketError)(error, socket, eventName);
    }
};
// Optimized auth + player data extraction
const getPlayerData = (socket, data) => {
    const identifier = (0, math_1.validatePlayerAuth)(socket, data);
    // Accept photoUrl from socket.data or data
    let photoUrl = data.photoUrl || socket.data.photoUrl || null;
    // Debug: Log photoUrl at getPlayerData
    //console.log('[PHOTOURL FLOW] getPlayerData:', { identifier, name: socket.data.name || data.name, photoUrl, data, socketData: socket.data });
    return identifier ? { identifier, name: socket.data.name || data.name, photoUrl } : null;
};
// Socket room operations helper
const joinGameRoom = (socket, gameId) => {
    socket.data.gameId = gameId;
    socket.join(gameId);
};
// Game operations with functional composition
const gameOps = {
    create: async (socket, io, data) => {
        const playerData = getPlayerData(socket, data);
        if (!playerData)
            throw new Error('Authentication failed');
        // Store photoUrl in socket.data for future events
        if (playerData.photoUrl)
            socket.data.photoUrl = playerData.photoUrl;
        const game = await game_1.gameCreationService.createGame(playerData);
        joinGameRoom(socket, game.gameId);
        return game;
    },
    fetch: async (socket, io, data) => {
        const gameId = data?.gameId;
        const identifier = (0, math_1.validatePlayerAuth)(socket, data);
        if (!gameId || !identifier)
            throw new Error('Validation failed');
        const game = await game_1.gameService.getGameById(gameId);
        joinGameRoom(socket, gameId);
        return game;
    },
    join: async (socket, io, data) => {
        const gameId = data?.gameId;
        const playerData = getPlayerData(socket, data);
        if (!gameId || !playerData)
            throw new Error('Validation failed');
        // Store photoUrl in socket.data for future events
        if (playerData.photoUrl)
            socket.data.photoUrl = playerData.photoUrl;
        // First check if this is a rejoining player
        const existingGame = await game_1.gameService.getGameById(gameId);
        const existingRole = existingGame.players.challenger?.playerId === playerData.identifier ? 'challenger' :
            existingGame.players.acceptor?.playerId === playerData.identifier ? 'acceptor' : null;
        let game;
        if (existingRole) {
            // Player is rejoining - use reconnection logic instead of join
            config_1.logger.info(`Player ${playerData.identifier} rejoining game ${gameId} as ${existingRole}`);
            game = await game_1.gameConnectionService.handleReconnection(gameId, playerData.identifier);
        }
        else {
            // New player joining
            game = await game_1.gameCreationService.joinGame(gameId, playerData);
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
                    if (gameObj.players.challenger && !gameObj.players.challenger.photoUrl)
                        gameObj.players.challenger.photoUrl = game.players.challenger?.photoUrl || null;
                    if (gameObj.players.acceptor && !gameObj.players.acceptor.photoUrl)
                        gameObj.players.acceptor.photoUrl = game.players.acceptor?.photoUrl || null;
                }
                const playerSpecificGame = {
                    ...gameObj,
                    statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
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
    move: (params, data) => data.number !== undefined
        ? game_1.gamePlayService.makeMove(params.gameId, params.playerId, data.number)
        : Promise.reject(new Error('Number is required')),
    markLine: (params, data) => data.numbers?.length
        ? game_1.gamePlayService.markLine(params.gameId, params.playerId, data.numbers)
        : Promise.reject(new Error('Numbers array is required')),
    claimBingo: (params) => game_1.gamePlayService.claimBingo(params.gameId, params.playerId)
};
// Higher-order function for game play handlers
const createGamePlayHandler = (operation, responseEvent) => async (socket, io, data, callback) => {
    try {
        const params = (0, math_1.validateSocketGameParams)(socket, data);
        if (!params)
            return;
        const game = await gamePlayOps[operation](params, data);
        // Send updated game state to all players in the room
        const socketsInRoom = await io.in(params.gameId).fetchSockets();
        for (const roomSocket of socketsInRoom) {
            const socketPlayerId = roomSocket.data.identifier;
            if (socketPlayerId) {
                // Generate player-specific status message
                const playerSpecificGame = {
                    ...ensurePlayerPhotoUrls(game.toObject(), game),
                    statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
                };
                roomSocket.emit(responseEvent, {
                    game: playerSpecificGame,
                    playerId: params.playerId
                });
            }
        }
        callback?.({ game: { ...ensurePlayerPhotoUrls(game.toObject(), game), statusMessage: (0, gameLogic_1.generateStatusMessage)(game, params.playerId) } });
        config_1.logger.info(`${operation} completed for ${params.playerId} in game ${params.gameId}`);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
        callback ? callback({ error: errorMsg }) : (0, math_1.handleSocketError)(error, socket, operation);
    }
};
// Handle rematch request
const handleRematch = async (socket, io, data, callback) => {
    try {
        const params = (0, math_1.validateSocketGameParams)(socket, data);
        if (!params)
            return;
        const { game, rematchGame } = await game_1.gameService.requestRematch(params.gameId, params.playerId);
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
            callback?.({ game: { ...ensurePlayerPhotoUrls(rematchGame.toObject(), rematchGame), statusMessage: (0, gameLogic_1.generateStatusMessage)(rematchGame, params.playerId) } });
            config_1.logger.info(`Rematch accepted - new game ${rematchGame.gameId} created from ${params.gameId}`);
        }
        else {
            // Only one player has requested rematch so far
            const socketsInRoom = await io.in(params.gameId).fetchSockets();
            for (const roomSocket of socketsInRoom) {
                const socketPlayerId = roomSocket.data.identifier;
                if (socketPlayerId) {
                    const playerSpecificGame = {
                        ...ensurePlayerPhotoUrls(game.toObject(), game),
                        statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
                    };
                    roomSocket.emit('game:rematchRequested', {
                        game: playerSpecificGame,
                        playerId: params.playerId
                    });
                }
            }
            callback?.({ game: { ...ensurePlayerPhotoUrls(game.toObject(), game), statusMessage: (0, gameLogic_1.generateStatusMessage)(game, params.playerId) } });
            config_1.logger.info(`Rematch requested by ${params.playerId} in game ${params.gameId}`);
        }
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
        callback ? callback({ error: errorMsg }) : (0, math_1.handleSocketError)(error, socket, 'rematch');
    }
};
// Handle player leaving game
const handlePlayerLeaving = async (socket, io, data, callback) => {
    try {
        const params = (0, math_1.validateSocketGameParams)(socket, data);
        if (!params)
            return;
        const [, game] = await Promise.all([
            player_1.playerConnectionService.handleDisconnection(params.playerId),
            game_1.gameConnectionService.handleDisconnection(params.gameId, params.playerId)
        ]);
        // Send player-specific status messages to each player in the room
        const socketsInRoom = await io.in(params.gameId).fetchSockets();
        for (const roomSocket of socketsInRoom) {
            const socketPlayerId = roomSocket.data.identifier;
            if (socketPlayerId) {
                const playerSpecificGame = {
                    ...game.toObject(),
                    statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
                };
                roomSocket.emit('player:left', {
                    game: playerSpecificGame,
                    playerId: params.playerId
                });
            }
        }
        callback?.({ success: true });
        config_1.logger.info(`Player leaving handled: ${params.playerId} from ${params.gameId}`);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
        callback ? callback({ error: errorMsg }) : (0, math_1.handleSocketError)(error, socket, 'playerLeaving');
    }
};
// Handle game disconnection
const handleGameDisconnectEvent = async (socket, io, data) => {
    try {
        const params = (0, math_1.validateSocketGameParams)(socket, data);
        if (!params)
            return;
        // Handle disconnection similar to socket disconnect
        const [, game] = await Promise.all([
            player_1.playerConnectionService.handleDisconnection(params.playerId),
            game_1.gameConnectionService.handleDisconnection(params.gameId, params.playerId)
        ]);
        // Send player-specific status messages to each player in the room
        const socketsInRoom = await io.in(params.gameId).fetchSockets();
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
                    playerId: params.playerId,
                    reconnectionTimeout: 60
                });
            }
        }
        config_1.logger.info(`Game disconnection handled: ${params.playerId} from ${params.gameId}`);
    }
    catch (error) {
        (0, math_1.handleSocketValidationError)(socket, error, 'game:disconnect');
    }
};
// Handle instant win for testing
const handleInstantWin = async (socket, io, data, callback) => {
    try {
        const params = (0, math_1.validateSocketGameParams)(socket, data);
        if (!params)
            return;
        const game = await game_1.gameService.instantWin(params.gameId, params.playerId);
        // Emit game completion to all players in the room
        const socketsInRoom = await io.in(params.gameId).fetchSockets();
        for (const roomSocket of socketsInRoom) {
            const socketPlayerId = roomSocket.data.identifier;
            if (socketPlayerId) {
                const playerSpecificGame = {
                    ...game.toObject(),
                    statusMessage: (0, gameLogic_1.generateStatusMessage)(game, socketPlayerId)
                };
                roomSocket.emit('game:bingoClaimedBy', {
                    game: playerSpecificGame,
                    winner: game.winner,
                    playerId: params.playerId
                });
            }
        }
        callback?.({ success: true, game: { ...game.toObject(), statusMessage: (0, gameLogic_1.generateStatusMessage)(game, params.playerId) } });
        config_1.logger.info(`Instant win completed by ${params.playerId} in game ${params.gameId}`);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
        callback ? callback({ error: errorMsg }) : (0, math_1.handleSocketError)(error, socket, 'instantWin');
    }
};
exports.gameEventHandlers = {
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
exports.handleGameCreate = exports.gameEventHandlers["game:create"], exports.handleGameJoin = exports.gameEventHandlers["game:join"], exports.handleGameMove = exports.gameEventHandlers["game:move"], exports.handleMarkLine = exports.gameEventHandlers["game:markLine"], exports.handleClaimBingo = exports.gameEventHandlers["game:claimBingo"], exports.handleRequestRematch = exports.gameEventHandlers["game:requestRematch"];
exports.handleGameDisconnectExport = exports.gameEventHandlers['game:disconnect'];
exports.handlePlayerLeavingExport = exports.gameEventHandlers['game:playerLeaving'];
