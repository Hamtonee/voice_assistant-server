// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import concurrentLimiter from './middleware/concurrentLimiter.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// ——— Clean and parse allowed origins ———
const cleanUrl = (url) => {
  console.log('🔍 Before cleaning:', JSON.stringify(url));
  let cleaned = url
    .trim()
    .replace(/^['"`]+/g, '')     // Remove quotes from start
    .replace(/['"`]+$/g, '')     // Remove quotes from end
    .replace(/;+$/g, '')          // Remove semicolons from end
    .replace(/,+$/g, '')          // Remove commas from end
    .replace(/\s+$/g, '')        // Remove whitespace from end
    .replace(/^[;,\s]+/g, '');   // Remove semicolons, commas, whitespace from start
  console.log('🔍 After cleaning:', JSON.stringify(cleaned));
  return cleaned;
};

console.log('🔍 Raw FRONTEND_URLS:', JSON.stringify(process.env.FRONTEND_URLS));

// Temporary fix: Allow all origins until environment variables are set
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(url => cleanUrl(url)).filter(url => url.length > 0)
  : [
      'http://localhost:3000', 
      'http://192.168.100.122:3000',
      'https://semanami-ai.com',
      'https://www.semanami-ai.com',
      // Temporary: Allow all origins for debugging
      '*'
    ];

console.log('🔧 Final Cleaned Origins:', allowedOrigins);

// ——— Prisma error logging ———
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
  
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log(`✅ Allowed origin: ${origin}`);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] === '*' ? '*' : allowedOrigins[0]);
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
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS → Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE, OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

// Body and Cookie Parsers
app.use(express.json());
app.use(cookieParser());

// Scope concurrency limiter to heavy chat routes only (avoid 429 on auth)
console.log('Registering route: /api/auth (app.use)');
app.use('/api/auth', authRoutes);
console.log('Registering route: /api/chats (app.use with concurrentLimiter)');
app.use('/api/chats', concurrentLimiter, chatRoutes);

console.log('Registering route: /api/health (app.get)');
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    message: 'Server is running',
    uptime: process.uptime()
  });
});

console.log('Registering route: /health (app.get)');
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

console.log('Registering route: / (app.get)');
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