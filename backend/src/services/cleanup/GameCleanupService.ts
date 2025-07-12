/**
 * Game Cleanup Service
 * Handles automated deletion of completed games after a delay
 */

import { IGameRepository } from '../../data/repositories/IGameRepository';
import { gameRepository } from '../../data/repositories';
import { logger } from '../../config';

export class GameCleanupService {
  private static instance: GameCleanupService;
  private scheduledDeletions = new Map<string, NodeJS.Timeout>();

  constructor(private repository: IGameRepository = gameRepository) {}

  static getInstance(): GameCleanupService {
    if (!GameCleanupService.instance) {
      GameCleanupService.instance = new GameCleanupService();
    }
    return GameCleanupService.instance;
  }

  /**
   * Schedule a game for deletion after the specified delay
   * @param gameId - The ID of the game to delete
   * @param delayMs - Delay in milliseconds (default: 30 seconds)
   */
  scheduleGameDeletion(gameId: string, delayMs: number = 30000): void {
    // Cancel any existing scheduled deletion for this game
    const existingTimeoutId = this.scheduledDeletions.get(gameId);
    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
      this.scheduledDeletions.delete(gameId);
    }

    logger.info(`Scheduling deletion of completed game ${gameId} in ${delayMs}ms`);

    const timeoutId = setTimeout(async () => {
      try {
        await this.deleteGame(gameId);
        this.scheduledDeletions.delete(gameId);
      } catch (error) {
        logger.error(`Failed to delete completed game ${gameId}:`, error);
        this.scheduledDeletions.delete(gameId);
      }
    }, delayMs);

    this.scheduledDeletions.set(gameId, timeoutId);
  }

  /**
   * Cancel a scheduled cleanup for a game (useful when someone reconnects)
   * @param gameId - The ID of the game to cancel cleanup for
   */
  cancelScheduledCleanup(gameId: string): void {
    const existingTimeoutId = this.scheduledDeletions.get(gameId);
    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
      this.scheduledDeletions.delete(gameId);
      logger.info(`Cancelled scheduled cleanup for game ${gameId} due to reconnection`);
    }
  }

  /**
   * Delete a game from the database
   * @param gameId - The ID of the game to delete
   */
  private async deleteGame(gameId: string): Promise<void> {
    try {
      const deleted = await this.repository.deleteById(gameId);
      if (deleted) {
        logger.info(`Successfully deleted completed game ${gameId}`);
      } else {
        logger.warn(`Game ${gameId} was not found during scheduled deletion`);
      }
    } catch (error) {
      logger.error(`Error deleting game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get the count of currently scheduled deletions (for monitoring)
   */
  getScheduledDeletionsCount(): number {
    return this.scheduledDeletions.size;
  }

  /**
   * Get all scheduled game IDs (for monitoring)
   */
  getScheduledGameIds(): string[] {
    return Array.from(this.scheduledDeletions.keys());
  }

  /**
   * Clear all scheduled deletions (useful for testing or shutdown)
   */
  clearAllScheduledDeletions(): void {
    this.scheduledDeletions.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledDeletions.clear();
    logger.info('Cleared all scheduled game deletions');
  }
}

export const gameCleanupService = GameCleanupService.getInstance();
