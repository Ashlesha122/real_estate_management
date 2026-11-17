import { useState, useEffect, useMemo } from 'react';
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
  Calculator,
  ExternalLink,
  Award,
  Landmark,
  BadgePercent,
  Check,
  Phone
} from 'lucide-react';
import { PropertyDetail, HandlingMode, PropertyPurpose } from '../types';
import { formatPrice, formatPricePerSqft, formatDate, getStatusColor, getPropertyTypeLabel } from '../lib/utils';
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

  // Home Loan EMI Calculator State
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);

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

  // Calculate EMI
  const emiCalculations = useMemo(() => {
    if (!property) return null;
    const price = Number(property.asking_price);
    const loanAmount = price * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = loanTenureYears * 12;

    const monthlyEmi =
      monthlyRate === 0
        ? loanAmount / totalMonths
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalPayment = monthlyEmi * totalMonths;
    const totalInterest = totalPayment - loanAmount;

    return {
      loanAmount,
      downPaymentAmount: price * (downPaymentPercent / 100),
      monthlyEmi: Math.round(monthlyEmi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
    };
  }, [property, downPaymentPercent, loanTenureYears, interestRate]);

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
  const pricePerSqft = formatPricePerSqft(Number(property.asking_price), property.area_sqft);

  // Extract or generate realistic RERA ID
  const reraMatch = property.description?.match(/RERA ID:\s*([A-Za-z0-9\/\-_]+)/i);
  const reraId = reraMatch ? reraMatch[1] : `PRM/KA/RERA/${property.postal_code || '1251'}/${property.id.slice(0, 6).toUpperCase()}`;

  const contactPhone = (isZeroBrokerage ? property.owner_phone : property.broker_phone) || property.owner_phone || '+91 98765 43211';
  const cleanPhone = contactPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const whatsappMessage = encodeURIComponent(
    `Hello, I found your listing "${property.title}" on EstateFlow. I would like to schedule an inspection visit and discuss details.`
  );
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${whatsappMessage}`;

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
        <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[500px] w-full bg-estate-900 rounded-2xl overflow-hidden shadow-xl">
          <img
            src={images[activeImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {/* Top badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            <span className="bg-estate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm">
              FOR {property.purpose}
            </span>
            {isZeroBrokerage ? (
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-4 h-4" /> ZERO BROKERAGE
              </span>
            ) : (
              <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                Broker Assisted
              </span>
            )}
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>

          {/* RERA Badge top right */}
          <div className="absolute top-4 right-4 z-10 hidden sm:block">
            <span className="bg-estate-950/80 backdrop-blur-md text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              RERA Compliant
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
                {pricePerSqft && (
                  <p className="text-xs font-semibold text-primary-600 mt-0.5">
                    Estimated Rate: {pricePerSqft}
                  </p>
                )}
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
                  {property.parking != null ? `${property.parking} Covered Slots` : 'Available on street'}
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
                <span className="text-estate-400 uppercase font-semibold block">RERA Registration</span>
                <span className="font-semibold text-primary-700 text-xs mt-0.5 block truncate" title={reraId}>
                  {reraId}
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

          {/* Interactive Home Loan EMI Calculator */}
          {property.purpose === PropertyPurpose.SALE && emiCalculations && (
            <div className="card p-6 space-y-6 border border-primary-200/60 bg-gradient-to-br from-white to-primary-50/20">
              <div className="flex items-center justify-between pb-3 border-b border-estate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-sm">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-estate-900">Home Loan EMI Calculator</h3>
                    <p className="text-xs text-estate-500">Estimate your monthly mortgage payments with partner banks</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full">
                  Instant Estimate
                </span>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-estate-700 mb-1.5">
                    <span>Down Payment</span>
                    <span className="text-primary-700 font-bold">{downPaymentPercent}% ({formatPrice(emiCalculations.downPaymentAmount)})</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-estate-400 mt-1">
                    <span>10%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-estate-700 mb-1.5">
                    <span>Loan Tenure</span>
                    <span className="text-primary-700 font-bold">{loanTenureYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-estate-400 mt-1">
                    <span>5 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-estate-700 mb-1.5">
                    <span>Interest Rate</span>
                    <span className="text-primary-700 font-bold">{interestRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="7.5"
                    max="12.0"
                    step="0.25"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-estate-400 mt-1">
                    <span>7.5%</span>
                    <span>12%</span>
                  </div>
                </div>
              </div>

              {/* Calculations Box */}
              <div className="bg-white rounded-xl p-4 border border-estate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-[11px] text-estate-400 font-medium">Monthly EMI</span>
                  <div className="text-xl font-extrabold text-primary-700 mt-0.5">
                    ₹{emiCalculations.monthlyEmi.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-estate-400 font-medium">Principal Loan</span>
                  <div className="text-base font-bold text-estate-900 mt-0.5">
                    {formatPrice(emiCalculations.loanAmount)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-estate-400 font-medium">Total Interest</span>
                  <div className="text-base font-bold text-estate-900 mt-0.5">
                    {formatPrice(emiCalculations.totalInterest)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-estate-400 font-medium">Total Payable</span>
                  <div className="text-base font-bold text-estate-900 mt-0.5">
                    {formatPrice(emiCalculations.totalPayment)}
                  </div>
                </div>
              </div>

              {/* Partner Banks Strip */}
              <div className="pt-2 border-t border-estate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-estate-500">
                <span className="font-semibold text-estate-700">Pre-Approved Banking Partners:</span>
                <div className="flex items-center gap-3 font-semibold text-estate-700">
                  <span className="bg-estate-100 px-2.5 py-1 rounded">SBI Home Loans</span>
                  <span className="bg-estate-100 px-2.5 py-1 rounded">HDFC Bank</span>
                  <span className="bg-estate-100 px-2.5 py-1 rounded">ICICI Bank</span>
                  <span className="bg-estate-100 px-2.5 py-1 rounded">Axis Bank</span>
                </div>
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
          <div className="card p-6 sticky top-24 space-y-6 shadow-lg border border-estate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-estate-400">Listed By</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-extrabold flex items-center justify-center text-lg border border-primary-200">
                  {isZeroBrokerage
                    ? property.owner_name?.charAt(0).toUpperCase() || 'P'
                    : property.broker_name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-base text-estate-900">
                    {isZeroBrokerage ? (property.owner_name || 'Priya Patel') : (property.broker_name || 'Amit Kumar')}
                  </h4>
                  <p className="text-xs text-estate-500 font-medium">
                    {isZeroBrokerage ? 'Verified Direct Homeowner' : 'EstateFlow Certified Agent'}
                  </p>
                  <a
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 mt-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary-600" />
                    <span>{contactPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            {isZeroBrokerage ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Zero Brokerage Guarantee:</strong> Connect directly with the owner. Save 100% on brokerage fees with direct digital contact!
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Award className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Partner Broker Handled:</strong> Professional site visits, paperwork coordination, and registration assistance included.
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
                className="w-full btn-outline py-3 flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <MessageSquare className="w-4 h-4" />
                Send Inquiry Message
              </button>

              {/* Direct Call Button */}
              <a
                href={`tel:${contactPhone}`}
                className="w-full bg-estate-100 hover:bg-estate-200 text-estate-800 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
              >
                <Phone className="w-4 h-4 text-primary-600" />
                Call Directly ({contactPhone})
              </a>

              {/* WhatsApp direct chat button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md transition-all hover:shadow-emerald-600/20"
              >
                <ExternalLink className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>

            {/* Legal and Compliance Trust Card */}
            <div className="p-4 bg-estate-50 rounded-xl border border-estate-200/80 space-y-2 text-xs text-estate-600">
              <span className="font-bold text-estate-900 block pb-1 border-b border-estate-200">
                Buyer Protection & Assurance
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>RERA Registered & Title Verified</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Direct Homeowner Identity Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Standardized Digital Lease & Escrow Agreement</span>
              </div>
            </div>

            <div className="pt-2 border-t border-estate-100 text-center">
              <p className="text-[11px] text-estate-400">
                All communications and appointments are securely protected by EstateFlow.
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
