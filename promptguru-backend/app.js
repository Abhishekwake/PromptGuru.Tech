import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import promptRoutes from './routes/promptRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "https://prompt-guru-tech.vercel.app"],
  credentials: true,
}));

app.use(express.json()); // Parse JSON bodies

app.get('/', (req, res) => res.status(200).send('👋 PromptGuru backend is alive!'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

const startServer = async () => {
  try {
    const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('❌ MONGODB_URI not found in .env');

    console.log('🟡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    app.use('/api/auth', authRoutes);
    app.use('/api/prompt', promptRoutes);

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

startServer();
