import dotenv from 'dotenv';
import app from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { initMonthlyNotificationJob } from './jobs/monthlyNotificationJob.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start node-cron background job
    initMonthlyNotificationJob();

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`===========================================`);
      console.log(`TuitionTrack Backend Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Health: http://localhost:${PORT}/api/health`);
      console.log(`===========================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closeDB();
        console.log('TuitionTrack server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
