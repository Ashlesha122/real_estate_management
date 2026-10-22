import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Map as MapIcon,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
  Building2,
  Scale
} from 'lucide-react';
import { PropertySummary } from '../types';
import PropertyCard from '../components/property/PropertyCard';
import PropertyMap from '../components/property/PropertyMap';
import PropertyFilters, { FilterState } from '../components/property/PropertyFilters';
import CompareModal from '../components/modals/CompareModal';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : [],
    city: searchParams.get('city') || '',
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
      if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
      params.set('sort', filters.sort || 'newest');
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
  }, [filters, page]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);

    // Update URL query params
    const params = new URLSearchParams();
    if (newFilters.purpose) params.set('purpose', newFilters.purpose);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.bedrooms) params.set('bedrooms', newFilters.bedrooms);
    if (newFilters.zeroBrokerage) params.set('zeroBrokerage', 'true');
    if (newFilters.city) params.set('city', newFilters.city);
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
      sort: 'newest',
    };
    setFilters(empty);
    setSearchParams({});
    setPage(1);
  };

  const handleBboxChange = async (bbox: { north: number; south: number; east: number; west: number }) => {
    try {
      const params = new URLSearchParams({
        north: bbox.north.toString(),
        south: bbox.south.toString(),
        east: bbox.east.toString(),
        west: bbox.west.toString(),
      });
      if (filters.purpose) params.set('purpose', filters.purpose);
      if (filters.type) params.set('type', filters.type);
      if (filters.zeroBrokerage) params.set('zeroBrokerage', 'true');

      const res = await api.get(`/search/bbox?${params.toString()}`);
      if (res.data.data) {
        setProperties(res.data.data);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error('BBox search error:', err);
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
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-estate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-estate-900">
            {filters.city ? `Properties in ${filters.city}` : 'Explore Properties'}
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
        <div className={viewMode === 'split' ? 'lg:col-span-9' : 'lg:col-span-9'}>
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px]">
              {/* Properties column */}
              <div className="xl:col-span-7 overflow-y-auto pr-2 space-y-4">
                {loading ? (
                  <div className="py-20 flex justify-center text-primary-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-estate-200">
                    <Building2 className="w-12 h-12 mx-auto text-estate-300 mb-2" />
                    <h3 className="font-bold text-estate-900 text-base">No properties found</h3>
                    <p className="text-xs text-estate-500 mt-1">Try clearing filters or moving the map.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {properties.map((p) => (
                      <div
                        key={p.id}
                        onMouseEnter={() => setSelectedProperty(p)}
                        className={`transition-all rounded-xl ${
                          selectedProperty?.id === p.id ? 'ring-2 ring-primary-500 shadow-md' : ''
                        }`}
                      >
                        <PropertyCard
                          property={p}
                          onCompareToggle={toggleCompare}
                          isComparing={compareList.some((c) => c.id === p.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Map column */}
              <div className="xl:col-span-5 h-[350px] xl:h-full sticky top-24">
                <PropertyMap
                  properties={properties}
                  selectedProperty={selectedProperty}
                  onSelectProperty={setSelectedProperty}
                  onBoundsChange={handleBboxChange}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="py-20 flex justify-center text-primary-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-estate-200">
                  <Building2 className="w-12 h-12 mx-auto text-estate-300 mb-2" />
                  <h3 className="font-bold text-estate-900 text-base">No listings match your criteria</h3>
                  <p className="text-xs text-estate-500 mt-1">Try loosening price or location filters</p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'grid grid-cols-1 gap-4'
                  }
                >
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onCompareToggle={toggleCompare}
                      isComparing={compareList.some((c) => c.id === p.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border border-estate-300 rounded-lg hover:bg-estate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-4 text-estate-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border border-estate-300 rounded-lg hover:bg-estate-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-estate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <Scale className="w-5 h-5 text-primary-400" />
          <span className="text-xs font-medium">
            <strong className="text-white font-bold">{compareList.length}</strong> properties selected for comparison
          </span>
          <button
            onClick={() => setIsCompareOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 shadow"
          >
            Compare Now
          </button>
          <button
            onClick={() => setCompareList([])}
            className="text-xs text-estate-400 hover:text-white underline ml-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        properties={compareList}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemove={(id) => setCompareList(compareList.filter((p) => p.id !== id))}
      />
    </div>
  );
}
