// server/routes/usageRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Protect all routes
router.use(auth);

// GET /api/usage-summary - Get user usage summary
router.get('/usage-summary', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get usage statistics
    const totalChats = await prisma.chat.count({
      where: { userId }
    });
    
    const totalMessages = await prisma.chat.aggregate({
      where: { userId },
      _sum: {
        messageCount: true
      }
    });
    
    const sessionsByFeature = await prisma.chat.groupBy({
      by: ['feature'],
      where: { userId },
      _count: {
        id: true
      }
    });
    
    const recentActivity = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        feature: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      usage: {
        totalChats,
        totalMessages: totalMessages._sum.messageCount || 0,
        sessionsByFeature: sessionsByFeature.reduce((acc, item) => {
          acc[item.feature] = item._count.id;
          return acc;
        }, {}),
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage summary'
    });
  }
});

export default router;
