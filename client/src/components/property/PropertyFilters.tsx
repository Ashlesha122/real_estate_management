import { useState } from 'react';
import { PropertyPurpose, PropertyType, FurnishingStatus, AMENITIES } from '../../types';
import { Filter, X, RotateCcw, ShieldCheck } from 'lucide-react';

export interface FilterState {
  purpose?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  furnishing?: string;
  zeroBrokerage?: boolean;
  amenities: string[];
  city?: string;
  sort?: string;
}

interface PropertyFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export default function PropertyFilters({
  filters,
  onChange,
  onReset,
}: PropertyFiltersProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleTextChange = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const next = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    onChange({ ...filters, amenities: next });
  };

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'amenities') return (v as string[]).length > 0;
    if (k === 'zeroBrokerage') return !!v;
    if (k === 'sort') return false;
    return !!v;
  }).length;

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-estate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-estate-900 text-sm">Filter Properties</h3>
          {activeCount > 0 && (
            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-estate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all
          </button>
        )}
      </div>

      {/* Purpose Toggle */}
      <div>
        <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Purpose</label>
        <div className="grid grid-cols-3 gap-2">
          {['', PropertyPurpose.SALE, PropertyPurpose.RENT].map((p) => (
            <button
              key={p || 'all'}
              type="button"
              onClick={() => handleTextChange('purpose', p)}
              className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                filters.purpose === p
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-estate-700 border-estate-300 hover:bg-estate-50'
              }`}
            >
              {p ? `For ${p}` : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Zero Brokerage Toggle */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Zero Brokerage Only
          </span>
          <input
            type="checkbox"
            checked={!!filters.zeroBrokerage}
            onChange={(e) => handleTextChange('zeroBrokerage', e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
          />
        </label>
        <p className="text-[11px] text-emerald-700 mt-1">Direct from verified owners, 0% brokerage fee.</p>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Property Type</label>
        <select
          value={filters.type || ''}
          onChange={(e) => handleTextChange('type', e.target.value)}
          className="input-field text-sm"
        >
          <option value="">All Types</option>
          <option value={PropertyType.APARTMENT}>Apartment / Flat</option>
          <option value={PropertyType.VILLA}>Villa / Bungalow</option>
          <option value={PropertyType.INDEPENDENT_HOUSE}>Independent House</option>
          <option value={PropertyType.PLOT}>Residential Plot</option>
          <option value={PropertyType.COMMERCIAL}>Commercial Property</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Budget (₹)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice || ''}
            onChange={(e) => handleTextChange('minPrice', e.target.value)}
            className="input-field text-xs"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice || ''}
            onChange={(e) => handleTextChange('maxPrice', e.target.value)}
            className="input-field text-xs"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Bedrooms (BHK)</label>
        <div className="flex flex-wrap gap-1.5">
          {['', '1', '2', '3', '4', '5'].map((b) => (
            <button
              key={b || 'any'}
              type="button"
              onClick={() => handleTextChange('bedrooms', b)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                filters.bedrooms === b
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-estate-700 border-estate-300 hover:bg-estate-50'
              }`}
            >
              {b ? `${b} BHK` : 'Any'}
            </button>
          ))}
        </div>
      </div>

      {/* Furnishing */}
      <div>
        <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Furnishing</label>
        <select
          value={filters.furnishing || ''}
          onChange={(e) => handleTextChange('furnishing', e.target.value)}
          className="input-field text-sm"
        >
          <option value="">Any Furnishing</option>
          <option value={FurnishingStatus.FULLY_FURNISHED}>Fully Furnished</option>
          <option value={FurnishingStatus.SEMI_FURNISHED}>Semi Furnished</option>
          <option value={FurnishingStatus.UNFURNISHED}>Unfurnished</option>
        </select>
      </div>

      {/* Amenities checklist */}
      <div>
        <label className="block text-xs font-semibold uppercase text-estate-500 mb-2">Popular Amenities</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {AMENITIES.map((amenity) => {
            const isChecked = filters.amenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center gap-2 text-xs text-estate-700 hover:text-estate-900 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-3.5 h-3.5 text-primary-600 rounded border-estate-300 focus:ring-primary-500"
                />
                <span>{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="w-full btn-outline flex items-center justify-center gap-2 text-sm py-2"
        >
          <Filter className="w-4 h-4" />
          Filter & Refine {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-estate-900/60 backdrop-blur-sm" onClick={() => setIsOpenMobile(false)} />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-estate-900">Filters</span>
                <button onClick={() => setIsOpenMobile(false)} className="p-1 text-estate-500 hover:text-estate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>
            <div className="pt-6 border-t border-estate-200 mt-6">
              <button onClick={() => setIsOpenMobile(false)} className="w-full btn-primary py-2.5">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Filters */}
      <div className="hidden lg:block bg-white p-5 rounded-2xl border border-estate-200 shadow-sm sticky top-24">
        {content}
      </div>
    </>
  );
}
