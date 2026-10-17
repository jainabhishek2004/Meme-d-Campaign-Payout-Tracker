import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/memed';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('FATAL SECURITY ERROR: JWT_SECRET environment variable is required and cannot be empty.');
  process.exit(1);
}

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database successfully.');

    const server = app.listen(PORT, () => {
      console.log(`Meme'd Backend server listening on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed. Server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {

    const safeError = error instanceof Error
      ? error.message.replace(/:[^:@]+@/, ':****@')
      : 'Unknown startup error';
    console.error('Failed to start server:', safeError);
    process.exit(1);
  }
};

startServer();
