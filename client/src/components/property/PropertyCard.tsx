import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BedDouble, Bath, Square, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PropertySummary, HandlingMode, PropertyPurpose } from '../../types';
import { formatPrice, formatPricePerSqft, getStatusColor, getPropertyTypeLabel } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { toast } from 'sonner';

interface PropertyCardProps {
  property: PropertySummary;
  isWishlisted?: boolean;
  onWishlistChange?: (propertyId: string, isAdded: boolean) => void;
  showStatus?: boolean;
  onCompareToggle?: (property: PropertySummary) => void;
  isComparing?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  isCompared?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export default function PropertyCard({
  property,
  isWishlisted: initialWishlisted = false,
  onWishlistChange,
  showStatus = false,
  onCompareToggle,
  isComparing = false,
  isSelected = false,
  onSelect,
  onCompare,
  isCompared = false,
  layout = 'vertical',
}: PropertyCardProps) {
  const { isAuthenticated, user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save properties to your wishlist');
      return;
    }

    try {
      setIsWishlistLoading(true);
      if (isWishlisted) {
        await api.delete(`/wishlist/${property.id}`);
        setIsWishlisted(false);
        onWishlistChange?.(property.id, false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist', { propertyId: property.id });
        setIsWishlisted(true);
        onWishlistChange?.(property.id, true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const isZeroBrokerage = property.handling_mode === HandlingMode.DIRECT;
  const pricePerSqft = formatPricePerSqft(Number(property.asking_price), property.area_sqft);
  const effectiveComparing = isCompared || isComparing;
  const handleCompareClick = onCompare || (onCompareToggle ? () => onCompareToggle(property) : undefined);

  return (
    <div
      onClick={onSelect}
      className={`group card overflow-hidden flex transition-all duration-300 border bg-white cursor-pointer ${
        layout === 'horizontal' ? 'flex-col sm:flex-row' : 'flex-col'
      } ${
        isSelected
          ? 'ring-2 ring-primary-500 border-primary-500 shadow-lg'
          : 'border-estate-200/80 hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      {/* Image container */}
      <div
        className={`relative bg-estate-100 overflow-hidden ${
          layout === 'horizontal' ? 'sm:w-72 aspect-[16/10] sm:aspect-auto flex-shrink-0' : 'aspect-[16/10]'
        }`}
      >
        <img
          src={property.cover_image_url || fallbackImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10">
          <span className="bg-estate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider">
            FOR {property.purpose}
          </span>
          {isZeroBrokerage ? (
            <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" /> 0% BROKERAGE
            </span>
          ) : (
            <span className="bg-amber-600/90 text-white text-[11px] font-medium px-2.5 py-1 rounded-md">
              Broker Assisted
            </span>
          )}
        </div>

        {/* RERA verified chip */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> RERA Verified
          </span>
        </div>

        {/* Wishlist button */}
        {user?.role !== 'OWNER' && user?.role !== 'BROKER' && (
          <button
            onClick={toggleWishlist}
            disabled={isWishlistLoading}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-md transition-all z-10 ${
              isWishlisted
                ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110'
                : 'bg-white/90 hover:bg-white text-estate-700 hover:text-rose-500'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Status badge if requested */}
        {showStatus && (
          <div className="absolute top-12 left-3 z-10">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
        )}
      </div>

      {/* Body content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Price, rate per sqft & Type */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-xl font-extrabold font-display text-estate-900">
                {formatPrice(Number(property.asking_price))}
                {property.purpose === PropertyPurpose.RENT && (
                  <span className="text-xs font-normal text-estate-500"> /mo</span>
                )}
              </div>
              {pricePerSqft && (
                <span className="text-[11px] font-medium text-estate-400">
                  ({pricePerSqft})
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-100/60">
              {getPropertyTypeLabel(property.type)}
            </span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property.id}`} className="block group-hover:text-primary-600 transition-colors mt-2">
            <h3 className="font-bold text-estate-900 line-clamp-1 text-base tracking-tight leading-snug">
              {property.title}
            </h3>
          </Link>

          {/* Location & Proximity */}
          <div className="flex items-center gap-1.5 text-xs text-estate-500 mt-1.5 flex-wrap">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-estate-400" />
            <span className="truncate">
              {[property.locality, property.city].filter(Boolean).join(', ')}
            </span>
            {property.distance !== undefined && property.distance !== null && (
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                📍 {Number(property.distance) >= 1000 ? `${(Number(property.distance) / 1000).toFixed(1)} km away` : `${Math.round(Number(property.distance))} m away`}
              </span>
            )}
          </div>
        </div>

        {/* Feature icons & Compare */}
        <div className="pt-3.5 mt-3.5 border-t border-estate-100 flex items-center justify-between text-xs text-estate-600">
          <div className="flex items-center gap-3.5">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1 font-medium" title={`${property.bedrooms} Bedrooms`}>
                <BedDouble className="w-3.5 h-3.5 text-estate-400" />
                {property.bedrooms} BHK
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1 font-medium" title={`${property.bathrooms} Bathrooms`}>
                <Bath className="w-3.5 h-3.5 text-estate-400" />
                {property.bathrooms} Baths
              </span>
            )}
            {property.area_sqft !== null && (
              <span className="flex items-center gap-1 font-medium" title="Super Built-up Area">
                <Square className="w-3.5 h-3.5 text-estate-400" />
                {property.area_sqft} sq.ft
              </span>
            )}
          </div>

          {handleCompareClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCompareClick();
              }}
              className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                effectiveComparing
                  ? 'bg-primary-600 text-white'
                  : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
              }`}
            >
              {effectiveComparing ? 'Comparing' : '+ Compare'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
