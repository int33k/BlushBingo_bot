import { Telegraf, Context } from 'telegraf';
import { logger } from '../config';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface GameContext extends Context {
  telegramUser?: TelegramUser;
  gameId?: string;
}

class TelegramBotService {
  private bot: Telegraf;
  private isInitialized = false;

  constructor(token: string) {
    this.bot = new Telegraf(token);
    this.setupCommands();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Extract user info
    this.bot.use((ctx: GameContext, next) => {
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
  private getWebAppBaseUrl(): string {
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
  private autoDetectUrl(): string | null {
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

  /**
   * Generate a game URL with user parameters
   */
  private generateGameUrl(gameId: string, user: TelegramUser): string {
    const baseUrl = this.getWebAppBaseUrl();
    return `${baseUrl}?gameId=${gameId}&userId=${user.id}&firstName=${encodeURIComponent(user.first_name)}`;
  }

  private setupCommands() {
    // Start command - shows main menu
    this.bot.command('start', (ctx: GameContext) => {
      const user = ctx.telegramUser;
      const welcomeMessage = `🎮 Welcome to Blush Bingo, ${user?.first_name}! 🎮

🔥 Ready to play the most exciting Bingo game?

Choose an option:`;

      ctx.reply(welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 Create New Game', callback_data: 'create_game' }],
            [{ text: '🎲 Join Game', callback_data: 'join_game' }],
            [{ text: '📋 How to Play', callback_data: 'how_to_play' }],
            [{ text: '🏆 My Stats', callback_data: 'my_stats' }]
          ]
        }
      });
    });

    // Help command
    this.bot.command('help', (ctx) => {
      ctx.reply(`🎮 Blush Bingo Commands:

/start - Start the game
/create - Create a new game
/join - Join a game with code
/help - Show this help message
/stats - Show your statistics

🎯 Quick Actions:
• Click "Create New Game" to start a new match
• Use a game code to join an existing game
• Play with friends in real-time!`);
    });

    // Handle button callbacks
    this.bot.action('create_game', this.handleCreateGame.bind(this));
    this.bot.action('join_game', this.handleJoinGame.bind(this));
    this.bot.action('how_to_play', this.handleHowToPlay.bind(this));
    this.bot.action('my_stats', this.handleMyStats.bind(this));
    this.bot.action('back_to_menu', this.handleBackToMenu.bind(this));
  }

  private async handleCreateGame(ctx: GameContext) {
    try {
      await ctx.answerCbQuery();
      
      const user = ctx.telegramUser;
      if (!user) {
        await ctx.reply('❌ Unable to identify user. Please try again.');
        return;
      }

      // Generate a unique game ID
      const gameId = this.generateGameId();
      
      const message = `🎯 New Game Created!

🔗 Game Code: \`${gameId}\`

🌐 Play here: ${this.generateGameUrl(gameId, user)}

Share the game code with a friend to start playing! 🎮`;

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Open Game', web_app: { url: this.generateGameUrl(gameId, user) } }],
            [{ text: '📋 Share Game Code', switch_inline_query: `Join my Bingo game! Code: ${gameId}` }],
            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      logger.error('Error creating game:', error);
      await ctx.reply('❌ Failed to create game. Please try again.');
    }
  }

  private async handleJoinGame(ctx: GameContext) {
    try {
      await ctx.answerCbQuery();
      
      await ctx.reply('🎲 Enter the game code to join:', {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Enter game code...'
        }
      });

      // Listen for the next message as game code
      this.bot.hears(/^[A-Z0-9]{6}$/, async (ctx: GameContext) => {
        const gameId = 'text' in ctx.message! ? ctx.message.text : undefined;
        const user = ctx.telegramUser;
        
        if (!gameId || !user) {
          await ctx.reply('❌ Invalid game code or user. Please try again.');
          return;
        }

        const gameUrl = this.generateGameUrl(gameId, user);
        
        await ctx.reply(`🎮 Joining game: \`${gameId}\``, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Open Game', web_app: { url: gameUrl } }],
              [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
            ]
          }
        });
      });

    } catch (error) {
      logger.error('Error joining game:', error);
      await ctx.reply('❌ Failed to join game. Please try again.');
    }
  }

  private async handleHowToPlay(ctx: GameContext) {
    try {
      await ctx.answerCbQuery();
      
      const instructions = `🎯 How to Play Blush Bingo:

1️⃣ **Create or Join**: Start a new game or join with a code
2️⃣ **Fill Your Card**: Complete your 5x5 bingo card with numbers 1-25
3️⃣ **Wait for Match**: Both players must be ready to start
4️⃣ **Play**: Numbers are called automatically
5️⃣ **Mark Numbers**: Tap numbers on your card as they're called
6️⃣ **Get BINGO**: Complete 5 lines (rows, columns, diagonals) to win!

🏆 **Winning**: First to complete all 5 lines wins the game!

💡 **Tips**:
• Choose your numbers strategically
• Pay attention to called numbers
• React quickly to mark your card`;

      await ctx.reply(instructions, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 Create Game', callback_data: 'create_game' }],
            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      logger.error('Error showing instructions:', error);
      await ctx.reply('❌ Failed to load instructions. Please try again.');
    }
  }

  private async handleMyStats(ctx: GameContext) {
    try {
      await ctx.answerCbQuery();
      
      // TODO: Implement stats fetching from database
      const stats = `📊 Your Blush Bingo Stats:

🎮 Games Played: 0
🏆 Games Won: 0
📈 Win Rate: 0%
⚡ Best Time: --
🔥 Current Streak: 0

🚀 Start playing to build your stats!`;

      await ctx.reply(stats, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 Play Now', callback_data: 'create_game' }],
            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      logger.error('Error showing stats:', error);
      await ctx.reply('❌ Failed to load stats. Please try again.');
    }
  }

  private async handleBackToMenu(ctx: GameContext) {
    try {
      await ctx.answerCbQuery();
      
      const user = ctx.telegramUser;
      const welcomeMessage = `🎮 Welcome back to Blush Bingo, ${user?.first_name}! 🎮

🔥 Ready to play the most exciting Bingo game?

Choose an option:`;

      await ctx.editMessageText(welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 Create New Game', callback_data: 'create_game' }],
            [{ text: '🎲 Join Game', callback_data: 'join_game' }],
            [{ text: '📋 How to Play', callback_data: 'how_to_play' }],
            [{ text: '🏆 My Stats', callback_data: 'my_stats' }]
          ]
        }
      });

    } catch (error) {
      logger.error('Error showing back to menu:', error);
      await ctx.reply('❌ Failed to show menu. Please try /start again.');
    }
  }

  private generateGameId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Telegram bot already initialized');
      return;
    }

    try {
      // Set up webhook or start polling based on environment
      if (process.env.TELEGRAM_WEBHOOK_URL) {
        await this.bot.telegram.setWebhook(process.env.TELEGRAM_WEBHOOK_URL);
        logger.info(`Telegram webhook set to: ${process.env.TELEGRAM_WEBHOOK_URL}`);
      } else {
        // For development, use polling
        this.bot.launch();
        logger.info('Telegram bot started with polling');
      }

      this.isInitialized = true;
      
      // Get bot info
      const botInfo = await this.bot.telegram.getMe();
      logger.info(`Telegram bot initialized: @${botInfo.username}`);

    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  public getBot(): Telegraf {
    return this.bot;
  }

  public async stop(): Promise<void> {
    if (this.isInitialized) {
      this.bot.stop();
      this.isInitialized = false;
      logger.info('Telegram bot stopped');
    }
  }
}

export default TelegramBotService;
