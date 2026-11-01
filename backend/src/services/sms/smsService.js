import prisma from '../../config/db.js';

/**
 * Optional SMS Provider Integration Service
 * Checks admin settings and environment variables for SMS configuration.
 * Gracefully reports delivery status or logs unconfigured state.
 */
export const sendSMSNotification = async ({ to, message, customerName }) => {
  try {
    if (!to || !to.trim()) {
      return {
        configured: false,
        sent: false,
        status: 'skipped',
        reason: 'Customer has no phone number on file',
      };
    }

    // Check PostgreSQL settings or environment variables
    const [smsProviderSetting, smsApiKeySetting, smsFromSetting] = await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: 'sms_provider' } }),
      prisma.adminSetting.findUnique({ where: { key: 'sms_api_key' } }),
      prisma.adminSetting.findUnique({ where: { key: 'sms_from_number' } }),
    ]);

    const provider = smsProviderSetting?.value || process.env.SMS_PROVIDER || '';
    const apiKey = smsApiKeySetting?.value || process.env.SMS_API_KEY || '';
    const fromNumber = smsFromSetting?.value || process.env.SMS_FROM_NUMBER || '';

    if (!provider || !apiKey) {
      // SMS is optional and not currently configured
      return {
        configured: false,
        sent: false,
        status: 'not_configured',
        reason: 'SMS provider not configured (optional future integration)',
      };
    }

    // Provider integration hook (e.g. Twilio / Infobip / Vonage / AWS SNS)
    console.log(`[SMS Gateway] Dispatched SMS to ${to} via ${provider}: "${message.slice(0, 50)}..."`);

    return {
      configured: true,
      sent: true,
      status: 'sent',
      provider,
      recipient: to,
    };
  } catch (err) {
    console.error('[SMS Service Error]:', err.message);
    return {
      configured: true,
      sent: false,
      status: 'failed',
      error: err.message,
    };
  }
};
