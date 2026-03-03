import axios from 'axios';

const TOKEN_LEEWAY_MS = 60 * 1000;

const getBaseUrl = () =>
  process.env.DARAJA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const getCredentials = () => ({
  consumerKey: process.env.DARAJA_CONSUMER_KEY,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET,
  shortCode: process.env.DARAJA_SHORTCODE,
  passkey: process.env.DARAJA_PASSKEY,
  callbackUrl: process.env.DARAJA_CALLBACK_URL,
  accountRef: process.env.DARAJA_ACCOUNT_REF || 'SEMANA_MI',
  transactionDesc: process.env.DARAJA_TRANSACTION_DESC || 'Subscription payment',
});

const state = {
  token: null,
  expiresAt: 0,
};

const formatTimestamp = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const normalizeMsisdn = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('7') && digits.length === 9) return `254${digits}`;
  return digits;
};

const buildPassword = ({ shortCode, passkey, timestamp }) =>
  Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

export const getAccessToken = async () => {
  if (state.token && Date.now() < state.expiresAt - TOKEN_LEEWAY_MS) {
    return state.token;
  }

  const { consumerKey, consumerSecret } = getCredentials();

  if (!consumerKey || !consumerSecret) {
    throw new Error('Daraja consumer key/secret not configured');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  const token = response.data?.access_token;
  const expiresIn = Number(response.data?.expires_in || 0) * 1000;

  if (!token) {
    throw new Error('Daraja access token response missing token');
  }

  state.token = token;
  state.expiresAt = Date.now() + expiresIn;
  return token;
};

export const initiateStkPush = async ({
  amount,
  phoneNumber,
  accountReference,
  transactionDesc,
}) => {
  const token = await getAccessToken();
  const {
    shortCode,
    passkey,
    callbackUrl,
    accountRef,
    transactionDesc: defaultDesc,
  } = getCredentials();

  if (!shortCode || !passkey || !callbackUrl) {
    throw new Error('Daraja shortcode/passkey/callback URL not configured');
  }

  const timestamp = formatTimestamp();
  const password = buildPassword({ shortCode, passkey, timestamp });
  const msisdn = normalizeMsisdn(phoneNumber);

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Number(amount),
    PartyA: msisdn,
    PartyB: shortCode,
    PhoneNumber: msisdn,
    CallBackURL: callbackUrl,
    AccountReference: accountReference || accountRef,
    TransactionDesc: transactionDesc || defaultDesc,
  };

  const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;
  const response = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return { payload, response: response.data };
};

export const queryStkPush = async ({ checkoutRequestId }) => {
  const token = await getAccessToken();
  const { shortCode, passkey } = getCredentials();

  if (!shortCode || !passkey) {
    throw new Error('Daraja shortcode/passkey not configured');
  }

  const timestamp = formatTimestamp();
  const password = buildPassword({ shortCode, passkey, timestamp });
  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const url = `${getBaseUrl()}/mpesa/stkpushquery/v1/query`;
  const response = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return { payload, response: response.data };
};

export const extractCallbackMetadata = (callback) => {
  const items = callback?.CallbackMetadata?.Item || [];
  const map = {};
  for (const item of items) {
    if (item?.Name) {
      map[item.Name] = item?.Value;
    }
  }
  return map;
};

export default {
  getAccessToken,
  initiateStkPush,
  queryStkPush,
  extractCallbackMetadata,
};
