// Ultra-optimized error system with consolidated configuration and factory patterns
export enum ErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED', UNAUTHORIZED = 'UNAUTHORIZED',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND', GAME_FULL = 'GAME_FULL', INVALID_GAME_STATE = 'INVALID_GAME_STATE',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND', PLAYER_ALREADY_IN_GAME = 'PLAYER_ALREADY_IN_GAME', PLAYER_NOT_READY = 'PLAYER_NOT_READY',
  INVALID_MOVE = 'INVALID_MOVE', NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  VALIDATION_ERROR = 'VALIDATION_ERROR', MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD', DUPLICATE_KEY = 'DUPLICATE_KEY',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', DATABASE_ERROR = 'DATABASE_ERROR',
  SOCKET_ERROR = 'SOCKET_ERROR', CONNECTION_ERROR = 'CONNECTION_ERROR', UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Consolidated error configuration with status codes and messages
const errorConfig: Record<ErrorCode, { status: number; message: string }> = {
  [ErrorCode.AUTHENTICATION_FAILED]: { status: 401, message: 'Authentication failed' },
  [ErrorCode.UNAUTHORIZED]: { status: 403, message: 'Unauthorized access' },
  [ErrorCode.GAME_NOT_FOUND]: { status: 404, message: 'Game not found' },
  [ErrorCode.GAME_FULL]: { status: 400, message: 'Game is already full' },
  [ErrorCode.INVALID_GAME_STATE]: { status: 400, message: 'Invalid game state' },
  [ErrorCode.PLAYER_NOT_FOUND]: { status: 404, message: 'Player not found' },
  [ErrorCode.PLAYER_ALREADY_IN_GAME]: { status: 400, message: 'Player is already in a game' },
  [ErrorCode.PLAYER_NOT_READY]: { status: 400, message: 'Player is not ready' },
  [ErrorCode.INVALID_MOVE]: { status: 400, message: 'Invalid move' },
  [ErrorCode.NOT_YOUR_TURN]: { status: 400, message: 'Not your turn' },
  [ErrorCode.VALIDATION_ERROR]: { status: 400, message: 'Validation error' },
  [ErrorCode.MISSING_REQUIRED_FIELD]: { status: 400, message: 'Missing required field' },
  [ErrorCode.DUPLICATE_KEY]: { status: 400, message: 'Duplicate key error' },
  [ErrorCode.INTERNAL_SERVER_ERROR]: { status: 500, message: 'Internal server error' },
  [ErrorCode.DATABASE_ERROR]: { status: 500, message: 'Database error' },
  [ErrorCode.SOCKET_ERROR]: { status: 500, message: 'Socket error' },
  [ErrorCode.CONNECTION_ERROR]: { status: 500, message: 'Connection error' },
  [ErrorCode.UNKNOWN_ERROR]: { status: 500, message: 'Unknown error' }
};

// Extract status codes and messages using functional programming
export const errorStatusCodes = Object.fromEntries(Object.entries(errorConfig).map(([k, v]) => [k, v.status])) as Record<ErrorCode, number>;
export const defaultErrorMessages = Object.fromEntries(Object.entries(errorConfig).map(([k, v]) => [k, v.message])) as Record<ErrorCode, string>;

// Ultra-compact AppError class with optimized constructor
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode = errorConfig[code].status,
    public isOperational = true,
    public details?: Record<string, any>
  ) {
    super(message);
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
  status: string;
  timestamp: string;
}

// Higher-order error factory with template literal optimization
const createError = (code: ErrorCode, msgTemplate: (params: any) => string = () => defaultErrorMessages[code]) =>
  (params?: any, details?: Record<string, any>) => new AppError(msgTemplate(params), code, undefined, true, details);

// Optimized error factories using functional composition
export const createValidationError = createError(ErrorCode.VALIDATION_ERROR, ({ message }: { message: string }) => message);
export const createGameNotFoundError = createError(ErrorCode.GAME_NOT_FOUND, ({ gameId }: { gameId: string }) => `Game with ID ${gameId} not found`);
export const createGameFullError = createError(ErrorCode.GAME_FULL, ({ gameId }: { gameId: string }) => `Game ${gameId} is already full`);
export const createGameStateError = createError(ErrorCode.INVALID_GAME_STATE, ({ currentState, expectedStates }: { currentState: string; expectedStates: string[] }) =>
  `Game is not in ${expectedStates.join(' or ')} state. Current state: ${currentState}`);
export const createNotYourTurnError = createError(ErrorCode.NOT_YOUR_TURN, ({ gameId, playerId }: { gameId: string; playerId: string }) =>
  `Not your turn in game ${gameId} for player ${playerId}`);
export const createInvalidMoveError = createError(ErrorCode.INVALID_MOVE, ({ gameId, playerId, move, reason }: { gameId: string; playerId: string; move: number; reason: string }) =>
  `Invalid move ${move} by player ${playerId} in game ${gameId}: ${reason}`);
export const createPlayerNotFoundError = createError(ErrorCode.PLAYER_NOT_FOUND, ({ gameId, playerId }: { gameId: string; playerId: string }) =>
  `Player ${playerId} not found in game ${gameId}`);
export const createPlayerAlreadyInGameError = createError(ErrorCode.PLAYER_ALREADY_IN_GAME, ({ playerId }: { playerId: string }) =>
  `Player ${playerId} is already in a game`);
export const createPlayerNotReadyError = createError(ErrorCode.PLAYER_NOT_READY, ({ gameId, playerId }: { gameId: string; playerId: string }) =>
  `Player ${playerId} is not ready in game ${gameId}`);
