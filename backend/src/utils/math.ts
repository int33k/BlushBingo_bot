// Ultra-consolidated utilities: math, validation, controller, socket, health, error handling
import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import mongoose from 'mongoose';
import { GameDocument } from '../types/gameTypes';
import { AppError, ErrorCode } from './errors';
import { logger } from '../config';

// Math & validation utilities with ultra-compact implementations
export const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
export const isInRange = (num: number, min: number, max: number): boolean => num >= min && num <= max;
export const validateEnvVars = (env: Record<string, string | undefined>, requiredVars: string[]): void => {
  const missing = requiredVars.filter(v => !env[v]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
};
export const req = (v: any, f: string) => v || (() => { throw new AppError(`${f} is required`, ErrorCode.MISSING_REQUIRED_FIELD); })();
export const userData = (n: string, i: string) => ({ name: n || `Player_${i.substring(0, 5)}`, identifier: i });
export const gameParams = (r: Request) => ({ gameId: req(r.params.gameId, 'Game ID'), playerId: req(r.body.playerId, 'Player ID') });
export const gameState = (g: GameDocument, s: string | string[]) => (Array.isArray(s) ? s : [s]).includes(g.status) || (() => { throw new AppError(`Game not in ${(Array.isArray(s) ? s : [s]).join(' or ')} state. Current: ${g.status}`, ErrorCode.INVALID_GAME_STATE); })();

// Controller wrapper with ultra-compact implementation
export const ctrl = (code = 200) => (h: (req: Request, res?: Response, next?: NextFunction) => Promise<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await h(req, res, next);
      !res.headersSent && res.status(code).json({ success: true, data: result });
    } catch (error) {
      logger.error(`Controller error: ${error instanceof Error ? error.message : String(error)}`);
      next(error);
    }
  };

// Socket validation with ultra-compact factory pattern
const validate = <T>(getValue: (s: Socket, d: any) => T | undefined, errorMsg: string, errorCode = ErrorCode.MISSING_REQUIRED_FIELD) =>
  (socket: Socket, data: any): T | null => {
    const value = getValue(socket, data);
    return value || (handleSocketError(new AppError(errorMsg, errorCode), socket), null);
  };

// Error handling with pattern matching optimization
const errorPatterns: [string, ErrorCode][] = [
  ['not found', ErrorCode.GAME_NOT_FOUND], ['already in', ErrorCode.PLAYER_ALREADY_IN_GAME],
  ['not your turn', ErrorCode.NOT_YOUR_TURN], ['invalid move', ErrorCode.INVALID_MOVE], ['required', ErrorCode.MISSING_REQUIRED_FIELD]
];

export const handleHttpError = (error: any): AppError =>
  error instanceof AppError ? error :
  error instanceof Error ? new AppError(error.message, errorPatterns.find(([pattern]) => error.message.includes(pattern))?.[1] || ErrorCode.INTERNAL_SERVER_ERROR, undefined, true, { originalStack: error.stack }) :
  new AppError('An unexpected error occurred', ErrorCode.INTERNAL_SERVER_ERROR, 500, false, { originalError: error });

export const handleSocketError = (error: any, socket: any, context?: string): void => {
  const appError = handleHttpError(error);
  const msg = context ? `Socket error in ${context}: ${appError.message}` : `Socket error: ${appError.message}`;
  logger.error(msg, { code: appError.code, details: appError.details });
  socket.emit('error', { code: appError.code, message: appError.message, details: appError.details });
};

// Health check utilities with production-friendly logging
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { connection } = mongoose;
    if (connection.readyState !== 1 || !connection.db) return logger.warn('Database health check failed: Not connected'), false;
    const result = await connection.db.admin().ping();
    if (result?.ok === 1) {
      // Only log success in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Database health check passed');
      }
      return true;
    } else {
      logger.warn('Database health check failed: Ping unsuccessful');
      return false;
    }
  } catch (error) {
    return logger.error(`Database health check error: ${error instanceof Error ? error.message : String(error)}`), false;
  }
};

export const checkSystemHealth = async () => {
  const dbHealth = await checkDatabaseHealth();
  const { rss, heapTotal } = process.memoryUsage();
  const [used, total] = [rss, heapTotal].map(v => Math.round(v / 1024 / 1024));
  return { status: dbHealth ? 'healthy' : 'unhealthy', database: dbHealth, uptime: process.uptime(), memory: { used, total, percentUsed: Math.round((used / total) * 100) } };
};

export const startHealthChecks = (intervalMs = 60000): NodeJS.Timeout => {
  const isProd = process.env.NODE_ENV === 'production';
  const interval = isProd ? 300000 : intervalMs; // 5 minutes in prod, 1 minute in dev
  
  logger.info(`Starting health checks every ${interval / 1000} seconds`);
  
  return setInterval(async () => {
    try {
      const health = await checkSystemHealth();
      if (health.status !== 'healthy') {
        logger.warn(`System health check failed: ${JSON.stringify(health)}`);
      } else if (!isProd) {
        // Only log successful checks in development
        logger.debug(`System health check passed: ${JSON.stringify(health)}`);
      }
    } catch (error) {
      logger.error(`Error in health check: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, interval);
};

// Socket validators with ultra-compact exports
export const validatePlayerAuth = validate<string>((s, d) => s.data.identifier || d?.identifier, 'Player identifier is required. Please authenticate first.', ErrorCode.AUTHENTICATION_FAILED);
export const validateGameId = validate<string>((s, d) => s.data.gameId || d?.gameId, 'Game ID is required');
export const validateMoveNumber = validate<number>((_s, d) => d?.number, 'Number is required');
export const validateSocketGameParams = (socket: Socket, data: any, socketData = true): { playerId: string; gameId: string } | null => {
  const playerId = validatePlayerAuth(socket, data);
  const gameId = socketData ? validateGameId(socket, data) : validate<string>((_s, d) => d?.gameId, 'Game ID is required')(socket, data);
    return playerId && gameId ? { playerId, gameId } : null;
};
export const handleSocketValidationError = (socket: Socket, error: Error, context: string): void => (
  logger.error(`Socket validation error in ${context}: ${error.message}`),
  handleSocketError(error instanceof AppError ? error : new AppError(`Validation failed in ${context}: ${error.message}`, ErrorCode.VALIDATION_ERROR, 400), socket)
);