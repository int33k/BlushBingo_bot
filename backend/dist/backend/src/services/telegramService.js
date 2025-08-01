"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const config_1 = require("../config");
class TelegramBotService {
    constructor(token) {
        this.isInitialized = false;
        this.bot = new telegraf_1.Telegraf(token);
        this.setupMiddleware();
        this.setupCommands();
    }
    setupMiddleware() {
        // Extract user info
        this.bot.use((ctx, next) => {
            if (ctx.from) {
                ctx.telegramUser = {
                    id: ctx.from.id,
                    first_name: ctx.from.first_name,
                    last_name: ctx.from.last_name,
                    username: ctx.from.username
                };
            }
            return next();
        });
    }
    /**
     * Get the base URL for the WebApp
     * Priority: TELEGRAM_WEBAPP_URL -> AUTO_DETECT_URL -> default localhost
     */
    getWebAppBaseUrl() {
        // 1. Use explicit TELEGRAM_WEBAPP_URL if set
        if (process.env.TELEGRAM_WEBAPP_URL) {
            return process.env.TELEGRAM_WEBAPP_URL;
        }
        // 2. Try to auto-detect from common hosting patterns
        const autoDetectedUrl = this.autoDetectUrl();
        if (autoDetectedUrl) {
            return autoDetectedUrl;
        }
        // 3. Fall back to localhost for development
        return 'http://localhost:3001';
    }
    /**
     * Auto-detect URL from common hosting patterns
     */
    autoDetectUrl() {
        // Heroku
        if (process.env.HEROKU_APP_NAME) {
            return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
        }
        // Railway
        if (process.env.RAILWAY_STATIC_URL) {
            return process.env.RAILWAY_STATIC_URL;
        }
        // Render
        if (process.env.RENDER_EXTERNAL_URL) {
            return process.env.RENDER_EXTERNAL_URL;
        }
        // Vercel
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
        }
        // Generic hosting with HOST and PORT
        if (process.env.HOST && process.env.PORT) {
            const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
            return `${protocol}://${process.env.HOST}:${process.env.PORT}`;
        }
        return null;
    }
    setupCommands() {
        // Start command - shows main menu
        this.bot.command('start', (ctx) => {
            const user = ctx.telegramUser;
            config_1.logger.info(`[TelegramBot] /start user: ${JSON.stringify(user)}`);
            const firstName = user && typeof user.first_name === 'string' ? user.first_name : (user && user.username ? user.username : 'Player');
            // Show first name in bold, fallback to username or 'Player' if not available
            const nameText = firstName ? `<b>${firstName}</b>` : '<b>Player</b>';
            const welcomeMessage = `Welcome to BlushBingo, ${nameText}!\nTap on Launch Game button to play`;
            ctx.replyWithHTML(welcomeMessage, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🚀 Launch Game', web_app: { url: this.getWebAppBaseUrl() } }]
                    ]
                }
            });
        });
        // Help command
        this.bot.command('help', (ctx) => {
            const instructions = `🎯 How to Play Blush Bingo:

1️⃣ Create or Join: Start a new game or join with a code
2️⃣ Fill Your Card: Complete your 5x5 bingo card with numbers 1-25
3️⃣ Wait for Match: Both players must be ready to start
4️⃣ Play: Numbers are called Turn-wise
5️⃣ Mark Numbers: Tap numbers on your card as they're called
6️⃣ Get BINGO: Complete 5 lines (rows, columns, diagonals) to win!

🏆 Winning: First to complete all 5 lines wins the game!

💡 Tips:
• Choose your numbers strategically
• Pay attention to called numbers
• React quickly to mark your card`;
            ctx.reply(instructions);
        });
    }
    async initialize() {
        if (this.isInitialized) {
            config_1.logger.warn('Telegram bot already initialized');
            return;
        }
        try {
            // Set up webhook or start polling based on environment
            if (process.env.TELEGRAM_WEBHOOK_URL) {
                await this.bot.telegram.setWebhook(process.env.TELEGRAM_WEBHOOK_URL);
                config_1.logger.info(`Telegram webhook set to: ${process.env.TELEGRAM_WEBHOOK_URL}`);
            }
            else {
                // For development, use polling
                this.bot.launch();
                config_1.logger.info('Telegram bot started with polling');
            }
            this.isInitialized = true;
            // Get bot info
            const botInfo = await this.bot.telegram.getMe();
            config_1.logger.info(`Telegram bot initialized: @${botInfo.username}`);
        }
        catch (error) {
            config_1.logger.error('Failed to initialize Telegram bot:', error);
            throw error;
        }
    }
    getBot() {
        return this.bot;
    }
    async stop() {
        if (this.isInitialized) {
            this.bot.stop();
            this.isInitialized = false;
            config_1.logger.info('Telegram bot stopped');
        }
    }
}
exports.default = TelegramBotService;
