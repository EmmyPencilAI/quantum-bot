import { Telegraf } from 'telegraf';

export class TelegramService {
    private bot: Telegraf | null = null;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (token) {
            this.bot = new Telegraf(token);
            this.setupCommands();
        }
    }

    private setupCommands(): void {
        if (!this.bot) return;

        this.bot.command('start', (ctx) => {
            ctx.reply(
                '🤖 Welcome to Quantum Bot!\n\n' +
                'I provide AI-powered trading signals for Qubic Blockchain.\n\n' +
                'Commands:\n' +
                '/signals - Get latest trading signals\n' +
                '/price <symbol> - Check cryptocurrency price\n' +
                '/subscribe - Subscribe to signals\n' +
                '/help - Show help information\n\n' +
                'Visit: https://quantum-bot.vercel.app'
            );
        });

        this.bot.command('signals', async (ctx) => {
            ctx.reply('📊 Fetching latest signals...');
            // You would fetch from database here
        });

        this.bot.command('help', (ctx) => {
            ctx.reply(
                '❓ Quantum Bot Help\n\n' +
                'Available commands:\n' +
                '/start - Start the bot\n' +
                '/signals - Get trading signals\n' +
                '/price <symbol> - Check price\n' +
                '/subscribe - Subscribe to alerts\n' +
                '/help - Show this help\n\n' +
                'Web Dashboard: https://quantum-bot.vercel.app'
            );
        });

        this.bot.launch().then(() => {
            console.log('✅ Telegram bot started');
        }).catch(error => {
            console.error('❌ Telegram bot failed to start:', error);
        });
    }

    async sendSignal(signal: any, chatId?: string): Promise<void> {
        if (!this.bot) return;

        try {
            const message = this.formatSignalMessage(signal);
            await this.bot.telegram.sendMessage(
                chatId || process.env.TELEGRAM_ADMIN_ID || '',
                message,
                { parse_mode: 'HTML' }
            );
        } catch (error) {
            console.error('Error sending Telegram message:', error);
        }
    }

    private formatSignalMessage(signal: any): string {
        return `
🚀 <b>QUANTUM BOT SIGNAL</b>

<b>Symbol:</b> ${signal.symbol}
<b>Type:</b> ${signal.type} | <b>Confidence:</b> ${signal.confidence}%

<b>Price:</b> $${signal.price.toFixed(6)}
<b>Target:</b> $${signal.target.toFixed(6)}
<b>Stop Loss:</b> $${signal.stopLoss.toFixed(6)}

<b>Source:</b> ${signal.source}
<b>Time:</b> ${new Date(signal.timestamp).toLocaleString()}

#${signal.symbol.replace('/', '')} #QuantumBot
        `.trim();
    }
}