/**
 * Shared Game Constants - Consolidated from multiple files
 * Eliminates constant duplication across platforms
 */
export declare const CARD_SIZE = 5;
export declare const CARD_RANGE: {
    min: number;
    max: number;
};
export declare const BINGO_LETTERS: string[];
export declare const DEFAULT_REQUIRED_LINES_FOR_BINGO = 5;
export declare const MAX_PLAYERS = 2;
export declare const DEFAULT_DISCONNECTION_TIMEOUT = 30;
export declare const LETTER_RANGES: {
    B: {
        min: number;
        max: number;
    };
    I: {
        min: number;
        max: number;
    };
    N: {
        min: number;
        max: number;
    };
    G: {
        min: number;
        max: number;
    };
    O: {
        min: number;
        max: number;
    };
};
export declare const SOCKET_EVENTS: {
    readonly CONNECTION: "connection";
    readonly DISCONNECT: "disconnect";
    readonly AUTH: "auth";
    readonly AUTH_SUCCESS: "auth_success";
    readonly AUTH_ERROR: "auth_error";
    readonly CREATE_GAME: "create_game";
    readonly JOIN_GAME: "join_game";
    readonly PLAYER_READY: "player_ready";
    readonly GAME_STARTED: "game_started";
    readonly GAME_ENDED: "game_ended";
    readonly MAKE_MOVE: "make_move";
    readonly MOVE_MADE: "move_made";
    readonly BINGO_STOP: "bingo_stop";
    readonly PLAYER_CONNECTED: "player_connected";
    readonly PLAYER_DISCONNECTED: "player_disconnected";
    readonly PLAYER_RECONNECTED: "player_reconnected";
    readonly REQUEST_REMATCH: "request_rematch";
    readonly REMATCH_REQUESTED: "rematch_requested";
    readonly REMATCH_ACCEPTED: "rematch_accepted";
    readonly ERROR: "error";
    readonly GAME_ERROR: "game_error";
};
export declare const API_ENDPOINTS: {
    readonly HEALTH: "/health";
    readonly CREATE_GAME: "/games";
    readonly JOIN_GAME: "/games/join";
    readonly GET_GAME: "/games/:gameId";
    readonly PLAYER_READY: "/games/:gameId/ready";
    readonly MAKE_MOVE: "/games/:gameId/move";
    readonly BINGO_STOP: "/games/:gameId/bingo";
    readonly REQUEST_REMATCH: "/games/:gameId/rematch";
};
export declare const STATUS_MESSAGES: {
    readonly WAITING_FOR_PLAYERS: "Waiting for players to join...";
    readonly WAITING_FOR_READY: "Waiting for players to be ready...";
    readonly GAME_IN_PROGRESS: "Game in progress";
    readonly GAME_COMPLETED: "Game completed";
    readonly PLAYER_DISCONNECTED: "Player disconnected";
    readonly RECONNECTION_TIMEOUT: "Reconnection timeout";
};
//# sourceMappingURL=game.d.ts.map