import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    isSubscribed: boolean;
    languageCode: string;
    alertsEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    settings?: {
        notificationType: 'all' | 'buy_only' | 'strong_signals';
        riskLevel: 'low' | 'medium' | 'high';
    };
}

const UserSchema = new Schema<IUser>({
    telegramId: {
        type: Number,
        required: true,
        unique: true
    },
    username: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    isSubscribed: {
        type: Boolean,
        default: true
    },
    languageCode: {
        type: String,
        default: 'en'
    },
    alertsEnabled: {
        type: Boolean,
        default: true
    },
    settings: {
        notificationType: {
            type: String,
            enum: ['all', 'buy_only', 'strong_signals'],
            default: 'all'
        },
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }
}, {
    timestamps: true
});

export const User = model<IUser>('User', UserSchema);