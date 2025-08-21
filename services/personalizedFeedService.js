/**
 * Personalized Feed Service
 * 
 * This service implements intelligent content pre-generation and delivery
 * to dramatically improve user experience and reduce API costs.
 * 
 * Key Features:
 * - User behavior analysis and profiling
 * - Predictive content generation
 * - Smart feed management and delivery
 * - Performance optimization through caching
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export class PersonalizedFeedService {
  constructor() {
    this.FEED_EXPIRY_HOURS = 24;
    this.MIN_FEED_SIZE = 5;
    this.MAX_FEED_SIZE = 15;
    this.PYTHON_API_BASE = process.env.PYTHON_API_BASE || 'http://localhost:8000';
  }

  /**
   * Analyze user behavior and create/update behavior analytics
   */
  async analyzeUserBehavior(userId) {
    try {
      // Get user's historical data
      const userSessions = await prisma.learningSession.findMany({
        where: { 
          user: { auth_user_id: userId }
        },
        include: {
          conversationMessages: true
        },
        orderBy: { started_at: 'desc' },
        take: 50 // Analyze last 50 sessions
      });

      const userArticles = await prisma.article.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 100 // Analyze last 100 articles
      });

      // Calculate behavior patterns
      const behavior = this.calculateBehaviorMetrics(userSessions, userArticles);
      
      // Update or create behavior analytics
      const analytics = await prisma.userBehaviorAnalytics.upsert({
        where: { 
          user_id_session_id: {
            user_id: userId,
            session_id: 'global' // Global analytics per user
          }
        },
        update: {
          preferred_categories: behavior.preferredCategories,
          preferred_difficulty: behavior.preferredDifficulty,
          content_consumption_rate: behavior.consumptionRate,
          peak_usage_hours: behavior.peakHours,
          session_duration_avg: behavior.avgSessionDuration,
          feature_usage_ratio: behavior.featureRatio,
          article_completion_rate: behavior.completionRate,
          interaction_frequency: behavior.interactionFreq,
          last_engagement_score: behavior.engagementScore,
          last_updated: new Date()
        },
        create: {
          user_id: userId,
          session_id: 'global',
          preferred_categories: behavior.preferredCategories,
          preferred_difficulty: behavior.preferredDifficulty,
          content_consumption_rate: behavior.consumptionRate,
          peak_usage_hours: behavior.peakHours,
          session_duration_avg: behavior.avgSessionDuration,
          feature_usage_ratio: behavior.featureRatio,
          article_completion_rate: behavior.completionRate,
          interaction_frequency: behavior.interactionFreq,
          last_engagement_score: behavior.engagementScore
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  /**
   * Calculate behavior metrics from user data
   */
  calculateBehaviorMetrics(sessions, articles) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Category preferences (from articles)
    const categoryCount = {};
    articles.forEach(article => {
      if (article.created_at > thirtyDaysAgo) {
        categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
      }
    });

    const preferredCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Difficulty preference
    const difficultyCount = {};
    articles.forEach(article => {
      if (article.created_at > thirtyDaysAgo) {
        difficultyCount[article.difficulty] = (difficultyCount[article.difficulty] || 0) + 1;
      }
    });
    const preferredDifficulty = Object.keys(difficultyCount).reduce((a, b) => 
      difficultyCount[a] > difficultyCount[b] ? a : b, 'intermediate');

    // Usage patterns
    const hourCounts = new Array(24).fill(0);
    sessions.forEach(session => {
      if (session.started_at > thirtyDaysAgo) {
        const hour = session.started_at.getHours();
        hourCounts[hour]++;
      }
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ hour }) => hour);

    // Session duration
    const validSessions = sessions.filter(s => s.duration_minutes && s.duration_minutes > 0);
    const avgSessionDuration = validSessions.length > 0 
      ? validSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / validSessions.length 
      : 15; // Default 15 minutes

    // Feature usage ratio (based on session types)
    const featureCount = {};
    sessions.forEach(session => {
      if (session.started_at > thirtyDaysAgo) {
        featureCount[session.session_type] = (featureCount[session.session_type] || 0) + 1;
      }
    });

    const totalFeatureUse = Object.values(featureCount).reduce((sum, count) => sum + count, 0);
    const featureRatio = {};
    Object.keys(featureCount).forEach(feature => {
      featureRatio[feature] = totalFeatureUse > 0 ? featureCount[feature] / totalFeatureUse : 0;
    });

    // Engagement metrics
    const recentArticles = articles.filter(a => a.created_at > thirtyDaysAgo);
    const completedArticles = recentArticles.filter(a => a.reading_progress >= 0.8);
    const completionRate = recentArticles.length > 0 ? completedArticles.length / recentArticles.length : 0;

    const consumptionRate = recentArticles.length / 30; // Articles per day
    const interactionFreq = sessions.length / 30; // Sessions per day
    const engagementScore = (completionRate * 0.4) + (Math.min(consumptionRate / 2, 1) * 0.3) + (Math.min(interactionFreq / 3, 1) * 0.3);

    return {
      preferredCategories,
      preferredDifficulty,
      consumptionRate,
      peakHours,
      avgSessionDuration,
      featureRatio,
      completionRate,
      interactionFreq,
      engagementScore
    };
  }

  /**
   * Generate personalized feed for a user
   */
  async generatePersonalizedFeed(userId, feedType = 'reading') {
    try {
      console.log(`🎯 Generating personalized ${feedType} feed for user ${userId}`);

      // Get user behavior analytics
      const analytics = await this.analyzeUserBehavior(userId);
      
      // Check if user already has a valid feed
      const existingFeed = await prisma.personalizedFeed.findFirst({
        where: {
          user_id: userId,
          feed_type: feedType,
          expires_at: { gt: new Date() }
        }
      });

      if (existingFeed && existingFeed.content_ids?.length >= this.MIN_FEED_SIZE) {
        console.log(`✅ Found valid existing ${feedType} feed for user ${userId}`);
        return existingFeed;
      }

      // Generate new content based on user preferences
      const contentIds = await this.generateFeedContent(userId, feedType, analytics);

      // Create new feed
      const feed = await prisma.personalizedFeed.create({
        data: {
          user_id: userId,
          feed_type: feedType,
          content_ids: contentIds,
          user_profile: {
            preferred_categories: analytics.preferred_categories,
            preferred_difficulty: analytics.preferred_difficulty,
            engagement_score: analytics.last_engagement_score
          },
          expires_at: new Date(Date.now() + this.FEED_EXPIRY_HOURS * 60 * 60 * 1000)
        }
      });

      console.log(`✅ Generated new ${feedType} feed for user ${userId} with ${contentIds.length} items`);
      return feed;

    } catch (error) {
      console.error('Error generating personalized feed:', error);
      throw error;
    }
  }

  /**
   * Generate content for the feed
   */
  async generateFeedContent(userId, feedType, analytics) {
    const contentIds = [];

    if (feedType === 'reading') {
      // Generate articles based on user preferences
      const categories = analytics.preferred_categories?.length ? 
        analytics.preferred_categories : ['technology', 'business', 'science'];
      
      for (const category of categories.slice(0, 3)) {
        try {
          // Generate 2-3 articles per preferred category
          for (let i = 0; i < 2; i++) {
            const article = await this.generateArticleContent(userId, {
              category,
              difficulty: analytics.preferred_difficulty || 'intermediate',
              word_count: Math.floor(300 + Math.random() * 400) // 300-700 words
            });

            if (article) {
              contentIds.push(article.id);
            }
          }
        } catch (error) {
          console.error(`Error generating article for category ${category}:`, error);
        }
      }

      // Add some variety with random categories if we don't have enough
      if (contentIds.length < this.MIN_FEED_SIZE) {
        const additionalCategories = ['health', 'education', 'lifestyle', 'culture'];
        for (const category of additionalCategories) {
          if (contentIds.length >= this.MIN_FEED_SIZE) break;
          
          try {
            const article = await this.generateArticleContent(userId, {
              category,
              difficulty: analytics.preferred_difficulty || 'intermediate',
              word_count: Math.floor(300 + Math.random() * 400)
            });

            if (article) {
              contentIds.push(article.id);
            }
          } catch (error) {
            console.error(`Error generating additional article for ${category}:`, error);
          }
        }
      }
    }

    return contentIds;
  }

  /**
   * Generate individual article content
   */
  async generateArticleContent(userId, params) {
    try {
      // Call Python backend to generate article
      const response = await axios.get(`${this.PYTHON_API_BASE}/reading-topic`, {
        params: {
          category: params.category,
          difficulty: params.difficulty,
          word_count: params.word_count,
          paragraph_count: Math.ceil(params.word_count / 150)
        },
        timeout: 30000
      });

      if (!response.data || !response.data.content) {
        throw new Error('Invalid response from content generation service');
      }

      // Create a temporary chat session for this article
      const tempChat = await prisma.chat.create({
        data: {
          title: `Feed Article: ${params.category}`,
          owner_id: userId,
          feature: 'tusome'
        }
      });

      // Save article to database
      const article = await prisma.article.create({
        data: {
          chat_id: tempChat.id,
          user_id: userId,
          title: response.data.title || `${params.category} Article`,
          content: response.data.content,
          category: params.category,
          difficulty: params.difficulty,
          feature: 'tusome',
          paragraph_count: params.paragraph_count,
          is_pre_generated: true,
          feed_priority: this.calculateFeedPriority(params),
          content_tags: response.data.learning_elements || {},
          article_metadata: {
            generated_for_feed: true,
            generation_params: params,
            generated_at: new Date().toISOString()
          }
        }
      });

      return article;

    } catch (error) {
      console.error('Error generating article content:', error);
      return null;
    }
  }

  /**
   * Calculate feed priority for content ordering
   */
  calculateFeedPriority(params) {
    // Higher priority for preferred difficulty and categories
    let priority = 5; // Base priority

    if (params.difficulty === 'intermediate') priority += 2;
    if (params.word_count >= 400 && params.word_count <= 600) priority += 1; // Optimal length

    return priority;
  }

  /**
   * Get next content item from user's feed
   */
  async getNextFeedContent(userId, feedType = 'reading') {
    try {
      // Get user's current feed
      let feed = await prisma.personalizedFeed.findFirst({
        where: {
          user_id: userId,
          feed_type: feedType,
          expires_at: { gt: new Date() }
        }
      });

      // Generate new feed if none exists or expired
      if (!feed || !feed.content_ids?.length) {
        feed = await this.generatePersonalizedFeed(userId, feedType);
      }

      // Get the next undelivered content
      const contentIds = Array.isArray(feed.content_ids) ? feed.content_ids : [];
      if (contentIds.length === 0) {
        throw new Error('No content available in feed');
      }

      // Get the first available content item
      const contentId = contentIds[0];
      
      const content = await prisma.article.findUnique({
        where: { id: contentId },
        include: {
          chat: true
        }
      });

      if (!content) {
        // Remove invalid content ID and try next
        const updatedIds = contentIds.slice(1);
        await prisma.personalizedFeed.update({
          where: { id: feed.id },
          data: { content_ids: updatedIds }
        });

        if (updatedIds.length > 0) {
          return this.getNextFeedContent(userId, feedType); // Recursive call
        } else {
          throw new Error('No valid content in feed');
        }
      }

      // Update feed - remove delivered content and update access metrics
      const updatedIds = contentIds.slice(1);
      await prisma.personalizedFeed.update({
        where: { id: feed.id },
        data: {
          content_ids: updatedIds,
          last_accessed: new Date(),
          access_count: { increment: 1 },
          content_consumed: { increment: 1 }
        }
      });

      // Track user engagement
      await this.trackContentDelivery(userId, content.id, feedType);

      return {
        ...content,
        delivery_metadata: {
          from_personalized_feed: true,
          feed_id: feed.id,
          remaining_content: updatedIds.length
        }
      };

    } catch (error) {
      console.error('Error getting next feed content:', error);
      throw error;
    }
  }

  /**
   * Track content delivery for analytics
   */
  async trackContentDelivery(userId, contentId, feedType) {
    try {
      // This could be expanded to track more detailed analytics
      console.log(`📊 Tracked delivery: User ${userId}, Content ${contentId}, Feed ${feedType}`);
      
      // Update user engagement metrics
      await prisma.userBehaviorAnalytics.updateMany({
        where: { user_id: userId },
        data: {
          interaction_frequency: { increment: 0.1 },
          last_updated: new Date()
        }
      });

    } catch (error) {
      console.error('Error tracking content delivery:', error);
    }
  }

  /**
   * Background task to refresh feeds for all active users
   */
  async refreshAllUserFeeds() {
    try {
      console.log('🔄 Starting background feed refresh for all users...');

      // Get active users (logged in within last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeUsers = await prisma.authUser.findMany({
        where: {
          lastActive: { gte: sevenDaysAgo },
          is_active: true
        },
        select: { id: true }
      });

      console.log(`Found ${activeUsers.length} active users for feed refresh`);

      // Process users in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (user) => {
          try {
            await this.generatePersonalizedFeed(user.id, 'reading');
            console.log(`✅ Refreshed feed for user ${user.id}`);
          } catch (error) {
            console.error(`❌ Failed to refresh feed for user ${user.id}:`, error);
          }
        }));

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('✅ Background feed refresh completed');

    } catch (error) {
      console.error('Error refreshing user feeds:', error);
    }
  }

  /**
   * Get feed statistics for monitoring
   */
  async getFeedStatistics() {
    try {
      const stats = await prisma.personalizedFeed.groupBy({
        by: ['feed_type'],
        _count: { id: true },
        _avg: { avg_engagement: true, content_consumed: true },
        where: {
          expires_at: { gt: new Date() }
        }
      });

      const totalUsers = await prisma.authUser.count({
        where: { is_active: true }
      });

      const activeFeeds = await prisma.personalizedFeed.count({
        where: { expires_at: { gt: new Date() } }
      });

      return {
        feed_types: stats,
        total_active_users: totalUsers,
        total_active_feeds: activeFeeds,
        feed_coverage: totalUsers > 0 ? (activeFeeds / totalUsers) * 100 : 0
      };

    } catch (error) {
      console.error('Error getting feed statistics:', error);
      throw error;
    }
  }
}

export default PersonalizedFeedService;

