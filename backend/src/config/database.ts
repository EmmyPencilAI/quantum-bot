import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_bot';

    try {
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        // Continue without database - use mock data
        console.log('⚠️ Using mock data mode');
    }
};