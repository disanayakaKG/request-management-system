import mongoose from 'mongoose';
import { config } from '../config/config';
import { seedMongoData } from './seedMongo';
import { db } from './db';

export async function connectMongoDB(): Promise<boolean> {
  const uri = config.mongoUri;

  if (!uri) {
    console.log('ℹ️ MONGODB_URI is not set in .env. Skipping MongoDB connection.');
    return false;
  }

  try {
    mongoose.connection.on('connected', () => {
      console.log('🍃 MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });

    console.log('⏳ Connecting to MongoDB Cluster...');
    await mongoose.connect(uri);
    await seedMongoData();
    await db.syncWithMongo();
    return true;
  } catch (error) {
    console.error('💥 Failed to connect to MongoDB cluster:', error);
    return false;
  }
}


export function getMongoStatus(): { connected: boolean; readyState: number } {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState
  };
}
