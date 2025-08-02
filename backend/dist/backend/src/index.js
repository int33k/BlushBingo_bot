"use strict";
/**
 * Main application entry point - Optimized for conciseness
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const services_1 = require("./services");
const config_2 = __importDefault(require("./config"));
const telegramService_1 = __importDefault(require("./services/telegramService"));
const math_1 = require("./utils/math");
const middleware_1 = require("./middleware");
// Unified configuration factory
const createConfigs = () => {
    const corsBase = { origin: config_2.default.security.corsOrigin, credentials: true };
    const { csp } = config_2.default.security;
    return {
        cors: {
            express: { ...corsBase, methods: ['GET', 'POST', 'OPTIONS'] },
            socket: { ...corsBase, methods: ['GET', 'POST'] }
        },
        csp: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", ...(csp.allowUnsafeInline ? ["'unsafe-inline'"] : []), ...(csp.trustedDomains || [])],
            styleSrc: ["'self'", ...(csp.allowUnsafeInline ? ["'unsafe-inline'"] : [])],
            imgSrc: ["'self'", "data:", "https://t.me", "https://telegram.org", "'https://cdn5.cdn-telegram.org"],
            connectSrc: ["'self'", corsBase.origin, ...(csp.trustedDomains || [])],
            fontSrc: ["'self'"], objectSrc: ["'none'"], mediaSrc: ["'self'"], frameSrc: ["'none'"],
            upgradeInsecureRequests: []
        },
        socket: {
            transports: ['websocket', 'polling'], pingInterval: 25000, pingTimeout: 10000,
            upgradeTimeout: 10000, maxHttpBufferSize: 1e6
        }
    };
};
// Application factory with middleware chain
const createApp = (configs) => {
    const app = (0, express_1.default)();
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
        (0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    ...helmet_1.default.contentSecurityPolicy.getDefaultDirectives(),
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
        (0, compression_1.default)(),
        (0, cors_1.default)(configs.cors.express),
        express_1.default.json({ limit: '1mb' }),
        express_1.default.urlencoded({ extended: true, limit: '1mb' }),
        (req, _, next) => (config_1.logger.http(`${req.method} ${req.url}`), next())
    ].forEach(middleware => app.use(middleware));
    // Serve frontend static files in production
    if (config_2.default.server.env === 'production') {
        app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
    }
    // Serve static files from frontend build (for production/Telegram)
    if (config_2.default.server.isProd || process.env.SERVE_FRONTEND === 'true') {
        const frontendBuildPath = path_1.default.resolve(process.cwd(), 'public');
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
        app.use(express_1.default.static(frontendBuildPath));
        // Handle React Router routes - serve index.html for non-API routes
        app.get(/^(?!\/api|\/socket\.io|\/health).*/, (req, res) => {
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
            res.sendFile(path_1.default.join(frontendBuildPath, 'index.html'));
        });
    }
    // Routes and error handling - TEMPORARILY DISABLED FOR DEBUGGING
    // app.use(routes);
    app.use(middleware_1.errorHandler);
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
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, { cors: configs.cors.socket, ...configs.socket });
    const disconnectionTimer = (0, services_1.initializeSocket)(io);
    try {
        await (0, config_1.connectDB)();
        server.listen(config_2.default.server.port, () => {
            config_1.logger.info(`Server running in ${config_2.default.server.env} mode on port ${config_2.default.server.port}`);
            (0, math_1.startHealthChecks)(60000);
        });
        // --- Initialize Telegram Bot ---
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
            const telegramBot = new telegramService_1.default(botToken);
            await telegramBot.initialize();
            config_1.logger.info('Telegram bot started');
        }
        else {
            config_1.logger.warn('TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
        }
        // Unified error and shutdown handling
        const cleanup = () => (clearInterval(disconnectionTimer), config_1.logger.info('Disconnection timer cleared'));
        const shutdown = (signal) => {
            config_1.logger.info(`${signal} received, shutting down gracefully`);
            cleanup();
            io.emit('server:shutdown', { message: 'Server is shutting down', reconnectAfter: 5000 });
            setTimeout(() => server.close(() => (config_1.logger.info('Process terminated'), process.exit(0))), 1000);
        };
        // Process event handlers using functional approach
        ['unhandledRejection', 'uncaughtException'].forEach(event => process.on(event, (err) => {
            config_1.logger.error(`${event}: ${err.message}`, err.stack || '');
            cleanup();
            server.close(() => process.exit(1));
        }));
        ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => shutdown(signal)));
    }
    catch (error) {
        config_1.logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
};
initializeServer();
