/**
 * Feed Scheduler Service
 * 
 * Manages background tasks for personalized feed generation and maintenance
 * Ensures users always have fresh, relevant content available instantly
 */

import cron from 'node-cron';
import { PersonalizedFeedService } from './personalizedFeedService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const feedService = new PersonalizedFeedService();

export class FeedScheduler {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.isRunning) {
      console.log('📅 Feed scheduler is already running');
      return;
    }

    console.log('🚀 Starting personalized feed scheduler...');
    
    // 1. Refresh feeds for all active users every 4 hours
    this.jobs.set('refresh_feeds', cron.schedule('0 */4 * * *', async () => {
      console.log('🔄 Running scheduled feed refresh...');
      try {
        await feedService.refreshAllUserFeeds();
        console.log('✅ Scheduled feed refresh completed');
      } catch (error) {
        console.error('❌ Scheduled feed refresh failed:', error);
      }
    }, { 
      scheduled: false // Start manually
    }));

    // 2. Clean up expired feeds every hour
    this.jobs.set('cleanup_expired', cron.schedule('0 * * * *', async () => {
      console.log('🧹 Cleaning up expired feeds...');
      try {
        await this.cleanupExpiredFeeds();
        console.log('✅ Expired feeds cleanup completed');
      } catch (error) {
        console.error('❌ Feed cleanup failed:', error);
      }
    }, { 
      scheduled: false 
    }));

    // 3. Generate feeds for new users every 30 minutes
    this.jobs.set('new_user_feeds', cron.schedule('*/30 * * * *', async () => {
      console.log('👤 Generating feeds for new users...');
      try {
        await this.generateFeedsForNewUsers();
        console.log('✅ New user feeds generation completed');
      } catch (error) {
        console.error('❌ New user feeds generation failed:', error);
      }
    }, { 
      scheduled: false 
    }));

    // 4. Update user behavior analytics every 2 hours
    this.jobs.set('update_analytics', cron.schedule('0 */2 * * *', async () => {
      console.log('📊 Updating user behavior analytics...');
      try {
        await this.updateUserAnalytics();
        console.log('✅ User analytics update completed');
      } catch (error) {
        console.error('❌ User analytics update failed:', error);
      }
    }, { 
      scheduled: false 
    }));

    // 5. Generate peak-hour feeds (before typical usage times)
    this.jobs.set('peak_prep', cron.schedule('0 8,13,18 * * *', async () => {
      console.log('⚡ Preparing feeds for peak hours...');
      try {
        await this.preparePeakHourFeeds();
        console.log('✅ Peak hour feeds preparation completed');
      } catch (error) {
        console.error('❌ Peak hour preparation failed:', error);
      }
    }, { 
      scheduled: false 
    }));

    // 6. Daily system health check and optimization
    this.jobs.set('daily_health', cron.schedule('0 2 * * *', async () => {
      console.log('🏥 Running daily system health check...');
      try {
        await this.runDailyHealthCheck();
        console.log('✅ Daily health check completed');
      } catch (error) {
        console.error('❌ Daily health check failed:', error);
      }
    }, { 
      scheduled: false 
    }));

    // Start all jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`✅ Started job: ${name}`);
    });

    this.isRunning = true;
    console.log('🎯 All feed scheduler jobs are now running');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (!this.isRunning) {
      console.log('📅 Feed scheduler is not running');
      return;
    }

    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('🛑 Feed scheduler stopped');
  }

  /**
   * Clean up expired feeds and related data
   */
  async cleanupExpiredFeeds() {
    try {
      const expiredFeeds = await prisma.personalizedFeed.findMany({
        where: {
          expires_at: { lt: new Date() }
        },
        select: { id: true, content_ids: true }
      });

      console.log(`Found ${expiredFeeds.length} expired feeds to clean up`);

      // Delete expired feeds
      const deleteResult = await prisma.personalizedFeed.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      // Clean up pre-generated articles that are no longer needed
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const cleanupArticles = await prisma.article.deleteMany({
        where: {
          is_pre_generated: true,
          created_at: { lt: oneWeekAgo },
          reading_progress: { lt: 0.1 } // Not read
        }
      });

      console.log(`Cleaned up ${deleteResult.count} expired feeds and ${cleanupArticles.count} unused articles`);

    } catch (error) {
      console.error('Error cleaning up expired feeds:', error);
      throw error;
    }
  }

  /**
   * Generate feeds for users who don't have current feeds
   */
  async generateFeedsForNewUsers() {
    try {
      // Find active users without current feeds
      const usersWithoutFeeds = await prisma.authUser.findMany({
        where: {
          is_active: true,
          lastActive: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // Active in last 3 days
          personalizedFeeds: {
            none: {
              expires_at: { gt: new Date() }
            }
          }
        },
        select: { id: true, email: true },
        take: 20 // Limit to 20 users per run
      });

      console.log(`Found ${usersWithoutFeeds.length} users needing new feeds`);

      // Generate feeds for these users
      for (const user of usersWithoutFeeds) {
        try {
          await feedService.generatePersonalizedFeed(user.id, 'reading');
          console.log(`✅ Generated feed for user ${user.id}`);
        } catch (error) {
          console.error(`❌ Failed to generate feed for user ${user.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error generating feeds for new users:', error);
      throw error;
    }
  }

  /**
   * Update behavior analytics for active users
   */
  async updateUserAnalytics() {
    try {
      // Get users who have been active in the last 24 hours
      const activeUsers = await prisma.authUser.findMany({
        where: {
          is_active: true,
          lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        select: { id: true },
        take: 50 // Process 50 users per run
      });

      console.log(`Updating analytics for ${activeUsers.length} active users`);

      // Update analytics for each user
      for (const user of activeUsers) {
        try {
          await feedService.analyzeUserBehavior(user.id);
        } catch (error) {
          console.error(`Failed to update analytics for user ${user.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error updating user analytics:', error);
      throw error;
    }
  }

  /**
   * Prepare feeds before peak usage hours
   */
  async preparePeakHourFeeds() {
    try {
      // Get users who typically use the system during peak hours
      const peakUsers = await prisma.userBehaviorAnalytics.findMany({
        where: {
          peak_usage_hours: {
            path: '$',
            array_contains: new Date().getHours() + 1 // Next hour
          }
        },
        select: { user_id: true },
        take: 30
      });

      console.log(`Preparing feeds for ${peakUsers.length} peak-hour users`);

      // Ensure these users have fresh feeds
      for (const user of peakUsers) {
        try {
          const existingFeed = await prisma.personalizedFeed.findFirst({
            where: {
              user_id: user.user_id,
              feed_type: 'reading',
              expires_at: { gt: new Date() }
            }
          });

          // Generate new feed if none exists or current one is running low
          if (!existingFeed || (existingFeed.content_ids?.length || 0) < 3) {
            await feedService.generatePersonalizedFeed(user.user_id, 'reading');
            console.log(`🔄 Refreshed peak-hour feed for user ${user.user_id}`);
          }
        } catch (error) {
          console.error(`Failed to prepare peak-hour feed for user ${user.user_id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error preparing peak-hour feeds:', error);
      throw error;
    }
  }

  /**
   * Run daily health checks and system optimization
   */
  async runDailyHealthCheck() {
    try {
      console.log('🏥 Running comprehensive system health check...');

      // 1. Check feed coverage
      const totalActiveUsers = await prisma.authUser.count({
        where: { is_active: true }
      });

      const usersWithFeeds = await prisma.personalizedFeed.count({
        where: { expires_at: { gt: new Date() } },
        distinct: ['user_id']
      });

      const feedCoverage = totalActiveUsers > 0 ? (usersWithFeeds / totalActiveUsers) * 100 : 0;
      console.log(`📊 Feed coverage: ${feedCoverage.toFixed(1)}% (${usersWithFeeds}/${totalActiveUsers} users)`);

      // 2. Check average response times and engagement
      const feedStats = await feedService.getFeedStatistics();
      console.log('📈 Feed statistics:', feedStats);

      // 3. Identify users with poor engagement and refresh their feeds
      const lowEngagementUsers = await prisma.userBehaviorAnalytics.findMany({
        where: {
          last_engagement_score: { lt: 0.3 },
          last_updated: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { user_id: true },
        take: 10
      });

      console.log(`🔄 Refreshing feeds for ${lowEngagementUsers.length} low-engagement users`);
      for (const user of lowEngagementUsers) {
        try {
          await feedService.generatePersonalizedFeed(user.user_id, 'reading');
        } catch (error) {
          console.error(`Failed to refresh feed for low-engagement user ${user.user_id}:`, error);
        }
      }

      // 4. Log system health summary
      console.log('🎯 Daily health check summary:', {
        total_active_users: totalActiveUsers,
        feed_coverage_percent: feedCoverage,
        low_engagement_users_refreshed: lowEngagementUsers.length,
        system_status: feedCoverage >= 80 ? 'healthy' : 'needs_attention'
      });

    } catch (error) {
      console.error('Error running daily health check:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      is_running: this.isRunning,
      active_jobs: Array.from(this.jobs.keys()),
      job_count: this.jobs.size
    };
  }

  /**
   * Run a specific job manually (for testing/debugging)
   */
  async runJob(jobName) {
    const jobActions = {
      refresh_feeds: () => feedService.refreshAllUserFeeds(),
      cleanup_expired: () => this.cleanupExpiredFeeds(),
      new_user_feeds: () => this.generateFeedsForNewUsers(),
      update_analytics: () => this.updateUserAnalytics(),
      peak_prep: () => this.preparePeakHourFeeds(),
      daily_health: () => this.runDailyHealthCheck()
    };

    if (!jobActions[jobName]) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    console.log(`🔧 Manually running job: ${jobName}`);
    await jobActions[jobName]();
    console.log(`✅ Manual job completed: ${jobName}`);
  }
}

// Create and export singleton instance
const feedScheduler = new FeedScheduler();
export default feedScheduler;

