-- Migration: Add Personalized Feeds System
-- This migration adds the database structure for personalized content feeds
-- to dramatically improve content delivery performance

-- Add personalized feed enhancement fields to Article model
ALTER TABLE "articles" ADD COLUMN "is_pre_generated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "articles" ADD COLUMN "feed_priority" INTEGER DEFAULT 0;
ALTER TABLE "articles" ADD COLUMN "user_engagement_score" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "articles" ADD COLUMN "content_tags" JSONB;

-- Create indexes for enhanced Article performance
CREATE INDEX "articles_is_pre_generated_idx" ON "articles"("is_pre_generated");
CREATE INDEX "articles_feed_priority_idx" ON "articles"("feed_priority");
CREATE INDEX "articles_user_engagement_score_idx" ON "articles"("user_engagement_score");

-- Create PersonalizedFeed table
CREATE TABLE "personalized_feeds" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "feed_type" VARCHAR(50) NOT NULL,
    "content_ids" JSONB NOT NULL,
    "user_profile" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_accessed" TIMESTAMP(3),
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "avg_engagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "content_consumed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "personalized_feeds_pkey" PRIMARY KEY ("id")
);

-- Create indexes for PersonalizedFeed performance
CREATE INDEX "personalized_feeds_user_id_idx" ON "personalized_feeds"("user_id");
CREATE INDEX "personalized_feeds_feed_type_idx" ON "personalized_feeds"("feed_type");
CREATE INDEX "personalized_feeds_expires_at_idx" ON "personalized_feeds"("expires_at");
CREATE INDEX "personalized_feeds_generated_at_idx" ON "personalized_feeds"("generated_at");

-- Create UserBehaviorAnalytics table
CREATE TABLE "user_behavior_analytics" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "preferred_categories" JSONB NOT NULL,
    "preferred_difficulty" VARCHAR(20) NOT NULL,
    "content_consumption_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peak_usage_hours" JSONB NOT NULL,
    "session_duration_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feature_usage_ratio" JSONB NOT NULL,
    "article_completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interaction_frequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_engagement_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_behavior_analytics_pkey" PRIMARY KEY ("id")
);

-- Create indexes for UserBehaviorAnalytics performance
CREATE INDEX "user_behavior_analytics_user_id_idx" ON "user_behavior_analytics"("user_id");
CREATE INDEX "user_behavior_analytics_last_updated_idx" ON "user_behavior_analytics"("last_updated");
CREATE INDEX "user_behavior_analytics_session_id_idx" ON "user_behavior_analytics"("session_id");

-- Create unique constraint for user behavior analytics
CREATE UNIQUE INDEX "user_behavior_analytics_user_id_session_id_key" ON "user_behavior_analytics"("user_id", "session_id");

-- Add foreign key relationships
ALTER TABLE "personalized_feeds" ADD CONSTRAINT "personalized_feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_behavior_analytics" ADD CONSTRAINT "user_behavior_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert some initial data for testing (optional)
-- This creates behavior analytics for existing users with default values

INSERT INTO "user_behavior_analytics" ("user_id", "session_id", "preferred_categories", "preferred_difficulty", "peak_usage_hours", "feature_usage_ratio", "created_at")
SELECT 
    id,
    'global',
    '["technology", "business", "science"]'::jsonb,
    'intermediate',
    '[9, 14, 20]'::jsonb,
    '{"reading": 0.6, "chat": 0.3, "speech": 0.1}'::jsonb,
    CURRENT_TIMESTAMP
FROM "auth_users" 
WHERE "is_active" = true
ON CONFLICT ("user_id", "session_id") DO NOTHING;

