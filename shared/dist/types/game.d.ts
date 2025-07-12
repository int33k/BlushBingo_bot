/**
 * Shared Game Types - Consolidated from frontend and backend
 * Eliminates type duplication across platforms
 */
export type GameStatus = 'waiting' | 'lobby' | 'playing' | 'completed';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'disconnected';
export type PlayerRole = 'challenger' | 'acceptor';
export type WinReason = 'bingo' | 'disconnection' | 'forfeit';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export interface Player {
    playerId: string;
    name: string;
    username?: string;
    telegramId?: string;
    status: PlayerStatus;
    connected: boolean;
    card?: number[][];
    markedCells?: number[];
    completedLines?: number;
    markedLetters?: string[];
}
export interface Move {
    playerId: string;
    position: {
        row: number;
        col: number;
    };
    value: number;
    timestamp: Date;
}
export interface RematchRequests {
    challenger: boolean;
    acceptor: boolean;
}
export interface DisconnectionTimer {
    playerId: string;
    role: string;
    startTime: Date;
    expiryTime: Date;
}
export interface Game {
    gameId: string;
    status: GameStatus;
    statusMessage?: string;
    currentTurn: string | null;
    moves: Move[];
    players: {
        challenger?: Player;
        acceptor?: Player;
    };
    winner?: string | null;
    winReason?: WinReason;
    rematchRequests?: RematchRequests;
    rematchGameId?: string;
    disconnectionTimer?: DisconnectionTimer;
    connectedPlayers?: string[];
    createdAt: Date;
    lastActivityAt: Date;
    lookupTable?: number[][];
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface GameResponse extends ApiResponse {
    game?: Game;
    gameId?: string;
}
export interface Notification {
    id?: string;
    message: string;
    type: NotificationType;
    duration?: number;
}
export interface User {
    identifier: string;
    name: string;
    username?: string;
    telegramId?: string;
    isAuthenticated: boolean;
}
//# sourceMappingURL=game.d.ts.map