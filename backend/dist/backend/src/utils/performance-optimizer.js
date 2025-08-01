"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchOperations = exports.deltaPool = exports.movePool = exports.compressGameData = exports.calculateGameDelta = void 0;
// Calculate only what changed in game state
const calculateGameDelta = (oldGame, newGame) => {
    if (!oldGame) {
        // First time - send minimal essential data
        return {
            currentTurn: newGame.currentTurn,
            status: newGame.status,
            moves: newGame.moves?.slice(-1) || [], // Only last move
            winner: newGame.winner
        };
    }
    const delta = {};
    // Check for new moves (only send new ones)
    if (newGame.moves && oldGame.moves) {
        const newMoves = newGame.moves.slice(oldGame.moves.length);
        if (newMoves.length > 0) {
            delta.moves = newMoves;
            delta.lastMove = newMoves[newMoves.length - 1];
        }
    }
    // Check for turn changes
    if (newGame.currentTurn !== oldGame.currentTurn) {
        delta.currentTurn = newGame.currentTurn;
    }
    // Check for status changes
    if (newGame.status !== oldGame.status) {
        delta.status = newGame.status;
    }
    // Check for winner
    if (newGame.winner !== oldGame.winner) {
        delta.winner = newGame.winner;
    }
    // Check for player updates
    const playerUpdates = {};
    if (newGame.players.challenger?.completedLines !== oldGame.players.challenger?.completedLines) {
        playerUpdates.challenger = { completedLines: newGame.players.challenger?.completedLines };
    }
    if (newGame.players.acceptor?.completedLines !== oldGame.players.acceptor?.completedLines) {
        playerUpdates.acceptor = { completedLines: newGame.players.acceptor?.completedLines };
    }
    if (Object.keys(playerUpdates).length > 0) {
        delta.playerUpdates = playerUpdates;
    }
    return delta;
};
exports.calculateGameDelta = calculateGameDelta;
// Compress game data for transmission
const compressGameData = (data) => {
    // Remove unnecessary fields for socket transmission
    const compressed = { ...data };
    // Remove large fields that don't change often
    if (compressed.lookupTable && compressed.moves?.length > 10) {
        delete compressed.lookupTable; // Can be regenerated on client
    }
    // Compress player data
    if (compressed.players) {
        Object.keys(compressed.players).forEach(role => {
            const player = compressed.players[role];
            if (player) {
                // Remove card data if moves exist (can be reconstructed)
                if (compressed.moves?.length > 0 && player.card) {
                    delete player.card;
                }
            }
        });
    }
    return compressed;
};
exports.compressGameData = compressGameData;
// Memory pool for reusable objects
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.pool = [];
        this.createFn = createFn;
        this.resetFn = resetFn;
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    get() {
        return this.pool.pop() || this.createFn();
    }
    release(obj) {
        this.resetFn(obj);
        if (this.pool.length < 50) { // Prevent memory bloat
            this.pool.push(obj);
        }
    }
}
// Pre-created object pools for common operations
exports.movePool = new ObjectPool(() => ({ playerId: '', position: { row: 0, col: 0 }, value: 0, timestamp: new Date() }), (obj) => { obj.playerId = ''; obj.value = 0; obj.timestamp = new Date(); });
exports.deltaPool = new ObjectPool(() => ({}), (obj) => Object.keys(obj).forEach(key => delete obj[key]));
// Batch processing for multiple operations
const batchOperations = (operations, batchSize = 10) => {
    const results = [];
    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        results.push(...batch.map(op => op()));
    }
    return results;
};
exports.batchOperations = batchOperations;
