import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import authRoutes from './routes/authRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import battleRoutes from './routes/battleRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import adminRoutes, { telemetryRouter } from './routes/adminRoutes.js';
import initializeBattleSocket from './sockets/battleSocket.js';
import initializeAdminSocket from './sockets/adminSocket.js';
import { recalculateGlobalRanks } from './controllers/leaderboardController.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const server = http.createServer(app);

const isProd = process.env.NODE_ENV === "production";
const allowedWebOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://prompt-guru-tech.vercel.app",
];

app.use(
  cors({
    origin: isProd ? allowedWebOrigins : true,
    credentials: true,
  })
);

app.use(express.json()); // Parse JSON bodies

app.get('/', (req, res) => res.status(200).send('👋 PromptGuru backend is alive!'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

const io = new Server(server, {
  cors: {
    origin: isProd ? allowedWebOrigins : true,
    credentials: true,
  },
});

initializeBattleSocket(io);
initializeAdminSocket(io);

const startServer = async () => {
  try {
    const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('❌ MONGODB_URI not found in .env.local or .env');

    console.log('🟡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    app.use('/api/auth', authRoutes);
    app.use('/api/prompt', promptRoutes);
    app.use('/api/battle', battleRoutes);
    app.use('/api/practice', practiceRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/telemetry', telemetryRouter);

    cron.schedule('0 0 * * *', async () => {
      try {
        await recalculateGlobalRanks();
        console.log('✅ Global leaderboard ranks recalculated');
      } catch (error) {
        console.error('❌ Failed to recalculate global leaderboard ranks');
      }
    });

    const PORT = process.env.PORT || 4000;
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the other process or run: npx kill-port ${PORT}`);
        process.exit(1);
      }
      throw err;
    });
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

startServer();
