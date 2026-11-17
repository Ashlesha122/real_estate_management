import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { UserRole, PropertyStatus, HandlingMode, LeadStage, VisitStatus, VisitMode } from '@estateflow/shared';

// ---------------------------------------------------------------------------
// Realistic high-resolution architectural images pool for startup UI
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
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80',
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

// ---------------------------------------------------------------------------
// 40 Curated Real-World Developments for Indian Tech Hubs
// ---------------------------------------------------------------------------
interface CuratedSeedItem {
  title: string;
  city: string;
  locality: string;
  postal_code: string;
  street_address: string;
  lat: number;
  lng: number;
  type: string;
  purpose: 'RENT' | 'SALE';
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  carpet_area_sqft: number;
  asking_price: number;
  furnishing: string;
  floor_level: number;
  total_floors: number;
  parking: number;
  amenities: string[];
  description: string;
}

const CURATED_PROPERTIES: CuratedSeedItem[] = [
  {
    title: 'Lodha Bellissimo Sky Residence, Mahalaxmi',
    city: 'Mumbai',
    locality: 'Mahalaxmi',
    postal_code: '400011',
    street_address: 'NM Joshi Marg, Mahalaxmi',
    lat: 18.9832,
    lng: 72.8228,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 2850,
    carpet_area_sqft: 2380,
    asking_price: 87500000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 34,
    total_floors: 48,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Breathtaking 4 BHK luxury sky residence at Lodha Bellissimo overlooking the Mahalaxmi Racecourse and Arabian Sea. Features Italian marble, VRV central air-conditioning, Poggenpohl kitchen, private elevator lobby, and concierge service. RERA ID: P51900001339.',
  },
  {
    title: 'Prestige Kingfisher Towers Penthouse, Ashok Nagar',
    city: 'Bangalore',
    locality: 'Ashok Nagar',
    postal_code: '560001',
    street_address: 'Kasturba Road, UB City Corridor',
    lat: 12.9719,
    lng: 77.5975,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 8320,
    carpet_area_sqft: 6900,
    asking_price: 145000000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 31,
    total_floors: 33,
    parking: 4,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: "Bangalore's most prestigious luxury address overlooking Cubbon Park and UB City. Sprawling ultra-luxury penthouse with private heated infinity plunge pool, biometric access, floor-to-ceiling glass facade, and five-star club privileges. RERA ID: PRM/KA/RERA/1251/310/PR/170915/000214.",
  },
  {
    title: 'DLF The Camellias Golf Suite, Golf Course Road',
    city: 'Delhi',
    locality: 'Golf Course Road',
    postal_code: '122002',
    street_address: 'Sector 42, Golf Course Road, Gurgaon',
    lat: 28.4682,
    lng: 77.0984,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 7400,
    carpet_area_sqft: 6150,
    asking_price: 125000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 22,
    total_floors: 35,
    parking: 3,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Unrivalled luxury on Golf Course Road directly overlooking the Gary Player designed golf greens. Private elevator, double-height grand living hall, wrap-around sunset deck, and access to the 1.5 lakh sq.ft Camellias Club. RERA ID: RC/REP/HARERA/GGM/2018/14.',
  },
  {
    title: 'Rustomjee Elements Sea-Facing Residence, Juhu',
    city: 'Mumbai',
    locality: 'Juhu',
    postal_code: '400049',
    street_address: 'Upper Juhu, Juhu Circle',
    lat: 19.1028,
    lng: 72.8270,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 3100,
    carpet_area_sqft: 2550,
    asking_price: 240000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 9,
    total_floors: 14,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Opulent 4 BHK designer residence off Juhu Circle. Expansive sea-facing sundecks, Italian modular kitchen, designer bathrooms with jacuzzi, and a celebrity community. RERA ID: P51800000729.',
  },
  {
    title: 'Total Environment Windmills of Your Mind, Whitefield',
    city: 'Bangalore',
    locality: 'Whitefield',
    postal_code: '560066',
    street_address: 'EPIP Zone, Whitefield',
    lat: 12.9784,
    lng: 77.7289,
    type: 'VILLA',
    purpose: 'RENT',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 3750,
    carpet_area_sqft: 3100,
    asking_price: 185000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 2,
    total_floors: 2,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Parking', 'Children Play Area'],
    description: 'Iconic earth-sheltered handcrafted duplex villa featuring natural stone walls, wire-cut brickwork, landscaped terrace garden with water body, and integrated smart home automation. RERA ID: PRM/KA/RERA/1251/446/PR/171014/000450.',
  },
  {
    title: 'My Home Bhooja Sky Mansions, HITEC City',
    city: 'Hyderabad',
    locality: 'HITEC City',
    postal_code: '500081',
    street_address: 'Silpa Gram Craft Village Road, HITEC City',
    lat: 17.4399,
    lng: 78.3752,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 3430,
    carpet_area_sqft: 2820,
    asking_price: 47500000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 28,
    total_floors: 36,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: "Sky mansion at My Home Bhooja situated beside the Biodiversity Park. High-ceilinged 3 BHK with panoramic skyline views of Hyderabad's cyber corridor, German bath fittings, and 3-tier security. RERA ID: P02400000028.",
  },
  {
    title: 'Oberoi Sky City Tower A, Borivali East',
    city: 'Mumbai',
    locality: 'Borivali East',
    postal_code: '400066',
    street_address: 'Western Express Highway, Borivali East',
    lat: 19.2288,
    lng: 72.8647,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1420,
    carpet_area_sqft: 1080,
    asking_price: 34000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 24,
    total_floors: 60,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Ultra-modern high-rise residence at Oberoi Sky City with direct private access to the metro station. Features imported marble, expansive clubhouse, Olympic swimming pool, and pristine National Park views. RERA ID: P51800003582.',
  },
  {
    title: 'Sobha HRC Pristine Eco-Luxury, Jakkur',
    city: 'Bangalore',
    locality: 'Jakkur',
    postal_code: '560064',
    street_address: 'Amruthahalli Main Road, Jakkur',
    lat: 13.0782,
    lng: 77.6074,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1940,
    carpet_area_sqft: 1560,
    asking_price: 28500000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 14,
    total_floors: 19,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Eco-luxury forest facing 3 BHK apartment near Manyata Tech Park. Unmatched Sobha German engineering quality, rainwater harvesting, organic orchard gardens, and clubhouse. RERA ID: PRM/KA/RERA/1251/309/PR/171130/002311.',
  },
  {
    title: 'Appaswamy Clover By The River, Kotturpuram',
    city: 'Chennai',
    locality: 'Kotturpuram',
    postal_code: '600085',
    street_address: 'River View Road, Kotturpuram',
    lat: 13.0163,
    lng: 80.2435,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 3250,
    carpet_area_sqft: 2650,
    asking_price: 58000000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 11,
    total_floors: 18,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Waterfront luxury living along the tranquil Adyar River. 4 BHK with teak wood fixtures, Italian marble flooring, double-glazed soundproof windows, and private riverside walking deck. RERA ID: TN/29/Building/0122/2018.',
  },
  {
    title: 'Tata Primanti Executive Villa, Sector 72',
    city: 'Delhi',
    locality: 'Sector 72',
    postal_code: '122004',
    street_address: 'Southern Peripheral Road, Sector 72, Gurgaon',
    lat: 28.4095,
    lng: 77.0378,
    type: 'VILLA',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 4200,
    carpet_area_sqft: 3500,
    asking_price: 52000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 3,
    total_floors: 3,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Parking', 'Children Play Area'],
    description: 'European-styled 4 BHK triplex executive villa at Tata Primanti with private hydraulic glass elevator, rooftop terrace garden, basement entertainment lounge, and 24/7 security surveillance. RERA ID: 219 of 2017.',
  },
  {
    title: 'Hiranandani Regent Hill, Powai',
    city: 'Mumbai',
    locality: 'Powai',
    postal_code: '400076',
    street_address: 'Central Avenue, Hiranandani Gardens, Powai',
    lat: 19.1176,
    lng: 72.9060,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 580,
    carpet_area_sqft: 410,
    asking_price: 68000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 16,
    total_floors: 23,
    parking: 1,
    amenities: ['Gym', 'Security', 'Power Backup', 'Lift', 'Clubhouse', 'Wi-Fi'],
    description: 'Elegantly finished 1 BHK neoclassical apartment in Hiranandani Gardens Powai. Fully furnished with high-end appliances, modular kitchen, neoclassical architecture, and proximity to Powai Lake. RERA ID: P51800018620.',
  },
  {
    title: 'Jayabheri The Peak Ultra-Luxury, Financial District',
    city: 'Hyderabad',
    locality: 'Financial District',
    postal_code: '500032',
    street_address: 'Nanakramguda, Financial District',
    lat: 17.4143,
    lng: 78.3498,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2800,
    carpet_area_sqft: 2280,
    asking_price: 120000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 18,
    total_floors: 32,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Premium 3 BHK home in the heart of Hyderabad Financial District. Walking distance to Amazon and Google campuses. Features central air-conditioning, international clubhouse, and tennis courts. RERA ID: P02400000812.',
  },
  {
    title: 'Brigade Gateway Sky Villas, Rajajinagar',
    city: 'Bangalore',
    locality: 'Rajajinagar',
    postal_code: '560055',
    street_address: 'Dr. Rajkumar Road, Malleshwaram-Rajajinagar',
    lat: 13.0112,
    lng: 77.5550,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2100,
    carpet_area_sqft: 1710,
    asking_price: 110000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 19,
    total_floors: 32,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Located inside the integrated Brigade Gateway township adjoining Orion Mall, WTC, and Columbia Asia Hospital. Lake views, 5-star amenities, metro connectivity, and 24-hr security. RERA ID: PRM/KA/RERA/1251/309/PR/170916/000120.',
  },
  {
    title: 'Godrej South Estate Landmark Tower, Okhla',
    city: 'Delhi',
    locality: 'Okhla',
    postal_code: '110025',
    street_address: 'Plot No. 1, Okhla Industrial Area Phase 1',
    lat: 28.5355,
    lng: 77.2732,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2150,
    carpet_area_sqft: 1720,
    asking_price: 41000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 15,
    total_floors: 29,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: "Godrej Properties flagship South Delhi development with copper stone cladding and MFIE air-purification technology delivering clean air indoors. High-spec luxury finish. RERA ID: DLRERA2019P0003.",
  },
  {
    title: 'TVS Emerald Peninsula Waterfront, Manapakkam',
    city: 'Chennai',
    locality: 'Manapakkam',
    postal_code: '600125',
    street_address: 'Mount Poonamallee High Road, Manapakkam',
    lat: 13.0210,
    lng: 80.1788,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1520,
    carpet_area_sqft: 1210,
    asking_price: 17500000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 8,
    total_floors: 14,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Thoughtfully crafted courtyard-style 3 BHK residence with 100% Vaastu compliance. 72% open greenery, waterfront promenade, EV charging ports, and clubhouse. RERA ID: TN/29/Building/0199/2020.',
  },
  {
    title: 'Kalpataru Avana Ultra-Luxury, Parel',
    city: 'Mumbai',
    locality: 'Worli',
    postal_code: '400012',
    street_address: 'Dr. Babasaheb Ambedkar Road, Parel',
    lat: 18.9986,
    lng: 72.8361,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 3450,
    carpet_area_sqft: 2800,
    asking_price: 112000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 42,
    total_floors: 50,
    parking: 3,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Towering above South Mumbai, this 4 BHK sky mansion offers east-to-west sea breeze ventilation, 12.8 ft floor-to-ceiling heights, temperature-controlled infinity pool, and helipad access. RERA ID: P51900000624.',
  },
  {
    title: 'Salarpuria Sattva Luxuria, Malleshwaram',
    city: 'Bangalore',
    locality: 'Indiranagar',
    postal_code: '560003',
    street_address: '8th Main Road, Malleshwaram',
    lat: 13.0033,
    lng: 77.5685,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2215,
    carpet_area_sqft: 1810,
    asking_price: 39500000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 12,
    total_floors: 24,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Prime residential masterpiece in heritage Malleshwaram. Finished with Botticino Italian marble, advanced home automation, private elevator access, and wellness center. RERA ID: PRM/KA/RERA/1251/309/PR/171026/000843.',
  },
  {
    title: 'Aparna One Smart Living Suites, Shaikpet',
    city: 'Hyderabad',
    locality: 'Jubilee Hills',
    postal_code: '500008',
    street_address: 'Old Mumbai Highway, Shaikpet, Jubilee Hills',
    lat: 17.4125,
    lng: 78.3980,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 2875,
    carpet_area_sqft: 2360,
    asking_price: 36000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 21,
    total_floors: 36,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Ultra-luxury smart homes equipped with voice-activated climate control, biometric digital door locks, central gas piping, and panoramic views of Golconda Fort. RERA ID: P02500001150.',
  },
  {
    title: 'Mahagun Mezzaria Sky Condos, Sector 78',
    city: 'Delhi',
    locality: 'Sector 78',
    postal_code: '201301',
    street_address: 'Sector 78, Central Noida',
    lat: 28.5672,
    lng: 77.3850,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2500,
    carpet_area_sqft: 2050,
    asking_price: 65000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 17,
    total_floors: 34,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Art Deco inspired 3 BHK sky apartment with double-height sundecks, VRV air conditioning, IGBC certified gold green building rating, and metro access. RERA ID: UPRERAPRJ3306.',
  },
  {
    title: 'Casagrand First City Club Residence, Sholinganallur',
    city: 'Chennai',
    locality: 'Anna Nagar',
    postal_code: '600119',
    street_address: 'OMR Junction, Sholinganallur',
    lat: 12.9010,
    lng: 80.2279,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1650,
    carpet_area_sqft: 1320,
    asking_price: 42000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 6,
    total_floors: 16,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Grand township living on OMR IT Corridor. Over 100+ world-class amenities including a 1.5-acre grand club, squash court, rooftop swimming pool, and preschool. RERA ID: TN/01/Building/0114/2020.',
  },
  {
    title: 'Godrej Origins The Trees, Vikhroli East',
    city: 'Mumbai',
    locality: 'Powai',
    postal_code: '400079',
    street_address: 'Eastern Express Highway, Vikhroli East',
    lat: 19.0988,
    lng: 72.9298,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1050,
    carpet_area_sqft: 810,
    asking_price: 95000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 11,
    total_floors: 18,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Urban oasis at The Trees mixed-use township. Designed by Perkins Eastman, featuring retail high street, Taj Hotel within campus, and lush mangrove landscape. RERA ID: P51800000165.',
  },
  {
    title: 'Assetz Marq 3.0 Garden Suite, Whitefield',
    city: 'Bangalore',
    locality: 'Whitefield',
    postal_code: '560067',
    street_address: 'Kannamangala, Whitefield Hoskote Road',
    lat: 12.9922,
    lng: 77.7490,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1245,
    carpet_area_sqft: 980,
    asking_price: 55000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 8,
    total_floors: 28,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Modern 2 BHK apartment surrounded by 4 acres of central park. Natural airflow design, high ceiling heights, jogging tracks, and Olympic size pool. RERA ID: PRM/KA/RERA/1251/446/PR/171201/001150.',
  },
  {
    title: 'Ambience Caitriona Super-Luxury, Ambience Island',
    city: 'Delhi',
    locality: 'Dwarka',
    postal_code: '122002',
    street_address: 'NH-8, Ambience Island, Gurgaon',
    lat: 28.5042,
    lng: 77.0970,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 4100,
    carpet_area_sqft: 3400,
    asking_price: 220000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 10,
    total_floors: 18,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Seven-star living integrated inside Ambience Island adjacent to the 9-hole golf course. Private elevator, Italian kitchen with Miele appliances, and round-the-clock butler service. RERA ID: 08 of 2017.',
  },
  {
    title: 'Rainbow Vistas Rock Garden, Moosapet, HITEC City',
    city: 'Hyderabad',
    locality: 'HITEC City',
    postal_code: '500018',
    street_address: 'Near IDL Lake, Kukatpally-HITEC Road',
    lat: 17.4712,
    lng: 78.4110,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1280,
    carpet_area_sqft: 1010,
    asking_price: 45000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 14,
    total_floors: 22,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Scenic lake-facing 2 BHK flat next to IDL Lake. Includes lakeside cycling track, 1 lakh sq.ft clubhouse, retail supermarket, and doctor clinic. RERA ID: P02200000420.',
  },
  {
    title: 'Akshaya Today Smart Home, OMR',
    city: 'Chennai',
    locality: 'Velachery',
    postal_code: '603103',
    street_address: 'Old Mahabalipuram Road, Thaiyur',
    lat: 12.8250,
    lng: 80.1985,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1020,
    carpet_area_sqft: 800,
    asking_price: 32000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 7,
    total_floors: 14,
    parking: 1,
    amenities: ['Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Smart living on the bustling OMR corridor. Low-density residential complex with zero-water wastage, solar powered common areas, and high-speed fiber connectivity. RERA ID: TN/01/Building/0045/2017.',
  },
  {
    title: 'Piramal Mahalaxmi Central Tower, Lower Parel',
    city: 'Mumbai',
    locality: 'Mahalaxmi',
    postal_code: '400013',
    street_address: 'Sanapati Bapat Marg, Lower Parel',
    lat: 18.9892,
    lng: 72.8290,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 980,
    carpet_area_sqft: 760,
    asking_price: 48500000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 38,
    total_floors: 63,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Skyline living overlooking the Mahalaxmi Racecourse and Mumbai Harbour. Frameless glass windows, imported marble, infinity pool on 60th floor, and signature spa. RERA ID: P51900015854.',
  },
  {
    title: 'Puravankara Atmosphere, Thanisandra Main Road',
    city: 'Bangalore',
    locality: 'Koramangala',
    postal_code: '560077',
    street_address: 'Thanisandra Main Road, Near Manyata',
    lat: 13.0610,
    lng: 77.6320,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1380,
    carpet_area_sqft: 1080,
    asking_price: 19500000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 15,
    total_floors: 34,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Signature 2 BHK on the North Bengaluru airport growth corridor. Features a 34th-floor sky club, cantilevered viewing decks, and Japanese landscaped zen gardens. RERA ID: PRM/KA/RERA/1251/309/PR/180602/001859.',
  },
  {
    title: 'ATS Knightsbridge Signature Tower, Sector 124',
    city: 'Delhi',
    locality: 'Vasant Kunj',
    postal_code: '201301',
    street_address: 'Sector 124, Noida-Greater Noida Expressway',
    lat: 28.5440,
    lng: 77.3400,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 6000,
    carpet_area_sqft: 4950,
    asking_price: 89000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 29,
    total_floors: 47,
    parking: 3,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Monumental luxury towers on the Noida-Greater Noida Expressway. Single apartment per floor, 360-degree panoramic skyline views, temperature-controlled pool, and 3-car basement parking. RERA ID: UPRERAPRJ2954.',
  },
  {
    title: 'Phoenix Golf Edge Luxury Residences, Gachibowli',
    city: 'Hyderabad',
    locality: 'Gachibowli',
    postal_code: '500032',
    street_address: 'Financial District Road, Gachibowli',
    lat: 17.4260,
    lng: 78.3480,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2150,
    carpet_area_sqft: 1720,
    asking_price: 29500000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 19,
    total_floors: 30,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Designer furnished 3 BHK home overlooking the golf green. Features 2 infinity pools, sky lounge on the 30th floor, private cinema theater, and squash court. RERA ID: P02400000340.',
  },
  {
    title: 'Ceebros Boulevard Elite, Rajiv Gandhi Salai, OMR',
    city: 'Chennai',
    locality: 'Adyar',
    postal_code: '600096',
    street_address: 'Kandanchavadi, OMR Express Highway',
    lat: 12.9540,
    lng: 80.2450,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2050,
    carpet_area_sqft: 1650,
    asking_price: 24000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 12,
    total_floors: 18,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Contemporary sea-breeze oriented 3 BHK home on OMR. High ceiling layouts, acoustic double-pane glass, multi-tier security, and Olympic lap pool. RERA ID: TN/01/Building/0088/2019.',
  },
  {
    title: 'Wadhwa 25 South Prabhadevi, Worli',
    city: 'Mumbai',
    locality: 'Worli',
    postal_code: '400025',
    street_address: 'Sayani Road, Prabhadevi Beachfront',
    lat: 19.0160,
    lng: 72.8240,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2250,
    carpet_area_sqft: 1820,
    asking_price: 320000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 26,
    total_floors: 45,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Direct Arabian Sea front luxury home at Prabhadevi. Bespoke designer furniture, master bath with sunset ocean views, private sundeck, and concierge desk. RERA ID: P51900000320.',
  },
  {
    title: 'Embassy Pristine Lakeview Penthouse, Bellandur',
    city: 'Bangalore',
    locality: 'HSR Layout',
    postal_code: '560103',
    street_address: 'Iblur Village, Bellandur Lake Road',
    lat: 12.9280,
    lng: 77.6740,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 3600,
    carpet_area_sqft: 2950,
    asking_price: 145000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 14,
    total_floors: 15,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Stunning lake-facing 4 BHK duplex penthouse near Outer Ring Road tech parks. Private terrace deck, Italian modular kitchen, hardwood floors, and serene water view. RERA ID: PRM/KA/RERA/1251/310/PR/170920/000305.',
  },
  {
    title: 'DLF Magnolias Signature Condominium',
    city: 'Delhi',
    locality: 'Saket',
    postal_code: '122002',
    street_address: 'Sector 42, DLF Golf Course, Gurgaon',
    lat: 28.4610,
    lng: 77.0940,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 6500,
    carpet_area_sqft: 5350,
    asking_price: 350000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 16,
    total_floors: 24,
    parking: 3,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Prestigious golf condominium overlooking the DLF Golf and Country Club. Ultra-luxury interior detailing, automated mood lighting, wine cellar, and private spa. RERA ID: 02 of 2017.',
  },
  {
    title: 'Prestige High Fields, Financial District, Nanakramguda',
    city: 'Hyderabad',
    locality: 'Gachibowli',
    postal_code: '500032',
    street_address: 'ISB Road, Financial District, Nanakramguda',
    lat: 17.4190,
    lng: 78.3420,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1742,
    carpet_area_sqft: 1390,
    asking_price: 58000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 22,
    total_floors: 33,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Centrally positioned in Hyderabad Financial District. Full modern furnishing, air conditioned, clubhouse with badminton courts, pharmacy, and café. RERA ID: P02400000085.',
  },
  {
    title: 'Olympia Opaline Park Luxury Towers, Navalur',
    city: 'Chennai',
    locality: 'T. Nagar',
    postal_code: '603103',
    street_address: 'Rajiv Gandhi Salai, Navalur',
    lat: 12.8460,
    lng: 80.2260,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1180,
    carpet_area_sqft: 920,
    asking_price: 36000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 9,
    total_floors: 19,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Lake-view modern 2 BHK apartment in a self-sufficient integrated gated community. Walking distance to Marina Mall and AGS Cinemas. RERA ID: TN/01/Building/0034/2018.',
  },
  {
    title: 'Experion The Heartsong, Sector 108',
    city: 'Delhi',
    locality: 'Hauz Khas',
    postal_code: '122017',
    street_address: 'Dwarka Expressway, Sector 108, Gurgaon',
    lat: 28.5170,
    lng: 77.0120,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1750,
    carpet_area_sqft: 1400,
    asking_price: 48000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 11,
    total_floors: 15,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Spacious 3 BHK apartment along Dwarka Expressway. Surrounded by 20,000 sq.ft of recreation spaces, air-conditioned lobby, and rapid access to Delhi IGI Airport. RERA ID: 32 of 2018.',
  },
  {
    title: 'Rajapushpa Atria Super-Luxury, Gachibowli',
    city: 'Hyderabad',
    locality: 'Banjara Hills',
    postal_code: '500032',
    street_address: 'Golden Mile Road, Kokapet-Gachibowli',
    lat: 17.4320,
    lng: 78.3510,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2600,
    carpet_area_sqft: 2100,
    asking_price: 32000000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 14,
    total_floors: 25,
    parking: 2,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Signature 3 BHK apartment featuring large format Italian tiles, concealed wiring, landscaped courtyard, infinity pool, and EV charging bays. RERA ID: P02400000220.',
  },
  {
    title: 'Radiance Empire Prestige, Perambur',
    city: 'Chennai',
    locality: 'Anna Nagar',
    postal_code: '600011',
    street_address: 'Stephenson Road, Perambur',
    lat: 13.1110,
    lng: 80.2390,
    type: 'APARTMENT',
    purpose: 'SALE',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1150,
    carpet_area_sqft: 890,
    asking_price: 14500000,
    furnishing: 'SEMI_FURNISHED',
    floor_level: 7,
    total_floors: 12,
    parking: 1,
    amenities: ['Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Children Play Area'],
    description: 'Centrally connected 2 BHK home with quick metro connectivity to Central Chennai. Rooftop amphitheater, fitness zone, and children activity area. RERA ID: TN/29/Building/0076/2020.',
  },
  {
    title: 'Lanco Hills High-Rise Condos, Manikonda',
    city: 'Hyderabad',
    locality: 'HITEC City',
    postal_code: '500089',
    street_address: 'Lanco Hills Mega Township, Manikonda',
    lat: 17.4100,
    lng: 78.3790,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1980,
    carpet_area_sqft: 1580,
    asking_price: 52000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 16,
    total_floors: 28,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking', 'Wi-Fi'],
    description: 'Panoramic hilltop views in a 100-acre integrated mega township. High-speed elevators, Olympic size pool, supermarket, and pharmacy within premises. RERA ID: P02400000632.',
  },
  {
    title: 'VGN Fairmont Signature Tower, Guindy',
    city: 'Chennai',
    locality: 'Adyar',
    postal_code: '600032',
    street_address: 'Jawaharlal Nehru Road, Guindy',
    lat: 13.0070,
    lng: 80.2030,
    type: 'APARTMENT',
    purpose: 'RENT',
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1800,
    carpet_area_sqft: 1420,
    asking_price: 60000,
    furnishing: 'FULLY_FURNISHED',
    floor_level: 8,
    total_floors: 14,
    parking: 1,
    amenities: ['Swimming Pool', 'Clubhouse', 'Gym', 'Security', 'Power Backup', 'Lift', 'Parking'],
    description: 'Luxury 3 BHK residence adjacent to Guindy National Park and Kathipara junction. Excellent connectivity to Chennai Airport, Olympia Tech Park, and metro station. RERA ID: TN/29/Building/0154/2019.',
  },
];

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

  private getStoreFilePath(): string {
    const candidates = [
      path.resolve(process.cwd(), 'data/estateflow_db.json'),
      path.resolve(process.cwd(), 'server/data/estateflow_db.json'),
      path.resolve(__dirname, '../../../data/estateflow_db.json'),
      path.resolve(__dirname, '../../data/estateflow_db.json'),
    ];
    for (const c of candidates) {
      const dir = path.dirname(c);
      if (fs.existsSync(dir)) return c;
    }
    const defaultDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(defaultDir)) {
      try { fs.mkdirSync(defaultDir, { recursive: true }); } catch {}
    }
    return path.join(defaultDir, 'estateflow_db.json');
  }

  saveToDisk(): void {
    try {
      const filePath = this.getStoreFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const payload = {
        users: this.users,
        properties: this.properties,
        media: this.media,
        inquiries: this.inquiries,
        inquiryNotes: this.inquiryNotes,
        inquiryActivities: this.inquiryActivities,
        visits: this.visits,
        notifications: this.notifications,
        wishlists: this.wishlists,
        leaseRecords: this.leaseRecords,
        savedSearches: this.savedSearches,
        otps: this.otps,
        statusHistory: this.statusHistory,
        availabilityRules: this.availabilityRules,
        availabilityBlocks: this.availabilityBlocks,
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {
      // safe fallback
    }
  }

  loadFromDisk(): boolean {
    try {
      const filePath = this.getStoreFilePath();
      if (!fs.existsSync(filePath)) return false;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.properties) || data.properties.length === 0) return false;

      this.users = (data.users || []).map((u: any) => ({
        ...u,
        created_at: new Date(u.created_at),
        updated_at: new Date(u.updated_at),
      }));
      this.properties = (data.properties || []).map((p: any) => ({
        ...p,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at),
        published_at: p.published_at ? new Date(p.published_at) : null,
      }));
      this.media = (data.media || []).map((m: any) => ({
        ...m,
        created_at: new Date(m.created_at),
      }));
      this.inquiries = (data.inquiries || []).map((i: any) => ({
        ...i,
        preferred_visit_time: i.preferred_visit_time ? new Date(i.preferred_visit_time) : null,
        created_at: new Date(i.created_at),
        updated_at: new Date(i.updated_at),
      }));
      this.inquiryNotes = (data.inquiryNotes || []).map((n: any) => ({
        ...n,
        created_at: new Date(n.created_at),
      }));
      this.inquiryActivities = (data.inquiryActivities || []).map((a: any) => ({
        ...a,
        created_at: new Date(a.created_at),
      }));
      this.visits = (data.visits || []).map((v: any) => ({
        ...v,
        scheduled_at: new Date(v.scheduled_at),
        created_at: new Date(v.created_at),
        updated_at: new Date(v.updated_at),
      }));
      this.notifications = (data.notifications || []).map((n: any) => ({
        ...n,
        created_at: new Date(n.created_at),
      }));
      this.wishlists = (data.wishlists || []).map((w: any) => ({
        ...w,
        created_at: new Date(w.created_at),
      }));
      this.leaseRecords = (data.leaseRecords || []).map((l: any) => ({
        ...l,
        created_at: new Date(l.created_at),
        updated_at: new Date(l.updated_at),
      }));
      this.savedSearches = (data.savedSearches || []).map((s: any) => ({
        ...s,
        created_at: new Date(s.created_at),
      }));
      this.otps = (data.otps || []).map((o: any) => ({
        ...o,
        expires_at: new Date(o.expires_at),
        consumed_at: o.consumed_at ? new Date(o.consumed_at) : null,
        created_at: new Date(o.created_at),
      }));
      this.statusHistory = (data.statusHistory || []).map((sh: any) => ({
        ...sh,
        changed_at: new Date(sh.changed_at),
      }));
      this.availabilityRules = (data.availabilityRules || []).map((r: any) => ({
        ...r,
        created_at: new Date(r.created_at),
      }));
      this.availabilityBlocks = (data.availabilityBlocks || []).map((b: any) => ({
        ...b,
        created_at: new Date(b.created_at),
      }));

      return true;
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (this.loadFromDisk()) {
      return;
    }

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
    for (let i = 0; i < CURATED_PROPERTIES.length; i++) {
      const item = CURATED_PROPERTIES[i];
      const isZeroBrokerage = i < 28; // First 28 are direct owner listings
      const status = i < 25 ? 'ACTIVE' : i < 30 ? 'DRAFT' : i < 33 ? 'UNDER_OFFER' : i < 35 ? 'SOLD' : i < 37 ? 'RENTED' : 'INACTIVE';
      const propId = uuidv4();

      const property: MemoryProperty = {
        id: propId,
        owner_id: ownerId,
        broker_id: isZeroBrokerage ? null : brokerId,
        handling_mode: isZeroBrokerage ? HandlingMode.DIRECT : HandlingMode.BROKER_ASSISTED,
        title: item.title,
        description: item.description,
        type: item.type,
        purpose: item.purpose,
        asking_price: item.asking_price,
        security_deposit: item.purpose === 'RENT' ? item.asking_price * 2 : null,
        area_sqft: item.area_sqft,
        carpet_area_sqft: item.carpet_area_sqft,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        floor_level: item.floor_level,
        total_floors: item.total_floors,
        furnishing: item.furnishing,
        parking: item.parking,
        amenities: item.amenities,
        street_address: item.street_address,
        city: item.city,
        locality: item.locality,
        postal_code: item.postal_code,
        latitude: item.lat,
        longitude: item.lng,
        status,
        view_count: 24 + i * 11,
        created_at: new Date(Date.now() - (40 - i) * 86400000),
        updated_at: new Date(),
        published_at: status === 'ACTIVE' ? new Date(Date.now() - (40 - i) * 86400000) : null,
      };

      this.properties.push(property);

      // Assign 3 high quality media images per property
      const img1 = PROPERTY_IMAGES[i % PROPERTY_IMAGES.length];
      const img2 = PROPERTY_IMAGES[(i + 4) % PROPERTY_IMAGES.length];
      const img3 = PROPERTY_IMAGES[(i + 8) % PROPERTY_IMAGES.length];

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
        message: `Hello, I am interested in viewing ${prop.title} this weekend. Please let me know if it is available for an in-person walkthrough.`,
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
        body: `Buyer contacted regarding visit schedule for ${prop.title}. High intent buyer.`,
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
        body: `Rahul Sharma sent an inquiry about ${this.properties[0].title}.`,
        read: false,
        data: { propertyId: this.properties[0].id },
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: buyerId,
        type: 'VISIT_CONFIRMED',
        title: 'Site Visit Confirmed',
        body: `Your site visit for ${this.properties[0].title} has been confirmed for tomorrow.`,
        read: false,
        data: { visitId: 'visit-1' },
        created_at: new Date(),
      }
    );

    this.saveToDisk();
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
