import prisma from '../config/prisma.js';
import { sendVerification, checkVerification, toE164 } from '../services/twilioVerifyService.js';
import subscriptionService from '../services/subscriptionService.js';
import {
  initiateStkPush,
  queryStkPush,
  extractCallbackMetadata,
} from '../services/darajaService.js';

const normalizePhoneNumber = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('0')) return digits;
  if (digits.startsWith('254')) return `0${digits.slice(3)}`;
  if (digits.length > 0 && !digits.startsWith('0')) return `0${digits}`;
  return digits;
};

const isValidPhoneNumber = (value) => /^07[0-9]{8}$/.test(value);

const getVerifiedPaymentPhone = async (userId) =>
  prisma.paymentPhone.findUnique({
    where: { user_id: Number(userId) },
    select: { phone_number: true, verified_at: true },
  });

export const getPaymentPhone = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const record = await prisma.paymentPhone.findUnique({
      where: { user_id: userId },
      select: { phone_number: true, verified_at: true },
    });

    return res.json({
      success: true,
      phoneNumber: record?.phone_number || null,
      verifiedAt: record?.verified_at || null,
    });
  } catch (error) {
    console.error('Failed to get payment phone:', error);
    return res.status(500).json({ error: 'Failed to fetch payment phone number' });
  }
};

// When user enters their phone number on the platform (e.g. payment-phone modal), send OTP for security verification.
export const startPhoneVerification = async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (phoneNumber.length !== 10 || !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const e164Phone = toE164(phoneNumber);
    await sendVerification(e164Phone, 'sms');

    return res.json({
      success: true,
      message: 'Verification code sent to your phone for security verification.',
    });
  } catch (error) {
    console.error('Failed to start phone verification:', error);
    return res.status(500).json({
      error: error.message || 'Failed to start phone verification',
    });
  }
};

export const confirmPhoneVerification = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);
    const code = String(req.body?.code || '').trim();

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    if (phoneNumber.length !== 10 || !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const e164Phone = toE164(phoneNumber);
    const { valid } = await checkVerification(e164Phone, code);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const paymentPhone = await prisma.paymentPhone.upsert({
      where: { user_id: userId },
      update: { phone_number: phoneNumber, verified_at: new Date() },
      create: {
        user_id: userId,
        phone_number: phoneNumber,
        verified_at: new Date(),
      },
    });

    return res.json({
      success: true,
      phoneNumber: paymentPhone.phone_number,
      verifiedAt: paymentPhone.verified_at,
    });
  } catch (error) {
    console.error('Failed to confirm phone verification:', error);
    return res.status(500).json({
      error: error.message || 'Failed to verify phone number',
    });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const status = await subscriptionService.getSubscriptionStatus(userId);
    return res.json({ success: true, ...status });
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

export const startStkPush = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const amountInput = Number(req.body?.amount || 10);
    const amount = Math.round(amountInput);
    if (!Number.isFinite(amountInput) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const overridePhone = normalizePhoneNumber(req.body?.phoneNumber);
    let phoneToUse = overridePhone;

    if (overridePhone) {
      if (overridePhone.length !== 10 || !isValidPhoneNumber(overridePhone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
    } else {
      const paymentPhone = await getVerifiedPaymentPhone(userId);
      if (!paymentPhone?.verified_at) {
        return res.status(400).json({ error: 'Payment phone not verified' });
      }
      phoneToUse = paymentPhone.phone_number;
    }

    const accountReference = req.body?.accountReference || `USER-${userId}`;
    const transactionDesc = req.body?.transactionDesc;

    const transaction = await prisma.paymentTransaction.create({
      data: {
        user_id: userId,
        phone_number: phoneToUse,
        amount,
        currency: 'KES',
        account_reference: String(accountReference),
        status: 'initiated',
      },
    });

    try {
      const { payload, response } = await initiateStkPush({
        amount,
        phoneNumber: phoneToUse,
        accountReference,
        transactionDesc,
      });

      const updated = await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          merchant_request_id: response?.MerchantRequestID || null,
          checkout_request_id: response?.CheckoutRequestID || null,
          result_code: response?.ResponseCode ? Number(response.ResponseCode) : null,
          result_desc: response?.ResponseDescription || null,
          status: response?.ResponseCode === '0' ? 'pending' : 'failed',
          raw_payload: { request: payload, response },
        },
      });

      return res.json({
        success: true,
        transactionId: updated.id,
        checkoutRequestId: updated.checkout_request_id,
        customerMessage: response?.CustomerMessage,
        response,
      });
    } catch (error) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          result_desc: error.message,
        },
      });
      throw error;
    }
  } catch (error) {
    console.error('Failed to start STK push:', error);
    return res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

export const stkPushQuery = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const checkoutRequestId = String(req.params?.checkoutRequestId || '').trim();

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'CheckoutRequestID is required' });
    }

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { checkout_request_id: checkoutRequestId, user_id: userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { payload, response } = await queryStkPush({ checkoutRequestId });
    return res.json({ success: true, payload, response });
  } catch (error) {
    console.error('Failed to query STK push:', error);
    return res.status(500).json({ error: 'Failed to query payment status' });
  }
};

export const darajaCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid payload' });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const merchantRequestId = callback.MerchantRequestID;
    const resultCode = Number(callback.ResultCode);
    const resultDesc = callback.ResultDesc;
    const metadata = extractCallbackMetadata(callback);

    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        checkout_request_id: checkoutRequestId,
      },
    });

    if (!transaction) {
      console.warn('Daraja callback received for unknown transaction:', {
        checkoutRequestId,
        merchantRequestId,
      });
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const updated = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        merchant_request_id: merchantRequestId || transaction.merchant_request_id,
        result_code: Number.isFinite(resultCode) ? resultCode : null,
        result_desc: resultDesc || null,
        mpesa_receipt: metadata.MpesaReceiptNumber || null,
        status: resultCode === 0 ? 'success' : 'failed',
        raw_payload: req.body,
      },
    });

    if (resultCode === 0) {
      await subscriptionService.createOrExtendSubscription({
        userId: updated.user_id,
        amount: updated.amount,
        paymentTransactionId: updated.id,
      });
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Failed to handle Daraja callback:', error);
    return res.json({ ResultCode: 1, ResultDesc: 'Server error' });
  }
};
