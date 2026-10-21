import { query } from '../config/database';

class WishlistRepository {
  async add(userId: string, propertyId: string): Promise<void> {
    await query(
      `INSERT INTO wishlists (user_id, property_id) VALUES ($1, $2)
       ON CONFLICT (user_id, property_id) DO NOTHING`,
      [userId, propertyId]
    );
  }

  async remove(userId: string, propertyId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND property_id = $2 RETURNING id',
      [userId, propertyId]
    );
    return result.rows.length > 0;
  }

  async findByUserId(userId: string, page = 1, limit = 20): Promise<{ rows: unknown[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query('SELECT COUNT(*) FROM wishlists WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT w.created_at as wishlisted_at, p.*,
              ST_Y(p.location::geometry) as latitude, ST_X(p.location::geometry) as longitude,
              (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_image_url
       FROM wishlists w
       JOIN properties p ON p.id = w.property_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return { rows: result.rows, total };
  }

  async isWishlisted(userId: string, propertyId: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM wishlists WHERE user_id = $1 AND property_id = $2',
      [userId, propertyId]
    );
    return result.rows.length > 0;
  }

  async compare(userId: string, propertyIds: string[]): Promise<unknown[]> {
    if (propertyIds.length === 0 || propertyIds.length > 3) return [];

    const placeholders = propertyIds.map((_, i) => `$${i + 2}`).join(', ');
    const result = await query(
      `SELECT p.*,
              ST_Y(p.location::geometry) as latitude, ST_X(p.location::geometry) as longitude,
              u.full_name as owner_name
       FROM properties p
       JOIN users u ON u.id = p.owner_id
       JOIN wishlists w ON w.property_id = p.id AND w.user_id = $1
       WHERE p.id IN (${placeholders})`,
      [userId, ...propertyIds]
    );
    return result.rows;
  }
}

export const wishlistRepository = new WishlistRepository();
