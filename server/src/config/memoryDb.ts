import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, PropertyStatus, HandlingMode, LeadStage, VisitStatus, VisitMode } from '@estateflow/shared';

// ---------------------------------------------------------------------------
// Realistic images pool for high quality demo UI
// ---------------------------------------------------------------------------
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
];

export interface MemoryUser {
  id: string;
  email: string;
  phone: string;
  password_hash: string;
  full_name: string;
  role: string;
  phone_verified: boolean;
  contact_preference: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MemoryProperty {
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
  latitude: number;
  longitude: number;
  status: string;
  view_count: number;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface MemoryMedia {
  id: string;
  property_id: string;
  url: string;
  media_type: string;
  sort_order: number;
  is_cover: boolean;
  created_at: Date;
}

export interface MemoryInquiry {
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

export interface MemoryVisit {
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

export interface MemoryNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data: any;
  created_at: Date;
}

export interface MemoryWishlist {
  id: string;
  user_id: string;
  property_id: string;
  created_at: Date;
}

export interface MemoryLeaseRecord {
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

export interface MemoryOtp {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  consumed_at: Date | null;
  created_at: Date;
}

export interface MemorySavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: any;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  notify: boolean;
  created_at: Date;
}

export interface MemoryStatusHistory {
  id: string;
  property_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  changed_at: Date;
}

export class MemoryDatabase {
  users: MemoryUser[] = [];
  properties: MemoryProperty[] = [];
  media: MemoryMedia[] = [];
  inquiries: MemoryInquiry[] = [];
  inquiryNotes: Array<{ id: string; inquiry_id: string; author_id: string; body: string; created_at: Date }> = [];
  inquiryActivities: Array<{ id: string; inquiry_id: string; actor_id: string; event_type: string; metadata: any; created_at: Date }> = [];
  visits: MemoryVisit[] = [];
  notifications: MemoryNotification[] = [];
  wishlists: MemoryWishlist[] = [];
  leaseRecords: MemoryLeaseRecord[] = [];
  savedSearches: MemorySavedSearch[] = [];
  otps: MemoryOtp[] = [];
  statusHistory: MemoryStatusHistory[] = [];
  availabilityRules: Array<{ id: string; handler_id: string; day_of_week: number; start_time: string; end_time: string; created_at: Date }> = [];
  availabilityBlocks: Array<{ id: string; handler_id: string; blocked_date: string; reason: string | null; created_at: Date }> = [];

  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Seed Demo Users
    const buyerId = 'e0a9d07f-7a5e-4ff6-99cf-d6a503554471';
    const ownerId = 'e0a9d07f-7a5e-4ff6-99cf-d6a503554472';
    const brokerId = 'e0a9d07f-7a5e-4ff6-99cf-d6a503554473';

    this.users.push(
      {
        id: buyerId,
        email: 'buyer@estateflow.com',
        phone: '+919876543210',
        password_hash: passwordHash,
        full_name: 'Rahul Sharma',
        role: UserRole.BUYER,
        phone_verified: true,
        contact_preference: 'CALL',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: ownerId,
        email: 'owner@estateflow.com',
        phone: '+919876543211',
        password_hash: passwordHash,
        full_name: 'Priya Patel',
        role: UserRole.OWNER,
        phone_verified: true,
        contact_preference: 'WHATSAPP',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: brokerId,
        email: 'broker@estateflow.com',
        phone: '+919876543212',
        password_hash: passwordHash,
        full_name: 'Amit Kumar',
        role: UserRole.BROKER,
        phone_verified: true,
        contact_preference: 'CALL',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
        created_at: new Date(),
        updated_at: new Date(),
      }
    );

    // 2. Seed 40 Properties across Indian Metro Cities
    const CITIES = [
      { name: 'Mumbai', lat: 19.076, lng: 72.8777, localities: ['Bandra West', 'Andheri East', 'Juhu', 'Powai', 'Worli'] },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946, localities: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout'] },
      { name: 'Delhi', lat: 28.6139, lng: 77.209, localities: ['Dwarka', 'Vasant Kunj', 'Saket', 'Hauz Khas'] },
      { name: 'Hyderabad', lat: 17.385, lng: 78.4867, localities: ['Gachibowli', 'HITEC City', 'Jubilee Hills', 'Banjara Hills'] },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, localities: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery'] },
    ];

    const TYPES = ['APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE', 'PLOT', 'COMMERCIAL'];
    const AMENITIES_LIST = ['Parking', 'Gym', 'Lift', 'Security', 'Power Backup', 'Swimming Pool', 'Clubhouse', 'Children Play Area', 'Wi-Fi'];

    for (let i = 0; i < 40; i++) {
      const city = CITIES[i % CITIES.length];
      const locality = city.localities[i % city.localities.length];
      const type = TYPES[i % TYPES.length];
      const purpose = i % 2 === 0 ? 'RENT' : 'SALE';
      const isZeroBrokerage = i < 28; // first 28 are direct owner
      const status = i < 25 ? 'ACTIVE' : i < 30 ? 'DRAFT' : i < 33 ? 'UNDER_OFFER' : i < 35 ? 'SOLD' : i < 37 ? 'RENTED' : 'INACTIVE';
      const askingPrice = purpose === 'RENT' ? 25000 + (i * 3500) : 4500000 + (i * 500000);
      const bedrooms = type === 'PLOT' || type === 'COMMERCIAL' ? null : (i % 3) + 1;
      const bathrooms = bedrooms ? Math.min(bedrooms, 3) : null;
      const area = 650 + (i * 90);
      const propId = uuidv4();

      const property: MemoryProperty = {
        id: propId,
        owner_id: ownerId,
        broker_id: isZeroBrokerage ? null : brokerId,
        handling_mode: isZeroBrokerage ? HandlingMode.DIRECT : HandlingMode.BROKER_ASSISTED,
        title: `${bedrooms ? `${bedrooms} BHK ` : ''}${type.replace('_', ' ')} in ${locality}, ${city.name}`,
        description: `Spacious and beautifully maintained ${type.toLowerCase().replace('_', ' ')} located in prime ${locality}, ${city.name}. Features modern architecture, prime road connectivity, 24/7 water and security.`,
        type,
        purpose,
        asking_price: askingPrice,
        security_deposit: purpose === 'RENT' ? askingPrice * 2 : null,
        area_sqft: area,
        carpet_area_sqft: Math.round(area * 0.8),
        bedrooms,
        bathrooms,
        floor_level: type === 'PLOT' ? 0 : (i % 12) + 1,
        total_floors: type === 'PLOT' ? 1 : 14,
        furnishing: i % 3 === 0 ? 'FULLY_FURNISHED' : i % 3 === 1 ? 'SEMI_FURNISHED' : 'UNFURNISHED',
        parking: (i % 2) + 1,
        amenities: AMENITIES_LIST.slice(0, 3 + (i % 5)),
        street_address: `${10 + i * 2}, ${locality} Main Avenue`,
        city: city.name,
        locality,
        postal_code: `4000${10 + (i % 40)}`,
        latitude: city.lat + ((i % 5) - 2) * 0.012,
        longitude: city.lng + ((i % 5) - 2) * 0.012,
        status,
        view_count: 14 + i * 8,
        created_at: new Date(Date.now() - (40 - i) * 86400000),
        updated_at: new Date(),
        published_at: status === 'ACTIVE' ? new Date(Date.now() - (40 - i) * 86400000) : null,
      };

      this.properties.push(property);

      // Add 2-3 media images per property
      const img1 = PROPERTY_IMAGES[i % PROPERTY_IMAGES.length];
      const img2 = PROPERTY_IMAGES[(i + 3) % PROPERTY_IMAGES.length];
      const img3 = PROPERTY_IMAGES[(i + 6) % PROPERTY_IMAGES.length];

      this.media.push(
        { id: uuidv4(), property_id: propId, url: img1, media_type: 'IMAGE', sort_order: 0, is_cover: true, created_at: new Date() },
        { id: uuidv4(), property_id: propId, url: img2, media_type: 'IMAGE', sort_order: 1, is_cover: false, created_at: new Date() },
        { id: uuidv4(), property_id: propId, url: img3, media_type: 'IMAGE', sort_order: 2, is_cover: false, created_at: new Date() }
      );
    }

    // 3. Seed Sample Inquiries
    for (let i = 0; i < 5; i++) {
      const prop = this.properties[i];
      const inqId = uuidv4();
      this.inquiries.push({
        id: inqId,
        property_id: prop.id,
        buyer_id: buyerId,
        handler_id: prop.broker_id || prop.owner_id,
        message: `Hello, I am interested in viewing this property this weekend. Please let me know if it is available.`,
        contact_mode: 'WHATSAPP',
        preferred_visit_time: new Date(Date.now() + (i + 1) * 86400000),
        stage: i === 0 ? 'NEW' : i === 1 ? 'SITE_VISIT_SCHEDULED' : i === 2 ? 'NEGOTIATION' : 'NEW',
        read: i > 1,
        created_at: new Date(Date.now() - (5 - i) * 86400000),
        updated_at: new Date(),
      });

      this.inquiryActivities.push({
        id: uuidv4(),
        inquiry_id: inqId,
        actor_id: buyerId,
        event_type: 'INQUIRY_CREATED',
        metadata: { source: 'listing_page' },
        created_at: new Date(Date.now() - (5 - i) * 86400000),
      });

      this.inquiryNotes.push({
        id: uuidv4(),
        inquiry_id: inqId,
        author_id: prop.broker_id || prop.owner_id,
        body: `Buyer contacted regarding visit schedule. Seems like a serious buyer.`,
        created_at: new Date(),
      });
    }

    // 4. Seed Sample Site Visits
    for (let i = 0; i < 3; i++) {
      const inq = this.inquiries[i];
      this.visits.push({
        id: uuidv4(),
        inquiry_id: inq.id,
        property_id: inq.property_id,
        buyer_id: buyerId,
        handler_id: inq.handler_id,
        scheduled_at: new Date(Date.now() + (i + 2) * 86400000),
        duration_minutes: 30,
        mode: i === 0 ? 'IN_PERSON' : 'VIRTUAL',
        status: i === 0 ? 'CONFIRMED' : 'PROPOSED',
        notes: 'Walkthrough scheduled for weekend inspection.',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 5. Seed Sample Lease Record
    const rentedProp = this.properties.find(p => p.status === 'RENTED') || this.properties[35];
    this.leaseRecords.push({
      id: uuidv4(),
      property_id: rentedProp.id,
      tenant_id: buyerId,
      counterparty_name: 'Rahul Sharma',
      counterparty_phone: '+919876543210',
      record_type: 'LEASE',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      amount: rentedProp.asking_price,
      notes: 'Executed 11-month registered lease agreement.',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 6. Seed Sample Notifications
    this.notifications.push(
      {
        id: uuidv4(),
        user_id: ownerId,
        type: 'INQUIRY_RECEIVED',
        title: 'New Property Inquiry',
        body: 'Rahul Sharma sent an inquiry about your property in Bandra West.',
        read: false,
        data: { propertyId: this.properties[0].id },
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: buyerId,
        type: 'VISIT_CONFIRMED',
        title: 'Site Visit Confirmed',
        body: 'Your site visit for Bandra West has been confirmed for tomorrow.',
        read: false,
        data: { visitId: 'visit-1' },
        created_at: new Date(),
      }
    );
  }

  // Helper to get cover image for a property
  getCoverImageUrl(propertyId: string): string | null {
    const cover = this.media.find(m => m.property_id === propertyId && m.is_cover);
    if (cover) return cover.url;
    const first = this.media.find(m => m.property_id === propertyId);
    return first ? first.url : null;
  }
}

export const memoryDb = new MemoryDatabase();
