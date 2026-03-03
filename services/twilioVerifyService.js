/**
 * Twilio Verify API v2 – send and check OTP for SMS and email.
 *
 * Auth: use either
 *   - API Key: TWILIO_API_KEY_SID (SK...), TWILIO_API_KEY_SECRET
 *   - or Account: TWILIO_ACCOUNT_SID (AC...), TWILIO_AUTH_TOKEN
 * Plus: TWILIO_VERIFY_SERVICE_SID (VA...) from Verify → Services in Twilio console.
 */

const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

/** Basic auth: prefer API Key (SK + Secret), else Account SID + Auth Token */
function getAuth() {
  if (apiKeySid && apiKeySecret) {
    return Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString('base64');
  }
  if (accountSid && authToken) {
    return Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  }
  return null;
}

function isConfigured() {
  return Boolean((apiKeySid && apiKeySecret) || (accountSid && authToken)) && Boolean(verifyServiceSid);
}

/**
 * Normalize phone to E.164 (e.g. +254712345678).
 */
export function toE164(phoneNumber) {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('7') && digits.length === 9) return `+254${digits}`;
  return `+${digits}`;
}

/**
 * Send verification OTP.
 * @param {string} to - E.164 phone (+254...) or email address
 * @param {'sms'|'email'|'call'} channel
 * @returns {Promise<{ sid: string }>}
 */
export async function sendVerification(to, channel = 'sms') {
  if (!isConfigured()) {
    throw new Error('Twilio Verify is not configured. Set TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET (or ACCOUNT_SID + AUTH_TOKEN) and TWILIO_VERIFY_SERVICE_SID.');
  }
  const normalizedTo = channel === 'sms' ? toE164(to) : String(to).trim();
  if (!normalizedTo) throw new Error('Invalid recipient');

  const auth = getAuth();
  const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(verifyServiceSid)}/Verifications`;
  const body = new URLSearchParams({
    To: normalizedTo,
    Channel: channel,
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + auth,
    },
    body: body.toString(),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(response.statusText || 'Failed to send verification');
  }
  if (!response.ok) {
    const msg = data.message || data.error_message || response.statusText;
    throw new Error(msg || 'Failed to send verification');
  }
  return { sid: data.sid, status: data.status };
}

/**
 * Check verification code.
 * @param {string} to - Same E.164 phone or email used in sendVerification
 * @param {string} code - OTP entered by user
 * @returns {Promise<{ status: string, valid: boolean }>}
 */
export async function checkVerification(to, code) {
  if (!isConfigured()) {
    throw new Error('Twilio Verify is not configured');
  }
  const normalizedTo = to.includes('@') ? String(to).trim() : toE164(to);
  if (!normalizedTo || !code) throw new Error('Invalid recipient or code');

  const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(verifyServiceSid)}/VerificationCheck`;
  const body = new URLSearchParams({
    To: normalizedTo,
    Code: String(code).trim(),
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + getAuth(),
    },
    body: body.toString(),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(response.statusText || 'Verification check failed');
  }
  if (!response.ok) {
    const msg = data.message || data.error_message || response.statusText;
    throw new Error(msg || 'Verification check failed');
  }
  const valid = data.status === 'approved';
  return { status: data.status, valid };
}

export default { isConfigured, toE164, sendVerification, checkVerification };
