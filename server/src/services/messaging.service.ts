import { logger } from '../config/logger';
import { config } from '../config';

export interface MessagingProvider {
  sendSMS(to: string, body: string): Promise<void>;
  sendWhatsApp(to: string, body: string): Promise<void>;
}

class ConsoleProvider implements MessagingProvider {
  async sendSMS(to: string, body: string): Promise<void> {
    logger.info({ to, body }, '📱 [MOCK SMS]');
    console.log(`\n📱 MOCK SMS to ${to}:\n${body}\n`);
  }

  async sendWhatsApp(to: string, body: string): Promise<void> {
    logger.info({ to, body }, '💬 [MOCK WhatsApp]');
    console.log(`\n💬 MOCK WhatsApp to ${to}:\n${body}\n`);
  }
}

class TwilioProvider implements MessagingProvider {
  async sendSMS(to: string, body: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`;
    const auth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: config.twilio.phoneNumber,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio SMS failed: ${error}`);
    }
  }

  async sendWhatsApp(to: string, body: string): Promise<void> {
    // Use Twilio for WhatsApp as well
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`;
    const auth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${config.twilio.phoneNumber}`,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio WhatsApp failed: ${error}`);
    }
  }
}

function createProvider(): MessagingProvider {
  if (config.twilio.accountSid && config.twilio.authToken) {
    logger.info('Using Twilio messaging provider');
    return new TwilioProvider();
  }
  logger.info('Using console mock messaging provider (no Twilio credentials configured)');
  return new ConsoleProvider();
}

export const messagingProvider = createProvider();
