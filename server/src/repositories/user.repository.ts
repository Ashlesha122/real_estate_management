import { query } from '../config/database';

export interface UserRow {
  id: string;
  email: string;
  phone: string;
  password_hash: string;
  full_name: string;
  role: string;
  phone_verified: boolean;
  contact_preference: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

class UserRepository {
  async create(data: {
    email: string;
    phone: string;
    passwordHash: string;
    fullName: string;
    role: string;
  }): Promise<UserRow> {
    const result = await query(
      `INSERT INTO users (email, phone, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.email, data.phone, data.passwordHash, data.fullName, data.role]
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateProfile(id: string, data: {
    fullName?: string;
    phone?: string;
    contactPreference?: string;
  }): Promise<UserRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined) {
      sets.push(`full_name = $${idx++}`);
      values.push(data.fullName);
    }
    if (data.phone !== undefined) {
      sets.push(`phone = $${idx++}`);
      values.push(data.phone);
    }
    if (data.contactPreference !== undefined) {
      sets.push(`contact_preference = $${idx++}`);
      values.push(data.contactPreference);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<void> {
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, id]
    );
  }

  async setPhoneVerified(id: string): Promise<void> {
    await query(
      'UPDATE users SET phone_verified = true, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }

  async findBrokers(search?: string, page = 1, limit = 20): Promise<{ rows: UserRow[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE role = 'BROKER'";
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await query(
      `SELECT id, email, phone, full_name, role, avatar_url, created_at
       FROM users ${whereClause}
       ORDER BY full_name ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    return { rows: result.rows, total };
  }
}

export const userRepository = new UserRepository();
