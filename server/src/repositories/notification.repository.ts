import { query } from '../config/database';

class NotificationRepository {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    notificationData?: Record<string, unknown>;
  }): Promise<unknown> {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.type, data.title, data.body, data.notificationData ? JSON.stringify(data.notificationData) : null]
    );
    return result.rows[0];
  }

  async findByUserId(userId: string, page = 1, limit = 20): Promise<{ rows: unknown[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return { rows: result.rows, total };
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    await query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND id IN (${placeholders})`,
      [userId, ...ids]
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async createLog(data: {
    notificationId?: string;
    userId: string;
    channel: string;
    recipient: string;
    template: string;
    payloadSummary?: string;
    status: string;
    attempts?: number;
    error?: string;
  }): Promise<void> {
    await query(
      `INSERT INTO notification_logs (notification_id, user_id, channel, recipient, template, payload_summary, status, attempts, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [data.notificationId || null, data.userId, data.channel, data.recipient,
       data.template, data.payloadSummary || null, data.status, data.attempts || 1, data.error || null]
    );
  }
}

export const notificationRepository = new NotificationRepository();
