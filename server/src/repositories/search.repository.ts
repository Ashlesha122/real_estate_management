import { query } from '../config/database';

class SearchRepository {
  async radiusSearch(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    filters: Record<string, unknown>;
    limit: number;
    offset: number;
    sort: string;
  }): Promise<{ rows: unknown[]; total: number }> {
    const { lat, lng, radiusMeters, filters, limit, offset, sort } = params;
    const conditions: string[] = [`p.status = 'ACTIVE'`];
    const values: unknown[] = [lng, lat, radiusMeters];
    let idx = 4;

    conditions.push(`ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`);

    this.buildFilterConditions(filters, conditions, values, idx);
    idx = values.length + 1;

    const whereClause = conditions.join(' AND ');
    let orderBy = 'distance ASC';
    if (sort === 'price_asc') orderBy = 'p.asking_price ASC';
    else if (sort === 'price_desc') orderBy = 'p.asking_price DESC';
    else if (sort === 'newest') orderBy = 'p.published_at DESC NULLS LAST';

    const countSql = `
      SELECT COUNT(*) FROM properties p WHERE ${whereClause}
    `;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const searchSql = `
      SELECT p.*,
             ST_Y(p.location::geometry) as latitude,
             ST_X(p.location::geometry) as longitude,
             ST_Distance(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance,
             (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_image_url
      FROM properties p
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx}
    `;
    values.push(limit, offset);

    const result = await query(searchSql, values);
    return { rows: result.rows, total };
  }

  async bboxSearch(params: {
    north: number;
    south: number;
    east: number;
    west: number;
    filters: Record<string, unknown>;
    limit: number;
    offset: number;
  }): Promise<{ rows: unknown[]; total: number }> {
    const { north, south, east, west, filters, limit, offset } = params;
    const conditions: string[] = [`p.status = 'ACTIVE'`];
    const values: unknown[] = [west, south, east, north];
    let idx = 5;

    conditions.push(`ST_Within(p.location::geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))`);

    this.buildFilterConditions(filters, conditions, values, idx);
    idx = values.length + 1;

    const whereClause = conditions.join(' AND ');

    const countResult = await query(`SELECT COUNT(*) FROM properties p WHERE ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const result = await query(
      `SELECT p.*,
              ST_Y(p.location::geometry) as latitude,
              ST_X(p.location::geometry) as longitude,
              (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_image_url
       FROM properties p
       WHERE ${whereClause}
       ORDER BY p.published_at DESC NULLS LAST
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { rows: result.rows, total };
  }

  private buildFilterConditions(
    filters: Record<string, unknown>,
    conditions: string[],
    values: unknown[],
    startIdx: number
  ): void {
    let idx = startIdx;

    if (filters.purpose) {
      conditions.push(`p.purpose = $${idx++}`);
      values.push(filters.purpose);
    }
    if (filters.type) {
      conditions.push(`p.type = $${idx++}`);
      values.push(filters.type);
    }
    if (filters.minPrice !== undefined) {
      conditions.push(`p.asking_price >= $${idx++}`);
      values.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`p.asking_price <= $${idx++}`);
      values.push(filters.maxPrice);
    }
    if (filters.bedrooms !== undefined) {
      conditions.push(`p.bedrooms >= $${idx++}`);
      values.push(filters.bedrooms);
    }
    if (filters.bathrooms !== undefined) {
      conditions.push(`p.bathrooms >= $${idx++}`);
      values.push(filters.bathrooms);
    }
    if (filters.minArea !== undefined) {
      conditions.push(`p.area_sqft >= $${idx++}`);
      values.push(filters.minArea);
    }
    if (filters.maxArea !== undefined) {
      conditions.push(`p.area_sqft <= $${idx++}`);
      values.push(filters.maxArea);
    }
    if (filters.furnishing) {
      conditions.push(`p.furnishing = $${idx++}`);
      values.push(filters.furnishing);
    }
    if (filters.zeroBrokerage) {
      conditions.push(`p.handling_mode = 'DIRECT'`);
    }
    if (filters.city) {
      conditions.push(`p.city ILIKE $${idx++}`);
      values.push(`%${filters.city}%`);
    }
    if (filters.locality) {
      conditions.push(`p.locality ILIKE $${idx++}`);
      values.push(`%${filters.locality}%`);
    }
    if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
      conditions.push(`p.amenities @> $${idx++}`);
      values.push(filters.amenities);
    }
  }
}

export const searchRepository = new SearchRepository();
