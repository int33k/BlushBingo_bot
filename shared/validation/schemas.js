"use strict";
/**
 * Shared Validation Schemas - Cross-platform validation
 * Eliminates validation duplication between frontend and backend
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMove = exports.validateJoinGame = exports.validateCreateGame = exports.validateGameNumber = exports.validatePlayerName = exports.validatePlayerId = exports.validateGameId = exports.validateNumber = exports.validateString = void 0;
var game_1 = require("../constants/game");
// Basic validation functions that work across platforms
var validateString = function (value, fieldName, required) {
    if (required === void 0) { required = true; }
    var errors = [];
    if (required && (value === undefined || value === null || value === '')) {
        errors.push("".concat(fieldName, " is required"));
    }
    else if (value !== undefined && value !== null && typeof value !== 'string') {
        errors.push("".concat(fieldName, " must be a string"));
    }
    return { isValid: errors.length === 0, errors: errors };
};
exports.validateString = validateString;
var validateNumber = function (value, fieldName, min, max, required) {
    if (required === void 0) { required = true; }
    var errors = [];
    if (required && (value === undefined || value === null)) {
        errors.push("".concat(fieldName, " is required"));
        return { isValid: false, errors: errors };
    }
    if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || isNaN(value)) {
            errors.push("".concat(fieldName, " must be a number"));
        }
        else {
            if (min !== undefined && value < min) {
                errors.push("".concat(fieldName, " must be at least ").concat(min));
            }
            if (max !== undefined && value > max) {
                errors.push("".concat(fieldName, " must be at most ").concat(max));
            }
        }
    }
    return { isValid: errors.length === 0, errors: errors };
};
exports.validateNumber = validateNumber;
// Game-specific validation functions
var validateGameId = function (gameId) {
    return (0, exports.validateString)(gameId, 'gameId');
};
exports.validateGameId = validateGameId;
var validatePlayerId = function (playerId) {
    return (0, exports.validateString)(playerId, 'playerId');
};
exports.validatePlayerId = validatePlayerId;
var validatePlayerName = function (playerName) {
    return (0, exports.validateString)(playerName, 'playerName');
};
exports.validatePlayerName = validatePlayerName;
var validateGameNumber = function (number) {
    return (0, exports.validateNumber)(number, 'number', game_1.CARD_RANGE.min, game_1.CARD_RANGE.max);
};
exports.validateGameNumber = validateGameNumber;
// Composite validation functions for common request types
var validateCreateGame = function (data) {
    var errors = [];
    var playerIdResult = (0, exports.validatePlayerId)(data === null || data === void 0 ? void 0 : data.playerId);
    var playerNameResult = (0, exports.validatePlayerName)(data === null || data === void 0 ? void 0 : data.playerName);
    errors.push.apply(errors, __spreadArray(__spreadArray([], playerIdResult.errors, false), playerNameResult.errors, false));
    return { isValid: errors.length === 0, errors: errors };
};
exports.validateCreateGame = validateCreateGame;
var validateJoinGame = function (data) {
    var errors = [];
    var gameIdResult = (0, exports.validateGameId)(data === null || data === void 0 ? void 0 : data.gameId);
    var playerIdResult = (0, exports.validatePlayerId)(data === null || data === void 0 ? void 0 : data.playerId);
    var playerNameResult = (0, exports.validatePlayerName)(data === null || data === void 0 ? void 0 : data.playerName);
    errors.push.apply(errors, __spreadArray(__spreadArray(__spreadArray([], gameIdResult.errors, false), playerIdResult.errors, false), playerNameResult.errors, false));
    return { isValid: errors.length === 0, errors: errors };
};
exports.validateJoinGame = validateJoinGame;
var validateMove = function (data) {
    var errors = [];
    var playerIdResult = (0, exports.validatePlayerId)(data === null || data === void 0 ? void 0 : data.playerId);
    var gameIdResult = (0, exports.validateGameId)(data === null || data === void 0 ? void 0 : data.gameId);
    var numberResult = (0, exports.validateGameNumber)(data === null || data === void 0 ? void 0 : data.number);
    errors.push.apply(errors, __spreadArray(__spreadArray(__spreadArray([], playerIdResult.errors, false), gameIdResult.errors, false), numberResult.errors, false));
    return { isValid: errors.length === 0, errors: errors };
};
exports.validateMove = validateMove;
