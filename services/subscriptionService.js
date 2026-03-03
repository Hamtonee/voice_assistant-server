import prisma from '../config/prisma.js';

const HOURS_IN_DAY = 24;
const SUBSCRIPTIONS_ENABLED = process.env.SUBSCRIPTIONS_ENABLED !== 'false';

const calculateHoursUntilExpiry = (expiresAt) => {
  if (!expiresAt) return 0;
  const diffMs = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
};

const subscriptionService = {
  async hasValidSubscription(userId) {
    if (!SUBSCRIPTIONS_ENABLED) {
      return true;
    }
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: Number(userId) },
      select: { status: true, expires_at: true },
    });

    return Boolean(
      subscription &&
        subscription.status === 'active' &&
        subscription.expires_at &&
        subscription.expires_at > new Date()
    );
  },

  async getSubscriptionStatus(userId) {
    if (!SUBSCRIPTIONS_ENABLED) {
      return {
        hasActiveSubscription: true,
        subscription: {
          status: 'active',
          plan: 'disabled',
          amount: 0,
          currency: 'KES',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          hoursUntilExpiry: 365 * 24,
        },
      };
    }
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: Number(userId) },
    });

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        subscription: null,
      };
    }

    const hasActiveSubscription =
      subscription.status === 'active' &&
      subscription.expires_at &&
      subscription.expires_at > new Date();

    return {
      hasActiveSubscription,
      subscription: {
        ...subscription,
        hoursUntilExpiry: calculateHoursUntilExpiry(subscription.expires_at),
      },
    };
  },

  async createOrExtendSubscription({ userId, amount, paymentTransactionId }) {
    const now = new Date();
    const existing = await prisma.subscription.findUnique({
      where: { user_id: Number(userId) },
    });

    const base = existing?.expires_at && existing.expires_at > now
      ? existing.expires_at
      : now;
    const expiresAt = new Date(base.getTime() + HOURS_IN_DAY * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { user_id: Number(userId) },
      update: {
        status: 'active',
        plan: 'daily',
        amount,
        currency: 'KES',
        started_at: existing?.started_at || now,
        expires_at: expiresAt,
        last_payment_id: paymentTransactionId,
      },
      create: {
        user_id: Number(userId),
        status: 'active',
        plan: 'daily',
        amount,
        currency: 'KES',
        started_at: now,
        expires_at: expiresAt,
        last_payment_id: paymentTransactionId,
      },
    });

    return subscription;
  },
};

export default subscriptionService;
