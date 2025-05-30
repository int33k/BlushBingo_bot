/**
 * Services module index
 *
 * IMPORTANT: To reduce confusion and avoid circular dependencies,
 * it's recommended to import directly from specific service modules rather than
 * using this consolidated export file.
 *
 * For example, instead of:
 * import { gameService, playerService } from '../services';
 *
 * Use:
 * import { gameService } from '../services/game';
 * import { playerService } from '../services/player';
 * import { initializeSocket } from '../services/socket';
 *
 * This file is maintained for backward compatibility but may be deprecated in the future.
 */

// Game services
export * from './game';

// Player services
export * from './player';

// Socket service
export { initializeSocket } from './socket';