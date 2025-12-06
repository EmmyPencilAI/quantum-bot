import { Router, Request, Response } from 'express';
import { TelegramService } from '../services/TelegramService';
import { logger } from '../utils/logger';

const router = Router();
const telegramService = new TelegramService();

// Telegram webhook endpoint
router.post(`/telegram/${process.env.TELEGRAM_WEBHOOK_SECRET || 'secret'}`,
    telegramService.getWebhookMiddleware()
);

// Health check for webhook
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'webhook',
        timestamp: new Date().toISOString()
    });
});

// Test webhook endpoint
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { message, chatId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        logger.info(`Test webhook received: ${message}`);

        res.json({
            success: true,
            message: 'Webhook test successful',
            data: { message, timestamp: new Date() }
        });
    } catch (error) {
        logger.error('Webhook test error:', error);
        res.status(500).json({ error: 'Webhook test failed' });
    }
});

export default router;