import { UserRole } from '@estateflow/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        phoneVerified: boolean;
      };
    }
  }
}

export {};
