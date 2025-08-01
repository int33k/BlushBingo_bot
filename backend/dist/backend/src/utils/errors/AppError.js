"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlayerNotReadyError = exports.createPlayerAlreadyInGameError = exports.createPlayerNotFoundError = exports.createInvalidMoveError = exports.createNotYourTurnError = exports.createGameStateError = exports.createGameFullError = exports.createGameNotFoundError = exports.createValidationError = exports.AppError = exports.defaultErrorMessages = exports.errorStatusCodes = exports.ErrorCode = void 0;
// Ultra-optimized error system with consolidated configuration and factory patterns
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["GAME_NOT_FOUND"] = "GAME_NOT_FOUND";
    ErrorCode["GAME_FULL"] = "GAME_FULL";
    ErrorCode["INVALID_GAME_STATE"] = "INVALID_GAME_STATE";
    ErrorCode["PLAYER_NOT_FOUND"] = "PLAYER_NOT_FOUND";
    ErrorCode["PLAYER_ALREADY_IN_GAME"] = "PLAYER_ALREADY_IN_GAME";
    ErrorCode["PLAYER_NOT_READY"] = "PLAYER_NOT_READY";
    ErrorCode["INVALID_MOVE"] = "INVALID_MOVE";
    ErrorCode["NOT_YOUR_TURN"] = "NOT_YOUR_TURN";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ErrorCode["DUPLICATE_KEY"] = "DUPLICATE_KEY";
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["SOCKET_ERROR"] = "SOCKET_ERROR";
    ErrorCode["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
// Consolidated error configuration with status codes and messages
const errorConfig = {
    [ErrorCode.AUTHENTICATION_FAILED]: { status: 401, message: 'Authentication failed' },
    [ErrorCode.UNAUTHORIZED]: { status: 403, message: 'Unauthorized access' },
    [ErrorCode.GAME_NOT_FOUND]: { status: 404, message: 'Game not found' },
    [ErrorCode.GAME_FULL]: { status: 400, message: 'Game is already full' },
    [ErrorCode.INVALID_GAME_STATE]: { status: 400, message: 'Invalid game state' },
    [ErrorCode.PLAYER_NOT_FOUND]: { status: 404, message: 'Player not found' },
    [ErrorCode.PLAYER_ALREADY_IN_GAME]: { status: 400, message: 'Player is already in a game' },
    [ErrorCode.PLAYER_NOT_READY]: { status: 400, message: 'Player is not ready' },
    [ErrorCode.INVALID_MOVE]: { status: 400, message: 'Invalid move' },
    [ErrorCode.NOT_YOUR_TURN]: { status: 400, message: 'Not your turn' },
    [ErrorCode.VALIDATION_ERROR]: { status: 400, message: 'Validation error' },
    [ErrorCode.MISSING_REQUIRED_FIELD]: { status: 400, message: 'Missing required field' },
    [ErrorCode.DUPLICATE_KEY]: { status: 400, message: 'Duplicate key error' },
    [ErrorCode.INTERNAL_SERVER_ERROR]: { status: 500, message: 'Internal server error' },
    [ErrorCode.DATABASE_ERROR]: { status: 500, message: 'Database error' },
    [ErrorCode.SOCKET_ERROR]: { status: 500, message: 'Socket error' },
    [ErrorCode.CONNECTION_ERROR]: { status: 500, message: 'Connection error' },
    [ErrorCode.UNKNOWN_ERROR]: { status: 500, message: 'Unknown error' }
};
// Extract status codes and messages using functional programming
exports.errorStatusCodes = Object.fromEntries(Object.entries(errorConfig).map(([k, v]) => [k, v.status]));
exports.defaultErrorMessages = Object.fromEntries(Object.entries(errorConfig).map(([k, v]) => [k, v.message]));
// Ultra-compact AppError class with optimized constructor
class AppError extends Error {
    constructor(message, code, statusCode = errorConfig[code].status, isOperational = true, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Higher-order error factory with template literal optimization
const createError = (code, msgTemplate = () => exports.defaultErrorMessages[code]) => (params, details) => new AppError(msgTemplate(params), code, undefined, true, details);
// Optimized error factories using functional composition
exports.createValidationError = createError(ErrorCode.VALIDATION_ERROR, ({ message }) => message);
exports.createGameNotFoundError = createError(ErrorCode.GAME_NOT_FOUND, ({ gameId }) => `Game with ID ${gameId} not found`);
exports.createGameFullError = createError(ErrorCode.GAME_FULL, ({ gameId }) => `Game ${gameId} is already full`);
exports.createGameStateError = createError(ErrorCode.INVALID_GAME_STATE, ({ currentState, expectedStates }) => `Game is not in ${expectedStates.join(' or ')} state. Current state: ${currentState}`);
exports.createNotYourTurnError = createError(ErrorCode.NOT_YOUR_TURN, ({ gameId, playerId }) => `Not your turn in game ${gameId} for player ${playerId}`);
exports.createInvalidMoveError = createError(ErrorCode.INVALID_MOVE, ({ gameId, playerId, move, reason }) => `Invalid move ${move} by player ${playerId} in game ${gameId}: ${reason}`);
exports.createPlayerNotFoundError = createError(ErrorCode.PLAYER_NOT_FOUND, ({ gameId, playerId }) => `Player ${playerId} not found in game ${gameId}`);
exports.createPlayerAlreadyInGameError = createError(ErrorCode.PLAYER_ALREADY_IN_GAME, ({ playerId }) => `Player ${playerId} is already in a game`);
exports.createPlayerNotReadyError = createError(ErrorCode.PLAYER_NOT_READY, ({ gameId, playerId }) => `Player ${playerId} is not ready in game ${gameId}`);
