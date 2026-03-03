/**
 * Subscription Authentication Middleware
 * Validates if user has an active subscription
 */

import subscriptionService from '../services/subscriptionService.js';

/**
 * Middleware to check if user has valid subscription
 */
export const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasValidSubscription = await subscriptionService.hasValidSubscription(userId);
    
    if (!hasValidSubscription) {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Please subscribe to access this feature. Daily subscription costs KES 20 and is valid until midnight.',
        action: 'subscribe'
      });
    }

    // Add subscription info to request
    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(userId);
    req.subscription = subscriptionStatus.subscription;

    next();
  } catch (error) {
    console.error('❌ Error in subscription middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
};

/**
 * Middleware to check subscription status and add info to request
 * Does not block access, just adds subscription info
 */
export const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      const subscriptionStatus = await subscriptionService.getSubscriptionStatus(userId);
      req.subscriptionStatus = subscriptionStatus;
    }

    next();
  } catch (error) {
    console.error('❌ Error checking subscription status:', error.message);
    // Don't block request, just log error
    req.subscriptionStatus = {
      hasActiveSubscription: false,
      message: 'Error checking subscription status'
    };
    next();
  }
};

/**
 * Middleware for premium features that require subscription
 */
export const requirePremiumSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(userId);
    
    if (!subscriptionStatus.hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        code: 'PREMIUM_SUBSCRIPTION_REQUIRED',
        message: 'This is a premium feature. Please subscribe to access advanced AI features.',
        subscriptionStatus,
        action: 'subscribe'
      });
    }

    // Check if subscription is about to expire (less than 2 hours)
    if (subscriptionStatus.subscription?.hoursUntilExpiry <= 2) {
      return res.status(403).json({
        success: false,
        error: 'Subscription expiring soon',
        code: 'SUBSCRIPTION_EXPIRING',
        message: `Your subscription expires in ${subscriptionStatus.subscription.hoursUntilExpiry} hours. Please renew to continue using premium features.`,
        subscriptionStatus,
        action: 'renew'
      });
    }

    req.subscription = subscriptionStatus.subscription;
    next();
  } catch (error) {
    console.error('❌ Error in premium subscription middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
};

export default {
  requireSubscription,
  checkSubscription,
  requirePremiumSubscription
};







