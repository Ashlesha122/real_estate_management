import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Loader2, Scale } from 'lucide-react';
import PropertyCard from '../../components/property/PropertyCard';
import CompareModal from '../../components/modals/CompareModal';
import { PropertySummary } from '../../types';
import api from '../../api/client';

export default function Wishlist() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState<PropertySummary[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      setProperties(res.data.data || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleWishlistChange = (id: string, isAdded: boolean) => {
    if (!isAdded) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setCompareList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const toggleCompare = (p: PropertySummary) => {
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) return;
      setCompareList([...compareList, p]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-estate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-estate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            My Saved Properties
          </h1>
          <p className="text-xs text-estate-500 mt-1">
            {properties.length} homes saved in your wishlist
          </p>
        </div>

        {compareList.length >= 2 && (
          <button
            onClick={() => setIsCompareOpen(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2 shadow"
          >
            <Scale className="w-4 h-4" />
            Compare {compareList.length} Properties
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-primary-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-estate-50 rounded-2xl border border-estate-200">
          <Heart className="w-12 h-12 text-estate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-estate-900">Your wishlist is empty</h3>
          <p className="text-xs text-estate-500 mt-1 max-w-sm mx-auto">
            Click the heart icon on any listing to save it here for fast comparisons and booking.
          </p>
          <div className="mt-5">
            <Link to="/search" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              <Search className="w-4 h-4" />
              Explore Listings
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isWishlisted={true}
              onWishlistChange={handleWishlistChange}
              onCompareToggle={toggleCompare}
              isComparing={compareList.some((c) => c.id === p.id)}
            />
          ))}
        </div>
      )}

      <CompareModal
        properties={compareList}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemove={(id) => setCompareList((prev) => prev.filter((p) => p.id !== id))}
      />
    </div>
  );
}
