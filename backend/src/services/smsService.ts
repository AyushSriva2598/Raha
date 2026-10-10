import { config } from '../config/index.js';
import { SosDispatchRecord } from '../types/index.js';

class SmsService {
  private dispatchHistory: SosDispatchRecord[] = [];

  /**
   * Dispatches emergency SOS SMS to a recipient's phone number
   */
  async sendSosSms(
    recipientPhone: string,
    recipientName: string,
    messageText: string
  ): Promise<SosDispatchRecord> {
    const record: SosDispatchRecord = {
      id: `sms-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientPhone,
      recipientName,
      status: 'SIMULATED',
      timestamp: new Date().toISOString(),
      messageText,
    };

    console.log(`\n======================================================`);
    console.log(`🚨 [REAL SOS ENGINE DISPATCH] 🚨`);
    console.log(`👤 Recipient: ${recipientName} (${recipientPhone})`);
    console.log(`💬 Message: "${messageText}"`);

    // 1. Attempt Twilio SMS delivery if configured
    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
      try {
        const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', recipientPhone.replace(/\s+/g, ''));
        params.append('From', config.twilioPhoneNumber);
        params.append('Body', messageText);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as any;
          record.status = 'SENT';
          record.carrierMessageId = data.sid;
          console.log(`✅ [Twilio] Live SMS delivered successfully! SID: ${data.sid}`);
          this.dispatchHistory.unshift(record);
          return record;
        } else {
          const err = await response.text();
          console.warn(`⚠️ [Twilio] Dispatch failed:`, err);
        }
      } catch (err) {
        console.warn(`⚠️ [Twilio Network Error]:`, (err as Error).message);
      }
    }

    // 2. Attempt Textbelt dispatch (provides 1 free SMS/day for testing without setup)
    try {
      const cleanPhone = recipientPhone.replace(/[\s-]/g, '');
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message: messageText,
          key: config.textbeltApiKey,
        }),
      });

      const result = (await response.json()) as any;
      if (result.success) {
        record.status = 'SENT';
        record.carrierMessageId = result.textId;
        console.log(`✅ [Textbelt Gateway] SMS delivered to phone! ID: ${result.textId}`);
        this.dispatchHistory.unshift(record);
        return record;
      } else {
        console.log(`ℹ️ [Textbelt Notice]: ${result.error || 'Quota reached, fallback simulated'}`);
      }
    } catch (err) {
      console.log(`ℹ️ [Textbelt Gateway Bypass]:`, (err as Error).message);
    }

    // 3. Forward to Emergency Webhook (e.g. Discord, Telegram bot, or Webhook.site) if configured
    if (config.emergencyWebhookUrl) {
      try {
        await fetch(config.emergencyWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'EMERGENCY_SOS_DISPATCH',
            recipient: { name: recipientName, phone: recipientPhone },
            message: messageText,
            timestamp: record.timestamp,
          }),
        });
        record.status = 'WEBHOOK_DELIVERED';
        console.log(`✅ [Emergency Webhook] Forwarded to external pager/phone webhook!`);
      } catch (err) {
        console.warn(`⚠️ [Webhook Error]:`, (err as Error).message);
      }
    }

    console.log(`📡 [SOS Status Recorded]: ${record.status}`);
    console.log(`======================================================\n`);

    this.dispatchHistory.unshift(record);
    return record;
  }

  getDispatchHistory(): SosDispatchRecord[] {
    return [...this.dispatchHistory];
  }
}

export const smsService = new SmsService();
