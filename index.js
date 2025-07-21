// server/index.js
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const app = express();

// CORS middleware - must be before any routes
const allowedOrigins = ['https://semanami-ai.com', 'https://www.semanami-ai.com', 'http://localhost:3000'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Basic middleware
app.use(express.json());

// IMMEDIATE health check endpoints - these must work regardless of other imports
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    message: 'Server is running',
    uptime: process.uptime()
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

app.get('/', (_req, res) => {
  res.send('🟢 API up and running!');
});

// Start server immediately
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log('✅ Health check endpoints available at /api/health and /health');
});

// Now try to load additional modules
const loadAdditionalModules = async () => {
  try {
    console.log('🔄 Loading additional modules...');
    
    // Import additional dependencies
    const cookieParser = (await import('cookie-parser')).default;
    const { PrismaClient } = await import('@prisma/client');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    // Import routes
    const authRoutes = (await import('./routes/authRoutes.js')).default;
    const chatRoutes = (await import('./routes/chatRoutes.js')).default;
    const concurrentLimiter = (await import('./middleware/concurrentLimiter.js')).default;
    const { 
      API_CONFIG, 
      CORS_CONFIG, 
      DB_CONFIG, 
      JWT_CONFIG, 
      HEALTH_ENDPOINTS 
    } = await import('./config/apiConfig.js');
    
    // Initialize Prisma
    const prisma = new PrismaClient();
    let dbConnected = false;
    
    try {
      await prisma.$connect();
      dbConnected = true;
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
    }
    
    // Add middleware
    app.use(cookieParser());
    
    // Add routes
    console.log('Registering route: /api/auth');
    app.use('/api/auth', authRoutes);
    console.log('Registering route: /api/chats');
    app.use('/api/chats', chatRoutes);
    
    // Update health check with full information
    app.get('/api/health', (_req, res) => {
      const timestamp = new Date().toISOString();
      const ttsAvailable = process.env.TTS_SERVICE_URL || process.env.GOOGLE_CREDENTIALS_BASE64 ? true : false;
      
      res.json({
        status: 'healthy',
        timestamp,
        tts_available: ttsAvailable,
        version: API_CONFIG.VERSION_NUMBER,
        environment: API_CONFIG.NODE_ENV,
        server: 'express',
        uptime: process.uptime(),
        custom_domain: API_CONFIG.CUSTOM_DOMAIN,
        api_base_url: API_CONFIG.BASE_URL,
        cors_origins: CORS_CONFIG.ORIGINS,
        database_connected: dbConnected,
        jwt_configured: !!JWT_CONFIG.SECRET
      });
    });
    
    // Serve frontend in production
    if (process.env.NODE_ENV === 'production') {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
      
      app.use(express.static(clientBuildPath));
      
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(clientBuildPath, 'index.html'));
      });
    }
    
    console.log('✅ All modules loaded successfully');
    
  } catch (error) {
    console.error('❌ Failed to load additional modules:', error);
    console.log('⚠️ Server running with basic functionality only');
  }
};

// Load additional modules after server starts
loadAdditionalModules();

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