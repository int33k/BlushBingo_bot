/**
 * Ultra-optimized game logic using advanced functional patterns
 */
import { GameDocument } from '../types/gameTypes';
import { PlayerRole } from '../types/playerTypes';
import config from '../config';

// Ultra-compact constants with destructuring
const { size: S, letters: L } = config.game.board;
const { maxValue: M } = config.game.card;
const { requiredLinesForBingo: R } = config.game.rules;
const ROLES: PlayerRole[] = config.game.players.roles as PlayerRole[];

// Ultra-compact utility functions
const pos = (card: number[][]) => card.reduce((m, row, r) => (row.forEach((n, c) => m[n] = [r, c]), m), {} as Record<number, [number, number]>);
const getP = (g: GameDocument, role: PlayerRole) => g.players[role];
const valid = (p: any) => p?.card?.length && p?.markedCells;
const lines = (card: number[][]) => [...card, ...Array.from({length: S}, (_, j) => card.map(r => r[j])), Array.from({length: S}, (_, i) => card[i][i]), Array.from({length: S}, (_, i) => card[i][S-1-i])];
const complete = (line: number[], marked: Array<string | number>) => line.every(c => marked.includes(c));

// Ultra-compact exports with inline optimizations
export const generateLookupTable = (c1: number[][], c2: number[][]): number[][] =>
  Array.from({length: M}, (_, i) => {
    const n = i + 1, [m1, m2] = [c1, c2].map(pos), p1 = m1[n] || [-1, -1], p2 = m2[n] || [-1, -1];
    return [p1[0], p1[1], p2[0], p2[1]];
  });

export const checkCompletedLines = (card: number[][], marked: Array<string | number>) => {
  if (!card?.length || !marked?.length) return { completedLines: 0, markedLetters: [] };
  const completedLines = lines(card).filter(l => complete(l, marked)).length;
  return { completedLines, markedLetters: L.slice(0, Math.min(completedLines, R)) };
};

export const checkGameCompletedLines = (game: GameDocument, role: PlayerRole): number => {
  const player = getP(game, role);
  if (!valid(player)) return 0;
  const result = checkCompletedLines(player!.card!, player!.markedCells!);
  return Object.assign(player!, result).completedLines;
};

export const checkWin = (game: GameDocument, role: PlayerRole): boolean => (getP(game, role)?.completedLines ?? 0) >= R;

export const markCellForBothPlayers = (game: GameDocument, number: number): GameDocument => (
  ROLES.forEach((role: PlayerRole) => {
    const player = getP(game, role);
    if (player) player.markedCells = [...new Set([...(player.markedCells || []), number])];
  }),
  ROLES.forEach((role: PlayerRole) => checkGameCompletedLines(game, role)),
  game
);

// Ultra-compact game state functions with inline constants
const [A, M_STATES, C] = [['lobby', 'playing'], ['playing'], ['completed']] as const;

export const findPlayerRole = (game: GameDocument, playerId: string) => {
  const playerRole = ROLES.find((role: PlayerRole) => getP(game, role)?.playerId === playerId) || 'challenger';
  const opponentRole = playerRole === 'challenger' ? 'acceptor' : 'challenger';
  return { playerRole: playerRole as PlayerRole, opponentRole: opponentRole as PlayerRole, player: getP(game, playerRole) };
};

// Ultra-compact one-liners
export const updateLastActivity = (game: GameDocument): GameDocument => Object.assign(game, { lastActivityAt: new Date() });
export const isPlayerInGame = (game: GameDocument, playerId: string): boolean => ROLES.some((role: PlayerRole) => getP(game, role)?.playerId === playerId);
export const isGameInState = (game: GameDocument, state: string | string[]): boolean => (Array.isArray(state) ? state : [state]).includes(game.status);
export const isGameActive = (game: GameDocument): boolean => A.includes(game.status as any);
export const canMakeMoves = (game: GameDocument): boolean => M_STATES.includes(game.status as any);
export const isGameCompleted = (game: GameDocument): boolean => C.includes(game.status as any);

// Ultra-compact status message generator with inline logic
export const generateStatusMessage = (game: GameDocument, currentPlayerId?: string): string => {
  const { challenger: c, acceptor: a } = game.players;
  const isC = c?.playerId === currentPlayerId;
  const [curr, opp] = isC ? [c, a] : [a, c];
  const [cReady, oReady] = [curr?.status === 'ready', opp?.status === 'ready'];

  return currentPlayerId && !curr ? 'Joining game...' :
         !opp ? 'Waiting for opponent to join...' :
         !opp.connected ? 'Opponent disconnected. Waiting for them to reconnect...' :
         game.status === 'playing' ? 'Game in progress!' :
         game.status === 'completed' ? (!game.winner || !currentPlayerId ? 'Game completed.' :
           getP(game, game.winner as PlayerRole)?.playerId === currentPlayerId ? 'You won! Congratulations!' :
           `${getP(game, game.winner as PlayerRole)?.name || 'Opponent'} won the game.`) :
         cReady && oReady ? 'Both players ready! Game starting soon...' :
         cReady ? 'You are ready. Waiting for opponent to get ready...' :
         oReady ? 'Opponent is ready. Complete your card and get ready!' :
         'Both players are preparing their cards...';
};

export const isPlayerTurn = (game: GameDocument, playerRole: PlayerRole): boolean => game.currentTurn === playerRole;
