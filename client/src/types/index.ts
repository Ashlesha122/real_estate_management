// ─── Enums (mirrored from shared) ────────────────────────
export enum UserRole { BUYER='BUYER', OWNER='OWNER', BROKER='BROKER' }
export enum PropertyType { APARTMENT='APARTMENT', VILLA='VILLA', INDEPENDENT_HOUSE='INDEPENDENT_HOUSE', PLOT='PLOT', COMMERCIAL='COMMERCIAL' }
export enum PropertyPurpose { SALE='SALE', RENT='RENT' }
export enum PropertyStatus { DRAFT='DRAFT', ACTIVE='ACTIVE', UNDER_OFFER='UNDER_OFFER', SOLD='SOLD', RENTED='RENTED', INACTIVE='INACTIVE' }
export enum HandlingMode { DIRECT='DIRECT', BROKER_ASSISTED='BROKER_ASSISTED' }
export enum FurnishingStatus { UNFURNISHED='UNFURNISHED', SEMI_FURNISHED='SEMI_FURNISHED', FULLY_FURNISHED='FULLY_FURNISHED' }
export enum MediaType { IMAGE='IMAGE', VIDEO='VIDEO', BROCHURE='BROCHURE' }
export enum ContactMode { CALL='CALL', WHATSAPP='WHATSAPP', EMAIL='EMAIL' }
export enum LeadStage { NEW='NEW', SITE_VISIT_SCHEDULED='SITE_VISIT_SCHEDULED', NEGOTIATION='NEGOTIATION', CLOSED='CLOSED', DROPPED='DROPPED' }
export enum VisitStatus { PROPOSED='PROPOSED', CONFIRMED='CONFIRMED', CANCELLED='CANCELLED', COMPLETED='COMPLETED' }
export enum VisitMode { IN_PERSON='IN_PERSON', VIRTUAL='VIRTUAL' }
export enum RecordType { LEASE='LEASE', SALE='SALE' }

export interface UserPublic {
  id: string; email: string; fullName: string; phone: string; role: UserRole;
  phoneVerified: boolean; contactPreference: ContactMode; avatarUrl: string|null; createdAt: string;
}

export interface PropertySummary {
  id: string; title: string; type: PropertyType; purpose: PropertyPurpose;
  asking_price: number; security_deposit: number|null; bedrooms: number|null;
  bathrooms: number|null; area_sqft: number|null; city: string|null; locality: string|null;
  status: PropertyStatus; handling_mode: HandlingMode;
  cover_image_url: string|null; latitude: number; longitude: number;
  created_at: string; published_at: string|null; distance?: number;
}

export interface PropertyDetail extends PropertySummary {
  description: string|null; carpet_area_sqft: number|null; floor_level: number|null;
  total_floors: number|null; furnishing: FurnishingStatus|null; parking: number|null;
  amenities: string[]; street_address: string|null; postal_code: string|null;
  owner_id: string; broker_id: string|null; owner_name: string; broker_name: string|null;
  media: PropertyMedia[]; updated_at: string; view_count: number; inquiry_count: number;
  isWishlisted?: boolean;
}

export interface PropertyMedia { id: string; url: string; media_type: MediaType; sort_order: number; is_cover: boolean; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }
export interface ApiError { code: string; message: string; details?: Record<string, string[]>; }

export const AMENITIES = ['Parking','Gym','Lift','Security','Power Backup','Swimming Pool','Garden','Clubhouse','Children Play Area','Fire Safety','Intercom','Rain Water Harvesting','Waste Disposal','Gas Pipeline','Wi-Fi'] as const;
