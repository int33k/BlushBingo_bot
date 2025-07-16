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
      scriptSrc: ["'self'", ...(csp.allowUnsafeInline ? ["'unsafe-inline'"] : [])],
      styleSrc: ["'self'", ...(csp.allowUnsafeInline ? ["'unsafe-inline'"] : [])],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", corsBase.origin, ...csp.trustedDomains],
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

  // Middleware chain using method chaining
  [
    helmet({ contentSecurityPolicy: { directives: configs.csp } }),
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
    const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendBuildPath));
    
    // Handle React Router routes - serve index.html for non-API routes
    app.get(/^(?!\/api|\/socket\.io|\/health).*/, (req: Request, res: Response) => {
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
