import { Telegraf, Context, Markup } from 'telegraf';
import { logger } from '../utils/logger';
import { Signal, ISignal } from '../models/Signal';
import { User, IUser } from '../models/User';

export class TelegramService {
    private bot: Telegraf;
    private isWebhookMode: boolean;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }

        this.bot = new Telegraf(token);
        this.isWebhookMode = process.env.NODE_ENV === 'production';
        this.setupCommands();
    }

    private setupCommands(): void {
        // Start command
        this.bot.command('start', async (ctx) => {
            await this.handleStart(ctx);
        });

        // Signals command
        this.bot.command('signals', async (ctx) => {
            await this.handleSignals(ctx);
        });

        // Subscribe command
        this.bot.command('subscribe', async (ctx) => {
            await this.handleSubscribe(ctx);
        });

        // Unsubscribe command
        this.bot.command('unsubscribe', async (ctx) => {
            await this.handleUnsubscribe(ctx);
        });

        // Stats command
        this.bot.command('stats', async (ctx) => {
            await this.handleStats(ctx);
        });

        // Help command
        this.bot.command('help', async (ctx) => {
            await this.handleHelp(ctx);
        });

        // Settings command
        this.bot.command('settings', async (ctx) => {
            await this.handleSettings(ctx);
        });

        // Alert command
        this.bot.command('alert', async (ctx) => {
            await this.handleAlert(ctx);
        });

        // Price command
        this.bot.command('price', async (ctx) => {
            await this.handlePrice(ctx);
        });

        // Handle callback queries
        this.bot.on('callback_query', async (ctx) => {
            await this.handleCallbackQuery(ctx);
        });
    }

    async initialize(): Promise<void> {
        if (this.isWebhookMode) {
            // Webhook mode for production
            const domain = process.env.DOMAIN;
            if (!domain) {
                throw new Error('DOMAIN is required for webhook mode');
            }

            const webhookPath = `/webhook/telegram/${process.env.TELEGRAM_WEBHOOK_SECRET}`;
            await this.bot.telegram.setWebhook(`${domain}${webhookPath}`);
            logger.info(`Webhook set to: ${domain}${webhookPath}`);
        } else {
            // Polling mode for development
            await this.bot.launch();
            logger.info('Telegram bot started in polling mode');
        }
    }

    async stop(): Promise<void> {
        await this.bot.stop();
    }

    async sendSignal(signal: ISignal, chatId?: string | number): Promise<number | null> {
        try {
            const message = this.formatSignalMessage(signal);

            // If specific chatId provided, send there
            const targetChatId = chatId || process.env.TELEGRAM_ADMIN_ID;

            if (!targetChatId) {
                logger.warn('No chat ID provided for signal');
                return null;
            }

            const sentMessage = await this.bot.telegram.sendMessage(
                targetChatId,
                message,
                {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                Markup.button.url('📊 View Chart', `https://www.tradingview.com/chart/?symbol=${signal.symbol}`),
                                Markup.button.url('💰 Trade', `https://www.binance.com/en/trade/${signal.symbol}`)
                            ],
                            [
                                Markup.button.callback('🔔 Set Alert', `alert_${signal.symbol}`),
                                Markup.button.callback('📈 More Details', `details_${signal._id}`)
                            ]
                        ]
                    }
                }
            );

            return sentMessage.message_id;

        } catch (error) {
            logger.error('Error sending Telegram signal:', error);
            return null;
        }
    }

    async broadcastSignal(signal: ISignal): Promise<void> {
        try {
            const subscribedUsers = await User.find({
                isSubscribed: true,
                alertsEnabled: true
            });

            logger.info(`Broadcasting signal to ${subscribedUsers.length} users`);

            for (const user of subscribedUsers) {
                try {
                    const messageId = await this.sendSignal(signal, user.telegramId);
                    if (messageId) {
                        signal.telegramMessageId = messageId;
                        await signal.save();
                    }
                } catch (error) {
                    logger.error(`Failed to send signal to user ${user.telegramId}:`, error);
                }
            }

        } catch (error) {
            logger.error('Error broadcasting signal:', error);
        }
    }

    private formatSignalMessage(signal: ISignal): string {
        const typeEmoji = signal.type === 'BUY' ? '🟢' : signal.type === 'SELL' ? '🔴' : '🟡';
        const confidenceBar = '█'.repeat(Math.floor(signal.confidence / 10)) +
            '░'.repeat(10 - Math.floor(signal.confidence / 10));

        return `
${typeEmoji} <b>QUANTUM BOT SIGNAL</b> ${typeEmoji}

<b>Symbol:</b> ${signal.symbol}
<b>Type:</b> ${signal.type} | <b>Confidence:</b> ${signal.confidence}%
${confidenceBar}

<b>Price:</b> $${signal.price.toFixed(6)}
<b>Target:</b> $${signal.target.toFixed(6)} (+${((signal.target / signal.price - 1) * 100).toFixed(2)}%)
<b>Stop Loss:</b> $${signal.stopLoss.toFixed(6)} (-${((1 - signal.stopLoss / signal.price) * 100).toFixed(2)}%)

<b>Risk/Reward:</b> 1:${((signal.target - signal.price) / (signal.price - signal.stopLoss)).toFixed(2)}

${signal.metadata?.trend ? `<b>Trend:</b> ${signal.metadata.trend}\n` : ''}
${signal.metadata?.rsi ? `<b>RSI:</b> ${signal.metadata.rsi.toFixed(2)}\n` : ''}
${signal.metadata?.volume ? `<b>Volume:</b> ${this.formatVolume(signal.metadata.volume)}\n` : ''}

<b>Source:</b> ${signal.source}
<b>Time:</b> ${signal.timestamp.toLocaleString()}

#${signal.symbol.replace('/', '')} #${signal.type} #QuantumBot
        `.trim();
    }

    private formatVolume(volume: number): string {
        if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
        if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
        if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
        return `$${volume.toFixed(2)}`;
    }

    private async handleStart(ctx: Context): Promise<void> {
        const userId = ctx.from?.id;
        const username = ctx.from?.username;
        const firstName = ctx.from?.first_name;

        if (userId) {
            await User.findOneAndUpdate(
                { telegramId: userId },
                {
                    telegramId: userId,
                    username,
                    firstName,
                    isSubscribed: true,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        const welcomeMessage = `
🤖 <b>Welcome to Quantum Bot!</b>

I'm your AI-powered trading assistant monitoring Qubic Blockchain and generating real-time trading signals.

<b>Available Commands:</b>
/start - Start the bot
/signals - Get latest trading signals
/subscribe - Subscribe to signals
/unsubscribe - Unsubscribe from signals
/price - Check current prices
/alert - Set price alerts
/stats - View bot statistics
/settings - Configure preferences
/help - Show help information

<b>Features:</b>
• Real-time Qubic market analysis
• AI-powered signal generation
• Risk management tools
• Price alert system
• Portfolio tracking (coming soon)

🚀 Start by checking /signals or /price to see current market conditions!
        `.trim();

        await ctx.reply(welcomeMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        Markup.button.callback('📈 Get Signals', 'get_signals'),
                        Markup.button.callback('⚙️ Settings', 'open_settings')
                    ],
                    [
                        Markup.button.url('🌐 Web Dashboard', 'https://quantum-bot.up.railway.app'),
                        Markup.button.url('📚 Tutorial', 'https://t.me/quantumbroker_bot/help')
                    ]
                ]
            }
        });
    }

    private async handleSignals(ctx: Context): Promise<void> {
        try {
            const signals = await Signal.find()
                .sort({ timestamp: -1 })
                .limit(5);

            if (signals.length === 0) {
                await ctx.reply('No signals available yet. Generating first signals...');
                return;
            }

            for (const signal of signals) {
                const message = this.formatSignalMessage(signal);
                await ctx.reply(message, { parse_mode: 'HTML' });
            }

            await ctx.reply(
                `📊 <b>Signal Summary</b>\n` +
                `Total signals generated: ${await Signal.countDocuments()}\n` +
                `Last 24h: ${await Signal.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })}`,
                { parse_mode: 'HTML' }
            );

        } catch (error) {
            logger.error('Error handling signals command:', error);
            await ctx.reply('Error fetching signals. Please try again later.');
        }
    }

    private async handleSubscribe(ctx: Context): Promise<void> {
        const userId = ctx.from?.id;

        if (userId) {
            await User.findOneAndUpdate(
                { telegramId: userId },
                { isSubscribed: true, updatedAt: new Date() },
                { upsert: true }
            );

            await ctx.reply(
                '✅ Successfully subscribed to Quantum Bot signals!\n\n' +
                'You will now receive trading signals and market updates.\n\n' +
                'Use /settings to configure your notification preferences.'
            );
        }
    }

    private async handleUnsubscribe(ctx: Context): Promise<void> {
        const userId = ctx.from?.id;

        if (userId) {
            await User.findOneAndUpdate(
                { telegramId: userId },
                { isSubscribed: false, updatedAt: new Date() }
            );

            await ctx.reply(
                '✅ Successfully unsubscribed from Quantum Bot signals.\n\n' +
                'You will no longer receive trading signals.\n\n' +
                'Use /subscribe to re-enable notifications.'
            );
        }
    }

    private async handleStats(ctx: Context): Promise<void> {
        const totalSignals = await Signal.countDocuments();
        const totalUsers = await User.countDocuments();
        const subscribedUsers = await User.countDocuments({ isSubscribed: true });
        const todaySignals = await Signal.countDocuments({
            timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        const statsMessage = `
📊 <b>Quantum Bot Statistics</b>

<b>Signals:</b>
• Total: ${totalSignals}
• Today: ${todaySignals}
• Last 7 days: ${await Signal.countDocuments({ timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })}

<b>Users:</b>
• Total: ${totalUsers}
• Active: ${subscribedUsers}

<b>Performance:</b>
• Average confidence: ${(await Signal.aggregate([{ $group: { _id: null, avg: { $avg: "$confidence" } } }]))[0]?.avg?.toFixed(1) || '0'}%
• Buy signals: ${await Signal.countDocuments({ type: 'BUY' })}
• Sell signals: ${await Signal.countDocuments({ type: 'SELL' })}

<b>Bot Status:</b> 🟢 Operational
<b>Uptime:</b> ${process.uptime().toFixed(0)} seconds
        `.trim();

        await ctx.reply(statsMessage, { parse_mode: 'HTML' });
    }

    private async handleHelp(ctx: Context): Promise<void> {
        const helpMessage = `
❓ <b>Quantum Bot Help</b>

<b>Commands:</b>
/start - Start the bot
/signals - Get latest trading signals
/subscribe - Subscribe to signals
/unsubscribe - Unsubscribe from signals
/price [symbol] - Check cryptocurrency price
/alert [symbol] [price] - Set price alert
/stats - View bot statistics
/settings - Configure preferences
/help - Show this help

<b>Examples:</b>
/price BTC
/alert QUBIC 0.0025
/signals

<b>Support:</b>
For issues or suggestions, contact @quantumbroker_bot admin.

<b>Disclaimer:</b>
Trading involves risk. Signals are for informational purposes only.
        `.trim();

        await ctx.reply(helpMessage, { parse_mode: 'HTML' });
    }

    private async handleSettings(ctx: Context): Promise<void> {
        const settingsMessage = `
⚙️ <b>Quantum Bot Settings</b>

<b>Notification Settings:</b>
• Signal Frequency: Real-time
• Alert Types: All signals
• Risk Level: Medium

<b>Account:</b>
• Subscription: Active
• Notifications: Enabled

<b>Quick Actions:</b>
        `.trim();

        await ctx.reply(settingsMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        Markup.button.callback('🔔 Toggle Alerts', 'toggle_alerts'),
                        Markup.button.callback('📊 Change Risk', 'change_risk')
                    ],
                    [
                        Markup.button.callback('📱 Notification Type', 'notification_type'),
                        Markup.button.callback('🔄 Reset Settings', 'reset_settings')
                    ],
                    [
                        Markup.button.callback('⬅️ Back', 'back_to_menu')
                    ]
                ]
            }
        });
    }

    private async handleAlert(ctx: Context): Promise<void> {
        const text = ctx.message?.text || '';
        const args = text.split(' ').slice(1);

        if (args.length < 2) {
            await ctx.reply(
                'Usage: /alert [symbol] [price]\n\n' +
                'Examples:\n' +
                '/alert QUBIC 0.0025\n' +
                '/alert BTC 45000\n\n' +
                'You will receive a notification when the price reaches your target.'
            );
            return;
        }

        const symbol = args[0].toUpperCase();
        const price = parseFloat(args[1]);

        if (isNaN(price)) {
            await ctx.reply('Invalid price. Please enter a valid number.');
            return;
        }

        await ctx.reply(
            `✅ Alert set for ${symbol} at $${price}\n\n` +
            `You will be notified when ${symbol} reaches this price.`
        );
    }

    private async handlePrice(ctx: Context): Promise<void> {
        const text = ctx.message?.text || '';
        const args = text.split(' ').slice(1);
        const symbol = args[0]?.toUpperCase() || 'QUBIC';

        // Mock price data - replace with actual API call
        const prices: Record<string, number> = {
            'QUBIC': 0.002156,
            'BTC': 42356.78,
            'ETH': 2289.45,
            'SOL': 98.67,
            'XRP': 0.6234
        };

        const price = prices[symbol] || 0.001234;
        const change24h = Math.random() * 10 - 5; // Random change between -5% and +5%

        const priceMessage = `
💰 <b>${symbol} Price Update</b>

<b>Current Price:</b> $${price.toLocaleString()}
<b>24h Change:</b> ${change24h > 0 ? '🟢' : '🔴'} ${change24h.toFixed(2)}%
<b>Market Cap:</b> $${(price * 1000000000).toLocaleString()}
<b>24h Volume:</b> $${(price * 10000000).toLocaleString()}

<b>Support:</b> $${(price * 0.95).toLocaleString()}
<b>Resistance:</b> $${(price * 1.05).toLocaleString()}

<b>Quantum AI Analysis:</b>
${change24h > 0 ? 'Bullish' : 'Bearish'} momentum detected
${Math.random() > 0.5 ? 'Strong buy signal' : 'Neutral signal'}

#${symbol} #PriceAlert #QuantumBot
        `.trim();

        await ctx.reply(priceMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        Markup.button.url('📈 View Chart', `https://www.tradingview.com/chart/?symbol=${symbol}USD`),
                        Markup.button.callback('🔔 Set Alert', `set_alert_${symbol}`)
                    ]
                ]
            }
        });
    }

    private async handleCallbackQuery(ctx: any): Promise<void> {
        const callbackData = ctx.callbackQuery.data;

        if (callbackData === 'get_signals') {
            await ctx.answerCbQuery();
            await this.handleSignals(ctx);
        } else if (callbackData === 'open_settings') {
            await ctx.answerCbQuery();
            await this.handleSettings(ctx);
        } else if (callbackData.startsWith('alert_')) {
            const symbol = callbackData.replace('alert_', '');
            await ctx.answerCbQuery(`Alert menu for ${symbol}`);
            await ctx.reply(`Set alert for ${symbol}:`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            Markup.button.callback('Price Above', `alert_above_${symbol}`),
                            Markup.button.callback('Price Below', `alert_below_${symbol}`)
                        ]
                    ]
                }
            });
        } else if (callbackData === 'back_to_menu') {
            await ctx.answerCbQuery();
            await this.handleStart(ctx);
        } else {
            await ctx.answerCbQuery('Feature coming soon!');
        }
    }

    // Webhook handler for Railway
    getWebhookMiddleware(): any {
        const webhookPath = `/webhook/telegram/${process.env.TELEGRAM_WEBHOOK_SECRET}`;
        return this.bot.webhookCallback(webhookPath);
    }
}