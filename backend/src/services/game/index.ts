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

// Import service interfaces
import {
  IGameService,
  IGameCreationService,
  IGamePlayService,
  IGameConnectionService
} from './IGameService';

// Import service implementation
import { GameService } from './GameService';

// Create singleton instance
const gameServiceInstance = new GameService();

// Create service instances with appropriate interfaces
const gameService: IGameService = gameServiceInstance;
const gameCreationService: IGameCreationService = gameServiceInstance;
const gamePlayService: IGamePlayService = gameServiceInstance;
const gameConnectionService: IGameConnectionService = gameServiceInstance;

// Export service instances
export {
  gameService,
  gameCreationService,
  gamePlayService,
  gameConnectionService
};

// Export service interfaces for type usage
export {
  IGameService,
  IGameCreationService,
  IGamePlayService,
  IGameConnectionService
};

// Export service implementations
export {
  GameService
};
