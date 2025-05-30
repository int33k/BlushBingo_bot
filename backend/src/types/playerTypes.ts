/**
 * Player-related type definitions - Using shared types to eliminate duplication
 */

import { PlayerRole, PlayerStatus, Player } from '../../../shared/types/game';

// Re-export shared types for backend compatibility
export { PlayerRole, PlayerStatus };

// Backend-specific player interface extending shared interface
export interface IPlayer extends Player {
  identifier?: string;
  socketId?: string;
  score?: number;
  gameId?: string;
}
