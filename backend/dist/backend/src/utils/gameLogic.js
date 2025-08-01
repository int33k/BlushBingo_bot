"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlayerTurn = exports.generateStatusMessage = exports.isGameCompleted = exports.canMakeMoves = exports.isGameActive = exports.isGameInState = exports.isPlayerInGame = exports.updateLastActivity = exports.findPlayerRole = exports.markCellForBothPlayers = exports.checkWin = exports.checkGameCompletedLines = exports.checkCompletedLines = exports.generateLookupTable = void 0;
const logic_1 = require("../../../shared/game/logic");
const game_1 = require("../../../shared/constants/game");
const config_1 = __importDefault(require("../config"));
// Ultra-compact constants with destructuring - use shared values where possible
const { size: S = game_1.CARD_SIZE } = config_1.default.game.board;
const { maxValue: M } = config_1.default.game.card;
const { requiredLinesForBingo: R = game_1.DEFAULT_REQUIRED_LINES_FOR_BINGO } = config_1.default.game.rules;
const ROLES = config_1.default.game.players.roles;
const L = game_1.BINGO_LETTERS;
// Ultra-compact utility functions
const getP = (g, role) => g.players[role];
const valid = (p) => p?.card?.length && p?.markedCells;
// Use shared implementation of generateLookupTable
exports.generateLookupTable = logic_1.generateLookupTable;
// Use shared implementation of checkCompletedLines
exports.checkCompletedLines = logic_1.checkCompletedLines;
const checkGameCompletedLines = (game, role) => {
    const player = getP(game, role);
    if (!valid(player))
        return 0;
    const result = (0, exports.checkCompletedLines)(player.card, player.markedCells);
    return Object.assign(player, result).completedLines;
};
exports.checkGameCompletedLines = checkGameCompletedLines;
const checkWin = (game, role) => (getP(game, role)?.completedLines ?? 0) >= R;
exports.checkWin = checkWin;
const markCellForBothPlayers = (game, number) => (ROLES.forEach((role) => {
    const player = getP(game, role);
    if (player)
        player.markedCells = [...new Set([...(player.markedCells || []), number])];
}),
    ROLES.forEach((role) => (0, exports.checkGameCompletedLines)(game, role)),
    game);
exports.markCellForBothPlayers = markCellForBothPlayers;
// Ultra-compact game state functions with inline constants
const [A, M_STATES, C] = [['lobby', 'playing'], ['playing'], ['completed']];
const findPlayerRole = (game, playerId) => {
    const playerRole = ROLES.find((role) => getP(game, role)?.playerId === playerId) || 'challenger';
    const opponentRole = playerRole === 'challenger' ? 'acceptor' : 'challenger';
    return { playerRole: playerRole, opponentRole: opponentRole, player: getP(game, playerRole) };
};
exports.findPlayerRole = findPlayerRole;
// Ultra-compact one-liners
const updateLastActivity = (game) => Object.assign(game, { lastActivityAt: new Date() });
exports.updateLastActivity = updateLastActivity;
const isPlayerInGame = (game, playerId) => ROLES.some((role) => getP(game, role)?.playerId === playerId);
exports.isPlayerInGame = isPlayerInGame;
const isGameInState = (game, state) => (Array.isArray(state) ? state : [state]).includes(game.status);
exports.isGameInState = isGameInState;
const isGameActive = (game) => A.includes(game.status);
exports.isGameActive = isGameActive;
const canMakeMoves = (game) => M_STATES.includes(game.status);
exports.canMakeMoves = canMakeMoves;
const isGameCompleted = (game) => C.includes(game.status);
exports.isGameCompleted = isGameCompleted;
// Ultra-compact status message generator with inline logic
const generateStatusMessage = (game, currentPlayerId) => {
    const { challenger: c, acceptor: a } = game.players;
    // console.log(`[DEBUG] generateStatusMessage called with:`, {
    //   currentPlayerId,
    //   challenger: c ? { playerId: c.playerId, status: c.status, connected: c.connected } : null,
    //   acceptor: a ? { playerId: a.playerId, status: a.status, connected: a.connected } : null,
    //   gameStatus: game.status
    // });
    // Handle case when currentPlayerId is not provided (general status)
    // if (!currentPlayerId) {
    //   const message = !c || !a ? 'Waiting for opponent to join...' :
    //          game.status === 'playing' ? 'Game in progress!' :
    //          game.status === 'completed' ? 'Game completed.' :
    //          c.status === 'ready' && a.status === 'ready' ? 'Both players ready! Game starting soon...' :
    //          'Players are preparing their cards...';
    //   console.log(`[DEBUG] Generated general status message:`, message);
    //   return message;
    // }
    const isC = c?.playerId === currentPlayerId;
    const [curr, opp] = isC ? [c, a] : [a, c];
    // console.log(`[DEBUG] Player-specific status generation:`, {
    //   currentPlayerId,
    //   isChallenger: isC,
    //   currentPlayer: curr ? { playerId: curr.playerId, status: curr.status, connected: curr.connected } : null,
    //   opponent: opp ? { playerId: opp.playerId, status: opp.status, connected: opp.connected } : null
    // });
    // If current player doesn't exist, they're joining
    if (!curr)
        return 'Joining game...';
    // If opponent doesn't exist, waiting for them to join
    if (!opp)
        return 'Waiting for opponent to join...';
    // If current player is disconnected (shouldn't normally happen in this context)
    if (!curr.connected)
        return 'Reconnecting to game...';
    // If opponent is disconnected - this is the key check
    if (!opp.connected) {
        //console.log(`[DEBUG] Opponent is disconnected, returning disconnection message`);
        return 'Opponent disconnected. Waiting for them to reconnect...';
    }
    // Game state checks
    if (game.status === 'playing')
        return 'Game in progress!';
    if (game.status === 'completed') {
        if (!game.winner)
            return 'Game completed.';
        const winnerPlayer = getP(game, game.winner);
        return winnerPlayer?.playerId === currentPlayerId ? 'You won! Congratulations!' :
            `${winnerPlayer?.name || 'Opponent'} won the game.`;
    }
    // Player readiness status
    const currentReady = curr.status === 'ready';
    const opponentReady = opp.status === 'ready';
    let message;
    if (currentReady && opponentReady)
        message = 'Both players ready! Game starting soon...';
    else if (currentReady)
        message = 'You are ready. Waiting for opponent to get ready...';
    else if (opponentReady)
        message = 'Opponent is ready. Complete your card and get ready!';
    else
        message = 'Both players are preparing their cards...';
    // console.log(`[DEBUG] Generated player-specific status message for ${currentPlayerId}:`, message, {
    //   currentReady,
    //   opponentReady,
    //   currentStatus: curr.status,
    //   opponentStatus: opp.status
    // });
    return message;
};
exports.generateStatusMessage = generateStatusMessage;
const isPlayerTurn = (game, playerRole) => game.currentTurn === playerRole;
exports.isPlayerTurn = isPlayerTurn;
