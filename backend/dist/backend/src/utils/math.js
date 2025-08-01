"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSocketValidationError = exports.validateSocketGameParams = exports.validateMoveNumber = exports.validateGameId = exports.validatePlayerAuth = exports.startHealthChecks = exports.checkSystemHealth = exports.checkDatabaseHealth = exports.handleSocketError = exports.handleHttpError = exports.ctrl = exports.gameState = exports.gameParams = exports.userData = exports.req = exports.validateEnvVars = exports.isInRange = exports.getRandomNumber = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const errors_1 = require("./errors");
const config_1 = require("../config");
// Math & validation utilities with ultra-compact implementations
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
exports.getRandomNumber = getRandomNumber;
const isInRange = (num, min, max) => num >= min && num <= max;
exports.isInRange = isInRange;
const validateEnvVars = (env, requiredVars) => {
    const missing = requiredVars.filter(v => !env[v]?.trim());
    if (missing.length)
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
};
exports.validateEnvVars = validateEnvVars;
const req = (v, f) => v || (() => { throw new errors_1.AppError(`${f} is required`, errors_1.ErrorCode.MISSING_REQUIRED_FIELD); })();
exports.req = req;
const userData = (n, i) => ({ name: n || `Player_${i.substring(0, 5)}`, identifier: i });
exports.userData = userData;
const gameParams = (r) => ({ gameId: (0, exports.req)(r.params.gameId, 'Game ID'), playerId: (0, exports.req)(r.body.playerId, 'Player ID') });
exports.gameParams = gameParams;
const gameState = (g, s) => (Array.isArray(s) ? s : [s]).includes(g.status) || (() => { throw new errors_1.AppError(`Game not in ${(Array.isArray(s) ? s : [s]).join(' or ')} state. Current: ${g.status}`, errors_1.ErrorCode.INVALID_GAME_STATE); })();
exports.gameState = gameState;
// Controller wrapper with ultra-compact implementation
const ctrl = (code = 200) => (h) => async (req, res, next) => {
    try {
        const result = await h(req, res, next);
        !res.headersSent && res.status(code).json({ success: true, data: result });
    }
    catch (error) {
        config_1.logger.error(`Controller error: ${error instanceof Error ? error.message : String(error)}`);
        next(error);
    }
};
exports.ctrl = ctrl;
// Socket validation with ultra-compact factory pattern
const validate = (getValue, errorMsg, errorCode = errors_1.ErrorCode.MISSING_REQUIRED_FIELD) => (socket, data) => {
    const value = getValue(socket, data);
    return value || ((0, exports.handleSocketError)(new errors_1.AppError(errorMsg, errorCode), socket), null);
};
// Error handling with pattern matching optimization
const errorPatterns = [
    ['not found', errors_1.ErrorCode.GAME_NOT_FOUND], ['already in', errors_1.ErrorCode.PLAYER_ALREADY_IN_GAME],
    ['not your turn', errors_1.ErrorCode.NOT_YOUR_TURN], ['invalid move', errors_1.ErrorCode.INVALID_MOVE], ['required', errors_1.ErrorCode.MISSING_REQUIRED_FIELD]
];
const handleHttpError = (error) => error instanceof errors_1.AppError ? error :
    error instanceof Error ? new errors_1.AppError(error.message, errorPatterns.find(([pattern]) => error.message.includes(pattern))?.[1] || errors_1.ErrorCode.INTERNAL_SERVER_ERROR, undefined, true, { originalStack: error.stack }) :
        new errors_1.AppError('An unexpected error occurred', errors_1.ErrorCode.INTERNAL_SERVER_ERROR, 500, false, { originalError: error });
exports.handleHttpError = handleHttpError;
const handleSocketError = (error, socket, context) => {
    const appError = (0, exports.handleHttpError)(error);
    const msg = context ? `Socket error in ${context}: ${appError.message}` : `Socket error: ${appError.message}`;
    config_1.logger.error(msg, { code: appError.code, details: appError.details });
    socket.emit('error', { code: appError.code, message: appError.message, details: appError.details });
};
exports.handleSocketError = handleSocketError;
// Health check utilities with production-friendly logging
const checkDatabaseHealth = async () => {
    try {
        const { connection } = mongoose_1.default;
        if (connection.readyState !== 1 || !connection.db)
            return config_1.logger.warn('Database health check failed: Not connected'), false;
        const result = await connection.db.admin().ping();
        if (result?.ok === 1) {
            // Only log success in development
            if (process.env.NODE_ENV === 'development') {
                config_1.logger.debug('Database health check passed');
            }
            return true;
        }
        else {
            config_1.logger.warn('Database health check failed: Ping unsuccessful');
            return false;
        }
    }
    catch (error) {
        return config_1.logger.error(`Database health check error: ${error instanceof Error ? error.message : String(error)}`), false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
const checkSystemHealth = async () => {
    const dbHealth = await (0, exports.checkDatabaseHealth)();
    const { rss, heapTotal } = process.memoryUsage();
    const [used, total] = [rss, heapTotal].map(v => Math.round(v / 1024 / 1024));
    return { status: dbHealth ? 'healthy' : 'unhealthy', database: dbHealth, uptime: process.uptime(), memory: { used, total, percentUsed: Math.round((used / total) * 100) } };
};
exports.checkSystemHealth = checkSystemHealth;
const startHealthChecks = (intervalMs = 60000) => {
    const isProd = process.env.NODE_ENV === 'production';
    // In production, run every 15 minutes; in dev, keep as is
    const interval = isProd ? 900000 : intervalMs; // 15 min prod, 1 min dev
    if (!isProd) {
        config_1.logger.info(`Starting health checks every ${interval / 1000} seconds`);
    }
    return setInterval(async () => {
        try {
            const health = await (0, exports.checkSystemHealth)();
            if (health.status !== 'healthy') {
                config_1.logger.warn(`System health check failed: ${JSON.stringify(health)}`);
            }
            else if (!isProd) {
                // Only log successful checks in development
                config_1.logger.debug(`System health check passed: ${JSON.stringify(health)}`);
            }
            // In production, do not log successful health checks
        }
        catch (error) {
            config_1.logger.error(`Error in health check: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, interval);
};
exports.startHealthChecks = startHealthChecks;
// Socket validators with ultra-compact exports
exports.validatePlayerAuth = validate((s, d) => s.data.identifier || d?.identifier, 'Player identifier is required. Please authenticate first.', errors_1.ErrorCode.AUTHENTICATION_FAILED);
exports.validateGameId = validate((s, d) => s.data.gameId || d?.gameId, 'Game ID is required');
exports.validateMoveNumber = validate((_s, d) => d?.number, 'Number is required');
const validateSocketGameParams = (socket, data, socketData = true) => {
    const playerId = (0, exports.validatePlayerAuth)(socket, data);
    const gameId = socketData ? (0, exports.validateGameId)(socket, data) : validate((_s, d) => d?.gameId, 'Game ID is required')(socket, data);
    return playerId && gameId ? { playerId, gameId } : null;
};
exports.validateSocketGameParams = validateSocketGameParams;
const handleSocketValidationError = (socket, error, context) => (config_1.logger.error(`Socket validation error in ${context}: ${error.message}`),
    (0, exports.handleSocketError)(error instanceof errors_1.AppError ? error : new errors_1.AppError(`Validation failed in ${context}: ${error.message}`, errors_1.ErrorCode.VALIDATION_ERROR, 400), socket));
exports.handleSocketValidationError = handleSocketValidationError;
