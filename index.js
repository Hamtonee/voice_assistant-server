// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import concurrentLimiter from './middleware/concurrentLimiter.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// ——— Simple CORS configuration ———
console.log('🔍 Raw FRONTEND_URLS:', JSON.stringify(process.env.FRONTEND_URLS));
console.log('🔧 Using simple CORS headers - allowing all origins');

// ——— Prisma error logging ———
prisma.$on('error', (e) => {
  console.error('🟥 Prisma error event:', e);
});

// ——— Request logger ———
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ——— Simple CORS Headers ———
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all origins for now to get the server running
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ——— Body and Cookie Parsers ———
app.use(express.json());
app.use(cookieParser());

// --- Serve frontend in production ---
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');

  app.use(express.static(clientBuildPath, {
    maxAge: '1y',
    immutable: true,
    // Set custom headers for caching
    setHeaders: (res, path) => {
      if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.webp') || path.endsWith('.jpg')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
}

// Static file serving with caching
app.use(express.static('public', {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// ——— Limit concurrent users ———
app.use(concurrentLimiter);

// ——— Routes ———
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// ——— Health Check Endpoint ———
app.get('/api/health', (_req, res) => {
  const timestamp = new Date().toISOString();
  const ttsAvailable = process.env.TTS_SERVICE_URL || process.env.GOOGLE_CREDENTIALS_BASE64 ? true : false;
  
  res.json({
    status: 'healthy',
    timestamp,
    tts_available: ttsAvailable,
    version: process.env.VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    server: 'express',
    uptime: process.uptime()
  });
});

// --- Handle SPA routing for production ---
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
}

// ——— Root Health Check ———
app.get('/', (_req, res) => {
  res.send('🟢 API up and running!');
});

// ——— Error Handler ———
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ——— Start Server ———
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT} (LAN access enabled)`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔗 Network: http://192.168.100.122:${PORT}`);
  console.log('🔧 CORS: Allowing all origins');
});

// ——— Graceful Shutdown ———
const shutdown = async () => {
  console.log('🛑 Shutting down server...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);