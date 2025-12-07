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
    }
}, {
    timestamps: true
});

export const User = model<IUser>('User', UserSchema);