/**
 * Personalized Feed Routes
 * 
 * API endpoints for managing personalized content feeds
 * Provides ultra-fast content delivery through pre-generated feeds
 */

import express from 'express';
import { PersonalizedFeedService } from '../services/personalizedFeedService.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();
const feedService = new PersonalizedFeedService();

/**
 * GET /api/feed/next-content
 * Get the next piece of content from user's personalized feed
 * This replaces the slow on-demand article generation
 */
router.get('/next-content', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'reading' } = req.query;

    const startTime = Date.now();
    
    // Get next content from personalized feed (ultra-fast)
    const content = await feedService.getNextFeedContent(userId, type);
    
    const responseTime = Date.now() - startTime;
    console.log(`⚡ Feed content delivered in ${responseTime}ms (vs 3000-5000ms for on-demand)`);

    res.json({
      success: true,
      content,
      performance: {
        response_time_ms: responseTime,
        delivery_method: 'personalized_feed'
      },
      metadata: {
        from_feed: true,
        remaining_content: content.delivery_metadata?.remaining_content || 0
      }
    });

  } catch (error) {
    console.error('Error getting next feed content:', error);
    
    // Fallback to traditional generation if feed fails
    try {
      const fallbackContent = await generateTraditionalContent(req.user.id, req.query.type);
      res.json({
        success: true,
        content: fallbackContent,
        performance: {
          delivery_method: 'fallback_generation'
        },
        metadata: {
          from_feed: false,
          fallback_used: true
        }
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Failed to get content',
        details: error.message
      });
    }
  }
});

/**
 * POST /api/feed/generate
 * Manually trigger feed generation for a user
 */
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'reading' } = req.body;

    const feed = await feedService.generatePersonalizedFeed(userId, type);
    
    res.json({
      success: true,
      message: 'Personalized feed generated successfully',
      feed: {
        id: feed.id,
        type: feed.feed_type,
        content_count: Array.isArray(feed.content_ids) ? feed.content_ids.length : 0,
        expires_at: feed.expires_at
      }
    });

  } catch (error) {
    console.error('Error generating feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate feed',
      details: error.message
    });
  }
});

/**
 * GET /api/feed/status
 * Get user's current feed status and analytics
 */
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current feeds
    const feeds = await prisma.personalizedFeed.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() }
      },
      select: {
        id: true,
        feed_type: true,
        content_ids: true,
        generated_at: true,
        expires_at: true,
        access_count: true,
        content_consumed: true,
        avg_engagement: true
      }
    });

    // Get user behavior analytics
    const analytics = await prisma.userBehaviorAnalytics.findFirst({
      where: { user_id: userId },
      orderBy: { last_updated: 'desc' }
    });

    res.json({
      success: true,
      feeds: feeds.map(feed => ({
        ...feed,
        content_count: Array.isArray(feed.content_ids) ? feed.content_ids.length : 0,
        is_active: feed.expires_at > new Date()
      })),
      analytics: analytics ? {
        preferred_categories: analytics.preferred_categories,
        preferred_difficulty: analytics.preferred_difficulty,
        engagement_score: analytics.last_engagement_score,
        consumption_rate: analytics.content_consumption_rate,
        last_updated: analytics.last_updated
      } : null,
      recommendations: {
        feed_health: feeds.length > 0 ? 'good' : 'needs_generation',
        total_content_available: feeds.reduce((sum, feed) => 
          sum + (Array.isArray(feed.content_ids) ? feed.content_ids.length : 0), 0)
      }
    });

  } catch (error) {
    console.error('Error getting feed status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feed status',
      details: error.message
    });
  }
});

/**
 * POST /api/feed/feedback
 * Provide feedback on delivered content to improve personalization
 */
router.post('/feedback', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content_id, rating, feedback_type, comments } = req.body;

    // Update content engagement score
    if (content_id && rating) {
      await prisma.article.update({
        where: { id: content_id },
        data: {
          user_engagement_score: rating,
          article_metadata: {
            user_feedback: {
              rating,
              feedback_type,
              comments,
              timestamp: new Date().toISOString()
            }
          }
        }
      });

      // Update user behavior analytics based on feedback
      await prisma.userBehaviorAnalytics.updateMany({
        where: { user_id: userId },
        data: {
          last_engagement_score: rating / 5.0, // Normalize to 0-1
          last_updated: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record feedback',
      details: error.message
    });
  }
});

/**
 * GET /api/feed/stats (Admin only)
 * Get system-wide feed statistics
 */
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Basic admin check (you should implement proper admin role checking)
    if (!req.user.email?.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await feedService.getFeedStatistics();
    
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting feed statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
});

/**
 * POST /api/feed/refresh-all (Admin only)
 * Manually trigger feed refresh for all active users
 */
router.post('/refresh-all', authenticateUser, async (req, res) => {
  try {
    // Basic admin check
    if (!req.user.email?.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Start background refresh (don't wait for completion)
    feedService.refreshAllUserFeeds().catch(error => {
      console.error('Background feed refresh failed:', error);
    });

    res.json({
      success: true,
      message: 'Feed refresh started for all active users'
    });

  } catch (error) {
    console.error('Error starting feed refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start feed refresh',
      details: error.message
    });
  }
});

/**
 * Fallback function for traditional content generation
 */
async function generateTraditionalContent(userId, type = 'reading') {
  // This would call your existing content generation logic
  // as a fallback when the feed system fails
  
  if (type === 'reading') {
    // Call existing article generation API
    const axios = require('axios');
    const PYTHON_API_BASE = process.env.PYTHON_API_BASE || 'http://localhost:8000';
    
    const response = await axios.get(`${PYTHON_API_BASE}/reading-topic`, {
      params: {
        category: 'technology',
        difficulty: 'intermediate',
        word_count: 400,
        paragraph_count: 3
      },
      timeout: 10000
    });

    return {
      title: response.data.title,
      content: response.data.content,
      category: 'technology',
      difficulty: 'intermediate',
      delivery_metadata: {
        from_personalized_feed: false,
        generation_method: 'on_demand_fallback'
      }
    };
  }

  throw new Error('Unsupported content type for fallback generation');
}

export default router;

