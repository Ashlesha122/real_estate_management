import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Map as MapIcon,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  Scale,
  Search as SearchIcon,
  MapPin,
  Crosshair,
  RotateCcw
} from 'lucide-react';
import { PropertySummary } from '../types';
import PropertyCard from '../components/property/PropertyCard';
import PropertyMap, { METRO_HUBS } from '../components/property/PropertyMap';
import PropertyFilters, { FilterState } from '../components/property/PropertyFilters';
import CompareModal from '../components/modals/CompareModal';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const CITY_COORDS: Record<string, [number, number]> = {
  'Bengaluru': [77.5946, 12.9716],
  'Bangalore': [77.5946, 12.9716],
  'Mumbai': [72.8477, 19.0760],
  'Delhi NCR': [77.0984, 28.4682],
  'Delhi': [77.0984, 28.4682],
  'Hyderabad': [78.3752, 17.4399],
  'Chennai': [80.2435, 13.0163],
  'Pune': [73.8567, 18.5204],
  'Kolkata': [88.3639, 22.5726],
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'split'>('split');
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertySummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Map position state - only moves on explicit user action
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.5946, 12.9716]); // Bengaluru default
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInput, setLocationInput] = useState(searchParams.get('city') || '');

  // Compare state
  const [compareList, setCompareList] = useState<PropertySummary[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    purpose: searchParams.get('purpose') || '',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
    furnishing: searchParams.get('furnishing') || '',
    zeroBrokerage: searchParams.get('zeroBrokerage') === 'true',
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',').filter(Boolean) : [],
    city: searchParams.get('city') || '',
    locality: searchParams.get('locality') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.purpose) params.set('purpose', filters.purpose);
      if (filters.type) params.set('type', filters.type);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
      if (filters.bathrooms) params.set('bathrooms', filters.bathrooms);
      if (filters.furnishing) params.set('furnishing', filters.furnishing);
      if (filters.zeroBrokerage) params.set('zeroBrokerage', 'true');
      if (filters.city) params.set('city', filters.city);
      if (filters.locality) params.set('locality', filters.locality);
      if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));

      // GPS location filter
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
        params.set('radius', '35'); // 35 km radius
        params.set('sort', 'distance');
      } else {
        params.set('sort', filters.sort || 'newest');
      }

      params.set('page', page.toString());
      params.set('limit', '18');

      const res = await api.get(`/search?${params.toString()}`);
      setProperties(res.data.data || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch search results:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, userLocation]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Sync city to map center when city changes
  useEffect(() => {
    if (filters.city && CITY_COORDS[filters.city]) {
      setMapCenter(CITY_COORDS[filters.city]);
      setLocationInput(filters.city);
    }
  }, [filters.city]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);

    if (newFilters.city && CITY_COORDS[newFilters.city]) {
      setMapCenter(CITY_COORDS[newFilters.city]);
      setLocationInput(newFilters.city);
    }

    // Update URL query params with ALL filters preserved
    const params = new URLSearchParams();
    if (newFilters.purpose) params.set('purpose', newFilters.purpose);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.bedrooms) params.set('bedrooms', newFilters.bedrooms);
    if (newFilters.bathrooms) params.set('bathrooms', newFilters.bathrooms);
    if (newFilters.furnishing) params.set('furnishing', newFilters.furnishing);
    if (newFilters.zeroBrokerage) params.set('zeroBrokerage', 'true');
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.locality) params.set('locality', newFilters.locality);
    if (newFilters.amenities && newFilters.amenities.length > 0) {
      params.set('amenities', newFilters.amenities.join(','));
    }
    if (newFilters.sort) params.set('sort', newFilters.sort);
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const empty: FilterState = {
      purpose: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      furnishing: '',
      zeroBrokerage: false,
      amenities: [],
      city: '',
      locality: '',
      sort: 'newest',
    };
    setFilters(empty);
    setUserLocation(null);
    setLocationInput('');
    setSearchParams({});
    setPage(1);
  };

  const handleCitySelect = (cityName: string) => {
    setLocationInput(cityName);
    setUserLocation(null);
    if (CITY_COORDS[cityName]) {
      setMapCenter(CITY_COORDS[cityName]);
    }
    handleFilterChange({ ...filters, city: cityName });
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = locationInput.trim();
    setUserLocation(null);
    if (clean && CITY_COORDS[clean]) {
      setMapCenter(CITY_COORDS[clean]);
    }
    handleFilterChange({ ...filters, city: clean });
  };

  const handleLocateMe = (coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
    setMapCenter([coords.lng, coords.lat]);
    setLocationInput('Near My Location');
    toast.success('Found your location! Showing nearby properties.');
  };

  const handleFetchLocation = async () => {
    toast.info('Detecting your location...');

    // 1. Try browser device geolocation first
    if (navigator.geolocation) {
      const getGpsPosition = () =>
        new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { timeout: 3500, enableHighAccuracy: false, maximumAge: 60000 }
          );
        });

      try {
        const coords = await getGpsPosition();
        handleLocateMe(coords);
        return;
      } catch (err) {
        console.warn('GPS location unavailable, trying network/IP location...', err);
      }
    }

    // 2. Network/IP Location Fallback
    try {
      const res = await api.get('/search/ip-location');
      if (res.data?.lat && res.data?.lng) {
        const cityName = res.data.city || 'Mumbai';
        setUserLocation({ lat: res.data.lat, lng: res.data.lng });
        setMapCenter([res.data.lng, res.data.lat]);
        setLocationInput(cityName);
        handleFilterChange({ ...filters, city: cityName });
        toast.success(`Found your location: ${cityName}! Showing nearby properties.`);
        return;
      }
    } catch (e) {
      console.warn('IP location fetch failed:', e);
    }

    // 3. Fallback to Mumbai or current selected city
    const fallbackCity = filters.city || 'Mumbai';
    handleCitySelect(fallbackCity);
    toast.info(`Showing properties in ${fallbackCity}.`);
  };

  const handleBboxChange = async (bbox: { north: number; south: number; east: number; west: number }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        north: bbox.north.toString(),
        south: bbox.south.toString(),
        east: bbox.east.toString(),
        west: bbox.west.toString(),
      });
      // Preserve active filters during map area search
      if (filters.purpose) params.set('purpose', filters.purpose);
      if (filters.type) params.set('type', filters.type);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
      if (filters.bathrooms) params.set('bathrooms', filters.bathrooms);
      if (filters.zeroBrokerage) params.set('zeroBrokerage', 'true');

      const res = await api.get(`/search/bbox?${params.toString()}`);
      if (res.data.data) {
        setProperties(res.data.data);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error('BBox search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save searches');
      return;
    }

    try {
      await api.post('/saved-searches', {
        name: `${filters.purpose || 'All'} in ${filters.city || 'Bangalore'}`,
        filters,
        notifyOnMatch: true,
      });
      toast.success('Search criteria saved! You will receive alerts for new matches.');
    } catch {
      toast.error('Failed to save search');
    }
  };

  const toggleCompare = (p: PropertySummary) => {
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        toast.error('You can compare up to 4 properties at once');
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Location Search & Quick Hubs Bar */}
      <div className="mb-6 bg-white rounded-2xl p-4 border border-estate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Location Input Form */}
          <form onSubmit={handleLocationSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-primary-600 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter city or locality (e.g. Mumbai, Bengaluru, Indiranagar, Whitefield)"
                className="input-field pl-10 pr-4 text-sm w-full py-2.5"
              />
              {locationInput && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationInput('');
                    handleFilterChange({ ...filters, city: '' });
                  }}
                  className="absolute right-3 top-3 text-xs text-estate-400 hover:text-estate-700"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 flex-shrink-0"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>Search City</span>
            </button>
          </form>

          {/* Quick GPS Near Me Button */}
          <button
            type="button"
            onClick={handleFetchLocation}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              userLocation
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>{userLocation ? '📍 Showing Nearby (GPS)' : '📍 Find Near Me'}</span>
          </button>
        </div>

        {/* Quick Metro City Selector Pills */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-estate-100 overflow-x-auto text-xs">
          <span className="font-semibold text-estate-500 whitespace-nowrap mr-1">Metro Hubs:</span>
          <button
            type="button"
            onClick={() => handleCitySelect('')}
            className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap ${
              !filters.city && !userLocation
                ? 'bg-estate-900 text-white font-bold'
                : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
            }`}
          >
            All Cities
          </button>
          {METRO_HUBS.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => handleCitySelect(m.name)}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap ${
                filters.city?.toLowerCase() === m.name.toLowerCase()
                  ? 'bg-primary-600 text-white font-bold shadow-sm'
                  : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-estate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-estate-900">
            {userLocation ? 'Properties Near Your Location' : filters.city ? `Properties in ${filters.city}` : 'Explore Properties'}
          </h1>
          <p className="text-xs text-estate-500 mt-0.5">
            Showing {totalCount} verified listings {filters.zeroBrokerage && '• 0% Brokerage'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Save search */}
          <button
            onClick={handleSaveSearch}
            className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            title="Save this search"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Save Search
          </button>

          {/* Sort selector */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
            className="input-field text-xs py-2 w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="distance">Nearest to Center</option>
          </select>

          {/* View Mode Switches */}
          <div className="flex items-center bg-estate-100 p-1 rounded-lg border border-estate-200">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-white shadow text-primary-600' : 'text-estate-600 hover:text-estate-900'
              }`}
              title="Split Map & Grid"
            >
              <div className="flex items-center gap-1 text-xs px-1">
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow text-primary-600' : 'text-estate-600 hover:text-estate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-estate-600 hover:text-estate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-3">
          <PropertyFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Split Mode: Top Map + Bottom Grid */}
          {viewMode === 'split' && (
            <div className="space-y-6">
              <div className="h-[380px] w-full rounded-2xl overflow-hidden shadow-sm border border-estate-200">
                <PropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onSelectProperty={(p) => setSelectedProperty(p)}
                  onBoundsChange={handleBboxChange}
                  center={mapCenter}
                  zoom={12}
                  onLocateMe={handleLocateMe}
                  onCitySelect={handleCitySelect}
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : properties.length === 0 ? (
                <EmptySearchState onReset={handleResetFilters} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      isSelected={selectedProperty?.id === p.id}
                      onSelect={() => setSelectedProperty(p)}
                      onCompare={() => toggleCompare(p)}
                      isCompared={compareList.some((item) => item.id === p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grid Only Mode */}
          {viewMode === 'grid' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : properties.length === 0 ? (
                <EmptySearchState onReset={handleResetFilters} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      isSelected={selectedProperty?.id === p.id}
                      onSelect={() => setSelectedProperty(p)}
                      onCompare={() => toggleCompare(p)}
                      isCompared={compareList.some((item) => item.id === p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* List Only Mode */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : properties.length === 0 ? (
                <EmptySearchState onReset={handleResetFilters} />
              ) : (
                properties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    layout="horizontal"
                    isSelected={selectedProperty?.id === p.id}
                    onSelect={() => setSelectedProperty(p)}
                    onCompare={() => toggleCompare(p)}
                    isCompared={compareList.some((item) => item.id === p.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-estate-200">
              <span className="text-xs text-estate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="btn-outline p-2 text-xs disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="btn-outline p-2 text-xs disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Drawer Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-estate-900 text-white rounded-2xl p-3.5 px-6 shadow-2xl flex items-center gap-4 border border-estate-700 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold">{compareList.length} properties selected to compare</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompareOpen(true)}
              className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              Compare Side-by-Side
            </button>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-estate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {isCompareOpen && (
        <CompareModal
          properties={compareList}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          onRemove={(id) => setCompareList((prev) => prev.filter((p) => p.id !== id))}
        />
      )}
    </div>
  );
}

function EmptySearchState({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-estate-200 p-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-estate-100 text-estate-400 flex items-center justify-center mx-auto">
        <Building2 className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-estate-900">No properties found</h3>
        <p className="text-xs text-estate-500 mt-1 max-w-sm mx-auto">
          We couldn't find any listings matching your exact criteria. Try broadening your budget, clearing selected amenities, or exploring nearby cities.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset All Filters
      </button>
    </div>
  );
}
