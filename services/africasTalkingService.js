import africastalking from 'africastalking';

const getConfig = () => ({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
  senderId: process.env.AFRICASTALKING_SENDER_ID || undefined
});

const isConfigured = ({ apiKey, username }) => Boolean(apiKey && username);

export const toKenyaE164 = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `+254${digits.slice(1)}`;
  }
  if (digits.startsWith('254')) {
    return `+${digits}`;
  }
  if (digits.startsWith('7') && digits.length === 9) {
    return `+254${digits}`;
  }
  return `+${digits}`;
};

export const sendVerificationSms = async ({ to, message }) => {
  const config = getConfig();

  if (!isConfigured(config)) {
    throw new Error('Africa\'s Talking is not configured');
  }

  const sms = africastalking({
    apiKey: config.apiKey,
    username: config.username
  }).SMS;

  const payload = {
    to: [to],
    message
  };

  if (config.senderId) {
    payload.from = config.senderId;
  }

  return sms.send(payload);
};
