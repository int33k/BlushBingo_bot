"use strict";
/**
 * Shared Validation Schemas - Cross-platform validation
 * Eliminates validation duplication between frontend and backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMove = exports.validateJoinGame = exports.validateCreateGame = exports.validateGameNumber = exports.validatePlayerName = exports.validatePlayerId = exports.validateGameId = exports.validateNumber = exports.validateString = void 0;
const game_1 = require("../constants/game");
// Basic validation functions that work across platforms
const validateString = (value, fieldName, required = true) => {
    const errors = [];
    if (required && (value === undefined || value === null || value === '')) {
        errors.push(`${fieldName} is required`);
    }
    else if (value !== undefined && value !== null && typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
    }
    return { isValid: errors.length === 0, errors };
};
exports.validateString = validateString;
const validateNumber = (value, fieldName, min, max, required = true) => {
    const errors = [];
    if (required && (value === undefined || value === null)) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
    }
    if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${fieldName} must be a number`);
        }
        else {
            if (min !== undefined && value < min) {
                errors.push(`${fieldName} must be at least ${min}`);
            }
            if (max !== undefined && value > max) {
                errors.push(`${fieldName} must be at most ${max}`);
            }
        }
    }
    return { isValid: errors.length === 0, errors };
};
exports.validateNumber = validateNumber;
// Game-specific validation functions
const validateGameId = (gameId) => {
    return (0, exports.validateString)(gameId, 'gameId');
};
exports.validateGameId = validateGameId;
const validatePlayerId = (playerId) => {
    return (0, exports.validateString)(playerId, 'playerId');
};
exports.validatePlayerId = validatePlayerId;
const validatePlayerName = (playerName) => {
    return (0, exports.validateString)(playerName, 'playerName');
};
exports.validatePlayerName = validatePlayerName;
const validateGameNumber = (number) => {
    return (0, exports.validateNumber)(number, 'number', game_1.CARD_RANGE.min, game_1.CARD_RANGE.max);
};
exports.validateGameNumber = validateGameNumber;
// Composite validation functions for common request types
const validateCreateGame = (data) => {
    const errors = [];
    const playerIdResult = (0, exports.validatePlayerId)(data?.playerId);
    const playerNameResult = (0, exports.validatePlayerName)(data?.playerName);
    errors.push(...playerIdResult.errors, ...playerNameResult.errors);
    return { isValid: errors.length === 0, errors };
};
exports.validateCreateGame = validateCreateGame;
const validateJoinGame = (data) => {
    const errors = [];
    const gameIdResult = (0, exports.validateGameId)(data?.gameId);
    const playerIdResult = (0, exports.validatePlayerId)(data?.playerId);
    const playerNameResult = (0, exports.validatePlayerName)(data?.playerName);
    errors.push(...gameIdResult.errors, ...playerIdResult.errors, ...playerNameResult.errors);
    return { isValid: errors.length === 0, errors };
};
exports.validateJoinGame = validateJoinGame;
const validateMove = (data) => {
    const errors = [];
    const playerIdResult = (0, exports.validatePlayerId)(data?.playerId);
    const gameIdResult = (0, exports.validateGameId)(data?.gameId);
    const numberResult = (0, exports.validateGameNumber)(data?.number);
    errors.push(...playerIdResult.errors, ...gameIdResult.errors, ...numberResult.errors);
    return { isValid: errors.length === 0, errors };
};
exports.validateMove = validateMove;
