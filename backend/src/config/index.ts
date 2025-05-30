import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config();

const e = (k: string, d: any = '') => process.env[k] || d, n = (k: string, d: number) => +e(k, d);
const missing = ['PORT', 'MONGODB_URI', 'NODE_ENV'].filter(k => !process.env[k]);
if (missing.length) console.error(`Missing: ${missing.join(', ')}`), process.exit(1);

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
    timing: { disconnectionTimeoutSeconds: n('DISCONNECTION_TIMEOUT', 60), moveTimeoutSeconds: n('MOVE_TIMEOUT', 30), gameExpiryHours: 24 },
    rules: { requiredLinesForBingo: 5, autoStartWhenAllReady: true, allowRematch: true },
    card: { size: 5, minValue: 1, maxValue: 25 }
  },
  security: {
    rateLimitWindowMs: n('RATE_LIMIT_WINDOW_MS', 60000), rateLimitMax: n('RATE_LIMIT_MAX', 100), corsOrigin: e('CORS_ORIGIN', '*'),
    csp: { trustedDomains: e('CSP_TRUSTED_DOMAINS').split(',').filter(Boolean), allowUnsafeInline: !isProd }
  },
  cache: { ttl: n('CACHE_TTL', 300), checkPeriod: n('CACHE_CHECK_PERIOD', 60) }
});

export const logger = winston.createLogger({
  level: config.logging.level, levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
  format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.colorize({ all: true }), winston.format.printf(i => `${i.timestamp} ${i.level}: ${i.message}`)),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }), new winston.transports.File({ filename: path.join('logs', 'all.log') })]
});
winston.addColors({ error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue' });

export const connectDB = async (): Promise<typeof mongoose> => {
  const { uri, options } = config.db, MAX_RETRIES = 5;
  const events = [['error', (err: Error) => logger.error(`MongoDB connection error: ${err.message}`)], ['disconnected', () => logger.warn('MongoDB disconnected. Attempting to reconnect...')], ['reconnected', () => logger.info('MongoDB reconnected')]] as const;
  const setupHandlers = () => (events.forEach(([event, handler]) => !mongoose.connection.listenerCount(event) && mongoose.connection.on(event, handler)), !process.listenerCount('SIGINT') && process.on('SIGINT', async () => { try { await mongoose.connection.close(); logger.info('MongoDB connection closed due to app termination'); process.exit(0); } catch (err) { logger.error(`Error closing MongoDB connection: ${err instanceof Error ? err.message : String(err)}`); process.exit(1); } }));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Connecting to MongoDB (Attempt ${attempt}/${MAX_RETRIES})...`);
      const conn = await mongoose.connect(uri, options);
      setupHandlers();
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return mongoose;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (attempt === MAX_RETRIES) { const message = `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${err.message}`; logger.error(message); throw new Error(message); }
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.warn(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to connect to MongoDB');
};

// Backward compatibility exports
export const env = { nodeEnv: config.server.env, port: config.server.port, mongoUri: config.db.uri, clientUrl: config.security.corsOrigin, rateLimitWindowMs: config.security.rateLimitWindowMs, rateLimitMaxRequests: config.security.rateLimitMax, logLevel: config.logging.level };
export default config;
