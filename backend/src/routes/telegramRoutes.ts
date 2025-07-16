import { Router, Request, Response } from 'express';
// import { TelegramBotService } from '../services';
import { logger } from '../config';

const router = Router();

// Telegram webhook endpoint (for production)
router.post('/webhook/telegram', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      res.status(500).json({ error: 'Telegram bot not configured' });
      return;
    }

    // This would be used when setting up webhooks in production
    // For now, we're using polling in development
    logger.info('Telegram webhook received:', req.body);
    res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Telegram bot info endpoint
router.get('/telegram/info', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      res.status(404).json({ error: 'Telegram bot not configured' });
      return;
    }

    res.json({
      configured: true,
      environment: process.env.NODE_ENV,
      webhookMode: !!process.env.TELEGRAM_WEBHOOK_URL
    });
    
  } catch (error) {
    logger.error('Telegram info error:', error);
    res.status(500).json({ error: 'Failed to get Telegram info' });
  }
});

export default router;
