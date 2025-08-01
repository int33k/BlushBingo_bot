"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.connectDB = exports.logger = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const e = (k, d = '') => process.env[k] || d, n = (k, d) => +e(k, d);
const missing = ['PORT', 'MONGODB_URI', 'NODE_ENV'].filter(k => !process.env[k]);
if (missing.length)
    console.error(`Missing: ${missing.join(', ')}`), process.exit(1);
const [nodeEnv, isProd] = [e('NODE_ENV', 'development'), e('NODE_ENV') === 'production'];
const config = Object.freeze({
    server: { port: n('PORT', 3000), env: nodeEnv, isDev: !isProd, isProd, isTest: nodeEnv === 'test' },
    db: {
        uri: e('MONGODB_URI', 'mongodb://0.0.0.0:27017/bingo'),
        options: { maxPoolSize: 10, minPoolSize: 2, socketTimeoutMS: 45000, connectTimeoutMS: 30000, serverSelectionTimeoutMS: 30000, heartbeatFrequencyMS: 10000, autoIndex: !isProd, retryWrites: true, retryReads: true, monitorCommands: !isProd }
    },
    logging: { level: e('LOG_LEVEL', isProd ? 'info' : 'debug'), format: e('LOG_FORMAT', 'json') },
    game: {
        board: { size: 5, letters: ['B', 'I', 'N', 'G', 'O'] },
        players: { min: 2, max: 2, roles: ['challenger', 'acceptor'] },
        timing: { moveTimeoutSeconds: n('MOVE_TIMEOUT', 30) },
        rules: { requiredLinesForBingo: 5, autoStartWhenAllReady: true, allowRematch: true },
        card: { size: 5, minValue: 1, maxValue: 25 }
    },
    security: {
        rateLimitWindowMs: n('RATE_LIMIT_WINDOW_MS', 60000), rateLimitMax: n('RATE_LIMIT_MAX', 100), corsOrigin: e('CORS_ORIGIN', '*'),
        csp: { trustedDomains: e('CSP_TRUSTED_DOMAINS').split(',').filter(Boolean), allowUnsafeInline: !isProd }
    },
    cache: { ttl: n('CACHE_TTL', 300), checkPeriod: n('CACHE_CHECK_PERIOD', 60) }
});
exports.logger = winston_1.default.createLogger({
    // Only log warn and error in production, info/debug in dev
    level: config.server.isProd ? 'warn' : config.logging.level,
    levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(i => `${i.timestamp} ${i.level}: ${i.message}`)),
    transports: config.server.isProd
        ? [new winston_1.default.transports.Console()]
        : [
            new winston_1.default.transports.Console(),
            new winston_1.default.transports.File({ filename: path_1.default.join('logs', 'error.log'), level: 'error' }),
            new winston_1.default.transports.File({ filename: path_1.default.join('logs', 'all.log') })
        ]
});
winston_1.default.addColors({ error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue' });
const connectDB = async () => {
    const { uri, options } = config.db, MAX_RETRIES = 5;
    const events = [['error', (err) => exports.logger.error(`MongoDB connection error: ${err.message}`)], ['disconnected', () => exports.logger.warn('MongoDB disconnected. Attempting to reconnect...')], ['reconnected', () => exports.logger.info('MongoDB reconnected')]];
    const setupHandlers = () => (events.forEach(([event, handler]) => !mongoose_1.default.connection.listenerCount(event) && mongoose_1.default.connection.on(event, handler)), !process.listenerCount('SIGINT') && process.on('SIGINT', async () => { try {
        await mongoose_1.default.connection.close();
        exports.logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
    }
    catch (err) {
        exports.logger.error(`Error closing MongoDB connection: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    } }));
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            exports.logger.info(`Connecting to MongoDB (Attempt ${attempt}/${MAX_RETRIES})...`);
            const conn = await mongoose_1.default.connect(uri, options);
            setupHandlers();
            exports.logger.info(`MongoDB Connected: ${conn.connection.host}`);
            return mongoose_1.default;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (attempt === MAX_RETRIES) {
                const message = `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${err.message}`;
                exports.logger.error(message);
                throw new Error(message);
            }
            const delay = 1000 * Math.pow(2, attempt - 1);
            exports.logger.warn(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
            exports.logger.info(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Failed to connect to MongoDB');
};
exports.connectDB = connectDB;
// Backward compatibility exports
exports.env = { nodeEnv: config.server.env, port: config.server.port, mongoUri: config.db.uri, clientUrl: config.security.corsOrigin, rateLimitWindowMs: config.security.rateLimitWindowMs, rateLimitMaxRequests: config.security.rateLimitMax, logLevel: config.logging.level };
exports.default = config;
