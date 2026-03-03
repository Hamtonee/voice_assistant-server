import prisma from '../config/prisma.js';
import subscriptionService from './subscriptionService.js';

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 3);
const TRIAL_ENABLED = process.env.TRIAL_ENABLED !== 'false';
const SUBSCRIPTIONS_ENABLED = process.env.SUBSCRIPTIONS_ENABLED !== 'false';

const getTrialWindow = (createdAt) => {
  if (!createdAt || !TRIAL_ENABLED) return { trialEnd: null, daysRemaining: null };
  const trialEnd = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const remainingMs = trialEnd.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return { trialEnd, daysRemaining };
};

const trialService = {
  async checkUserAccess(userId) {
    if (!SUBSCRIPTIONS_ENABLED) {
      return {
        hasAccess: true,
        accessType: 'unrestricted',
        reason: 'Subscriptions disabled',
        requiresSubscription: false,
        trialEnd: null,
        daysRemaining: null
      };
    }

    const hasSubscription = await subscriptionService.hasValidSubscription(userId);
    if (hasSubscription) {
      return {
        hasAccess: true,
        accessType: 'subscription',
        reason: 'Active subscription',
        requiresSubscription: false,
        trialEnd: null,
        daysRemaining: null
      };
    }

    if (!TRIAL_ENABLED || TRIAL_DAYS <= 0) {
      return {
        hasAccess: false,
        accessType: 'none',
        reason: 'Subscription required',
        requiresSubscription: true,
        trialEnd: null,
        daysRemaining: null
      };
    }

    const user = await prisma.authUser.findUnique({
      where: { id: Number(userId) },
      select: { created_at: true },
    });

    if (!user?.created_at) {
      return {
        hasAccess: false,
        accessType: 'none',
        reason: 'Subscription required',
        requiresSubscription: true,
        trialEnd: null,
        daysRemaining: null
      };
    }

    const { trialEnd, daysRemaining } = getTrialWindow(user.created_at);
    const hasTrialAccess = trialEnd && trialEnd > new Date();

    if (hasTrialAccess) {
      return {
        hasAccess: true,
        accessType: 'trial',
        reason: 'Trial active',
        requiresSubscription: false,
        trialEnd,
        daysRemaining
      };
    }

    return {
      hasAccess: false,
      accessType: 'none',
      reason: 'Trial ended',
      requiresSubscription: true,
      trialEnd,
      daysRemaining: 0
    };
  },

  async trackLoginAttempt(_userId, _success, _ipAddress, _userAgent) {
    // No-op for now.
  },

  async initializeTrial(_userId) {
    return { success: true };
  },

  async getTrialInfo(userId) {
    if (!TRIAL_ENABLED || TRIAL_DAYS <= 0) {
      return {
        success: true,
        hasTrial: false,
        trialEnd: null,
        daysRemaining: null
      };
    }

    const user = await prisma.authUser.findUnique({
      where: { id: Number(userId) },
      select: { created_at: true },
    });

    if (!user?.created_at) {
      return {
        success: true,
        hasTrial: false,
        trialEnd: null,
        daysRemaining: null
      };
    }

    const { trialEnd, daysRemaining } = getTrialWindow(user.created_at);
    return {
      success: true,
      hasTrial: Boolean(trialEnd && trialEnd > new Date()),
      trialEnd,
      daysRemaining
    };
  }
};

export default trialService;
