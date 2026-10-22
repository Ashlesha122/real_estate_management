import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BedDouble, Bath, Square, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { PropertySummary, HandlingMode, PropertyPurpose } from '../../types';
import { formatPrice, getStatusColor, getPropertyTypeLabel } from '../../lib/utils';
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
}

export default function PropertyCard({
  property,
  isWishlisted: initialWishlisted = false,
  onWishlistChange,
  showStatus = false,
  onCompareToggle,
  isComparing = false,
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

  return (
    <div className="group card overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-200">
      {/* Image container */}
      <div className="relative aspect-[16/10] bg-estate-100 overflow-hidden">
        <img
          src={property.cover_image_url || fallbackImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />

        {/* Top badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span className="bg-estate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
            FOR {property.purpose}
          </span>
          {isZeroBrokerage ? (
            <span className="bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> ZERO BROKERAGE
            </span>
          ) : (
            <span className="bg-amber-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
              Broker Assisted
            </span>
          )}
        </div>

        {/* Wishlist button */}
        {user?.role !== 'OWNER' && user?.role !== 'BROKER' && (
          <button
            onClick={toggleWishlist}
            disabled={isWishlistLoading}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-md transition-colors ${
              isWishlisted
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-white/80 hover:bg-white text-estate-700 hover:text-rose-500'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Status badge if requested */}
        {showStatus && (
          <div className="absolute bottom-3 left-3">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
        )}
      </div>

      {/* Body content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Price & Type */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div className="text-xl font-bold font-display text-estate-900">
              {formatPrice(Number(property.asking_price))}
              {property.purpose === PropertyPurpose.RENT && (
                <span className="text-xs font-normal text-estate-500"> /month</span>
              )}
            </div>
            <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
              {getPropertyTypeLabel(property.type)}
            </span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property.id}`} className="block group-hover:text-primary-600 transition-colors">
            <h3 className="font-semibold text-estate-900 line-clamp-1 text-base">{property.title}</h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-estate-500 mt-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-estate-400" />
            <span className="truncate">
              {[property.locality, property.city].filter(Boolean).join(', ')}
            </span>
            {property.distance !== undefined && (
              <span className="text-primary-600 font-medium">({property.distance.toFixed(1)} km)</span>
            )}
          </div>
        </div>

        {/* Feature icons */}
        <div className="pt-4 mt-4 border-t border-estate-100 flex items-center justify-between text-xs text-estate-600">
          <div className="flex items-center gap-4">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1 font-medium" title={`${property.bedrooms} Bedrooms`}>
                <BedDouble className="w-4 h-4 text-estate-400" />
                {property.bedrooms} Beds
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1 font-medium" title={`${property.bathrooms} Bathrooms`}>
                <Bath className="w-4 h-4 text-estate-400" />
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

          {onCompareToggle && (
            <button
              onClick={() => onCompareToggle(property)}
              className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                isComparing
                  ? 'bg-primary-600 text-white'
                  : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
              }`}
            >
              {isComparing ? 'Comparing' : '+ Compare'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
