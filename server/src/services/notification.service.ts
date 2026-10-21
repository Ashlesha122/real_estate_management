import { notificationRepository } from '../repositories/notification.repository';
import { messagingProvider } from './messaging.service';
import { logger } from '../config/logger';

class NotificationService {
  async sendOtp(phone: string, otp: string): Promise<void> {
    const body = `Your EstateFlow verification code is: ${otp}. It expires in 10 minutes.`;
    try {
      await messagingProvider.sendSMS(phone, body);
    } catch (error) {
      logger.error({ error, phone }, 'Failed to send OTP SMS');
      // Don't block the flow for OTP send failure
    }
  }

  async createInAppNotification(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    try {
      await notificationRepository.create({ userId, type, title, body, notificationData: data });
    } catch (error) {
      logger.error({ error, userId, type }, 'Failed to create in-app notification');
    }
  }

  async sendNotification(params: {
    userId: string;
    phone: string;
    type: string;
    title: string;
    body: string;
    contactPreference?: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    // Always create in-app notification
    await this.createInAppNotification(params.userId, params.type, params.title, params.body, params.data);

    // Send via preferred channel
    try {
      if (params.contactPreference === 'WHATSAPP') {
        await messagingProvider.sendWhatsApp(params.phone, params.body);
        await notificationRepository.createLog({
          userId: params.userId,
          channel: 'WHATSAPP',
          recipient: params.phone,
          template: params.type,
          payloadSummary: params.title,
          status: 'SENT',
        });
      } else {
        await messagingProvider.sendSMS(params.phone, params.body);
        await notificationRepository.createLog({
          userId: params.userId,
          channel: 'SMS',
          recipient: params.phone,
          template: params.type,
          payloadSummary: params.title,
          status: 'SENT',
        });
      }
    } catch (error) {
      logger.error({ error, userId: params.userId, type: params.type }, 'Failed to send notification');
      await notificationRepository.createLog({
        userId: params.userId,
        channel: params.contactPreference === 'WHATSAPP' ? 'WHATSAPP' : 'SMS',
        recipient: params.phone,
        template: params.type,
        payloadSummary: params.title,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const notificationService = new NotificationService();
