import { query, getClient } from '../config/database';

export interface InquiryRow {
  id: string;
  property_id: string;
  buyer_id: string;
  handler_id: string;
  message: string;
  contact_mode: string;
  preferred_visit_time: Date | null;
  stage: string;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}

class InquiryRepository {
  async create(data: {
    propertyId: string;
    buyerId: string;
    handlerId: string;
    message: string;
    contactMode: string;
    preferredVisitTime?: Date | null;
  }): Promise<InquiryRow> {
    const result = await query(
      `INSERT INTO inquiries (property_id, buyer_id, handler_id, message, contact_mode, preferred_visit_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.propertyId, data.buyerId, data.handlerId, data.message, data.contactMode, data.preferredVisitTime || null]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<InquiryRow | null> {
    const result = await query('SELECT * FROM inquiries WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByBuyerId(buyerId: string, page = 1, limit = 20): Promise<{ rows: unknown[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query('SELECT COUNT(*) FROM inquiries WHERE buyer_id = $1', [buyerId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT i.*, p.title as property_title, p.city, p.type as property_type,
              (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_image_url
       FROM inquiries i
       JOIN properties p ON p.id = i.property_id
       WHERE i.buyer_id = $1
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [buyerId, limit, offset]
    );
    return { rows: result.rows, total };
  }

  async findLeads(handlerId: string, filters: {
    propertyId?: string;
    stage?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rows: unknown[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['i.handler_id = $1'];
    const values: unknown[] = [handlerId];
    let idx = 2;

    if (filters.propertyId) {
      conditions.push(`i.property_id = $${idx++}`);
      values.push(filters.propertyId);
    }
    if (filters.stage) {
      conditions.push(`i.stage = $${idx++}`);
      values.push(filters.stage);
    }
    if (filters.fromDate) {
      conditions.push(`i.created_at >= $${idx++}`);
      values.push(filters.fromDate);
    }
    if (filters.toDate) {
      conditions.push(`i.created_at <= $${idx++}`);
      values.push(filters.toDate);
    }

    const whereClause = conditions.join(' AND ');
    const countResult = await query(`SELECT COUNT(*) FROM inquiries i WHERE ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const result = await query(
      `SELECT i.*,
              p.title as property_title, p.city,
              u.full_name as buyer_name, u.phone as buyer_phone, u.email as buyer_email,
              (SELECT COUNT(*) FROM inquiry_notes n WHERE n.inquiry_id = i.id)::int as notes_count,
              (SELECT COUNT(*) FROM site_visits v WHERE v.inquiry_id = i.id)::int as visits_count
       FROM inquiries i
       JOIN properties p ON p.id = i.property_id
       JOIN users u ON u.id = i.buyer_id
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return { rows: result.rows, total };
  }

  async findLeadsByOwnerId(ownerId: string, filters: {
    propertyId?: string; stage?: string; page?: number; limit?: number;
  }): Promise<{ rows: unknown[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['p.owner_id = $1'];
    const values: unknown[] = [ownerId];
    let idx = 2;

    if (filters.propertyId) {
      conditions.push(`i.property_id = $${idx++}`);
      values.push(filters.propertyId);
    }
    if (filters.stage) {
      conditions.push(`i.stage = $${idx++}`);
      values.push(filters.stage);
    }

    const whereClause = conditions.join(' AND ');
    const countResult = await query(
      `SELECT COUNT(*) FROM inquiries i JOIN properties p ON p.id = i.property_id WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const result = await query(
      `SELECT i.*,
              p.title as property_title, p.city,
              u.full_name as buyer_name, u.phone as buyer_phone, u.email as buyer_email,
              h.full_name as handler_name
       FROM inquiries i
       JOIN properties p ON p.id = i.property_id
       JOIN users u ON u.id = i.buyer_id
       JOIN users h ON h.id = i.handler_id
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return { rows: result.rows, total };
  }

  async updateStage(id: string, stage: string): Promise<void> {
    await query('UPDATE inquiries SET stage = $1, updated_at = NOW() WHERE id = $2', [stage, id]);
  }

  async markRead(id: string): Promise<void> {
    await query('UPDATE inquiries SET read = true WHERE id = $1', [id]);
  }

  async addNote(data: { inquiryId: string; authorId: string; body: string }): Promise<unknown> {
    const result = await query(
      `INSERT INTO inquiry_notes (inquiry_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
      [data.inquiryId, data.authorId, data.body]
    );
    return result.rows[0];
  }

  async findNotes(inquiryId: string): Promise<unknown[]> {
    const result = await query(
      `SELECT n.*, u.full_name as author_name
       FROM inquiry_notes n
       JOIN users u ON u.id = n.author_id
       WHERE n.inquiry_id = $1
       ORDER BY n.created_at DESC`,
      [inquiryId]
    );
    return result.rows;
  }

  async addActivity(data: { inquiryId: string; actorId: string; eventType: string; metadata?: Record<string, unknown> }): Promise<void> {
    await query(
      `INSERT INTO inquiry_activities (inquiry_id, actor_id, event_type, metadata) VALUES ($1, $2, $3, $4)`,
      [data.inquiryId, data.actorId, data.eventType, data.metadata ? JSON.stringify(data.metadata) : null]
    );
  }

  async findActivities(inquiryId: string): Promise<unknown[]> {
    const result = await query(
      `SELECT a.*, u.full_name as actor_name
       FROM inquiry_activities a
       JOIN users u ON u.id = a.actor_id
       WHERE a.inquiry_id = $1
       ORDER BY a.created_at DESC`,
      [inquiryId]
    );
    return result.rows;
  }

  async getUnreadCount(handlerId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM inquiries WHERE handler_id = $1 AND read = false',
      [handlerId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const inquiryRepository = new InquiryRepository();
