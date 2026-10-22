import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { userRepository } from '../../src/repositories/user.repository';
import { otpRepository } from '../../src/repositories/otp.repository';
import { authService } from '../../src/services/auth.service';
import { tokenService } from '../../src/services/token.service';
import { UserRole } from '@estateflow/shared';

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('POST /api/v1/auth/register should fail with 400 for invalid email or short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'short',
      fullName: 'A',
      phone: '123',
      role: 'BUYER',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/register should create user and return accessToken', async () => {
    const mockUser = {
      id: 'e0a9d07f-7a5e-4ff6-99cf-d6a503554471',
      email: 'test@example.com',
      phone: '+919876543210',
      password_hash: 'hashed_pw',
      full_name: 'Test Buyer',
      role: UserRole.BUYER,
      phone_verified: false,
      contact_preference: 'WHATSAPP',
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
    vi.spyOn(userRepository, 'create').mockResolvedValue(mockUser);
    vi.spyOn(otpRepository, 'create').mockResolvedValue({} as any);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test Buyer',
      phone: '+919876543210',
      role: 'BUYER',
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('POST /api/v1/auth/login should authenticate valid user', async () => {
    const mockUser = {
      id: 'e0a9d07f-7a5e-4ff6-99cf-d6a503554471',
      email: 'test@example.com',
      phone: '+919876543210',
      password_hash: 'hashed',
      full_name: 'Test Buyer',
      role: UserRole.BUYER,
      phone_verified: true,
      contact_preference: 'WHATSAPP',
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
    vi.spyOn(authService, 'comparePassword').mockResolvedValue(true);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('POST /api/v1/auth/login should return 401 for incorrect password', async () => {
    const mockUser = {
      id: 'e0a9d07f-7a5e-4ff6-99cf-d6a503554471',
      email: 'test@example.com',
      phone: '+919876543210',
      password_hash: 'hashed',
      full_name: 'Test Buyer',
      role: UserRole.BUYER,
      phone_verified: true,
      contact_preference: 'WHATSAPP',
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
    vi.spyOn(authService, 'comparePassword').mockResolvedValue(false);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
  });
});
