import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { TelegramService } from './services/TelegramService';
import { SignalGenerator } from './services/SignalGenerator';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Services
const telegramService = new TelegramService();
const signalGenerator = new SignalGenerator();

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://quantum-bot.vercel.app',
        'https://quantum-bot-frontend.vercel.app',
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
async function initializeServices() {
    try {
        // Connect to database (optional)
        await connectDB();

        // Start signal generator
        if (process.env.NODE_ENV === 'production') {
            signalGenerator.start();
        }

        console.log('✅ Services initialized');
    } catch (error) {
        console.error('❌ Service initialization error:', error);
        // Continue with mock data
    }
}

// Health Check
app.get('/', (req, res) => {
    res.json({
        message: 'Quantum Bot API',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        services: {
            telegram: !!process.env.TELEGRAM_BOT_TOKEN,
            database: !!process.env.MONGODB_URI,
            signals: true
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Quantum Bot API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// API Routes (keep the same routes as before)
// ... [All the routes from the simple version above]

// Telegram Webhook
app.post('/webhook/telegram/:secret', (req, res) => {
    const { secret } = req.params;

    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Process Telegram update
    const update = req.body;

    if (update.message) {
        console.log('Telegram message:', update.message.text);

        // Echo response
        res.json({
            success: true,
            response: `Echo: ${update.message.text}`
        });
    } else {
        res.json({ success: true });
    }
});

// Generate test signal
app.post('/api/signals/test', (req, res) => {
    const signal = {
        id: Date.now(),
        symbol: 'QUBIC/USDT',
        type: 'BUY',
        confidence: 92,
        price: 0.002156,
        target: 0.002500,
        stopLoss: 0.001900,
        timestamp: new Date().toISOString(),
        source: 'Test API',
        metadata: {
            rsi: 32.5,
            volume: 1250000,
            trend: 'Bullish'
        }
    };

    // Send to Telegram
    telegramService.sendSignal(signal);

    res.json({
        success: true,
        message: 'Test signal generated and sent to Telegram',
        data: signal
    });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, async () => {
        console.log(`🚀 Quantum Bot API running on port ${PORT}`);
        console.log(`🌐 Health: http://localhost:${PORT}/health`);
        console.log(`📊 Signals: http://localhost:${PORT}/api/signals`);

        // Initialize services
        await initializeServices();
    });
}

export default app;