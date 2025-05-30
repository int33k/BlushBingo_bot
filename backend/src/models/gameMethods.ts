/**
 * Ultra-optimized game methods using functional patterns and method chaining
 */
import { PlayerRole } from '../types/playerTypes';
import { GameDocument, WinReason } from '../types/gameTypes';
import { checkGameCompletedLines, markCellForBothPlayers as markUtil, checkWin as checkPlayerWin, generateStatusMessage, generateLookupTable } from '../utils/gameLogic';
import { randomBytes } from 'crypto';

// Ultra-compact helper functions with destructuring and arrow functions
const updateActivity = (game: GameDocument) => Object.assign(game, { lastActivityAt: new Date() });
const getOpponent = (role: PlayerRole) => role === 'challenger' ? 'acceptor' : 'challenger';
const bothReady = (players: any) => players.challenger?.status === 'ready' && players.acceptor?.status === 'ready';

// ===== Optimized Game Methods with Method Chaining =====

export const areBothPlayersReady = function(this: GameDocument) { return bothReady(this.players); };

export const startGame = function(this: GameDocument) {
  return Object.assign(this, {
    status: 'playing',
    lookupTable: this.players.challenger?.card && this.players.acceptor?.card ?
      generateLookupTable(this.players.challenger.card, this.players.acceptor.card) : [],
    currentTurn: randomBytes(1)[0] < 128 ? 'challenger' : 'acceptor',
    lastActivityAt: new Date()
  });
};

export const isPlayerTurn = function(this: GameDocument, role: PlayerRole) { return this.currentTurn === role; };

export const switchTurn = function(this: GameDocument) {
  return updateActivity(Object.assign(this, { currentTurn: getOpponent(this.currentTurn as PlayerRole) }));
};

export const endGame = function(this: GameDocument, winnerRole: PlayerRole, reason: WinReason = 'bingo') {
  return updateActivity(Object.assign(this, { status: 'completed', winner: winnerRole, winReason: reason, currentTurn: null }));
};

export const recordMove = function(this: GameDocument, role: PlayerRole, number: number) {
  const playerId = this.players[role]?.playerId || role;
  this.moves.push({ playerId, position: { row: 0, col: 0 }, value: number, timestamp: new Date() });
  return updateActivity(markUtil(this, number));
};

export const markCellForBothPlayers = function(this: GameDocument, number: number) { return markUtil(this, number); };

export const checkCompletedLines = function(this: GameDocument, role: PlayerRole) { return checkGameCompletedLines(this, role); };

export const getOpponentCard = function(this: GameDocument, role: PlayerRole) {
  const opponent = this.players[getOpponent(role)];
  if (!opponent?.card || !this.lookupTable) return null;

  const card = opponent.card.map(row => [...row]);
  this.moves.forEach(({ value }) => {
    const idx = value - 1;
    if (idx >= 0 && idx < this.lookupTable!.length) {
      const [, , r, c] = this.lookupTable![idx];
      if (r >= 0 && r < 5 && c >= 0 && c < 5) card[r][c] = 0;
    }
  });
  return card;
};

export const checkWin = function(this: GameDocument, role: PlayerRole) { return checkPlayerWin(this, role); };

export const updateStatusMessage = function(this: GameDocument, currentPlayerId?: string) {
  return Object.assign(this, { statusMessage: generateStatusMessage(this, currentPlayerId) });
};

// ===== Ultra-Optimized Connection Methods =====

export const startDisconnectionTimer = function(this: GameDocument, playerId: string, role: PlayerRole, seconds = 60) {
  const now = new Date();
  return Object.assign(this, {
    disconnectionTimer: { playerId, role, startTime: now, expiryTime: new Date(now.getTime() + seconds * 1000) }
  });
};

export const clearDisconnectionTimer = function(this: GameDocument) {
  return Object.assign(this, { disconnectionTimer: undefined });
};

export const isDisconnectionTimerExpired = function(this: GameDocument) {
  return this.disconnectionTimer ? new Date() > this.disconnectionTimer.expiryTime : false;
};

export const addConnectedPlayer = function(this: GameDocument, playerId: string) {
  const players = this.connectedPlayers || [];
  return Object.assign(this, { connectedPlayers: players.includes(playerId) ? players : [...players, playerId] });
};

export const removeConnectedPlayer = function(this: GameDocument, playerId: string) {
  return Object.assign(this, { connectedPlayers: (this.connectedPlayers || []).filter(id => id !== playerId) });
};

export const isPlayerConnected = function(this: GameDocument, playerId: string) {
  return (this.connectedPlayers || []).includes(playerId);
};
