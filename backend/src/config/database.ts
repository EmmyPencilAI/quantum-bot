import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_bot';

    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        logger.info(`MongoDB connected: ${mongoURI}`);

    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        throw error;
    }
};