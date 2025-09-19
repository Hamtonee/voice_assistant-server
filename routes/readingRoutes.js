// server/routes/readingRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Protect all routes
router.use(auth);

// GET /api/reading/sessions - Get all reading sessions for user
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await prisma.chat.findMany({
      where: {
        userId,
        feature: 'tusome' // Reading sessions are 'tusome' feature
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        feature: true,
        scenarioKey: true,
        createdAt: true,
        updatedAt: true,
        messageCount: true
      }
    });

    res.json({
      success: true,
      sessions: sessions || []
    });
  } catch (error) {
    console.error('Error fetching reading sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reading sessions'
    });
  }
});

// GET /api/reading/sessions/:id - Get specific reading session
router.get('/sessions/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    const userId = req.user.id;
    let id;
    
    // Handle both integer IDs and string session IDs
    if (isNaN(Number(idParam))) {
      // It's a string session ID, try to find by session_id in messages
      console.log('🔍 [readingRoutes] getReadingSession called with string session ID:', { idParam, userId });
      
      // First, try to find a message with this session_id
      const message = await prisma.message.findFirst({
        where: { 
          session_id: idParam,
          user_id: userId 
        },
        include: { chat: true }
      });
      
      if (!message || !message.chat) {
        console.log('❌ [readingRoutes] Chat not found for session ID:', { idParam, userId });
        return res.status(404).json({
          success: false,
          error: 'Reading session not found'
        });
      }
      
      id = message.chat.id;
    } else {
      // It's a numeric ID
      id = Number(idParam);
    }
    
    const session = await prisma.chat.findFirst({
      where: {
        id,
        owner_id: userId,
        feature: 'tusome'
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Reading session not found'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching reading session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reading session'
    });
  }
});

// POST /api/reading/sessions - Create new reading session
router.post('/sessions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { scenarioKey, title } = req.body;
    
    const session = await prisma.chat.create({
      data: {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: title || 'Reading Session',
        feature: 'tusome',
        scenarioKey: scenarioKey || null,
        messages: [],
        messageCount: 0
      }
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error creating reading session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reading session'
    });
  }
});

export default router;
