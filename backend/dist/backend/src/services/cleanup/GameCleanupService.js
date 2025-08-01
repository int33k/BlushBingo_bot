"use strict";
/**
 * Game Cleanup Service
 * Handles automated deletion of completed games after a delay
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameCleanupService = exports.GameCleanupService = void 0;
const repositories_1 = require("../../data/repositories");
const config_1 = require("../../config");
class GameCleanupService {
    constructor(repository = repositories_1.gameRepository) {
        this.repository = repository;
        this.scheduledDeletions = new Map();
    }
    static getInstance() {
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
    scheduleGameDeletion(gameId, delayMs = 30000) {
        // Cancel any existing scheduled deletion for this game
        const existingTimeoutId = this.scheduledDeletions.get(gameId);
        if (existingTimeoutId) {
            clearTimeout(existingTimeoutId);
            this.scheduledDeletions.delete(gameId);
        }
        config_1.logger.info(`Scheduling deletion of completed game ${gameId} in ${delayMs}ms`);
        const timeoutId = setTimeout(async () => {
            try {
                await this.deleteGame(gameId);
                this.scheduledDeletions.delete(gameId);
            }
            catch (error) {
                config_1.logger.error(`Failed to delete completed game ${gameId}:`, error);
                this.scheduledDeletions.delete(gameId);
            }
        }, delayMs);
        this.scheduledDeletions.set(gameId, timeoutId);
    }
    /**
     * Cancel a scheduled cleanup for a game (useful when someone reconnects)
     * @param gameId - The ID of the game to cancel cleanup for
     */
    cancelScheduledCleanup(gameId) {
        const existingTimeoutId = this.scheduledDeletions.get(gameId);
        if (existingTimeoutId) {
            clearTimeout(existingTimeoutId);
            this.scheduledDeletions.delete(gameId);
            config_1.logger.info(`Cancelled scheduled cleanup for game ${gameId} due to reconnection`);
        }
    }
    /**
     * Delete a game from the database
     * @param gameId - The ID of the game to delete
     */
    async deleteGame(gameId) {
        try {
            const deleted = await this.repository.deleteById(gameId);
            if (deleted) {
                config_1.logger.info(`Successfully deleted completed game ${gameId}`);
            }
            else {
                config_1.logger.warn(`Game ${gameId} was not found during scheduled deletion`);
            }
        }
        catch (error) {
            config_1.logger.error(`Error deleting game ${gameId}:`, error);
            throw error;
        }
    }
    /**
     * Get the count of currently scheduled deletions (for monitoring)
     */
    getScheduledDeletionsCount() {
        return this.scheduledDeletions.size;
    }
    /**
     * Get all scheduled game IDs (for monitoring)
     */
    getScheduledGameIds() {
        return Array.from(this.scheduledDeletions.keys());
    }
    /**
     * Clear all scheduled deletions (useful for testing or shutdown)
     */
    clearAllScheduledDeletions() {
        this.scheduledDeletions.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        this.scheduledDeletions.clear();
        config_1.logger.info('Cleared all scheduled game deletions');
    }
}
exports.GameCleanupService = GameCleanupService;
exports.gameCleanupService = GameCleanupService.getInstance();
