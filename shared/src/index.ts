// ─── Enums ────────────────────────────────────────────────────
export enum UserRole {
  BUYER = 'BUYER',
  OWNER = 'OWNER',
  BROKER = 'BROKER',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  INDEPENDENT_HOUSE = 'INDEPENDENT_HOUSE',
  PLOT = 'PLOT',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PropertyPurpose {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UNDER_OFFER = 'UNDER_OFFER',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  INACTIVE = 'INACTIVE',
}

export enum HandlingMode {
  DIRECT = 'DIRECT',
  BROKER_ASSISTED = 'BROKER_ASSISTED',
}

export enum FurnishingStatus {
  UNFURNISHED = 'UNFURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  FULLY_FURNISHED = 'FULLY_FURNISHED',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  BROCHURE = 'BROCHURE',
}

export enum ContactMode {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum LeadStage {
  NEW = 'NEW',
  SITE_VISIT_SCHEDULED = 'SITE_VISIT_SCHEDULED',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED = 'CLOSED',
  DROPPED = 'DROPPED',
}

export enum VisitStatus {
  PROPOSED = 'PROPOSED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum VisitMode {
  IN_PERSON = 'IN_PERSON',
  VIRTUAL = 'VIRTUAL',
}

export enum RecordType {
  LEASE = 'LEASE',
  SALE = 'SALE',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum NotificationType {
  NEW_INQUIRY = 'NEW_INQUIRY',
  VISIT_REQUESTED = 'VISIT_REQUESTED',
  VISIT_CONFIRMED = 'VISIT_CONFIRMED',
  VISIT_RESCHEDULED = 'VISIT_RESCHEDULED',
  VISIT_CANCELLED = 'VISIT_CANCELLED',
  LISTING_PUBLISHED = 'LISTING_PUBLISHED',
  NEW_MATCHING_LISTING = 'NEW_MATCHING_LISTING',
  OTP = 'OTP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

// ─── Amenities ────────────────────────────────────────────────
export const AMENITIES = [
  'Parking', 'Gym', 'Lift', 'Security', 'Power Backup',
  'Swimming Pool', 'Garden', 'Clubhouse', 'Children Play Area',
  'Fire Safety', 'Intercom', 'Rain Water Harvesting',
  'Waste Disposal', 'Gas Pipeline', 'Wi-Fi',
] as const;

export type Amenity = typeof AMENITIES[number];

// ─── Listing state machine allowed transitions ───────────────
export const ALLOWED_STATUS_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  [PropertyStatus.DRAFT]: [PropertyStatus.ACTIVE],
  [PropertyStatus.ACTIVE]: [PropertyStatus.UNDER_OFFER, PropertyStatus.INACTIVE],
  [PropertyStatus.UNDER_OFFER]: [PropertyStatus.ACTIVE, PropertyStatus.SOLD, PropertyStatus.RENTED],
  [PropertyStatus.SOLD]: [],
  [PropertyStatus.RENTED]: [],
  [PropertyStatus.INACTIVE]: [PropertyStatus.ACTIVE],
};

// ─── Interfaces ───────────────────────────────────────────────
export interface UserPublic {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  phoneVerified: boolean;
  contactPreference: ContactMode;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PropertySummary {
  id: string;
  title: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  askingPrice: number;
  securityDeposit: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  city: string;
  locality: string | null;
  status: PropertyStatus;
  handlingMode: HandlingMode;
  coverImageUrl: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  publishedAt: string | null;
  distance?: number;
}

export interface PropertyDetail extends PropertySummary {
  description: string | null;
  carpetAreaSqft: number | null;
  floorLevel: number | null;
  totalFloors: number | null;
  furnishing: FurnishingStatus | null;
  parking: number | null;
  amenities: string[];
  streetAddress: string | null;
  postalCode: string | null;
  ownerId: string;
  brokerId: string | null;
  ownerName: string;
  brokerName: string | null;
  media: PropertyMedia[];
  updatedAt: string;
  viewCount: number;
  inquiryCount: number;
}

export interface PropertyMedia {
  id: string;
  url: string;
  mediaType: MediaType;
  sortOrder: number;
  isCover: boolean;
}

export interface InquirySummary {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  handlerId: string;
  message: string;
  contactMode: ContactMode;
  stage: LeadStage;
  createdAt: string;
  updatedAt: string;
}

export interface SiteVisitSummary {
  id: string;
  inquiryId: string;
  propertyTitle: string;
  scheduledAt: string;
  mode: VisitMode;
  status: VisitStatus;
  buyerName: string;
  handlerName: string;
}

export interface LeaseRecordSummary {
  id: string;
  propertyId: string;
  propertyTitle: string;
  recordType: RecordType;
  counterpartyName: string;
  counterpartyPhone: string | null;
  amount: number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface SearchFilters {
  purpose?: PropertyPurpose;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: FurnishingStatus;
  amenities?: string[];
  zeroBrokerage?: boolean;
  city?: string;
  locality?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
  sort?: 'distance' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface BBoxSearch {
  north: number;
  south: number;
  east: number;
  west: number;
  filters?: Omit<SearchFilters, 'lat' | 'lng' | 'radius'>;
}

export interface AvailabilityRule {
  id: string;
  handlerId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface AvailabilityBlock {
  id: string;
  handlerId: string;
  blockedDate: string; // YYYY-MM-DD
  reason: string | null;
}

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  available: boolean;
}
