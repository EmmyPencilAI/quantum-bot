import cron from 'node-cron';
import { logger } from '../utils/logger';
import { Signal } from '../models/Signal';
import { TelegramService } from './TelegramService';
import { MarketDataService } from './MarketDataService';

export class SignalGenerator {
    private marketDataService: MarketDataService;
    private telegramService: TelegramService;
    private isRunning: boolean = false;

    constructor(telegramService: TelegramService) {
        this.marketDataService = new MarketDataService();
        this.telegramService = telegramService;
    }

    startCron(intervalMinutes: number = 5): void {
        if (this.isRunning) {
            logger.warn('Signal generator already running');
            return;
        }

        // Convert minutes to cron expression
        const cronExpression = `*/${intervalMinutes} * * * *`;

        cron.schedule(cronExpression, async () => {
            await this.generateAndBroadcastSignals();
        });

        this.isRunning = true;
        logger.info(`Signal cron scheduled every ${intervalMinutes} minutes`);

        // Generate initial signal
        this.generateAndBroadcastSignals().catch(error => {
            logger.error('Initial signal generation failed:', error);
        });
    }

    async generateAndBroadcastSignals(): Promise<void> {
        try {
            logger.info('Generating new signals...');

            // Get market data
            const marketData = await this.marketDataService.getMarketData();

            // Generate signals based on market data
            const signals = await this.generateSignals(marketData);

            // Save and broadcast each signal
            for (const signalData of signals) {
                const signal = new Signal(signalData);
                await signal.save();

                // Broadcast to all subscribed users
                await this.telegramService.broadcastSignal(signal);

                logger.info(`Signal generated: ${signal.symbol} ${signal.type} (${signal.confidence}%)`);
            }

            logger.info(`Generated ${signals.length} signals`);

        } catch (error) {
            logger.error('Error generating signals:', error);
        }
    }

    private async generateSignals(marketData: any[]): Promise<any[]> {
        const signals = [];

        // Example symbols to monitor
        const symbols = ['QUBIC/USDT', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

        for (const symbol of symbols) {
            try {
                // Get symbol-specific data
                const symbolData = marketData.find(data => data.symbol === symbol) ||
                    await this.marketDataService.getSymbolData(symbol);

                if (!symbolData) continue;

                // Analyze and generate signal
                const signal = await this.analyzeAndCreateSignal(symbol, symbolData);

                if (signal) {
                    signals.push(signal);
                }

            } catch (error) {
                logger.error(`Error generating signal for ${symbol}:`, error);
            }
        }

        return signals;
    }

    private async analyzeAndCreateSignal(symbol: string, data: any): Promise<any> {
        // Mock analysis - replace with actual AI/technical analysis
        const currentPrice = data.price || Math.random() * 100;
        const rsi = Math.random() * 100;
        const volume = data.volume || Math.random() * 1000000;
        const change24h = data.change24h || (Math.random() * 20 - 10);

        // Determine signal type based on analysis
        let type: 'BUY' | 'SELL' | 'HOLD' | 'ALERT';
        let confidence = 0;

        if (rsi < 30 && change24h > -5) {
            type = 'BUY';
            confidence = Math.floor(70 + Math.random() * 25);
        } else if (rsi > 70 && change24h < 5) {
            type = 'SELL';
            confidence = Math.floor(70 + Math.random() * 25);
        } else if (Math.abs(change24h) > 10) {
            type = 'ALERT';
            confidence = Math.floor(80 + Math.random() * 15);
        } else {
            type = 'HOLD';
            confidence = Math.floor(50 + Math.random() * 20);
        }

        // Calculate target and stop loss
        const targetMultiplier = type === 'BUY' ? 1.1 : 0.9;
        const stopLossMultiplier = type === 'BUY' ? 0.95 : 1.05;

        const targetPrice = currentPrice * targetMultiplier;
        const stopLossPrice = currentPrice * stopLossMultiplier;

        return {
            symbol,
            type,
            confidence,
            price: currentPrice,
            target: targetPrice,
            stopLoss: stopLossPrice,
            source: 'Quantum AI Analysis',
            metadata: {
                rsi,
                volume,
                trend: rsi > 50 ? 'Bullish' : 'Bearish',
                marketCap: currentPrice * 1000000000,
                change24h
            }
        };
    }

    async generateManualSignal(symbol: string, type: 'BUY' | 'SELL', price: number): Promise<ISignal | null> {
        try {
            const signalData = {
                symbol,
                type,
                confidence: 85,
                price,
                target: price * (type === 'BUY' ? 1.15 : 0.85),
                stopLoss: price * (type === 'BUY' ? 0.95 : 1.05),
                source: 'Manual Entry',
                metadata: {
                    rsi: 50,
                    volume: 0,
                    trend: 'Neutral',
                    marketCap: 0,
                    change24h: 0
                }
            };

            const signal = new Signal(signalData);
            await signal.save();
            await this.telegramService.broadcastSignal(signal);

            return signal;
        } catch (error) {
            logger.error('Error generating manual signal:', error);
            return null;
        }
    }

    stop(): void {
        this.isRunning = false;
        logger.info('Signal generator stopped');
    }
}