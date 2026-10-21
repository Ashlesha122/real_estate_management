import { query } from '../config/database';

export interface AvailabilityRuleRow {
  id: string;
  handler_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: Date;
}

export interface AvailabilityBlockRow {
  id: string;
  handler_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: Date;
}

class AvailabilityRepository {
  async getRules(handlerId: string): Promise<AvailabilityRuleRow[]> {
    const result = await query(
      'SELECT * FROM availability_rules WHERE handler_id = $1 ORDER BY day_of_week, start_time',
      [handlerId]
    );
    return result.rows;
  }

  async replaceRules(handlerId: string, rules: { dayOfWeek: number; startTime: string; endTime: string }[]): Promise<AvailabilityRuleRow[]> {
    await query('DELETE FROM availability_rules WHERE handler_id = $1', [handlerId]);

    const results: AvailabilityRuleRow[] = [];
    for (const rule of rules) {
      const result = await query(
        `INSERT INTO availability_rules (handler_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [handlerId, rule.dayOfWeek, rule.startTime, rule.endTime]
      );
      results.push(result.rows[0]);
    }
    return results;
  }

  async getBlocks(handlerId: string): Promise<AvailabilityBlockRow[]> {
    const result = await query(
      'SELECT * FROM availability_blocks WHERE handler_id = $1 ORDER BY blocked_date',
      [handlerId]
    );
    return result.rows;
  }

  async addBlock(handlerId: string, blockedDate: string, reason?: string): Promise<AvailabilityBlockRow> {
    const result = await query(
      `INSERT INTO availability_blocks (handler_id, blocked_date, reason)
       VALUES ($1, $2, $3) RETURNING *`,
      [handlerId, blockedDate, reason || null]
    );
    return result.rows[0];
  }

  async deleteBlock(id: string, handlerId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM availability_blocks WHERE id = $1 AND handler_id = $2 RETURNING id',
      [id, handlerId]
    );
    return result.rows.length > 0;
  }
}

export const availabilityRepository = new AvailabilityRepository();
