/**
 * Main application entry point - Optimized for conciseness
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { connectDB, logger } from './config';
import { initializeSocket } from './services';
import routes from './routes';
import config from './config';
import TelegramBotService from './services/telegramService';

import { startHealthChecks, checkSystemHealth } from './utils/math';
import { errorHandler } from './middleware';

// Unified configuration factory
const createConfigs = () => {
  const corsBase = { origin: config.security.corsOrigin, credentials: true };
  const { csp } = config.security;

  return {
    cors: {
      express: { ...corsBase, methods: ['GET', 'POST', 'OPTIONS'] },
      socket: { ...corsBase, methods: ['GET', 'POST'] }
    },
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...(csp.allowUnsafeInline ? ["'unsafe-inline'"] : []), ...(csp.trustedDomains || [])],
      styleSrc: ["'self'", ...(csp.allowUnsafeInline ? ["'unsafe-inline'"] : [])],
      imgSrc: ["'self'", "data:", "https://t.me", "https://telegram.org","'https://cdn5.cdn-telegram.org"],
      connectSrc: ["'self'", corsBase.origin, ...(csp.trustedDomains || [])],
      fontSrc: ["'self'"], objectSrc: ["'none'"], mediaSrc: ["'self'"], frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
    socket: {
      transports: ['websocket' as const, 'polling' as const], pingInterval: 25000, pingTimeout: 10000,
      upgradeTimeout: 10000, maxHttpBufferSize: 1e6
    }
  };
};

// Application factory with middleware chain
const createApp = (configs: ReturnType<typeof createConfigs>) => {
  const app = express();


  // Global CSP header for all responses
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://telegram.org https://t.me",
      "style-src 'self' 'unsafe-inline'",
      //"img-src 'self' data: https://t.me https://telegram.org https://cdn1.cdn-telegram.org https://cdn2.cdn-telegram.org https://cdn3.cdn-telegram.org https://cdn4.cdn-telegram.org https://cdn5.cdn-telegram.org",
      "img-src 'self' data: https://t.me https://telegram.org *.telegram.org *.telegram.space *.cdn-telegram.org *.cdn-telegram.space",
      "connect-src 'self' https://t.me https://telegram.org",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'"
    ].join('; '));
    next();
  });

  [
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": configs.csp.scriptSrc,
          "style-src": configs.csp.styleSrc,
          "img-src": [
            "'self'",
            "data:",
            "https://t.me",
            "https://telegram.org",
            "https://cdn5.cdn-telegram.org"
          ],
          "connect-src": configs.csp.connectSrc,
          "font-src": configs.csp.fontSrc,
          "object-src": configs.csp.objectSrc,
          "media-src": configs.csp.mediaSrc,
          "frame-src": configs.csp.frameSrc,
          "upgrade-insecure-requests": configs.csp.upgradeInsecureRequests
        },
      },
    }),
    compression(),
    cors(configs.cors.express),
    express.json({ limit: '1mb' }),
    express.urlencoded({ extended: true, limit: '1mb' }),
    (req: Request, _: Response, next: NextFunction) => (logger.http(`${req.method} ${req.url}`), next())
  ].forEach(middleware => app.use(middleware));

  // Serve frontend static files in production
  if (config.server.env === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
  }

  // Serve static files from frontend build (for production/Telegram)
  if (config.server.isProd || process.env.SERVE_FRONTEND === 'true') {
    const frontendBuildPath = path.resolve(process.cwd(), 'public');
    // Set CSP header for all static file responses
    app.use((req, res, next) => {
      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://telegram.org https://t.me",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://t.me https://telegram.org *.telegram.org *.telegram.space *.cdn-telegram.org *.cdn-telegram.space",
        "connect-src 'self' https://t.me https://telegram.org",
        "font-src 'self'",
        "object-src 'none'",
        "media-src 'self'",
        "frame-src 'none'"
      ].join('; '));
      next();
    });
    app.use(express.static(frontendBuildPath));

    // Handle React Router routes - serve index.html for non-API routes
    app.get(/^(?!\/api|\/socket\.io|\/health).*/, (req: Request, res: Response) => {
      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://telegram.org https://t.me",
        "style-src 'self' 'unsafe-inline'",
        //"img-src 'self' data: https://t.me https://telegram.org https://cdn1.cdn-telegram.org https://cdn2.cdn-telegram.org https://cdn3.cdn-telegram.org https://cdn4.cdn-telegram.org https://cdn5.cdn-telegram.org",
        "img-src 'self' data: https://t.me https://telegram.org *.telegram.org *.telegram.space *.cdn-telegram.org *.cdn-telegram.space",
        "connect-src 'self' https://t.me https://telegram.org",
        "font-src 'self'",
        "object-src 'none'",
        "media-src 'self'",
        "frame-src 'none'"
      ].join('; '));
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  }

  // Routes and error handling - TEMPORARILY DISABLED FOR DEBUGGING
  // app.use(routes);
  app.use(errorHandler);

  // 404 handler for API routes only - TEMPORARILY DISABLED
  // app.use('/api', (_req: Request, res: Response) => {
  //   res.status(404).json({ success: false, error: 'API endpoint not found' });
  // });

  // Health endpoint with inline error handling - TEMPORARILY DISABLED
  // app.get('/health', async (_: Request, res: Response) => {
  //   try {
  //     const health = await checkSystemHealth();
  //     res.status(health.status === 'healthy' ? 200 : 503).json(health);
  //   } catch (error) {
  //     logger.error(`Health check error: ${error instanceof Error ? error.message : String(error)}`);
  //     res.status(500).json({ status: 'error', message: 'Health check failed' });
  //   }
  // });

  return app;
};

// Server initialization with error handling
const initializeServer = async () => {
  // Environment validation is now handled in config/index.ts

  const configs = createConfigs();
  const app = createApp(configs);
  const server = http.createServer(app);
  const io = new Server(server, { cors: configs.cors.socket, ...configs.socket });
  const disconnectionTimer = initializeSocket(io);

  try {
    await connectDB();
    server.listen(config.server.port, () => {
      logger.info(`Server running in ${config.server.env} mode on port ${config.server.port}`);
      startHealthChecks(60000);
    });

    // --- Initialize Telegram Bot ---
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      const telegramBot = new TelegramBotService(botToken);
      await telegramBot.initialize();
      logger.info('Telegram bot started');
    } else {
      logger.warn('TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
    }

    // Unified error and shutdown handling
    const cleanup = () => (clearInterval(disconnectionTimer), logger.info('Disconnection timer cleared'));
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      cleanup();
      io.emit('server:shutdown', { message: 'Server is shutting down', reconnectAfter: 5000 });
      setTimeout(() => server.close(() => (logger.info('Process terminated'), process.exit(0))), 1000);
    };

    // Process event handlers using functional approach
    ['unhandledRejection', 'uncaughtException'].forEach(event =>
      process.on(event as any, (err: Error) => {
        logger.error(`${event}: ${err.message}`, err.stack || '');
        cleanup();
        server.close(() => process.exit(1));
      })
    );

    ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => shutdown(signal)));

  } catch (error) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

initializeServer();
