"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerRepository = void 0;
/**
 * Ultra-optimized Player repository with consolidated error handling
 */
const Player_1 = require("../../models/Player");
const BaseRepository_1 = require("./BaseRepository");
class PlayerRepository extends BaseRepository_1.BaseRepository {
    async findById(playerId) {
        return this.execute(() => Player_1.Player.findOne({ playerId }), 'Error finding player by ID');
    }
    async findBySocketId(socketId) {
        return this.execute(() => Player_1.Player.findOne({ socketId }), 'Error finding player by socket ID');
    }
    async create(playerData) {
        return this.executeOrThrow(() => Player_1.Player.create(playerData), 'Error creating player');
    }
    async updateById(playerId, updateData) {
        return this.execute(() => Player_1.Player.findOneAndUpdate({ playerId }, updateData, { new: true }), 'Error updating player');
    }
    async save(player) {
        return this.executeOrThrow(() => player.save(), 'Error saving player');
    }
}
exports.PlayerRepository = PlayerRepository;
