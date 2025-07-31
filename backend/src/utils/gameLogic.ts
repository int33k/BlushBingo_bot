/**
 * Ultra-optimized game logic using shared modules and advanced functional patterns
 */
import { GameDocument } from '../types/gameTypes';
import { PlayerRole } from '../types/playerTypes';
import { 
  checkCompletedLines as sharedCheckCompletedLines, 
  generateLines, 
  isLineComplete,
  generateLookupTable as sharedGenerateLookupTable 
} from '../../../shared/game/logic';
import { CARD_SIZE, BINGO_LETTERS, DEFAULT_REQUIRED_LINES_FOR_BINGO } from '../../../shared/constants/game';
import config from '../config';

// Ultra-compact constants with destructuring - use shared values where possible
const { size: S = CARD_SIZE } = config.game.board;
const { maxValue: M } = config.game.card;
const { requiredLinesForBingo: R = DEFAULT_REQUIRED_LINES_FOR_BINGO } = config.game.rules;
const ROLES: PlayerRole[] = config.game.players.roles as PlayerRole[];
const L = BINGO_LETTERS;

// Ultra-compact utility functions
const getP = (g: GameDocument, role: PlayerRole) => g.players[role];
const valid = (p: any) => p?.card?.length && p?.markedCells;

// Use shared implementation of generateLookupTable
export const generateLookupTable = sharedGenerateLookupTable;

// Use shared implementation of checkCompletedLines
export const checkCompletedLines = sharedCheckCompletedLines;

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
  if (!curr) return 'Joining game...';
  
  // If opponent doesn't exist, waiting for them to join
  if (!opp) return 'Waiting for opponent to join...';
  
  // If current player is disconnected (shouldn't normally happen in this context)
  if (!curr.connected) return 'Reconnecting to game...';
  
  // If opponent is disconnected - this is the key check
  if (!opp.connected) {
    //console.log(`[DEBUG] Opponent is disconnected, returning disconnection message`);
    return 'Opponent disconnected. Waiting for them to reconnect...';
  }
  
  // Game state checks
  if (game.status === 'playing') return 'Game in progress!';
  
  if (game.status === 'completed') {
    if (!game.winner) return 'Game completed.';
    const winnerPlayer = getP(game, game.winner as PlayerRole);
    return winnerPlayer?.playerId === currentPlayerId ? 'You won! Congratulations!' :
           `${winnerPlayer?.name || 'Opponent'} won the game.`;
  }
  
  // Player readiness status
  const currentReady = curr.status === 'ready';
  const opponentReady = opp.status === 'ready';
  
  let message;
  if (currentReady && opponentReady) message = 'Both players ready! Game starting soon...';
  else if (currentReady) message = 'You are ready. Waiting for opponent to get ready...';
  else if (opponentReady) message = 'Opponent is ready. Complete your card and get ready!';
  else message = 'Both players are preparing their cards...';
  
  // console.log(`[DEBUG] Generated player-specific status message for ${currentPlayerId}:`, message, {
  //   currentReady,
  //   opponentReady,
  //   currentStatus: curr.status,
  //   opponentStatus: opp.status
  // });
  
  return message;
};

export const isPlayerTurn = (game: GameDocument, playerRole: PlayerRole): boolean => game.currentTurn === playerRole;
