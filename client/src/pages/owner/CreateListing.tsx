import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  MapPin,
  FileText,
  DollarSign,
  Home,
  ShieldCheck,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  PropertyType,
  PropertyPurpose,
  HandlingMode,
  FurnishingStatus,
  AMENITIES
} from '../../types';
import api from '../../api/client';
import { toast } from 'sonner';

export default function CreateListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basics
    title: '',
    type: PropertyType.APARTMENT,
    purpose: PropertyPurpose.RENT,
    handlingMode: HandlingMode.DIRECT,
    askingPrice: '',
    securityDeposit: '',

    // Step 2: Specs & Amenities
    bedrooms: '2',
    bathrooms: '2',
    areaSqft: '',
    carpetAreaSqft: '',
    floorLevel: '3',
    totalFloors: '10',
    furnishing: FurnishingStatus.SEMI_FURNISHED,
    parking: '1',
    amenities: [] as string[],

    // Step 3: Location
    streetAddress: '',
    locality: '',
    city: 'Bengaluru',
    postalCode: '',
    latitude: 12.9716,
    longitude: 77.5946,

    // Step 4: Description & Media
    description: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
    mediaUrls: [] as string[],
    newMediaUrl: '',
  });

  const updateField = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addMediaUrl = () => {
    if (!formData.newMediaUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, prev.newMediaUrl.trim()],
      newMediaUrl: '',
    }));
  };

  const removeMediaUrl = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== idx),
    }));
  };

  // Step Validation
  const validateStep = (s: number) => {
    if (s === 1) {
      if (!formData.title.trim()) {
        toast.error('Please enter a property title');
        return false;
      }
      if (!formData.askingPrice || Number(formData.askingPrice) <= 0) {
        toast.error('Please enter a valid price');
        return false;
      }
    } else if (s === 2) {
      if (!formData.areaSqft || Number(formData.areaSqft) <= 0) {
        toast.error('Please enter the built-up area in sq.ft');
        return false;
      }
    } else if (s === 3) {
      if (!formData.city.trim() || !formData.locality.trim()) {
        toast.error('Please enter both city and locality');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(5, prev + 1));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSaveListing = async (publishImmediately: boolean) => {
    try {
      setLoading(true);

      const payload = {
        title: formData.title,
        type: formData.type,
        purpose: formData.purpose,
        handlingMode: formData.handlingMode,
        askingPrice: Number(formData.askingPrice),
        securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : null,
        description: formData.description || null,
        areaSqft: formData.areaSqft ? Number(formData.areaSqft) : null,
        carpetAreaSqft: formData.carpetAreaSqft ? Number(formData.carpetAreaSqft) : null,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        floorLevel: formData.floorLevel ? Number(formData.floorLevel) : null,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : null,
        furnishing: formData.furnishing,
        parking: formData.parking ? Number(formData.parking) : null,
        amenities: formData.amenities,
        streetAddress: formData.streetAddress || null,
        locality: formData.locality || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      };

      const res = await api.post('/properties', payload);
      const propertyId = res.data.id;

      // Add cover media
      if (formData.coverImageUrl) {
        try {
          await api.post(`/properties/${propertyId}/media`, {
            url: formData.coverImageUrl,
            mediaType: 'IMAGE',
            isCover: true,
            sortOrder: 0,
          });
        } catch {
          // ignore
        }
      }

      // Add extra media
      for (let i = 0; i < formData.mediaUrls.length; i++) {
        try {
          await api.post(`/properties/${propertyId}/media`, {
            url: formData.mediaUrls[i],
            mediaType: 'IMAGE',
            isCover: false,
            sortOrder: i + 1,
          });
        } catch {
          // ignore
        }
      }

      if (publishImmediately) {
        await api.post(`/properties/${propertyId}/publish`);
        toast.success('Property successfully published to live search!');
      } else {
        toast.success('Property saved as Draft!');
      }

      navigate('/dashboard/owner/listings');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Basics & Pricing' },
    { num: 2, title: 'Specs & Amenities' },
    { num: 3, title: 'Location' },
    { num: 4, title: 'Photos & Info' },
    { num: 5, title: 'Review & Publish' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-estate-900">
          Post a Property
        </h1>
        <p className="text-xs sm:text-sm text-estate-500 mt-1">
          Complete the steps below to list your verified property on EstateFlow
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between border-b border-estate-200 pb-4">
        {steps.map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-500/30'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-estate-100 text-estate-500'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`hidden sm:inline text-xs font-semibold ${
                step === s.num ? 'text-estate-900 font-bold' : 'text-estate-400'
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-estate-900 pb-2 border-b border-estate-100">
            Step 1: Basic Information & Pricing
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Property Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Spacious 3 BHK Luxury Apartment in Indiranagar"
                className="input-field text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Property Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value={PropertyType.APARTMENT}>Apartment / Flat</option>
                  <option value={PropertyType.VILLA}>Villa / Bungalow</option>
                  <option value={PropertyType.INDEPENDENT_HOUSE}>Independent House</option>
                  <option value={PropertyType.PLOT}>Residential Plot</option>
                  <option value={PropertyType.COMMERCIAL}>Commercial Property</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Purpose *
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value={PropertyPurpose.RENT}>For Rent</option>
                  <option value={PropertyPurpose.SALE}>For Sale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Brokerage Handling Mode
                </label>
                <select
                  value={formData.handlingMode}
                  onChange={(e) => updateField('handlingMode', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value={HandlingMode.DIRECT}>Direct (Zero Brokerage)</option>
                  <option value={HandlingMode.BROKER_ASSISTED}>Broker Assisted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  {formData.purpose === PropertyPurpose.RENT ? 'Monthly Rent (₹) *' : 'Asking Price (₹) *'}
                </label>
                <input
                  type="number"
                  value={formData.askingPrice}
                  onChange={(e) => updateField('askingPrice', e.target.value)}
                  placeholder="e.g. 45000"
                  className="input-field text-sm"
                  required
                />
              </div>

              {formData.purpose === PropertyPurpose.RENT && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => updateField('securityDeposit', e.target.value)}
                    placeholder="e.g. 150000"
                    className="input-field text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Specs */}
      {step === 2 && (
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-estate-900 pb-2 border-b border-estate-100">
            Step 2: Specifications & Amenities
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Bedrooms (BHK)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.bedrooms}
                  onChange={(e) => updateField('bedrooms', e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.bathrooms}
                  onChange={(e) => updateField('bathrooms', e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Super Area (sq.ft) *
                </label>
                <input
                  type="number"
                  value={formData.areaSqft}
                  onChange={(e) => updateField('areaSqft', e.target.value)}
                  placeholder="e.g. 1450"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Carpet Area (sq.ft)
                </label>
                <input
                  type="number"
                  value={formData.carpetAreaSqft}
                  onChange={(e) => updateField('carpetAreaSqft', e.target.value)}
                  placeholder="e.g. 1200"
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Floor Level / Total Floors
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={formData.floorLevel}
                    onChange={(e) => updateField('floorLevel', e.target.value)}
                    placeholder="Floor"
                    className="input-field text-sm"
                  />
                  <input
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => updateField('totalFloors', e.target.value)}
                    placeholder="Total"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Furnishing Status
                </label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => updateField('furnishing', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value={FurnishingStatus.SEMI_FURNISHED}>Semi Furnished</option>
                  <option value={FurnishingStatus.FULLY_FURNISHED}>Fully Furnished</option>
                  <option value={FurnishingStatus.UNFURNISHED}>Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Reserved Car Parking
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.parking}
                  onChange={(e) => updateField('parking', e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-2">
                Select Amenities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AMENITIES.map((amenity) => {
                  const isChecked = formData.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-primary-600 bg-primary-50 text-primary-800 font-semibold shadow-sm'
                          : 'border-estate-200 text-estate-600 hover:bg-estate-50'
                      }`}
                    >
                      <span>{amenity}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-estate-900 pb-2 border-b border-estate-100">
            Step 3: Property Address & Coordinates
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Street Address / Building Name
              </label>
              <input
                type="text"
                value={formData.streetAddress}
                onChange={(e) => updateField('streetAddress', e.target.value)}
                placeholder="e.g. Flat 302, Prestige Hermitage, 12th Main Rd"
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Locality / Neighborhood *
                </label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => updateField('locality', e.target.value)}
                  placeholder="e.g. Indiranagar"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  placeholder="e.g. 560038"
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Latitude (for Map)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => updateField('latitude', Number(e.target.value))}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Longitude (for Map)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => updateField('longitude', Number(e.target.value))}
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Photos & Description */}
      {step === 4 && (
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-estate-900 pb-2 border-b border-estate-100">
            Step 4: Media, Cover Photo & Description
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Cover Image URL
              </label>
              <input
                type="text"
                value={formData.coverImageUrl}
                onChange={(e) => updateField('coverImageUrl', e.target.value)}
                placeholder="https://..."
                className="input-field text-sm"
              />
              {formData.coverImageUrl && (
                <div className="mt-2 w-48 h-28 rounded-xl overflow-hidden border border-estate-200 shadow-sm">
                  <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Additional Photo URLs
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newMediaUrl}
                  onChange={(e) => updateField('newMediaUrl', e.target.value)}
                  placeholder="Paste image link and click Add"
                  className="input-field text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={addMediaUrl}
                  className="btn-outline text-xs px-4 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {formData.mediaUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                  {formData.mediaUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-estate-200 group">
                      <img src={url} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMediaUrl(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Property Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe key highlights, interior condition, proximity to metro, schools, hospitals..."
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review & Publish */}
      {step === 5 && (
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-estate-900 pb-2 border-b border-estate-100">
            Step 5: Review Your Listing Details
          </h2>

          <div className="bg-estate-50 rounded-2xl p-6 border border-estate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-primary-600 uppercase">
                  {formData.type} • For {formData.purpose}
                </span>
                <h3 className="text-xl font-bold text-estate-900 mt-1">{formData.title}</h3>
                <p className="text-xs text-estate-500 mt-1">
                  {[formData.streetAddress, formData.locality, formData.city].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-estate-900">
                  ₹{Number(formData.askingPrice || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                  {formData.handlingMode === 'DIRECT' ? 'Zero Brokerage' : 'Broker Assisted'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-estate-200 text-xs">
              <div>
                <span className="text-estate-400">Bedrooms:</span>
                <span className="font-bold ml-1">{formData.bedrooms} BHK</span>
              </div>
              <div>
                <span className="text-estate-400">Bathrooms:</span>
                <span className="font-bold ml-1">{formData.bathrooms}</span>
              </div>
              <div>
                <span className="text-estate-400">Built-up:</span>
                <span className="font-bold ml-1">{formData.areaSqft} sq.ft</span>
              </div>
              <div>
                <span className="text-estate-400">Furnishing:</span>
                <span className="font-bold ml-1">{formData.furnishing}</span>
              </div>
            </div>

            {formData.amenities.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-estate-500 font-semibold block mb-1.5">Amenities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.amenities.map((a) => (
                    <span key={a} className="text-[11px] bg-white border border-estate-200 px-2 py-0.5 rounded-md font-medium text-estate-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stepper Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-estate-200">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="btn-outline text-xs py-2.5 px-4 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5 shadow"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveListing(false)}
              className="btn-outline text-xs py-2.5 px-4"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveListing(true)}
              className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5 shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Property Live'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
