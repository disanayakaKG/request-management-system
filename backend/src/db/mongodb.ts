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
      // Handled in try/catch block during initial connection
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });

    console.log('⏳ Connecting to MongoDB Cluster...');
    await mongoose.connect(uri);
    await seedMongoData();
    await db.syncWithMongo();
    return true;
  } catch (error: any) {
    const isDnsErr = error?.code === 'ECONNREFUSED' || error?.message?.includes('querySrv');
    if (isDnsErr) {
      console.warn('⚠️ Could not resolve MongoDB Atlas DNS SRV (network/DNS block).');
    } else {
      console.error('💥 Failed to connect to MongoDB cluster:', error?.message || error);
    }
    console.log('📦 Operating with built-in JSON Database fallback (database.json).');
    return false;
  }
}


export function getMongoStatus(): { connected: boolean; readyState: number } {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState
  };
}
