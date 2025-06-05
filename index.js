// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import concurrentLimiter from './middleware/concurrentLimiter.js';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

const allowedOrigins = process.env.FRONTEND_URLS
  ? [process.env.FRONTEND_URLS.trim().replace(/^['"]+|['"]+$/g, '')]
  : ['http://localhost:3000', 'http://192.168.100.122:3000'];

// ——— Prisma error logging ———
prisma.$on('error', (e) => {
  console.error('🟥 Prisma error event:', e);
});

// ——— Request logger ———
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ——— Explicit CORS Headers (for flexibility/debugging) ———
app.use((req, res, next) => {
  const origin = req.headers.origin;

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log(`✅ Allowed origin: ${origin}`);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    console.log(`🔧 No origin header — using default: ${allowedOrigins[0]}`);
  } else {
    console.warn(`❌ Blocked origin: ${origin}`);
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// ——— CORS Middleware (backup and robust control) ———
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS → Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

// ——— Body and Cookie Parsers ———
app.use(express.json());
app.use(cookieParser());

// ——— Limit concurrent users ———
app.use(concurrentLimiter);

// ——— Routes ———
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

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
  console.log('🔧 Allowed CORS origins:', allowedOrigins);
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
