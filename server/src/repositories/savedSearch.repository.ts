import { query } from '../config/database';

class SavedSearchRepository {
  async create(data: {
    userId: string;
    name: string;
    filters: Record<string, unknown>;
    centerLat?: number;
    centerLng?: number;
    radiusKm?: number;
    notify?: boolean;
  }): Promise<unknown> {
    const result = await query(
      `INSERT INTO saved_searches (user_id, name, filters, center_lat, center_lng, radius_km, notify)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.userId, data.name, JSON.stringify(data.filters),
       data.centerLat || null, data.centerLng || null, data.radiusKm || null, data.notify !== false]
    );
    return result.rows[0];
  }

  async findByUserId(userId: string): Promise<unknown[]> {
    const result = await query(
      'SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows.length > 0;
  }

  async findAllWithNotify(): Promise<unknown[]> {
    const result = await query(
      `SELECT ss.*, u.phone, u.email, u.contact_preference
       FROM saved_searches ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.notify = true`
    );
    return result.rows;
  }
}

export const savedSearchRepository = new SavedSearchRepository();
