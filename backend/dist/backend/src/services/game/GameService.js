"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const game_1 = require("../../../../shared/constants/game");
const repositories_1 = require("../../data/repositories");
const errors_1 = require("../../utils/errors");
const gameLogic_1 = require("../../utils/gameLogic");
const cardUtils_1 = require("../../utils/cardUtils");
const Game_1 = require("../../models/Game");
const config_1 = require("../../config");
const GameCleanupService_1 = require("../cleanup/GameCleanupService");
class GameService {
    constructor(repository = repositories_1.gameRepository) {
        this.repository = repository;
        // ===== Helper Methods =====
        this.generateGameCode = () => Math.floor(100000 + Math.random() * 900000).toString();
        this.extractPlayerData = (data, defaultName) => {
            const playerId = data.playerId || data.identifier;
            if (!playerId)
                throw new Error('Player identifier is required');
            return { playerId, name: data.name || defaultName };
        };
        this.createPlayerObject = (playerId, name, status = 'waiting') => ({
            playerId, name, status, connected: true, card: undefined, markedCells: [], completedLines: 0, markedLetters: []
        });
        this.validateNumbers = (gameId, playerId, numbers) => {
            const nums = [numbers].flat();
            if (!nums.length)
                throw (0, errors_1.createInvalidMoveError)({ gameId, playerId, move: 0, reason: 'No numbers provided' });
            nums.forEach(n => { if (n < 1 || n > 25)
                throw (0, errors_1.createInvalidMoveError)({ gameId, playerId, move: n, reason: 'Invalid number' }); });
            return nums;
        };
    }
    async getGameById(gameId) {
        const game = await this.repository.findById(gameId);
        if (!game)
            throw (0, errors_1.createGameNotFoundError)(gameId);
        return game;
    }
    async findActiveGameByPlayerId(playerId) { return this.repository.findActiveByPlayerId(playerId); }
    async generateUniqueGameId() {
        for (let i = 0; i < 10; i++) {
            const id = this.generateGameCode();
            try {
                if (!(await this.repository.findById(id)))
                    return id;
            }
            catch {
                return id;
            }
        }
        return this.generateGameCode();
    }
    async executeGameOperation(gameId, playerId, operation, requiresTurn = false) {
        const game = await this.getGameById(gameId);
        const { playerRole, player } = (0, gameLogic_1.findPlayerRole)(game, playerId);
        if (!player)
            throw (0, errors_1.createPlayerNotFoundError)({ gameId, playerId });
        if (requiresTurn && !(0, gameLogic_1.isPlayerTurn)(game, playerRole))
            throw (0, errors_1.createNotYourTurnError)({ gameId, playerId });
        // Store original state for delta calculation and completion check
        const originalMoveCount = game.moves?.length || 0;
        const wasCompleted = game.status === 'completed';
        const result = await operation(game, playerRole, player);
        (0, gameLogic_1.updateLastActivity)(game);
        await this.repository.save(game);
        // Schedule deletion if game just became completed
        if (!wasCompleted && game.status === 'completed') {
            GameCleanupService_1.gameCleanupService.scheduleGameDeletion(gameId);
            config_1.logger.info(`Game ${gameId} completed - scheduled for deletion in 30 seconds`);
        }
        // Only emit new moves instead of full game state for better performance
        const newMoves = game.moves?.slice(originalMoveCount) || [];
        if (newMoves.length > 0) {
            // Emit delta update instead of full game object
            const io = require('../../index').io;
            if (io) {
                io.to(gameId).emit('game:move-update', {
                    gameId,
                    newMoves,
                    currentTurn: game.currentTurn,
                    status: game.status
                });
            }
        }
        return result;
    }
    // ===== Game Creation Methods =====
    async createGame(playerData) {
        const { playerId, name } = this.extractPlayerData(playerData, 'Player 1');
        // Clean up any existing games for this player before creating a new one
        const deletedCount = await this.repository.deleteAllByPlayerId(playerId);
        if (deletedCount > 0) {
            config_1.logger.info(`Cleaned up ${deletedCount} existing games for player ${playerId} before creating new game`);
        }
        // Pass photoUrl to player object
        const photoUrl = playerData.photoUrl || null;
        // Debug: Log photoUrl at game creation
        //console.log('[PHOTOURL FLOW] GameService.createGame challenger photoUrl:', photoUrl);
        const challengerObj = { ...this.createPlayerObject(playerId, name) };
        if (photoUrl)
            challengerObj.photoUrl = photoUrl;
        const game = new Game_1.Game({
            gameId: await this.generateUniqueGameId(), status: 'waiting',
            players: { challenger: challengerObj },
            currentTurn: null, moves: [], winner: null, winReason: null, connectedPlayers: [playerId]
        });
        game.updateStatusMessage();
        // Debug: Log game object after creation
        //console.log('[PHOTOURL FLOW] GameService.createGame persisted:', game.players);
        return this.repository.save(game);
    }
    async joinGame(gameId, playerData) {
        const game = await this.getGameById(gameId);
        if (game.players.acceptor)
            throw (0, errors_1.createGameFullError)({ gameId });
        const { playerId, name } = this.extractPlayerData(playerData, 'Player 2');
        // Clean up any existing games for this player before joining a new one
        const deletedCount = await this.repository.deleteAllByPlayerId(playerId);
        if (deletedCount > 0) {
            config_1.logger.info(`Cleaned up ${deletedCount} existing games for player ${playerId} before joining game ${gameId}`);
        }
        // Pass photoUrl to player object
        let photoUrl = typeof playerData.photoUrl === 'string' ? playerData.photoUrl : undefined;
        // If photoUrl is missing, try to get it from other sources (socket.data, etc)
        if (!photoUrl && playerData.identifier) {
            // Try to get from game.players.challenger if this player is challenger
            if (game.players.challenger && game.players.challenger.playerId === playerId && game.players.challenger.photoUrl) {
                photoUrl = game.players.challenger.photoUrl;
            }
        }
        // Debug: Log photoUrl at game join
        //console.log('[PHOTOURL FLOW] GameService.joinGame acceptor photoUrl:', photoUrl, 'playerData:', playerData);
        // Always update acceptor's photoUrl if present
        const acceptorObj = { ...this.createPlayerObject(playerId, name), username: name };
        if (photoUrl)
            acceptorObj.photoUrl = photoUrl;
        game.players.acceptor = acceptorObj;
        // Debug: Log game object after join
        //console.log('[PHOTOURL FLOW] GameService.joinGame persisted:', game.players);
        game.status = 'lobby';
        game.addConnectedPlayer(playerId);
        (0, gameLogic_1.updateLastActivity)(game);
        game.updateStatusMessage();
        return this.repository.save(game);
    }
    async setPlayerReady(gameId, playerId, card) {
        // Use shared constants and inject config for card generation
        // CARD_SIZE, CARD_RANGE, and a random number generator
        const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        return this.executeGameOperation(gameId, playerId, (game, _, player) => {
            player.status = 'ready';
            player.card = card || (0, cardUtils_1.generateRandomCard)(game_1.CARD_SIZE, game_1.CARD_SIZE, game_1.CARD_RANGE.min, game_1.CARD_RANGE.max, getRandomNumber);
            if (game.areBothPlayersReady())
                game.startGame();
            game.updateStatusMessage();
            return game;
        });
    }
    async requestRematch(gameId, playerId) {
        const game = await this.getGameById(gameId);
        const { playerRole } = (0, gameLogic_1.findPlayerRole)(game, playerId);
        if (!game.rematchRequests)
            game.rematchRequests = { challenger: false, acceptor: false };
        game.rematchRequests[playerRole] = true;
        const rematchGame = game.rematchRequests.challenger && game.rematchRequests.acceptor
            ? await this.createRematchGame(game) : undefined;
        if (rematchGame)
            game.rematchGameId = rematchGame.gameId;
        (0, gameLogic_1.updateLastActivity)(game);
        await this.repository.save(game);
        return { game, rematchGame };
    }
    async createRematchGame(originalGame) {
        const { challenger, acceptor } = originalGame.players;
        if (!challenger?.playerId || !acceptor?.playerId) {
            throw new Error('Cannot create rematch: missing player data');
        }
        // Create new game with swapped roles (acceptor becomes challenger, challenger becomes acceptor)
        const newGame = new Game_1.Game({
            gameId: await this.generateUniqueGameId(),
            status: 'waiting', // Start in waiting state, not lobby
            players: {
                challenger: {
                    ...this.createPlayerObject(acceptor.playerId, acceptor.name, 'waiting'),
                    connected: false,
                    card: undefined, // No pre-filled cards
                    markedCells: [],
                    completedLines: 0,
                    markedLetters: [],
                    photoUrl: acceptor.photoUrl || null
                    // Debug: Log photoUrl at rematch acceptor
                    ,
                    _debugPhotoUrl: acceptor.photoUrl
                },
                acceptor: {
                    ...this.createPlayerObject(challenger.playerId, challenger.name, 'waiting'),
                    connected: false,
                    card: undefined, // No pre-filled cards
                    markedCells: [],
                    completedLines: 0,
                    markedLetters: [],
                    photoUrl: challenger.photoUrl || null
                    // Debug: Log photoUrl at rematch challenger
                    ,
                    _debugPhotoUrl: challenger.photoUrl
                }
            },
            currentTurn: null, // No turn until game starts
            moves: [], // Empty moves
            winner: null,
            winReason: null,
            connectedPlayers: [], // Empty - players need to rejoin
            rematchRequests: { challenger: false, acceptor: false }, // Reset rematch requests
            lookupTable: [] // Will be generated when both players are ready
        });
        // Update status message for waiting state
        newGame.updateStatusMessage();
        return this.repository.save(newGame);
    }
    // ===== Game Play Methods =====
    async makeMove(gameId, playerId, number) {
        this.validateNumbers(gameId, playerId, number);
        return this.executeGameOperation(gameId, playerId, (game, role) => {
            game.recordMove(role, number);
            const prev = game.currentTurn;
            game.switchTurn();
            console.log(`🎮 Turn: ${prev} -> ${game.currentTurn} (Move #${game.moves.length})`);
            game.checkCompletedLines(role);
            return game;
        }, true);
    }
    async markLine(gameId, playerId, numbers) {
        return this.executeGameOperation(gameId, playerId, (game, role) => {
            // Validate numbers but don't record moves - marking a line is not individual moves
            this.validateNumbers(gameId, playerId, numbers);
            // Mark the cells for the line without adding to move history
            numbers.forEach(n => game.markCellForBothPlayers(n));
            // DON'T switch turns - marking a line is just marking completed cells, not a game action
            console.log(`🎮 Line marked: ${numbers.length} cells marked for both players (turn stays: ${game.currentTurn})`);
            game.checkCompletedLines(role);
            return game;
        }, false); // Changed from true to false - markLine doesn't require player's turn
    }
    async claimBingo(gameId, playerId) {
        return this.executeGameOperation(gameId, playerId, (game, role) => {
            if (game.status !== 'playing')
                throw (0, errors_1.createInvalidMoveError)({ gameId, playerId, move: 0, reason: 'Game not playing' });
            if (game.checkCompletedLines(role) < 5)
                throw (0, errors_1.createInvalidMoveError)({ gameId, playerId, move: 0, reason: 'Need 5 lines' });
            game.endGame(role, 'bingo');
            console.log(`🎮 BINGO: ${role} wins ${gameId}`);
            return game;
        });
    }
    async instantWin(gameId, playerId) {
        return this.executeGameOperation(gameId, playerId, (game, role, player) => {
            if (game.status !== 'playing')
                throw (0, errors_1.createInvalidMoveError)({ gameId, playerId, move: 0, reason: 'Game not playing' });
            // Force the player to have 5 completed lines for instant win
            player.completedLines = 5;
            // End the game immediately with this player as winner
            game.endGame(role, 'bingo');
            console.log(`🎮 INSTANT WIN: ${role} wins ${gameId}`);
            return game;
        });
    }
    // ===== Game Connection Methods =====
    async handleDisconnection(gameId, playerId) {
        try {
            return this.executeGameOperation(gameId, playerId, (game, role, player) => {
                //console.log(`[DEBUG] Before disconnection - Player ${playerId} connected status:`, player.connected);
                player.connected = false;
                player.status = 'disconnected'; // Set status to disconnected
                //console.log(`[DEBUG] After disconnection - Player ${playerId} connected status:`, player.connected, 'status:', player.status);
                game.removeConnectedPlayer(playerId);
                // Check if lobby is now empty and schedule cleanup
                const remainingConnected = game.connectedPlayers?.length || 0;
                if (remainingConnected === 0) {
                    // Schedule immediate cleanup for empty lobbies (5 seconds to allow for quick reconnections)
                    GameCleanupService_1.gameCleanupService.scheduleGameDeletion(gameId, 5000);
                    config_1.logger.info(`Game ${gameId} scheduled for cleanup - no players connected`);
                }
                // Immediate game ending on disconnection during playing state
                if (game.status === 'playing') {
                    const opponentRole = role === 'challenger' ? 'acceptor' : 'challenger';
                    game.endGame(opponentRole, 'disconnection');
                    config_1.logger.info(`Game ${gameId} ended immediately due to ${playerId} disconnection - opponent wins`);
                    // Note: Game completion cleanup will be handled by executeGameOperation
                }
                config_1.logger.info(`Player ${playerId} disconnected from ${gameId}`);
                return game;
            });
        }
        catch (error) {
            config_1.logger.error(`Disconnection error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async handleReconnection(gameId, playerId) {
        try {
            const result = await this.executeGameOperation(gameId, playerId, (game, role, player) => {
                //console.log(`[DEBUG] Before reconnection - Player ${playerId} connected status:`, player.connected, 'status:', player.status);
                player.connected = true;
                // Restore appropriate status based on game state
                if (game.status === 'waiting' || game.status === 'lobby') {
                    // In lobby, always start fresh - don't restore old card status for rematch games
                    player.status = 'waiting';
                    // Clear any old card data to ensure fresh start
                    player.card = undefined;
                    player.markedCells = [];
                    player.completedLines = 0;
                    player.markedLetters = [];
                }
                else if (game.status === 'playing') {
                    player.status = 'playing';
                }
                //console.log(`[DEBUG] After reconnection - Player ${playerId} connected status:`, player.connected, 'status:', player.status);
                game.addConnectedPlayer(playerId);
                // Cancel any scheduled cleanup since someone reconnected
                GameCleanupService_1.gameCleanupService.cancelScheduledCleanup(gameId);
                config_1.logger.info(`Player ${playerId} reconnected to ${gameId} with status ${player.status}`);
                return game;
            });
            // Force emit to all clients to ensure status is updated
            const io = require('../../index').io;
            if (io) {
                io.to(gameId).emit('game:player-status-update', {
                    gameId,
                    playerId,
                    connected: true,
                    status: result.players.challenger?.playerId === playerId ? result.players.challenger.status : result.players.acceptor?.status
                });
            }
            return result;
        }
        catch (error) {
            config_1.logger.error(`Reconnection error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.GameService = GameService;
