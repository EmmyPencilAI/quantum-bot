import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { TelegramService } from './services/TelegramService';
import { SignalGenerator } from './services/SignalGenerator';
import signalRoutes from './routes/signals.routes';
import webhookRoutes from './routes/webhook.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Routes
app.use('/api/signals', signalRoutes);
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Quantum Bot',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Dashboard
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../frontend/index.html');
});

// Initialize services
let telegramService: TelegramService;
let signalGenerator: SignalGenerator;

async function initializeServices() {
    try {
        // Connect to database
        await connectDB();
        logger.info('Database connected successfully');

        // Initialize Telegram bot
        telegramService = new TelegramService();
        await telegramService.initialize();
        logger.info('Telegram bot initialized');

        // Initialize signal generator
        signalGenerator = new SignalGenerator(telegramService);

        // Start cron jobs for signals
        if (process.env.ENABLE_SIGNALS === 'true') {
            const interval = parseInt(process.env.SIGNAL_INTERVAL || '5');
            signalGenerator.startCron(interval);
            logger.info(`Signal generation started (${interval} min interval)`);
        }

        // Start server
        app.listen(PORT, () => {
            logger.info(`🚀 Quantum Bot running on port ${PORT}`);
            logger.info(`🤖 Telegram: @quantumbroker_bot`);
            logger.info(`🌐 Health: http://localhost:${PORT}/health`);
        });

    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    if (telegramService) {
        await telegramService.stop();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down...');
    if (telegramService) {
        await telegramService.stop();
    }
    process.exit(0);
});

// Start the application
initializeServices().catch(error => {
    logger.error('Application startup failed:', error);
    process.exit(1);
});

export { app };