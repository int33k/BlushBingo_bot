"use strict";
/**
 * Game services module
 *
 * This module provides access to game-related services through a single GameService
 * implementation that implements multiple service interfaces for different aspects
 * of game functionality.
 *
 * Usage:
 * - For general game operations: import { gameService } from './services/game';
 * - For game creation: import { gameCreationService } from './services/game';
 * - For gameplay: import { gamePlayService } from './services/game';
 * - For connection handling: import { gameConnectionService } from './services/game';
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = exports.gameConnectionService = exports.gamePlayService = exports.gameCreationService = exports.gameService = void 0;
// Import service implementation
const GameService_1 = require("./GameService");
Object.defineProperty(exports, "GameService", { enumerable: true, get: function () { return GameService_1.GameService; } });
// Create singleton instance
const gameServiceInstance = new GameService_1.GameService();
// Create service instances with appropriate interfaces
const gameService = gameServiceInstance;
exports.gameService = gameService;
const gameCreationService = gameServiceInstance;
exports.gameCreationService = gameCreationService;
const gamePlayService = gameServiceInstance;
exports.gamePlayService = gamePlayService;
const gameConnectionService = gameServiceInstance;
exports.gameConnectionService = gameConnectionService;
