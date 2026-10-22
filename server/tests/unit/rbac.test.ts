import { describe, it, expect, vi } from 'vitest';
import { authorize, requireVerified } from '../../src/middleware/rbac';
import { UserRole } from '@estateflow/shared';
import { Request, Response } from 'express';

describe('RBAC Middleware', () => {
  it('should pass if user role is in authorized roles', () => {
    const middleware = authorize(UserRole.OWNER, UserRole.BROKER);
    const req = { user: { role: UserRole.OWNER } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject with ForbiddenError if role is not authorized', () => {
    const middleware = authorize(UserRole.OWNER);
    const req = { user: { role: UserRole.BUYER } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should reject with UnauthorizedError if user is missing', () => {
    const middleware = authorize(UserRole.BUYER);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should enforce phone verification check', () => {
    const nextVerified = vi.fn();
    requireVerified({ user: { phoneVerified: true } } as unknown as Request, {} as Response, nextVerified);
    expect(nextVerified).toHaveBeenCalledWith();

    const nextUnverified = vi.fn();
    requireVerified({ user: { phoneVerified: false } } as unknown as Request, {} as Response, nextUnverified);
    expect(nextUnverified).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
