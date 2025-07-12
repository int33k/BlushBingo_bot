"use strict";
/**
 * Shared Game Constants - Consolidated from multiple files
 * Eliminates constant duplication across platforms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_MESSAGES = exports.API_ENDPOINTS = exports.SOCKET_EVENTS = exports.LETTER_RANGES = exports.DEFAULT_DISCONNECTION_TIMEOUT = exports.MAX_PLAYERS = exports.DEFAULT_REQUIRED_LINES_FOR_BINGO = exports.BINGO_LETTERS = exports.CARD_RANGE = exports.CARD_SIZE = void 0;
// Core game constants
exports.CARD_SIZE = 5;
exports.CARD_RANGE = { min: 1, max: 75 };
exports.BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
// Game rules
exports.DEFAULT_REQUIRED_LINES_FOR_BINGO = 5;
exports.MAX_PLAYERS = 2;
exports.DEFAULT_DISCONNECTION_TIMEOUT = 30; // seconds
// Card generation ranges by letter
exports.LETTER_RANGES = {
    B: { min: 1, max: 15 },
    I: { min: 16, max: 30 },
    N: { min: 31, max: 45 },
    G: { min: 46, max: 60 },
    O: { min: 61, max: 75 }
};
// Socket event names
exports.SOCKET_EVENTS = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    // Authentication events
    AUTH: 'auth',
    AUTH_SUCCESS: 'auth_success',
    AUTH_ERROR: 'auth_error',
    // Game lifecycle events
    CREATE_GAME: 'create_game',
    JOIN_GAME: 'join_game',
    PLAYER_READY: 'player_ready',
    GAME_STARTED: 'game_started',
    GAME_ENDED: 'game_ended',
    // Gameplay events
    MAKE_MOVE: 'make_move',
    MOVE_MADE: 'move_made',
    BINGO_STOP: 'bingo_stop',
    // Connection status events
    PLAYER_CONNECTED: 'player_connected',
    PLAYER_DISCONNECTED: 'player_disconnected',
    PLAYER_RECONNECTED: 'player_reconnected',
    // Rematch events
    REQUEST_REMATCH: 'request_rematch',
    REMATCH_REQUESTED: 'rematch_requested',
    REMATCH_ACCEPTED: 'rematch_accepted',
    // Error events
    ERROR: 'error',
    GAME_ERROR: 'game_error'
};
// API endpoints
exports.API_ENDPOINTS = {
    HEALTH: '/health',
    CREATE_GAME: '/games',
    JOIN_GAME: '/games/join',
    GET_GAME: '/games/:gameId',
    PLAYER_READY: '/games/:gameId/ready',
    MAKE_MOVE: '/games/:gameId/move',
    BINGO_STOP: '/games/:gameId/bingo',
    REQUEST_REMATCH: '/games/:gameId/rematch'
};
// Game status messages
exports.STATUS_MESSAGES = {
    WAITING_FOR_PLAYERS: 'Waiting for players to join...',
    WAITING_FOR_READY: 'Waiting for players to be ready...',
    GAME_IN_PROGRESS: 'Game in progress',
    GAME_COMPLETED: 'Game completed',
    PLAYER_DISCONNECTED: 'Player disconnected',
    RECONNECTION_TIMEOUT: 'Reconnection timeout'
};
