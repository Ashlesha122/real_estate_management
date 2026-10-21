import { query } from '../config/database';

export interface OtpRow {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  consumed_at: Date | null;
  created_at: Date;
}

class OtpRepository {
  async create(userId: string, codeHash: string, expiresAt: Date): Promise<OtpRow> {
    const result = await query(
      `INSERT INTO otp_codes (user_id, code_hash, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, codeHash, expiresAt]
    );
    return result.rows[0];
  }

  async findLatestByUserId(userId: string): Promise<OtpRow | null> {
    const result = await query(
      `SELECT * FROM otp_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async incrementAttempts(id: string): Promise<void> {
    await query(
      'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
      [id]
    );
  }

  async markConsumed(id: string): Promise<void> {
    await query(
      'UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1',
      [id]
    );
  }
}

export const otpRepository = new OtpRepository();
