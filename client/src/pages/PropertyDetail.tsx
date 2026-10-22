import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Bath,
  Square,
  MapPin,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  ShieldCheck,
  Building,
  Layers,
  Car,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { PropertyDetail, HandlingMode, PropertyPurpose } from '../types';
import { formatPrice, formatDate, getStatusColor, getPropertyTypeLabel } from '../lib/utils';
import PropertyMap from '../components/property/PropertyMap';
import InquiryModal from '../components/modals/InquiryModal';
import BookVisitModal from '../components/modals/BookVisitModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { toast } from 'sonner';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Modals
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        const res = await api.get(`/properties/${id}/detail`);
        setProperty(res.data);
        setIsWishlisted(!!res.data.isWishlisted);
      } catch (err: any) {
        toast.error('Property not found or unavailable');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProperty();
  }, [id, navigate]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save properties');
      return;
    }
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${id}`);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist', { propertyId: id });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!property) return null;

  const images = property.media && property.media.length > 0
    ? property.media.map((m) => m.url)
    : [property.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'];

  const isZeroBrokerage = property.handling_mode === HandlingMode.DIRECT;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-estate-600 hover:text-estate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Search Results
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 border border-estate-200 hover:bg-estate-50 rounded-xl text-estate-600 transition-colors"
            title="Share Property"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleWishlist}
            className={`p-2 border border-estate-200 rounded-xl transition-colors ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'hover:bg-estate-50 text-estate-600'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Photo Gallery */}
      <div className="space-y-3">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[500px] w-full bg-estate-900 rounded-2xl overflow-hidden shadow-lg">
          <img
            src={images[activeImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {/* Top badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-estate-900/90 text-white text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-sm">
              FOR {property.purpose}
            </span>
            {isZeroBrokerage ? (
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-4 h-4" /> ZERO BROKERAGE
              </span>
            ) : (
              <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                Broker Assisted
              </span>
            )}
            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
        </div>

        {/* Thumbnails row */}
        {images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx ? 'border-primary-600 ring-2 ring-primary-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overview & Action Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-8">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                  {getPropertyTypeLabel(property.type)}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-estate-900 mt-1">
                  {property.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-estate-500 mt-2">
                  <MapPin className="w-4 h-4 text-estate-400 flex-shrink-0" />
                  <span>
                    {[property.street_address, property.locality, property.city, property.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-extrabold font-display text-estate-900">
                  {formatPrice(Number(property.asking_price))}
                  {property.purpose === PropertyPurpose.RENT && (
                    <span className="text-sm font-normal text-estate-500"> /month</span>
                  )}
                </div>
                {property.security_deposit && (
                  <p className="text-xs text-estate-500 mt-1">
                    Deposit: {formatPrice(Number(property.security_deposit))}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-estate-50 rounded-2xl border border-estate-200">
            {property.bedrooms !== null && (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl text-estate-700 shadow-sm border border-estate-200">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-estate-400 uppercase font-semibold">Bedrooms</div>
                  <div className="font-bold text-sm text-estate-900">{property.bedrooms} BHK</div>
                </div>
              </div>
            )}
            {property.bathrooms !== null && (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl text-estate-700 shadow-sm border border-estate-200">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-estate-400 uppercase font-semibold">Bathrooms</div>
                  <div className="font-bold text-sm text-estate-900">{property.bathrooms} Baths</div>
                </div>
              </div>
            )}
            {property.area_sqft !== null && (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl text-estate-700 shadow-sm border border-estate-200">
                  <Square className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-estate-400 uppercase font-semibold">Super Area</div>
                  <div className="font-bold text-sm text-estate-900">{property.area_sqft} sq.ft</div>
                </div>
              </div>
            )}
            {property.carpet_area_sqft !== null && (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl text-estate-700 shadow-sm border border-estate-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-estate-400 uppercase font-semibold">Carpet Area</div>
                  <div className="font-bold text-sm text-estate-900">{property.carpet_area_sqft} sq.ft</div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed attributes table */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-estate-900 mb-4 pb-2 border-b border-estate-100">
              Property Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-estate-400 uppercase font-semibold block">Furnishing Status</span>
                <span className="font-semibold text-estate-900 text-sm mt-0.5 block">
                  {property.furnishing?.replace('_', ' ') || 'Unspecified'}
                </span>
              </div>
              <div>
                <span className="text-estate-400 uppercase font-semibold block">Floor</span>
                <span className="font-semibold text-estate-900 text-sm mt-0.5 block">
                  {property.floor_level != null ? `${property.floor_level} of ${property.total_floors || '—'}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-estate-400 uppercase font-semibold block">Reserved Parking</span>
                <span className="font-semibold text-estate-900 text-sm mt-0.5 block">
                  {property.parking != null ? `${property.parking} Slots` : 'Available on street'}
                </span>
              </div>
              <div>
                <span className="text-estate-400 uppercase font-semibold block">Handling Mode</span>
                <span className="font-semibold text-estate-900 text-sm mt-0.5 block">
                  {property.handling_mode === 'DIRECT' ? 'Direct Owner (0% Brokerage)' : 'Broker Assisted'}
                </span>
              </div>
              <div>
                <span className="text-estate-400 uppercase font-semibold block">Listed On</span>
                <span className="font-semibold text-estate-900 text-sm mt-0.5 block">
                  {formatDate(property.created_at)}
                </span>
              </div>
              <div>
                <span className="text-estate-400 uppercase font-semibold block">Property Views</span>
                <span className="font-semibold text-estate-900 text-sm mt-0.5 block">
                  {property.view_count || 1} views
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="card p-6 space-y-3">
              <h3 className="text-base font-bold text-estate-900 pb-2 border-b border-estate-100">
                Description & Remarks
              </h3>
              <p className="text-sm text-estate-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="card p-6 space-y-4">
              <h3 className="text-base font-bold text-estate-900 pb-2 border-b border-estate-100">
                Amenities & Features
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-xs font-medium text-estate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Location Map */}
          {property.latitude && property.longitude && (
            <div className="card p-6 space-y-4">
              <h3 className="text-base font-bold text-estate-900 pb-2 border-b border-estate-100 flex items-center justify-between">
                <span>Location & Neighbourhood</span>
                <span className="text-xs font-normal text-estate-500">
                  {property.locality}, {property.city}
                </span>
              </h3>
              <div className="h-72">
                <PropertyMap
                  properties={[property]}
                  selectedProperty={property}
                  center={[property.longitude, property.latitude]}
                  zoom={14}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Handler Contact Card & Booking */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 sticky top-24 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-estate-400">Listed By</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-extrabold flex items-center justify-center text-lg border border-primary-200">
                  {isZeroBrokerage
                    ? property.owner_name?.charAt(0).toUpperCase() || 'O'
                    : property.broker_name?.charAt(0).toUpperCase() || 'B'}
                </div>
                <div>
                  <h4 className="font-bold text-base text-estate-900">
                    {isZeroBrokerage ? property.owner_name : property.broker_name || property.owner_name}
                  </h4>
                  <p className="text-xs text-estate-500">
                    {isZeroBrokerage ? 'Verified Property Owner' : 'Licensed Agent Partner'}
                  </p>
                </div>
              </div>
            </div>

            {isZeroBrokerage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Zero Brokerage Verified:</strong> You deal directly with the homeowner. No middleman markup or broker fee!
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please log in to schedule a visit');
                    navigate('/login');
                    return;
                  }
                  setIsVisitModalOpen(true);
                }}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <Calendar className="w-4 h-4" />
                Schedule Site Visit
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please log in to send inquiries');
                    navigate('/login');
                    return;
                  }
                  setIsInquiryModalOpen(true);
                }}
                className="w-full btn-outline py-3 flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Send Inquiry Message
              </button>
            </div>

            <div className="pt-4 border-t border-estate-100 text-center">
              <p className="text-[11px] text-estate-400">
                Inquiries and appointments are securely routed through EstateFlow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InquiryModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />

      <BookVisitModal
        propertyId={property.id}
        propertyTitle={property.title}
        handlerId={property.broker_id || property.owner_id}
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
      />
    </div>
  );
}
