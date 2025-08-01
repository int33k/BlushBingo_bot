"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlayerConnected = exports.removeConnectedPlayer = exports.addConnectedPlayer = exports.isDisconnectionTimerExpired = exports.clearDisconnectionTimer = exports.startDisconnectionTimer = exports.updateStatusMessage = exports.checkWin = exports.getOpponentCard = exports.checkCompletedLines = exports.markCellForBothPlayers = exports.recordMove = exports.endGame = exports.switchTurn = exports.isPlayerTurn = exports.startGame = exports.areBothPlayersReady = void 0;
const gameLogic_1 = require("../utils/gameLogic");
const crypto_1 = require("crypto");
// Ultra-compact helper functions with destructuring and arrow functions
const updateActivity = (game) => Object.assign(game, { lastActivityAt: new Date() });
const getOpponent = (role) => role === 'challenger' ? 'acceptor' : 'challenger';
const bothReady = (players) => players.challenger?.status === 'ready' && players.acceptor?.status === 'ready';
// ===== Optimized Game Methods with Method Chaining =====
const areBothPlayersReady = function () { return bothReady(this.players); };
exports.areBothPlayersReady = areBothPlayersReady;
const startGame = function () {
    // Set both players status to 'playing'
    if (this.players.challenger)
        this.players.challenger.status = 'playing';
    if (this.players.acceptor)
        this.players.acceptor.status = 'playing';
    return Object.assign(this, {
        status: 'playing',
        lookupTable: this.players.challenger?.card && this.players.acceptor?.card ?
            (0, gameLogic_1.generateLookupTable)(this.players.challenger.card, this.players.acceptor.card) : [],
        currentTurn: (0, crypto_1.randomBytes)(1)[0] < 128 ? 'challenger' : 'acceptor',
        lastActivityAt: new Date()
    });
};
exports.startGame = startGame;
const isPlayerTurn = function (role) { return this.currentTurn === role; };
exports.isPlayerTurn = isPlayerTurn;
const switchTurn = function () {
    return updateActivity(Object.assign(this, { currentTurn: getOpponent(this.currentTurn) }));
};
exports.switchTurn = switchTurn;
const endGame = function (winnerRole, reason = 'bingo') {
    return updateActivity(Object.assign(this, { status: 'completed', winner: winnerRole, winReason: reason, currentTurn: null }));
};
exports.endGame = endGame;
const recordMove = function (role, number) {
    const playerId = this.players[role]?.playerId || role;
    this.moves.push({ playerId, position: { row: 0, col: 0 }, value: number, timestamp: new Date() });
    return updateActivity((0, gameLogic_1.markCellForBothPlayers)(this, number));
};
exports.recordMove = recordMove;
const markCellForBothPlayers = function (number) { return (0, gameLogic_1.markCellForBothPlayers)(this, number); };
exports.markCellForBothPlayers = markCellForBothPlayers;
const checkCompletedLines = function (role) { return (0, gameLogic_1.checkGameCompletedLines)(this, role); };
exports.checkCompletedLines = checkCompletedLines;
const getOpponentCard = function (role) {
    const opponent = this.players[getOpponent(role)];
    if (!opponent?.card || !this.lookupTable)
        return null;
    const card = opponent.card.map(row => [...row]);
    this.moves.forEach(({ value }) => {
        const idx = value - 1;
        if (idx >= 0 && idx < this.lookupTable.length) {
            const [, , r, c] = this.lookupTable[idx];
            if (r >= 0 && r < 5 && c >= 0 && c < 5)
                card[r][c] = 0;
        }
    });
    return card;
};
exports.getOpponentCard = getOpponentCard;
const checkWin = function (role) { return (0, gameLogic_1.checkWin)(this, role); };
exports.checkWin = checkWin;
const updateStatusMessage = function (currentPlayerId) {
    return Object.assign(this, { statusMessage: (0, gameLogic_1.generateStatusMessage)(this, currentPlayerId) });
};
exports.updateStatusMessage = updateStatusMessage;
// ===== Ultra-Optimized Connection Methods =====
const startDisconnectionTimer = function (playerId, role, seconds = 60) {
    const now = new Date();
    return Object.assign(this, {
        disconnectionTimer: { playerId, role, startTime: now, expiryTime: new Date(now.getTime() + seconds * 1000) }
    });
};
exports.startDisconnectionTimer = startDisconnectionTimer;
const clearDisconnectionTimer = function () {
    return Object.assign(this, { disconnectionTimer: undefined });
};
exports.clearDisconnectionTimer = clearDisconnectionTimer;
const isDisconnectionTimerExpired = function () {
    return this.disconnectionTimer ? new Date() > this.disconnectionTimer.expiryTime : false;
};
exports.isDisconnectionTimerExpired = isDisconnectionTimerExpired;
const addConnectedPlayer = function (playerId) {
    const players = this.connectedPlayers || [];
    return Object.assign(this, { connectedPlayers: players.includes(playerId) ? players : [...players, playerId] });
};
exports.addConnectedPlayer = addConnectedPlayer;
const removeConnectedPlayer = function (playerId) {
    return Object.assign(this, { connectedPlayers: (this.connectedPlayers || []).filter(id => id !== playerId) });
};
exports.removeConnectedPlayer = removeConnectedPlayer;
const isPlayerConnected = function (playerId) {
    return (this.connectedPlayers || []).includes(playerId);
};
exports.isPlayerConnected = isPlayerConnected;
