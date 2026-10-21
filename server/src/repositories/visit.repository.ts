import { query, getClient } from '../config/database';

export interface VisitRow {
  id: string;
  inquiry_id: string;
  property_id: string;
  buyer_id: string;
  handler_id: string;
  scheduled_at: Date;
  duration_minutes: number;
  mode: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

class VisitRepository {
  async create(data: {
    inquiryId: string;
    propertyId: string;
    buyerId: string;
    handlerId: string;
    scheduledAt: Date;
    mode: string;
    durationMinutes?: number;
    notes?: string;
  }): Promise<VisitRow> {
    // Use a transaction with advisory lock to prevent double-booking
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check for existing confirmed/proposed visit at this slot for this handler
      const existing = await client.query(
        `SELECT id FROM site_visits
         WHERE handler_id = $1
           AND scheduled_at = $2
           AND status IN ('PROPOSED', 'CONFIRMED')
         FOR UPDATE`,
        [data.handlerId, data.scheduledAt]
      );

      if (existing.rows.length > 0) {
        throw new Error('This time slot is already booked');
      }

      const result = await client.query(
        `INSERT INTO site_visits (inquiry_id, property_id, buyer_id, handler_id, scheduled_at, duration_minutes, mode, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [data.inquiryId, data.propertyId, data.buyerId, data.handlerId,
         data.scheduledAt, data.durationMinutes || 30, data.mode, data.notes || null]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<VisitRow | null> {
    const result = await query('SELECT * FROM site_visits WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByIdWithDetails(id: string): Promise<unknown | null> {
    const result = await query(
      `SELECT v.*,
              p.title as property_title, p.city, p.locality,
              b.full_name as buyer_name, b.phone as buyer_phone,
              h.full_name as handler_name
       FROM site_visits v
       JOIN properties p ON p.id = v.property_id
       JOIN users b ON b.id = v.buyer_id
       JOIN users h ON h.id = v.handler_id
       WHERE v.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await query('UPDATE site_visits SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  }

  async reschedule(id: string, scheduledAt: Date): Promise<void> {
    await query(
      'UPDATE site_visits SET scheduled_at = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [scheduledAt, 'PROPOSED', id]
    );
  }

  async findByBuyerId(buyerId: string, page = 1, limit = 20): Promise<{ rows: unknown[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query('SELECT COUNT(*) FROM site_visits WHERE buyer_id = $1', [buyerId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT v.*,
              p.title as property_title, p.city,
              h.full_name as handler_name
       FROM site_visits v
       JOIN properties p ON p.id = v.property_id
       JOIN users h ON h.id = v.handler_id
       WHERE v.buyer_id = $1
       ORDER BY v.scheduled_at DESC
       LIMIT $2 OFFSET $3`,
      [buyerId, limit, offset]
    );
    return { rows: result.rows, total };
  }

  async findByHandlerId(handlerId: string, page = 1, limit = 20): Promise<{ rows: unknown[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query('SELECT COUNT(*) FROM site_visits WHERE handler_id = $1', [handlerId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT v.*,
              p.title as property_title, p.city,
              b.full_name as buyer_name, b.phone as buyer_phone
       FROM site_visits v
       JOIN properties p ON p.id = v.property_id
       JOIN users b ON b.id = v.buyer_id
       WHERE v.handler_id = $1
       ORDER BY v.scheduled_at DESC
       LIMIT $2 OFFSET $3`,
      [handlerId, limit, offset]
    );
    return { rows: result.rows, total };
  }

  async findConfirmedByHandlerAndDate(handlerId: string, date: string): Promise<VisitRow[]> {
    const result = await query(
      `SELECT * FROM site_visits
       WHERE handler_id = $1
         AND DATE(scheduled_at) = $2
         AND status IN ('PROPOSED', 'CONFIRMED')
       ORDER BY scheduled_at ASC`,
      [handlerId, date]
    );
    return result.rows;
  }
}

export const visitRepository = new VisitRepository();
