import express from 'express';
import auth from '../middleware/auth.js';
import {
  getPaymentPhone,
  startPhoneVerification,
  confirmPhoneVerification,
  getSubscriptionStatus,
  startStkPush,
  stkPushQuery,
  darajaCallback
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.get('/payment-phone', auth, getPaymentPhone);
router.post('/payment-phone/verify/start', auth, startPhoneVerification);
router.post('/payment-phone/verify/confirm', auth, confirmPhoneVerification);
router.get('/status', auth, getSubscriptionStatus);
router.post('/stk-push', auth, startStkPush);
router.get('/stk-query/:checkoutRequestId', auth, stkPushQuery);
router.post('/daraja/callback', darajaCallback);

export default router;
