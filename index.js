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

// ——— Prisma error logging ———
prisma.$on('error', e => {
  console.error('🟥 Prisma error event:', e);
});

// ——— Request logger ———
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ——— Explicit CORS Headers (FIRST - overrides any other CORS settings) ———
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',')
    : ['http://localhost:3000', 'http://192.168.100.122:3000'];
  
  console.log('🌐 Incoming request origin:', origin);
  console.log('📋 Allowed origins:', allowedOrigins);
  
  // Always set credentials header
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  // Set origin header if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('✅ Setting CORS origin to:', origin);
  } else if (!origin) {
    // For requests with no origin (like Postman, curl), allow the first origin
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    console.log('🔧 No origin header, using default:', allowedOrigins[0]);
  } else {
    console.error('❌ CORS blocked for origin:', origin);
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling preflight request for:', req.originalUrl);
    res.status(200).end();
    return;
  }
  
  next();
});

// ——— Additional CORS with cors package (backup) ———
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',')
  : ['http://localhost:3000', 'http://192.168.100.122:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ——— Body + Cookie Parsers ———
app.use(express.json());
app.use(cookieParser());

// ——— Concurrent Users Limiter ———
app.use(concurrentLimiter);

// ——— Routes ———
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// ——— Root Health Check ———
app.get('/', (_req, res) => res.send('🟢 API up'));

// ——— Global error handler ———
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ——— Start Server ———
const PORT = process.env.PORT || 5000;

// ——— Listen on all network interfaces for LAN access ———
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT} (LAN access enabled)`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔗 Network: http://192.168.100.122:${PORT}`);
  console.log('🔧 Allowed CORS origins:', allowedOrigins);
});

// ——— Graceful shutdown ———
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