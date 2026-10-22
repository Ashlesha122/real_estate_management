import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { notificationRepository } from '../../src/repositories/notification.repository';
import { tokenService } from '../../src/services/token.service';
import { UserRole } from '@estateflow/shared';

describe('Notifications API Integration Tests', () => {
  const userToken = tokenService.signAccessToken({
    id: '44444444-4444-4444-4444-444444444444',
    email: 'tenant@estateflow.com',
    role: UserRole.BUYER,
    phoneVerified: true,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/notifications/unread-count should return current count', async () => {
    vi.spyOn(notificationRepository, 'getUnreadCount').mockResolvedValue(3);

    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
  });

  it('POST /api/v1/notifications/read should mark notifications as read', async () => {
    vi.spyOn(notificationRepository, 'markAllRead').mockResolvedValue(undefined as any);

    const res = await request(app)
      .post('/api/v1/notifications/read')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ all: true });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('marked as read');
  });
});
