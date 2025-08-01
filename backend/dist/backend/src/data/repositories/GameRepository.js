"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRepository = void 0;
/**
 * Ultra-optimized Game repository with consolidated operations and smart query patterns
 */
const Game_1 = require("../../models/Game");
const BaseRepository_1 = require("./BaseRepository");
class GameRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(...arguments);
        // Smart query patterns with consolidated logic
        this.activeGameQuery = (playerId) => ({
            $and: [
                { status: { $in: ['waiting', 'lobby', 'playing'] } },
                { $or: [{ 'players.challenger.playerId': playerId }, { 'players.acceptor.playerId': playerId }] }
            ]
        });
        this.playerGameQuery = (playerId) => ({
            $or: [{ 'players.challenger.playerId': playerId }, { 'players.acceptor.playerId': playerId }]
        });
    }
    async findById(gameId) {
        return this.executeOrThrow(() => Game_1.Game.findOne({ gameId }), 'Error finding game by ID');
    }
    async findActiveByPlayerId(playerId) {
        return this.executeOrThrow(() => Game_1.Game.findOne(this.activeGameQuery(playerId)), 'Error finding active game by player ID');
    }
    // findWithExpiredDisconnectionTimers removed - immediate disconnection handling
    async save(game) {
        return this.executeOrThrow(() => game.save(), 'Error saving game');
    }
    async create(gameData) {
        return this.executeOrThrow(() => new Game_1.Game(gameData).save(), 'Error creating game');
    }
    async updateById(gameId, updateData) {
        return this.executeOrThrow(() => Game_1.Game.findOneAndUpdate({ gameId }, { $set: updateData }, { new: true }), 'Error updating game by ID');
    }
    async deleteById(gameId) {
        return this.executeOrThrow(async () => (await Game_1.Game.deleteOne({ gameId })).deletedCount > 0, 'Error deleting game by ID');
    }
    async deleteAllByPlayerId(playerId) {
        return this.executeOrThrow(async () => {
            const result = await Game_1.Game.deleteMany(this.playerGameQuery(playerId));
            return result.deletedCount || 0;
        }, 'Error deleting games by player ID');
    }
    async findCompletedByPlayerId(playerId) {
        return this.executeOrThrow(() => Game_1.Game.find({ status: 'completed', ...this.playerGameQuery(playerId) }).sort({ createdAt: -1 }), 'Error finding completed games by player ID');
    }
}
exports.GameRepository = GameRepository;
