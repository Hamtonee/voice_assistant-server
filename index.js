// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import concurrentLimiter from './middleware/concurrentLimiter.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Robust CORS logic
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://192.168.100.122:3000'];

prisma.$on('error', (e) => {
  console.error('🟥 Prisma error event:', e);
});

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Explicit CORS Headers
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

// CORS Middleware (backup)
import cors from 'cors';
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

// Body and Cookie Parsers
app.use(express.json());
app.use(cookieParser());

// Scope concurrency limiter to heavy chat routes only (avoid 429 on auth)
app.use('/api/auth', authRoutes);
app.use('/api/chats', concurrentLimiter, chatRoutes);

// Health check endpoint for deployment
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    message: 'Server is running',
    uptime: process.uptime()
  });
});

// Root Health Check
app.get('/', (_req, res) => {
  res.send('🟢 API up and running!');
});

// Error Handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log('✅ Health check endpoints available at /api/health and /health');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGTERM', shutdown);