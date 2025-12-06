import { Router, Request, Response } from 'express';
import { Signal } from '../models/Signal';
import { logger } from '../utils/logger';

const router = Router();

// Get all signals
router.get('/', async (req: Request, res: Response) => {
    try {
        const { limit = 50, page = 1, type, symbol } = req.query;

        const filter: any = {};
        if (type) filter.type = type;
        if (symbol) filter.symbol = symbol;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const signals = await Signal.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        const total = await Signal.countDocuments(filter);

        res.json({
            success: true,
            data: signals,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        logger.error('Error fetching signals:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch signals' });
    }
});

// Get signal by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const signal = await Signal.findById(req.params.id);

        if (!signal) {
            return res.status(404).json({ success: false, error: 'Signal not found' });
        }

        res.json({ success: true, data: signal });
    } catch (error) {
        logger.error('Error fetching signal:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch signal' });
    }
});

// Get signal statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalSignals,
            todaySignals,
            weekSignals,
            buySignals,
            sellSignals
        ] = await Promise.all([
            Signal.countDocuments(),
            Signal.countDocuments({ timestamp: { $gte: yesterday } }),
            Signal.countDocuments({ timestamp: { $gte: lastWeek } }),
            Signal.countDocuments({ type: 'BUY' }),
            Signal.countDocuments({ type: 'SELL' })
        ]);

        const avgConfidence = await Signal.aggregate([
            { $group: { _id: null, avg: { $avg: "$confidence" } } }
        ]);

        res.json({
            success: true,
            data: {
                total: totalSignals,
                today: todaySignals,
                last7Days: weekSignals,
                buy: buySignals,
                sell: sellSignals,
                avgConfidence: avgConfidence[0]?.avg?.toFixed(2) || '0'
            }
        });
    } catch (error) {
        logger.error('Error fetching signal stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
});

// Get recent signals by symbol
router.get('/symbol/:symbol', async (req: Request, res: Response) => {
    try {
        const { limit = 20 } = req.query;
        const symbol = req.params.symbol.toUpperCase();

        const signals = await Signal.find({ symbol })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit as string));

        res.json({ success: true, data: signals });
    } catch (error) {
        logger.error('Error fetching symbol signals:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch signals' });
    }
});

// Create a manual signal (admin only)
router.post('/', async (req: Request, res: Response) => {
    try {
        // In production, add authentication middleware here

        const { symbol, type, price, confidence, source } = req.body;

        if (!symbol || !type || !price) {
            return res.status(400).json({
                success: false,
                error: 'Symbol, type, and price are required'
            });
        }

        const signal = new Signal({
            symbol: symbol.toUpperCase(),
            type,
            confidence: confidence || 75,
            price: parseFloat(price),
            target: parseFloat(price) * (type === 'BUY' ? 1.15 : 0.85),
            stopLoss: parseFloat(price) * (type === 'BUY' ? 0.95 : 1.05),
            source: source || 'Manual Entry',
            metadata: {
                rsi: 50,
                volume: 0,
                trend: 'Neutral'
            }
        });

        await signal.save();

        logger.info(`Manual signal created: ${signal.symbol} ${signal.type}`);

        res.status(201).json({ success: true, data: signal });
    } catch (error) {
        logger.error('Error creating manual signal:', error);
        res.status(500).json({ success: false, error: 'Failed to create signal' });
    }
});

export default router;