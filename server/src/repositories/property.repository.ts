import { query, getClient } from '../config/database';

export interface PropertyRow {
  id: string;
  owner_id: string;
  broker_id: string | null;
  handling_mode: string;
  title: string;
  description: string | null;
  type: string;
  purpose: string;
  asking_price: number;
  security_deposit: number | null;
  area_sqft: number | null;
  carpet_area_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_level: number | null;
  total_floors: number | null;
  furnishing: string | null;
  parking: number | null;
  amenities: string[];
  street_address: string | null;
  city: string | null;
  locality: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  view_count: number;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface MediaRow {
  id: string;
  property_id: string;
  url: string;
  media_type: string;
  sort_order: number;
  is_cover: boolean;
  created_at: Date;
}

class PropertyRepository {
  async create(data: {
    ownerId: string;
    brokerId?: string | null;
    handlingMode: string;
    title: string;
    description?: string | null;
    type: string;
    purpose: string;
    askingPrice: number;
    securityDeposit?: number | null;
    areaSqft?: number | null;
    carpetAreaSqft?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    floorLevel?: number | null;
    totalFloors?: number | null;
    furnishing?: string | null;
    parking?: number | null;
    amenities?: string[];
    streetAddress?: string | null;
    city?: string | null;
    locality?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<PropertyRow> {
    const locationSql = data.latitude != null && data.longitude != null
      ? `ST_SetSRID(ST_MakePoint($23, $24), 4326)::geography`
      : 'NULL';

    const params: unknown[] = [
      data.ownerId, data.brokerId || null, data.handlingMode,
      data.title, data.description || null, data.type, data.purpose,
      data.askingPrice, data.securityDeposit || null,
      data.areaSqft || null, data.carpetAreaSqft || null,
      data.bedrooms || null, data.bathrooms || null,
      data.floorLevel || null, data.totalFloors || null,
      data.furnishing || null, data.parking || 0,
      data.amenities || [], data.streetAddress || null,
      data.city || null, data.locality || null, data.postalCode || null,
    ];

    if (data.latitude != null && data.longitude != null) {
      params.push(data.longitude, data.latitude);
    }

    const result = await query(
      `INSERT INTO properties (
        owner_id, broker_id, handling_mode,
        title, description, type, purpose,
        asking_price, security_deposit,
        area_sqft, carpet_area_sqft,
        bedrooms, bathrooms,
        floor_level, total_floors,
        furnishing, parking,
        amenities, street_address,
        city, locality, postal_code,
        location
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        ${locationSql}
      ) RETURNING *, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude`,
      params
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<PropertyRow | null> {
    const result = await query(
      `SELECT p.*, ST_Y(p.location::geometry) as latitude, ST_X(p.location::geometry) as longitude
       FROM properties p WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdWithDetails(id: string): Promise<(PropertyRow & { owner_name: string; broker_name: string | null; inquiry_count: number }) | null> {
    const result = await query(
      `SELECT p.*,
              ST_Y(p.location::geometry) as latitude,
              ST_X(p.location::geometry) as longitude,
              u.full_name as owner_name,
              b.full_name as broker_name,
              (SELECT COUNT(*) FROM inquiries i WHERE i.property_id = p.id)::int as inquiry_count
       FROM properties p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN users b ON b.id = p.broker_id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async update(id: string, data: Record<string, unknown>): Promise<PropertyRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      title: 'title', description: 'description', type: 'type', purpose: 'purpose',
      askingPrice: 'asking_price', securityDeposit: 'security_deposit',
      areaSqft: 'area_sqft', carpetAreaSqft: 'carpet_area_sqft',
      bedrooms: 'bedrooms', bathrooms: 'bathrooms',
      floorLevel: 'floor_level', totalFloors: 'total_floors',
      furnishing: 'furnishing', parking: 'parking', amenities: 'amenities',
      streetAddress: 'street_address', city: 'city', locality: 'locality',
      postalCode: 'postal_code', handlingMode: 'handling_mode', brokerId: 'broker_id',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    // Handle location separately
    if (data.latitude !== undefined && data.longitude !== undefined) {
      sets.push(`location = ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)::geography`);
      values.push(data.longitude, data.latitude);
      idx += 2;
    }

    if (sets.length === 0) return this.findById(id);

    sets.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE properties SET ${sets.join(', ')} WHERE id = $${idx}
       RETURNING *, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude`,
      values
    );
    return result.rows[0] || null;
  }

  async updateStatus(id: string, status: string, publishedAt?: boolean): Promise<void> {
    const extra = publishedAt ? ', published_at = NOW()' : '';
    await query(
      `UPDATE properties SET status = $1, updated_at = NOW()${extra} WHERE id = $2`,
      [status, id]
    );
  }

  async addStatusHistory(data: { propertyId: string; fromStatus: string | null; toStatus: string; changedBy: string }): Promise<void> {
    await query(
      `INSERT INTO property_status_history (property_id, from_status, to_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [data.propertyId, data.fromStatus, data.toStatus, data.changedBy]
    );
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM properties WHERE id = $1', [id]);
  }

  async findByOwnerId(ownerId: string, page = 1, limit = 20, status?: string): Promise<{ rows: PropertyRow[]; total: number }> {
    const offset = (page - 1) * limit;
    let where = 'WHERE p.owner_id = $1';
    const params: unknown[] = [ownerId];
    let idx = 2;

    if (status) {
      where += ` AND p.status = $${idx++}`;
      params.push(status);
    }

    const countResult = await query(`SELECT COUNT(*) FROM properties p ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await query(
      `SELECT p.*, ST_Y(p.location::geometry) as latitude, ST_X(p.location::geometry) as longitude,
              (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_image_url
       FROM properties p ${where}
       ORDER BY p.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    return { rows: result.rows, total };
  }

  async findByBrokerId(brokerId: string, page = 1, limit = 20): Promise<{ rows: PropertyRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await query(
      `SELECT COUNT(*) FROM properties WHERE broker_id = $1 AND status != 'DRAFT'`,
      [brokerId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT p.*, ST_Y(p.location::geometry) as latitude, ST_X(p.location::geometry) as longitude,
              (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_image_url
       FROM properties p
       WHERE p.broker_id = $1 AND p.status != 'DRAFT'
       ORDER BY p.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [brokerId, limit, offset]
    );

    return { rows: result.rows, total };
  }

  async incrementViewCount(id: string): Promise<void> {
    await query('UPDATE properties SET view_count = view_count + 1 WHERE id = $1', [id]);
  }

  // Media operations
  async addMedia(data: { propertyId: string; url: string; mediaType: string; sortOrder: number; isCover: boolean }): Promise<MediaRow> {
    // If this is a cover image, unset existing covers
    if (data.isCover) {
      await query(
        'UPDATE property_media SET is_cover = false WHERE property_id = $1',
        [data.propertyId]
      );
    }

    const result = await query(
      `INSERT INTO property_media (property_id, url, media_type, sort_order, is_cover)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.propertyId, data.url, data.mediaType, data.sortOrder, data.isCover]
    );
    return result.rows[0];
  }

  async deleteMedia(id: string): Promise<MediaRow | null> {
    const result = await query(
      'DELETE FROM property_media WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  async findMediaByPropertyId(propertyId: string): Promise<MediaRow[]> {
    const result = await query(
      'SELECT * FROM property_media WHERE property_id = $1 ORDER BY sort_order ASC',
      [propertyId]
    );
    return result.rows;
  }

  async reorderMedia(propertyId: string, mediaIds: string[]): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < mediaIds.length; i++) {
        await client.query(
          'UPDATE property_media SET sort_order = $1, is_cover = $2 WHERE id = $3 AND property_id = $4',
          [i, i === 0, mediaIds[i], propertyId]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMediaCount(propertyId: string): Promise<number> {
    const result = await query(
      "SELECT COUNT(*) FROM property_media WHERE property_id = $1 AND media_type = 'IMAGE'",
      [propertyId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const propertyRepository = new PropertyRepository();
