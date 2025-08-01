"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { TelegramBotService } from '../services';
const config_1 = require("../config");
const router = (0, express_1.Router)();
// Telegram webhook endpoint (for production)
router.post('/webhook/telegram', async (req, res) => {
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            res.status(500).json({ error: 'Telegram bot not configured' });
            return;
        }
        // This would be used when setting up webhooks in production
        // For now, we're using polling in development
        config_1.logger.info('Telegram webhook received:', req.body);
        res.status(200).json({ ok: true });
    }
    catch (error) {
        config_1.logger.error('Telegram webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// Telegram bot info endpoint
router.get('/telegram/info', async (req, res) => {
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
    }
    catch (error) {
        config_1.logger.error('Telegram info error:', error);
        res.status(500).json({ error: 'Failed to get Telegram info' });
    }
});
exports.default = router;
