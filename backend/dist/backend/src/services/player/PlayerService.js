"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
const repositories_1 = require("../../data/repositories");
const game_1 = require("../game");
const errors_1 = require("../../utils/errors");
const config_1 = require("../../config");
class PlayerService {
    constructor(repository = repositories_1.playerRepository) {
        this.repository = repository;
        // Ultra-compact operations with functional composition and error optimization
        this.withPlayer = async (playerId, operation) => operation(await this.repository.findById(playerId) ?? (() => { throw (0, errors_1.createPlayerNotFoundError)({ gameId: '', playerId }); })());
        this.createOrGetPlayer = async (playerId, name, socketId) => this.getPlayerById(playerId).catch(() => this.repository.create({
            playerId, name: name || `Player_${playerId.substring(0, 5)}`,
            ...(socketId && { socketId }), connected: !!socketId, status: 'waiting'
        }));
        this.handleGameOp = async (playerId, operation) => (await this.getPlayerById(playerId), operation());
        this.logExec = async (operation, errorMsg) => {
            try {
                return await operation();
            }
            catch (error) {
                config_1.logger.error(`${errorMsg}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        };
        // Ultra-compact public interface with arrow functions and method chaining
        this.getPlayerById = (playerId) => this.withPlayer(playerId, p => p);
        this.findPlayerBySocketId = (socketId) => this.repository.findBySocketId(socketId);
        this.updatePlayer = (playerId, updateData) => this.repository.updateById(playerId, updateData).then(p => p ?? (() => { throw (0, errors_1.createPlayerNotFoundError)({ gameId: '', playerId }); })());
        // Game operations with optimized error handling
        this.setPlayerReady = (gameId, playerId, card = null) => this.handleGameOp(playerId, () => game_1.gameCreationService.setPlayerReady(gameId, playerId, card));
        this.makeMove = (gameId, playerId, number) => this.handleGameOp(playerId, () => game_1.gamePlayService.makeMove(gameId, playerId, number));
        this.claimBingo = (gameId, playerId) => this.handleGameOp(playerId, () => game_1.gamePlayService.claimBingo(gameId, playerId));
        // Connection operations with functional composition and logging optimization
        this.handleConnection = (playerId, socketId, explicitGameId) => this.logExec(async () => {
            const player = await this.createOrGetPlayer(playerId, undefined, socketId);
            const wasDisconnected = !player.connected;
            Object.assign(player, { socketId, connected: true });
            await this.repository.save(player);
            // Auto-reconnect optimization with conditional chaining
            // Only auto-reconnect if there's no explicit game ID (to avoid race conditions with manual joins)
            if (!explicitGameId && wasDisconnected) {
                const activeGame = await game_1.gameConnectionService.findActiveGameByPlayerId(playerId);
                if (activeGame) {
                    // Small delay to allow explicit join events to be processed first
                    setTimeout(async () => {
                        try {
                            await game_1.gameConnectionService.handleReconnection(activeGame.gameId, playerId);
                            config_1.logger.info(`Player ${playerId} auto-reconnected to game ${activeGame.gameId}`);
                        }
                        catch (error) {
                            config_1.logger.debug(`Auto-reconnection failed for ${playerId}, likely joined explicitly: ${error}`);
                        }
                    }, 100); // 100ms delay
                }
            }
            return (config_1.logger.info(`Player ${playerId} connected with socket ${socketId}`), player);
        }, 'Error handling player connection');
        this.handleDisconnection = (playerId) => this.logExec(async () => {
            const player = await this.getPlayerById(playerId);
            player.connected = false;
            await this.repository.save(player);
            const activeGame = await game_1.gameConnectionService.findActiveGameByPlayerId(playerId);
            activeGame && (await game_1.gameConnectionService.handleDisconnection(activeGame.gameId, playerId),
                config_1.logger.info(`Player ${playerId} disconnected from game ${activeGame.gameId}`));
            return (config_1.logger.info(`Player ${playerId} disconnected`), player);
        }, 'Error handling player disconnection');
        this.associateWithGame = (playerId, gameId, playerName) => this.logExec(async () => {
            const player = await this.createOrGetPlayer(playerId, playerName);
            return (player.gameId = gameId, await this.repository.save(player),
                config_1.logger.info(`Player ${playerId} associated with game ${gameId}`), player);
        }, 'Error associating player with game');
    }
}
exports.PlayerService = PlayerService;
