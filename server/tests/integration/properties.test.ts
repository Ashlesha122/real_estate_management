import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { propertyRepository } from '../../src/repositories/property.repository';
import { userRepository } from '../../src/repositories/user.repository';
import { notificationService } from '../../src/services/notification.service';
import { tokenService } from '../../src/services/token.service';
import { UserRole, PropertyStatus } from '@estateflow/shared';

describe('Properties API Integration Tests', () => {
  const ownerToken = tokenService.signAccessToken({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'owner@estateflow.com',
    role: UserRole.OWNER,
    phoneVerified: true,
  });

  const buyerToken = tokenService.signAccessToken({
    id: '22222222-2222-2222-2222-222222222222',
    email: 'buyer@estateflow.com',
    role: UserRole.BUYER,
    phoneVerified: true,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/v1/properties should block unauthorized buyer', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Unauthorized Luxury Villa',
        type: 'VILLA',
        purpose: 'SALE',
        askingPrice: 15000000,
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/v1/properties should allow OWNER to create a draft listing', async () => {
    const mockCreated = {
      id: '33333333-3333-3333-3333-333333333333',
      owner_id: '11111111-1111-1111-1111-111111111111',
      title: 'Luxury 3 BHK in Koramangala',
      type: 'APARTMENT',
      purpose: 'RENT',
      asking_price: 60000,
      status: PropertyStatus.DRAFT,
      handling_mode: 'DIRECT',
      created_at: new Date(),
    };

    vi.spyOn(propertyRepository, 'create').mockResolvedValue(mockCreated as any);
    vi.spyOn(propertyRepository, 'addStatusHistory').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Luxury 3 BHK in Koramangala',
        type: 'APARTMENT',
        purpose: 'RENT',
        askingPrice: 60000,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('33333333-3333-3333-3333-333333333333');
    expect(res.body.status).toBe('DRAFT');
  });

  it('POST /api/v1/properties/:id/publish should publish DRAFT to ACTIVE', async () => {
    const mockProperty = {
      id: '33333333-3333-3333-3333-333333333333',
      owner_id: '11111111-1111-1111-1111-111111111111',
      title: 'Luxury 3 BHK in Koramangala',
      type: 'APARTMENT',
      purpose: 'RENT',
      asking_price: 60000,
      status: PropertyStatus.DRAFT,
      latitude: 12.9352,
      longitude: 77.6245,
    };

    vi.spyOn(propertyRepository, 'findById').mockResolvedValue(mockProperty as any);
    vi.spyOn(propertyRepository, 'getMediaCount').mockResolvedValue(1);
    vi.spyOn(propertyRepository, 'updateStatus').mockResolvedValue(undefined as any);
    vi.spyOn(propertyRepository, 'addStatusHistory').mockResolvedValue({} as any);
    vi.spyOn(userRepository, 'findById').mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      phone: '+919876543210',
      contact_preference: 'WHATSAPP',
    } as any);
    vi.spyOn(notificationService, 'sendNotification').mockResolvedValue(undefined as any);

    const res = await request(app)
      .post(`/api/v1/properties/${mockProperty.id}/publish`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('published');
  });
});
