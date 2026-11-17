import { memoryDb, MemoryProperty, MemoryUser } from './memoryDb';
import { v4 as uuidv4 } from 'uuid';

export async function executeMemoryQuery(text: string, params: unknown[] = []): Promise<{ rows: any[]; rowCount: number }> {
  await memoryDb.init();

  const sql = text.trim();
  const normalized = sql.replace(/\s+/g, ' ');

  // 1. Health / ping checks
  if (normalized.startsWith('SELECT NOW()') || normalized.startsWith('SELECT 1')) {
    return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
  }

  // 2. USERS
  if (normalized.includes('FROM users')) {
    // SELECT * FROM users WHERE email = $1
    if (normalized.includes('WHERE email = $1')) {
      const email = params[0] as string;
      const user = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    // SELECT * FROM users WHERE id = $1
    if (normalized.includes('WHERE id = $1')) {
      const id = params[0] as string;
      const user = memoryDb.users.find(u => u.id === id);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    // SELECT COUNT(*) FROM users WHERE role = 'BROKER'
    if (normalized.includes('COUNT(*)') && normalized.includes("role = 'BROKER'")) {
      let list = memoryDb.users.filter(u => u.role === 'BROKER');
      if (params.length > 0 && typeof params[0] === 'string') {
        const s = (params[0] as string).replace(/%/g, '').toLowerCase();
        list = list.filter(u => u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
      }
      return { rows: [{ count: list.length.toString() }], rowCount: 1 };
    }
    // SELECT * FROM users WHERE role = 'BROKER'
    if (normalized.includes("role = 'BROKER'")) {
      let list = memoryDb.users.filter(u => u.role === 'BROKER');
      let pIdx = 0;
      if (normalized.includes('ILIKE')) {
        const s = (params[pIdx++] as string).replace(/%/g, '').toLowerCase();
        list = list.filter(u => u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
      }
      const limit = Number(params[pIdx++]) || 20;
      const offset = Number(params[pIdx++]) || 0;
      const page = list.slice(offset, offset + limit).map(({ password_hash, ...safe }) => safe);
      return { rows: page, rowCount: page.length };
    }
  }

  if (normalized.startsWith('INSERT INTO users')) {
    const newUser: MemoryUser = {
      id: uuidv4(),
      email: params[0] as string,
      phone: params[1] as string,
      password_hash: params[2] as string,
      full_name: params[3] as string,
      role: params[4] as string,
      phone_verified: true,
      contact_preference: 'CALL',
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryDb.users.push(newUser);
    memoryDb.saveToDisk();
    return { rows: [newUser], rowCount: 1 };
  }

  if (normalized.startsWith('UPDATE users SET')) {
    const id = params[params.length - 1] as string;
    const user = memoryDb.users.find(u => u.id === id);
    if (!user) return { rows: [], rowCount: 0 };

    if (normalized.includes('phone_verified = true')) {
      user.phone_verified = true;
      user.updated_at = new Date();
      memoryDb.saveToDisk();
      return { rows: [user], rowCount: 1 };
    }

    if (normalized.includes('password_hash = $1')) {
      user.password_hash = params[0] as string;
      user.updated_at = new Date();
      memoryDb.saveToDisk();
      return { rows: [user], rowCount: 1 };
    }

    if (normalized.includes('avatar_url = $1')) {
      user.avatar_url = params[0] as string;
      user.updated_at = new Date();
      memoryDb.saveToDisk();
      return { rows: [user], rowCount: 1 };
    }

    // Dynamic profile update
    const setMatch = normalized.match(/UPDATE users SET (.*) WHERE/i);
    if (setMatch) {
      const setClauses = setMatch[1].split(',').map(s => s.trim());
      setClauses.forEach((clause) => {
        const colMatch = clause.match(/^([a-z_]+)\s*=\s*\$(\d+)/i);
        if (colMatch) {
          const col = colMatch[1];
          const pIdx = parseInt(colMatch[2], 10) - 1;
          const val = params[pIdx];
          (user as any)[col] = val;
        }
      });
    }
    user.updated_at = new Date();
    memoryDb.saveToDisk();
    return { rows: [user], rowCount: 1 };
  }

  // 3. PROPERTIES & SEARCH
  if (normalized.includes('FROM properties')) {
    // Detail by ID: findById or findByIdWithDetails
    if (normalized.includes('WHERE id = $1') || normalized.includes('WHERE p.id = $1')) {
      const id = params[0] as string;
      const prop = memoryDb.properties.find(p => p.id === id);
      if (!prop) return { rows: [], rowCount: 0 };
      const owner = memoryDb.users.find(u => u.id === prop.owner_id);
      const broker = prop.broker_id ? memoryDb.users.find(u => u.id === prop.broker_id) : null;
      const cover = memoryDb.getCoverImageUrl(prop.id);
      const row = {
        ...prop,
        cover_image_url: cover,
        owner_name: owner?.full_name || 'Verified Owner',
        owner_phone: owner?.phone,
        owner_email: owner?.email,
        broker_name: broker?.full_name || null,
        broker_phone: broker?.phone || null,
        inquiry_count: memoryDb.inquiries.filter(i => i.property_id === prop.id).length,
      };
      return { rows: [row], rowCount: 1 };
    }

    // Search / List properties
    let list = [...memoryDb.properties];

    // Filter conditions
    if (normalized.includes("p.status = 'ACTIVE'") || normalized.includes("status = 'ACTIVE'")) {
      list = list.filter(p => p.status === 'ACTIVE');
    }
    if (normalized.includes('p.owner_id = $1') || normalized.includes('owner_id = $1')) {
      const ownerId = params[0] as string;
      list = list.filter(p => p.owner_id === ownerId);
    }
    if (normalized.includes('p.broker_id = $1') || normalized.includes('broker_id = $1')) {
      const brokerId = params[0] as string;
      list = list.filter(p => p.broker_id === brokerId && p.status !== 'DRAFT');
    }

    // Status filter in findByOwnerId
    const statusMatch = normalized.match(/p\.status\s*=\s*\$(\d+)/i);
    if (statusMatch) {
      const sIdx = parseInt(statusMatch[1], 10) - 1;
      const statVal = params[sIdx] as string;
      if (statVal && statVal !== 'ALL') {
        list = list.filter(p => p.status === statVal);
      }
    }

    // Dynamic filter matching for search
    for (let i = 0; i < params.length; i++) {
      const val = params[i];
      if (typeof val === 'string') {
        const upper = val.toUpperCase();
        if (['SALE', 'RENT'].includes(upper)) {
          list = list.filter(p => p.purpose === upper);
        } else if (['APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE', 'PLOT', 'COMMERCIAL', 'PG', 'FARMHOUSE'].includes(upper)) {
          list = list.filter(p => p.type === upper);
        } else if (['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'].includes(upper)) {
          list = list.filter(p => p.furnishing === upper);
        }
      } else if (Array.isArray(val) && val.length > 0) {
        // Amenities array filter
        list = list.filter(p => Array.isArray(p.amenities) && val.every((a: string) => p.amenities.includes(a)));
      }
    }

    // Specific city filter (p.city ILIKE $x)
    const cityMatch = normalized.match(/p\.city\s+ILIKE\s+\$(\d+)/i);
    if (cityMatch) {
      const cIdx = parseInt(cityMatch[1], 10) - 1;
      const cVal = (params[cIdx] as string)?.replace(/%/g, '').trim().toLowerCase();
      if (cVal) {
        list = list.filter(p => p.city && p.city.toLowerCase().includes(cVal));
      }
    }

    // Specific locality filter (p.locality ILIKE $x)
    const locMatch = normalized.match(/p\.locality\s+ILIKE\s+\$(\d+)/i);
    if (locMatch) {
      const lIdx = parseInt(locMatch[1], 10) - 1;
      const lVal = (params[lIdx] as string)?.replace(/%/g, '').trim().toLowerCase();
      if (lVal) {
        list = list.filter(p => p.locality && p.locality.toLowerCase().includes(lVal));
      }
    }

    if (normalized.includes("p.handling_mode = 'DIRECT'")) {
      list = list.filter(p => p.handling_mode === 'DIRECT');
    }

    // Numeric filters
    const minPriceMatch = normalized.match(/p\.asking_price\s*>=\s*\$(\d+)/i);
    if (minPriceMatch) {
      const minP = Number(params[parseInt(minPriceMatch[1], 10) - 1]);
      if (!isNaN(minP)) list = list.filter(p => p.asking_price >= minP);
    }
    const maxPriceMatch = normalized.match(/p\.asking_price\s*<=\s*\$(\d+)/i);
    if (maxPriceMatch) {
      const maxP = Number(params[parseInt(maxPriceMatch[1], 10) - 1]);
      if (!isNaN(maxP)) list = list.filter(p => p.asking_price <= maxP);
    }
    const bedMatch = normalized.match(/p\.bedrooms\s*>=\s*\$(\d+)/i);
    if (bedMatch) {
      const beds = Number(params[parseInt(bedMatch[1], 10) - 1]);
      if (!isNaN(beds)) list = list.filter(p => p.bedrooms !== null && p.bedrooms >= beds);
    }
    const bathMatch = normalized.match(/p\.bathrooms\s*>=\s*\$(\d+)/i);
    if (bathMatch) {
      const baths = Number(params[parseInt(bathMatch[1], 10) - 1]);
      if (!isNaN(baths)) list = list.filter(p => p.bathrooms !== null && p.bathrooms >= baths);
    }
    const minAreaMatch = normalized.match(/p\.area_sqft\s*>=\s*\$(\d+)/i);
    if (minAreaMatch) {
      const minA = Number(params[parseInt(minAreaMatch[1], 10) - 1]);
      if (!isNaN(minA)) list = list.filter(p => p.area_sqft !== null && p.area_sqft >= minA);
    }
    const maxAreaMatch = normalized.match(/p\.area_sqft\s*<=\s*\$(\d+)/i);
    if (maxAreaMatch) {
      const maxA = Number(params[parseInt(maxAreaMatch[1], 10) - 1]);
      if (!isNaN(maxA)) list = list.filter(p => p.area_sqft !== null && p.area_sqft <= maxA);
    }

    // Geographic Bounding Box filtering (ST_Within & ST_MakeEnvelope)
    if (normalized.toUpperCase().includes('ST_WITHIN') && normalized.toUpperCase().includes('ST_MAKEENVELOPE')) {
      const west = Number(params[0]);
      const south = Number(params[1]);
      const east = Number(params[2]);
      const north = Number(params[3]);
      const minLng = Math.min(west, east);
      const maxLng = Math.max(west, east);
      const minLat = Math.min(south, north);
      const maxLat = Math.max(south, north);
      list = list.filter(p =>
        p.longitude !== null &&
        p.latitude !== null &&
        p.longitude >= minLng &&
        p.longitude <= maxLng &&
        p.latitude >= minLat &&
        p.latitude <= maxLat
      );
    }

    // Geographic Radius filtering (ST_DWithin & ST_MakePoint)
    let centerLat: number | null = null;
    let centerLng: number | null = null;
    if (normalized.toUpperCase().includes('ST_DWITHIN') && normalized.toUpperCase().includes('ST_MAKEPOINT')) {
      centerLng = Number(params[0]);
      centerLat = Number(params[1]);
      const radiusMeters = Number(params[2]);

      const deg2rad = (deg: number) => deg * (Math.PI / 180);
      const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      list = list.filter(p => {
        if (p.latitude === null || p.longitude === null) return false;
        const d = getDist(centerLat!, centerLng!, p.latitude, p.longitude);
        return d <= radiusMeters;
      });
    }

    // Check if COUNT query
    if (normalized.includes('COUNT(*)')) {
      return { rows: [{ count: list.length.toString() }], rowCount: 1 };
    }

    // Sort
    if (normalized.includes('distance ASC') && centerLat !== null && centerLng !== null) {
      const deg2rad = (deg: number) => deg * (Math.PI / 180);
      const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };
      list.sort((a, b) => {
        const da = (a.latitude && a.longitude) ? getDist(centerLat!, centerLng!, a.latitude, a.longitude) : 999999999;
        const db = (b.latitude && b.longitude) ? getDist(centerLat!, centerLng!, b.latitude, b.longitude) : 999999999;
        return da - db;
      });
    } else if (normalized.includes('p.asking_price ASC')) {
      list.sort((a, b) => a.asking_price - b.asking_price);
    } else if (normalized.includes('p.asking_price DESC')) {
      list.sort((a, b) => b.asking_price - a.asking_price);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Limit and Offset
    const limit = Number(params[params.length - 2]) || 20;
    const offset = Number(params[params.length - 1]) || 0;
    const page = list.slice(offset, offset + limit).map(p => {
      let dist: number | null = null;
      if (centerLat !== null && centerLng !== null && p.latitude !== null && p.longitude !== null) {
        const deg2rad = (deg: number) => deg * (Math.PI / 180);
        const dLat = deg2rad(p.latitude - centerLat);
        const dLon = deg2rad(p.longitude - centerLng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(centerLat)) * Math.cos(deg2rad(p.latitude)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        dist = Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      }
      return {
        ...p,
        cover_image_url: memoryDb.getCoverImageUrl(p.id),
        distance: dist ?? 1200,
      };
    });

    return { rows: page, rowCount: page.length };
  }

  // INSERT property
  if (normalized.startsWith('INSERT INTO properties')) {
    const propId = uuidv4();
    const prop: MemoryProperty = {
      id: propId,
      owner_id: params[0] as string,
      broker_id: (params[1] as string) || null,
      handling_mode: params[2] as string,
      title: params[3] as string,
      description: (params[4] as string) || null,
      type: params[5] as string,
      purpose: params[6] as string,
      asking_price: Number(params[7]),
      security_deposit: params[8] != null ? Number(params[8]) : null,
      area_sqft: params[9] != null ? Number(params[9]) : null,
      carpet_area_sqft: params[10] != null ? Number(params[10]) : null,
      bedrooms: params[11] != null ? Number(params[11]) : null,
      bathrooms: params[12] != null ? Number(params[12]) : null,
      floor_level: params[13] != null ? Number(params[13]) : null,
      total_floors: params[14] != null ? Number(params[14]) : null,
      furnishing: (params[15] as string) || null,
      parking: params[16] != null ? Number(params[16]) : 0,
      amenities: (params[17] as string[]) || [],
      street_address: (params[18] as string) || null,
      city: (params[19] as string) || null,
      locality: (params[20] as string) || null,
      postal_code: (params[21] as string) || null,
      longitude: params[22] != null ? Number(params[22]) : 77.5946,
      latitude: params[23] != null ? Number(params[23]) : 12.9716,
      status: 'DRAFT',
      view_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
      published_at: null,
    };
    memoryDb.properties.push(prop);
    memoryDb.saveToDisk();
    return { rows: [prop], rowCount: 1 };
  }

  // UPDATE properties
  if (normalized.startsWith('UPDATE properties SET')) {
    if (normalized.includes('view_count = view_count + 1')) {
      const id = params[0] as string;
      const prop = memoryDb.properties.find(p => p.id === id);
      if (prop) prop.view_count += 1;
      return { rows: [], rowCount: 1 };
    }

    const id = params[params.length - 1] as string;
    const prop = memoryDb.properties.find(p => p.id === id);
    if (!prop) return { rows: [], rowCount: 0 };

    if (normalized.includes('status = $1')) {
      prop.status = params[0] as string;
      if (prop.status === 'ACTIVE' && !prop.published_at) prop.published_at = new Date();
      prop.updated_at = new Date();
      memoryDb.saveToDisk();
      return { rows: [prop], rowCount: 1 };
    }

    // Dynamic property update for any modified fields
    const setMatch = normalized.match(/UPDATE properties SET (.*) WHERE/i);
    if (setMatch) {
      const setClauses = setMatch[1].split(',').map(s => s.trim());
      setClauses.forEach((clause) => {
        const colMatch = clause.match(/^([a-z_]+)\s*=\s*\$(\d+)/i);
        if (colMatch) {
          const col = colMatch[1];
          const paramIdx = parseInt(colMatch[2], 10) - 1;
          const val = params[paramIdx];
          (prop as any)[col] = val;
        }
      });
    }

    const locMatch = normalized.match(/location = ST_SetSRID\(ST_MakePoint\(\$(\d+),\s*\$(\d+)\)/i);
    if (locMatch) {
      const lngIdx = parseInt(locMatch[1], 10) - 1;
      const latIdx = parseInt(locMatch[2], 10) - 1;
      prop.longitude = Number(params[lngIdx]);
      prop.latitude = Number(params[latIdx]);
    }

    prop.updated_at = new Date();
    memoryDb.saveToDisk();
    return { rows: [prop], rowCount: 1 };
  }

  // DELETE property
  if (normalized.startsWith('DELETE FROM properties WHERE id = $1')) {
    const id = params[0] as string;
    memoryDb.properties = memoryDb.properties.filter(p => p.id !== id);
    memoryDb.media = memoryDb.media.filter(m => m.property_id !== id);
    memoryDb.saveToDisk();
    return { rows: [{ id }], rowCount: 1 };
  }

  // 4. PROPERTY STATUS HISTORY
  if (normalized.startsWith('INSERT INTO property_status_history')) {
    const rec = {
      id: uuidv4(),
      property_id: params[0] as string,
      from_status: (params[1] as string) || null,
      to_status: params[2] as string,
      changed_by: params[3] as string,
      changed_at: new Date(),
    };
    memoryDb.statusHistory.push(rec);
    memoryDb.saveToDisk();
    return { rows: [rec], rowCount: 1 };
  }

  // 5. PROPERTY MEDIA
  if (normalized.startsWith('SELECT') && normalized.includes('FROM property_media') && !normalized.includes('FROM inquiries') && !normalized.includes('FROM wishlists') && !normalized.includes('FROM properties')) {
    if (normalized.includes('COUNT(*)')) {
      const propId = params[0] as string;
      const count = memoryDb.media.filter(m => m.property_id === propId).length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }
    const propId = params[0] as string;
    const items = memoryDb.media
      .filter(m => m.property_id === propId)
      .sort((a, b) => a.sort_order - b.sort_order);
    return { rows: items, rowCount: items.length };
  }

  if (normalized.startsWith('INSERT INTO property_media')) {
    const isCover = Boolean(params[4]);
    const propId = params[0] as string;
    if (isCover) {
      memoryDb.media.forEach(m => {
        if (m.property_id === propId) m.is_cover = false;
      });
    }
    const record = {
      id: uuidv4(),
      property_id: propId,
      url: params[1] as string,
      media_type: (params[2] as string) || 'IMAGE',
      sort_order: Number(params[3]) || 0,
      is_cover: isCover,
      created_at: new Date(),
    };
    memoryDb.media.push(record);
    memoryDb.saveToDisk();
    return { rows: [record], rowCount: 1 };
  }

  if (normalized.startsWith('UPDATE property_media SET is_cover = false')) {
    const propId = params[0] as string;
    memoryDb.media.forEach(m => {
      if (m.property_id === propId) m.is_cover = false;
    });
    memoryDb.saveToDisk();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('UPDATE property_media SET sort_order = $1')) {
    const sortOrder = Number(params[0]);
    const isCover = Boolean(params[1]);
    const id = params[2] as string;
    const propId = params[3] as string;
    const item = memoryDb.media.find(m => m.id === id && m.property_id === propId);
    if (item) {
      item.sort_order = sortOrder;
      item.is_cover = isCover;
    }
    memoryDb.saveToDisk();
    return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
  }

  if (normalized.startsWith('DELETE FROM property_media WHERE id = $1')) {
    const id = params[0] as string;
    const removed = memoryDb.media.find(m => m.id === id);
    memoryDb.media = memoryDb.media.filter(m => m.id !== id);
    if (removed && removed.is_cover) {
      const remaining = memoryDb.media.filter(m => m.property_id === removed.property_id);
      if (remaining.length > 0) remaining[0].is_cover = true;
    }
    memoryDb.saveToDisk();
    return { rows: removed ? [removed] : [], rowCount: removed ? 1 : 0 };
  }

  // 6. INQUIRIES
  if (normalized.includes('FROM inquiries') || normalized.includes('JOIN inquiries')) {
    if (normalized.includes('WHERE id = $1') || normalized.includes('WHERE i.id = $1')) {
      const inq = memoryDb.inquiries.find(i => i.id === params[0]);
      return { rows: inq ? [inq] : [], rowCount: inq ? 1 : 0 };
    }

    if (normalized.includes('COUNT(*)') && normalized.includes('read = false')) {
      const handlerId = params[0] as string;
      const count = memoryDb.inquiries.filter(i => i.handler_id === handlerId && !i.read).length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }

    let list = [...memoryDb.inquiries];
    if (normalized.includes('buyer_id = $1') || normalized.includes('i.buyer_id = $1')) {
      const buyerId = params[0] as string;
      list = list.filter(i => i.buyer_id === buyerId);
    } else if (normalized.includes('handler_id = $1') || normalized.includes('i.handler_id = $1')) {
      const handlerId = params[0] as string;
      list = list.filter(i => i.handler_id === handlerId);
    } else if (normalized.includes('owner_id = $1') || normalized.includes('p.owner_id = $1')) {
      const ownerId = params[0] as string;
      const ownerPropIds = memoryDb.properties.filter(p => p.owner_id === ownerId).map(p => p.id);
      list = list.filter(i => ownerPropIds.includes(i.property_id));
    }

    // Property ID filter on leads
    const propIdMatch = normalized.match(/i\.property_id\s*=\s*\$(\d+)/i);
    if (propIdMatch) {
      const pIdx = parseInt(propIdMatch[1], 10) - 1;
      const pVal = params[pIdx] as string;
      if (pVal) list = list.filter(i => i.property_id === pVal);
    }

    // Filter by stage if present
    for (const val of params) {
      if (typeof val === 'string' && ['NEW', 'SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'CLOSED', 'DROPPED'].includes(val)) {
        list = list.filter(i => i.stage === val);
      }
    }

    if (normalized.includes('COUNT(*)')) {
      return { rows: [{ count: list.length.toString() }], rowCount: 1 };
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let limit = 20;
    let offset = 0;
    if (params.length >= 2 && typeof params[params.length - 2] === 'number') {
      limit = params[params.length - 2] as number;
      offset = (params[params.length - 1] as number) || 0;
    } else if (params.length >= 1 && typeof params[params.length - 1] === 'number') {
      limit = params[params.length - 1] as number;
    }

    const page = list.slice(offset, offset + limit).map(i => {
      const prop = memoryDb.properties.find(p => p.id === i.property_id);
      const buyer = memoryDb.users.find(u => u.id === i.buyer_id);
      const handler = memoryDb.users.find(u => u.id === i.handler_id);
      return {
        ...i,
        property_title: prop?.title || 'Property',
        property_type: prop?.type,
        city: prop?.city,
        locality: prop?.locality,
        asking_price: prop?.asking_price,
        cover_image_url: prop ? memoryDb.getCoverImageUrl(prop.id) : null,
        buyer_name: buyer?.full_name || 'Buyer',
        buyer_phone: buyer?.phone || '',
        buyer_email: buyer?.email || '',
        handler_name: handler?.full_name || 'Host',
        notes_count: memoryDb.inquiryNotes.filter(n => n.inquiry_id === i.id).length,
        visits_count: memoryDb.visits.filter(v => v.inquiry_id === i.id).length,
      };
    });

    return { rows: page, rowCount: page.length };
  }

  if (normalized.startsWith('INSERT INTO inquiries')) {
    const inq = {
      id: uuidv4(),
      property_id: params[0] as string,
      buyer_id: params[1] as string,
      handler_id: params[2] as string,
      message: params[3] as string,
      contact_mode: params[4] as string,
      preferred_visit_time: params[5] ? new Date(params[5] as string) : null,
      stage: 'NEW',
      read: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryDb.inquiries.push(inq);
    memoryDb.saveToDisk();
    return { rows: [inq], rowCount: 1 };
  }

  if (normalized.startsWith('UPDATE inquiries SET stage = $1')) {
    const inq = memoryDb.inquiries.find(i => i.id === params[1]);
    if (inq) {
      inq.stage = params[0] as string;
      inq.updated_at = new Date();
    }
    memoryDb.saveToDisk();
    return { rows: inq ? [inq] : [], rowCount: inq ? 1 : 0 };
  }

  if (normalized.startsWith('UPDATE inquiries SET read = true WHERE id = $1')) {
    const inq = memoryDb.inquiries.find(i => i.id === params[0]);
    if (inq) {
      inq.read = true;
      inq.updated_at = new Date();
    }
    memoryDb.saveToDisk();
    return { rows: inq ? [inq] : [], rowCount: inq ? 1 : 0 };
  }

  // 7. INQUIRY NOTES & ACTIVITIES
  if (normalized.includes('FROM inquiry_notes')) {
    const inqId = params[0] as string;
    const notes = memoryDb.inquiryNotes.filter(n => n.inquiry_id === inqId).map(n => {
      const author = memoryDb.users.find(u => u.id === n.author_id);
      return { ...n, author_name: author?.full_name || 'Agent' };
    });
    return { rows: notes, rowCount: notes.length };
  }

  if (normalized.startsWith('INSERT INTO inquiry_notes')) {
    const record = {
      id: uuidv4(),
      inquiry_id: params[0] as string,
      author_id: params[1] as string,
      body: params[2] as string,
      created_at: new Date(),
    };
    memoryDb.inquiryNotes.push(record);
    memoryDb.saveToDisk();
    return { rows: [record], rowCount: 1 };
  }

  if (normalized.includes('FROM inquiry_activities')) {
    const inqId = params[0] as string;
    const acts = memoryDb.inquiryActivities.filter(a => a.inquiry_id === inqId).map(a => {
      const actor = memoryDb.users.find(u => u.id === a.actor_id);
      return { ...a, actor_name: actor?.full_name || 'System' };
    });
    return { rows: acts, rowCount: acts.length };
  }

  if (normalized.startsWith('INSERT INTO inquiry_activities')) {
    const record = {
      id: uuidv4(),
      inquiry_id: params[0] as string,
      actor_id: params[1] as string,
      event_type: params[2] as string,
      metadata: params[3] ? JSON.parse(params[3] as string) : null,
      created_at: new Date(),
    };
    memoryDb.inquiryActivities.push(record);
    memoryDb.saveToDisk();
    return { rows: [record], rowCount: 1 };
  }

  // 8. SITE VISITS
  if (normalized.includes('FROM site_visits')) {
    // Conflict check
    if (normalized.includes('WHERE handler_id = $1 AND scheduled_at = $2')) {
      const handlerId = params[0] as string;
      const scheduledAt = new Date(params[1] as string).getTime();
      const conflict = memoryDb.visits.filter(
        v => v.handler_id === handlerId &&
             new Date(v.scheduled_at).getTime() === scheduledAt &&
             ['PROPOSED', 'CONFIRMED'].includes(v.status)
      );
      return { rows: conflict.map(c => ({ id: c.id })), rowCount: conflict.length };
    }

    // Availability slots query: DATE(scheduled_at) = $2
    if (normalized.includes('DATE(scheduled_at) = $2') || normalized.includes('DATE(scheduled_at) = $1')) {
      const handlerId = params[0] as string;
      const targetDate = params[1] as string;
      const dateVisits = memoryDb.visits.filter(v => {
        const dStr = new Date(v.scheduled_at).toISOString().split('T')[0];
        return v.handler_id === handlerId && dStr === targetDate && ['PROPOSED', 'CONFIRMED'].includes(v.status);
      });
      return { rows: dateVisits, rowCount: dateVisits.length };
    }

    let list = [...memoryDb.visits];
    if (normalized.includes('buyer_id = $1') || normalized.includes('v.buyer_id = $1')) {
      const buyerId = params[0] as string;
      list = list.filter(v => v.buyer_id === buyerId);
    } else if (normalized.includes('handler_id = $1') || normalized.includes('v.handler_id = $1')) {
      const handlerId = params[0] as string;
      list = list.filter(v => v.handler_id === handlerId);
    }

    if (normalized.includes('COUNT(*)')) {
      return { rows: [{ count: list.length.toString() }], rowCount: 1 };
    }

    if (normalized.includes('WHERE id = $1') || normalized.includes('WHERE v.id = $1')) {
      const v = memoryDb.visits.find(item => item.id === params[0]);
      if (!v) return { rows: [], rowCount: 0 };
      const prop = memoryDb.properties.find(p => p.id === v.property_id);
      const buyer = memoryDb.users.find(u => u.id === v.buyer_id);
      const handler = memoryDb.users.find(u => u.id === v.handler_id);
      return {
        rows: [{
          ...v,
          property_title: prop?.title || 'Property',
          city: prop?.city,
          locality: prop?.locality,
          buyer_name: buyer?.full_name || 'Buyer',
          buyer_phone: buyer?.phone || '',
          handler_name: handler?.full_name || 'Host',
        }],
        rowCount: 1,
      };
    }

    list.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    let limit = 20;
    let offset = 0;
    if (params.length >= 2 && typeof params[params.length - 2] === 'number') {
      limit = params[params.length - 2] as number;
      offset = (params[params.length - 1] as number) || 0;
    }

    const page = list.slice(offset, offset + limit).map(v => {
      const prop = memoryDb.properties.find(p => p.id === v.property_id);
      const buyer = memoryDb.users.find(u => u.id === v.buyer_id);
      const handler = memoryDb.users.find(u => u.id === v.handler_id);
      return {
        ...v,
        property_title: prop?.title || 'Property',
        city: prop?.city,
        street_address: prop?.street_address,
        cover_image_url: prop ? memoryDb.getCoverImageUrl(prop.id) : null,
        buyer_name: buyer?.full_name || 'Buyer',
        buyer_phone: buyer?.phone || '',
        handler_name: handler?.full_name || 'Host',
        handler_phone: handler?.phone || '',
      };
    });
    return { rows: page, rowCount: page.length };
  }

  if (normalized.startsWith('INSERT INTO site_visits')) {
    const visit = {
      id: uuidv4(),
      inquiry_id: params[0] as string,
      property_id: params[1] as string,
      buyer_id: params[2] as string,
      handler_id: params[3] as string,
      scheduled_at: new Date(params[4] as string),
      duration_minutes: Number(params[5]) || 30,
      mode: params[6] as string,
      status: 'PROPOSED',
      notes: (params[7] as string) || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryDb.visits.push(visit);
    memoryDb.saveToDisk();
    return { rows: [visit], rowCount: 1 };
  }

  if (normalized.startsWith('UPDATE site_visits SET')) {
    const id = params[params.length - 1] as string;
    const v = memoryDb.visits.find(item => item.id === id);
    if (v) {
      if (normalized.includes('scheduled_at = $1') && normalized.includes('status = $2')) {
        v.scheduled_at = new Date(params[0] as string);
        v.status = params[1] as string;
      } else if (normalized.includes('status = $1')) {
        v.status = params[0] as string;
      }
      v.updated_at = new Date();
      memoryDb.saveToDisk();
    }
    return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
  }

  // 9. WISHLISTS
  if (normalized.startsWith('INSERT INTO wishlists')) {
    const userId = params[0] as string;
    const propId = params[1] as string;
    const exists = memoryDb.wishlists.some(w => w.user_id === userId && w.property_id === propId);
    if (!exists) {
      memoryDb.wishlists.push({ id: uuidv4(), user_id: userId, property_id: propId, created_at: new Date() });
      memoryDb.saveToDisk();
    }
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('DELETE FROM wishlists')) {
    const userId = params[0] as string;
    const propId = params[1] as string;
    const initial = memoryDb.wishlists.length;
    memoryDb.wishlists = memoryDb.wishlists.filter(w => !(w.user_id === userId && w.property_id === propId));
    memoryDb.saveToDisk();
    return { rows: initial > memoryDb.wishlists.length ? [{ id: 'deleted' }] : [], rowCount: 1 };
  }

  if (normalized.includes('FROM wishlists') || normalized.includes('JOIN wishlists')) {
    const userId = params[0] as string;

    // Compare properties query
    if (normalized.includes('WHERE p.id IN') || normalized.includes('JOIN wishlists w ON w.property_id = p.id AND w.user_id = $1')) {
      const compareIds = params.slice(1) as string[];
      const list = memoryDb.properties
        .filter(p => compareIds.includes(p.id))
        .map(p => {
          const owner = memoryDb.users.find(u => u.id === p.owner_id);
          return {
            ...p,
            owner_name: owner?.full_name || 'Verified Owner',
            cover_image_url: memoryDb.getCoverImageUrl(p.id),
          };
        });
      return { rows: list, rowCount: list.length };
    }

    if (normalized.includes('COUNT(*)')) {
      const count = memoryDb.wishlists.filter(w => w.user_id === userId).length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }
    if (normalized.includes('WHERE user_id = $1 AND property_id = $2') || normalized.includes('SELECT 1 FROM wishlists')) {
      const propId = params[1] as string;
      const found = memoryDb.wishlists.some(w => w.user_id === userId && w.property_id === propId);
      return { rows: found ? [{ '1': 1 }] : [], rowCount: found ? 1 : 0 };
    }
    // List wishlisted properties
    let limit = 20;
    let offset = 0;
    if (params.length >= 3 && typeof params[1] === 'number') {
      limit = params[1];
      offset = (params[2] as number) || 0;
    }
    const propIds = memoryDb.wishlists.filter(w => w.user_id === userId).map(w => w.property_id);
    const list = memoryDb.properties
      .filter(p => propIds.includes(p.id))
      .slice(offset, offset + limit)
      .map(p => ({ ...p, cover_image_url: memoryDb.getCoverImageUrl(p.id), isWishlisted: true }));
    return { rows: list, rowCount: list.length };
  }

  // 10. NOTIFICATIONS
  if (normalized.includes('FROM notifications')) {
    const userId = params[0] as string;
    if (normalized.includes('COUNT(*)') && normalized.includes('read = false')) {
      const count = memoryDb.notifications.filter(n => n.user_id === userId && !n.read).length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }
    if (normalized.includes('COUNT(*)')) {
      const count = memoryDb.notifications.filter(n => n.user_id === userId).length;
      return { rows: [{ count: count.toString() }], rowCount: 1 };
    }

    let limit = 20;
    let offset = 0;
    if (params.length >= 3 && typeof params[1] === 'number') {
      limit = params[1];
      offset = (params[2] as number) || 0;
    }

    const list = memoryDb.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);

    return { rows: list, rowCount: list.length };
  }

  if (normalized.startsWith('INSERT INTO notifications')) {
    const notif = {
      id: uuidv4(),
      user_id: params[0] as string,
      type: params[1] as string,
      title: params[2] as string,
      body: params[3] as string,
      data: params[4] ? JSON.parse(params[4] as string) : null,
      read: false,
      created_at: new Date(),
    };
    memoryDb.notifications.push(notif);
    memoryDb.saveToDisk();
    return { rows: [notif], rowCount: 1 };
  }

  if (normalized.startsWith('UPDATE notifications SET read = true')) {
    const userId = params[0] as string;
    if (normalized.includes('AND id IN')) {
      const ids = params.slice(1) as string[];
      memoryDb.notifications.forEach(n => {
        if (n.user_id === userId && ids.includes(n.id)) n.read = true;
      });
    } else {
      memoryDb.notifications.forEach(n => {
        if (n.user_id === userId) n.read = true;
      });
    }
    memoryDb.saveToDisk();
    return { rows: [], rowCount: 1 };
  }

  // 11. LEASE RECORDS
  if (normalized.includes('FROM lease_records')) {
    if (normalized.includes('COUNT(*)')) {
      return { rows: [{ count: memoryDb.leaseRecords.length.toString() }], rowCount: 1 };
    }
    const list = memoryDb.leaseRecords.map(lr => {
      const prop = memoryDb.properties.find(p => p.id === lr.property_id);
      return {
        ...lr,
        property_title: prop?.title || 'Property',
        property_city: prop?.city,
        property_type: prop?.type,
      };
    });
    return { rows: list, rowCount: list.length };
  }

  if (normalized.startsWith('INSERT INTO lease_records')) {
    const lr = {
      id: uuidv4(),
      property_id: params[0] as string,
      tenant_id: (params[1] as string) || null,
      counterparty_name: params[2] as string,
      counterparty_phone: (params[3] as string) || null,
      record_type: params[4] as string,
      start_date: params[5] as string,
      end_date: (params[6] as string) || null,
      amount: Number(params[7]),
      notes: (params[8] as string) || null,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryDb.leaseRecords.push(lr);
    memoryDb.saveToDisk();
    return { rows: [lr], rowCount: 1 };
  }

  if (normalized.startsWith('UPDATE lease_records SET')) {
    const id = params[params.length - 1] as string;
    const lr = memoryDb.leaseRecords.find(item => item.id === id);
    if (!lr) return { rows: [], rowCount: 0 };

    const setMatch = normalized.match(/UPDATE lease_records SET (.*) WHERE/i);
    if (setMatch) {
      const setClauses = setMatch[1].split(',').map(s => s.trim());
      setClauses.forEach((clause) => {
        const colMatch = clause.match(/^([a-z_]+)\s*=\s*\$(\d+)/i);
        if (colMatch) {
          const col = colMatch[1];
          const paramIdx = parseInt(colMatch[2], 10) - 1;
          const val = params[paramIdx];
          (lr as any)[col] = val;
        }
      });
    }
    lr.updated_at = new Date();
    memoryDb.saveToDisk();
    return { rows: [lr], rowCount: 1 };
  }

  // 12. OTP CODES
  if (normalized.startsWith('INSERT INTO otp_codes')) {
    const otp = {
      id: uuidv4(),
      user_id: params[0] as string,
      code_hash: params[1] as string,
      expires_at: new Date(params[2] as string),
      attempts: 0,
      consumed_at: null,
      created_at: new Date(),
    };
    memoryDb.otps.push(otp);
    memoryDb.saveToDisk();
    return { rows: [otp], rowCount: 1 };
  }

  if (normalized.includes('FROM otp_codes')) {
    const userId = params[0] as string;
    const list = memoryDb.otps.filter(o => o.user_id === userId);
    list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return { rows: list.slice(0, 1), rowCount: list.length > 0 ? 1 : 0 };
  }

  if (normalized.startsWith('UPDATE otp_codes')) {
    const id = params[0] as string;
    const otp = memoryDb.otps.find(o => o.id === id);
    if (otp) {
      if (normalized.includes('attempts = attempts + 1')) otp.attempts += 1;
      if (normalized.includes('consumed_at = NOW()')) otp.consumed_at = new Date();
      memoryDb.saveToDisk();
    }
    return { rows: [], rowCount: 1 };
  }

  // 13. SAVED SEARCHES
  if (normalized.startsWith('INSERT INTO saved_searches')) {
    const ss = {
      id: uuidv4(),
      user_id: params[0] as string,
      name: params[1] as string,
      filters: params[2] ? JSON.parse(params[2] as string) : {},
      center_lat: params[3] ? Number(params[3]) : null,
      center_lng: params[4] ? Number(params[4]) : null,
      radius_km: params[5] ? Number(params[5]) : null,
      notify: Boolean(params[6]),
      created_at: new Date(),
    };
    memoryDb.savedSearches.push(ss);
    memoryDb.saveToDisk();
    return { rows: [ss], rowCount: 1 };
  }

  if (normalized.includes('FROM saved_searches')) {
    const userId = params[0] as string;
    const list = memoryDb.savedSearches.filter(s => s.user_id === userId);
    return { rows: list, rowCount: list.length };
  }

  if (normalized.startsWith('DELETE FROM saved_searches')) {
    const id = params[0] as string;
    const userId = params[1] as string;
    const initial = memoryDb.savedSearches.length;
    memoryDb.savedSearches = memoryDb.savedSearches.filter(s => !(s.id === id && s.user_id === userId));
    memoryDb.saveToDisk();
    return { rows: initial > memoryDb.savedSearches.length ? [{ id }] : [], rowCount: 1 };
  }

  // 14. AVAILABILITY
  if (normalized.includes('FROM availability_rules')) {
    const handlerId = params[0] as string;
    const list = memoryDb.availabilityRules.filter(r => r.handler_id === handlerId);
    return { rows: list, rowCount: list.length };
  }

  if (normalized.startsWith('DELETE FROM availability_rules')) {
    const handlerId = params[0] as string;
    memoryDb.availabilityRules = memoryDb.availabilityRules.filter(r => r.handler_id !== handlerId);
    memoryDb.saveToDisk();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('INSERT INTO availability_rules')) {
    const r = {
      id: uuidv4(),
      handler_id: params[0] as string,
      day_of_week: Number(params[1]),
      start_time: params[2] as string,
      end_time: params[3] as string,
      created_at: new Date(),
    };
    memoryDb.availabilityRules.push(r);
    memoryDb.saveToDisk();
    return { rows: [r], rowCount: 1 };
  }

  if (normalized.includes('FROM availability_blocks')) {
    const handlerId = params[0] as string;
    const list = memoryDb.availabilityBlocks.filter(b => b.handler_id === handlerId);
    return { rows: list, rowCount: list.length };
  }

  if (normalized.startsWith('INSERT INTO availability_blocks')) {
    const b = {
      id: uuidv4(),
      handler_id: params[0] as string,
      blocked_date: params[1] as string,
      reason: (params[2] as string) || null,
      created_at: new Date(),
    };
    memoryDb.availabilityBlocks.push(b);
    memoryDb.saveToDisk();
    return { rows: [b], rowCount: 1 };
  }

  if (normalized.startsWith('DELETE FROM availability_blocks')) {
    const id = params[0] as string;
    const handlerId = params[1] as string;
    const initial = memoryDb.availabilityBlocks.length;
    memoryDb.availabilityBlocks = memoryDb.availabilityBlocks.filter(b => !(b.id === id && b.handler_id === handlerId));
    memoryDb.saveToDisk();
    return { rows: initial > memoryDb.availabilityBlocks.length ? [{ id }] : [], rowCount: initial > memoryDb.availabilityBlocks.length ? 1 : 0 };
  }

  // Default fallback for unhandled queries
  return { rows: [], rowCount: 0 };
}
