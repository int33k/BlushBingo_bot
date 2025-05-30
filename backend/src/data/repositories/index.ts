/**
 * Ultra-optimized repositories with singleton instances and consolidated exports
 */
import { PlayerRepository } from './PlayerRepository';
import { GameRepository } from './GameRepository';

// Singleton instances with immediate export
export const playerRepository = new PlayerRepository();
export const gameRepository = new GameRepository();

// Consolidated exports for all repository types and implementations
export * from './BaseRepository';
export * from './IPlayerRepository';
export * from './PlayerRepository';
export * from './IGameRepository';
export * from './GameRepository';
