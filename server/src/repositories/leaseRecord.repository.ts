import { query } from '../config/database';

export interface LeaseRecordRow {
  id: string;
  property_id: string;
  tenant_id: string | null;
  counterparty_name: string;
  counterparty_phone: string | null;
  record_type: string;
  start_date: string;
  end_date: string | null;
  amount: number;
  notes: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

class LeaseRecordRepository {
  async create(data: {
    propertyId: string;
    tenantId?: string | null;
    counterpartyName: string;
    counterpartyPhone?: string | null;
    recordType: string;
    startDate: string;
    endDate?: string | null;
    amount: number;
    notes?: string | null;
  }): Promise<LeaseRecordRow> {
    const result = await query(
      `INSERT INTO lease_records (property_id, tenant_id, counterparty_name, counterparty_phone,
       record_type, start_date, end_date, amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.propertyId, data.tenantId || null, data.counterpartyName,
       data.counterpartyPhone || null, data.recordType, data.startDate,
       data.endDate || null, data.amount, data.notes || null]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<LeaseRecordRow | null> {
    const result = await query('SELECT * FROM lease_records WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByOwnerId(ownerId: string, page = 1, limit = 20): Promise<{ rows: unknown[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query(
      `SELECT COUNT(*) FROM lease_records lr JOIN properties p ON p.id = lr.property_id WHERE p.owner_id = $1`,
      [ownerId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT lr.*, p.title as property_title, p.city, p.type as property_type
       FROM lease_records lr
       JOIN properties p ON p.id = lr.property_id
       WHERE p.owner_id = $1
       ORDER BY lr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]
    );
    return { rows: result.rows, total };
  }

  async update(id: string, data: { active?: boolean; endDate?: string; notes?: string }): Promise<LeaseRecordRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.active !== undefined) {
      sets.push(`active = $${idx++}`);
      values.push(data.active);
    }
    if (data.endDate !== undefined) {
      sets.push(`end_date = $${idx++}`);
      values.push(data.endDate);
    }
    if (data.notes !== undefined) {
      sets.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE lease_records SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
}

export const leaseRecordRepository = new LeaseRecordRepository();
