import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/keygen_db';

  try {
    mongoose.set('strictQuery', true);
    console.log(`[MongoDB] Connecting to Database...`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully to Database!`);
  } catch (error: any) {
    console.warn(`[MongoDB Warning] Connection error: ${error.message}`);
    console.warn(`[MongoDB Warning] Running with Memory Backup Store active.`);
  }
};
