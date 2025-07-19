// server/index.js
import express from 'express';
import cors from 'cors';
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

// ——— Clean and parse allowed origins ———
const cleanUrl = (url) => {
  console.log('🔍 Before cleaning:', JSON.stringify(url));
  console.log('🔍 Before cleaning (raw):', url);
  
  // Remove ALL unwanted characters including semicolons, quotes, and extra whitespace
  let cleaned = url
    .trim()
    .replace(/['"`;]/g, '')      // Remove quotes and semicolons
    .replace(/[,\s]+/g, '')      // Remove commas and whitespace
    .replace(/\/+$/, '')         // Remove trailing slashes
  
  // Ensure it starts with http
  if (cleaned && !cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  
  // Final validation - ensure it's a valid URL
  try {
    new URL(cleaned);
  } catch (e) {
    console.warn(`⚠️ Invalid URL after cleaning: ${cleaned}`);
    return null;
  }
  
  console.log('🔍 After cleaning:', JSON.stringify(cleaned));
  console.log('🔍 After cleaning (raw):', cleaned);
  return cleaned;
};

console.log('🔍 Raw FRONTEND_URLS:', JSON.stringify(process.env.FRONTEND_URLS));

// Clean the entire FRONTEND_URLS string first, then split
let frontendUrls = process.env.FRONTEND_URLS || '';
if (frontendUrls) {
  // Remove any trailing semicolons from the entire string
  frontendUrls = frontendUrls.replace(/;+$/, '');
  console.log('🔍 Cleaned FRONTEND_URLS string:', JSON.stringify(frontendUrls));
}

const allowedOrigins = frontendUrls
  ? frontendUrls.split(',').map(url => cleanUrl(url)).filter(url => url && url.length > 0)
  : ['http://localhost:3000', 'http://192.168.100.122:3000'];

console.log('🔧 Final Cleaned Origins:', allowedOrigins);

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE, OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

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