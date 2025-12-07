import { Schema, model, Document } from 'mongoose';

export interface ISignal extends Document {
    symbol: string;
    type: 'BUY' | 'SELL' | 'HOLD' | 'ALERT';
    confidence: number;
    price: number;
    target: number;
    stopLoss: number;
    timestamp: Date;
    source: string;
    telegramMessageId?: number;
    metadata?: {
        rsi?: number;
        macd?: number;
        volume?: number;
        trend?: string;
        marketCap?: number;
        change24h?: number;
    };
}

const SignalSchema = new Schema<ISignal>({
    symbol: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['BUY', 'SELL', 'HOLD', 'ALERT'],
        required: true
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    target: {
        type: Number,
        required: true
    },
    stopLoss: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    source: {
        type: String,
        required: true
    },
    telegramMessageId: {
        type: Number
    },
    metadata: {
        rsi: Number,
        macd: Number,
        volume: Number,
        trend: String,
        marketCap: Number,
        change24h: Number
    }
});

export const Signal = model<ISignal>('Signal', SignalSchema);