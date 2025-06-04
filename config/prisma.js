// server/config/prisma.js
import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Create or reuse the PrismaClient
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

// In development, attach to global to avoid multiple instances on hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Eagerly connect once
if (!globalForPrisma.__prismaConnected) {
  prisma
    .$connect()
    .then(() => {
      console.log('✅ Prisma connected');
      globalForPrisma.__prismaConnected = true;
    })
    .catch((e) => {
      console.error('❌ Prisma connection error:', e);
      process.exit(1);
    });
}

// Graceful shutdown logic
if (!globalForPrisma.__shutdownAttached) {
  const shutdown = async () => {
    try {
      await prisma.$disconnect();
      console.log('🔌 Prisma disconnected');
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  globalForPrisma.__shutdownAttached = true;
}

export default prisma;
