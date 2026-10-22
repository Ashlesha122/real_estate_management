import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  MapPin,
  Building2,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  KeyRound,
  CheckCircle,
  Home,
  Check
} from 'lucide-react';
import { PropertyPurpose, PropertyType, PropertySummary } from '../types';
import PropertyCard from '../components/property/PropertyCard';
import api from '../api/client';

export default function Landing() {
  const [purpose, setPurpose] = useState<PropertyPurpose>(PropertyPurpose.RENT);
  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [featuredProperties, setFeaturedProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const { data } = await api.get('/search?limit=6&sort=newest');
        setFeaturedProperties(data.data || []);
      } catch (err) {
        console.error('Failed to load featured properties:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (purpose) params.set('purpose', purpose);
    if (query.trim()) params.set('city', query.trim());
    if (propertyType) params.set('type', propertyType);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-950 via-estate-900 to-estate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative backdrop blobs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-primary-200">
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
            Direct Owner Listings & Zero Brokerage Available
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-tight max-w-4xl mx-auto">
            Find Your Dream Home with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-200 to-accent-300">
              Zero Hassle & Zero Brokerage
            </span>
          </h1>

          <p className="text-base sm:text-lg text-estate-300 max-w-2xl mx-auto leading-relaxed">
            Verified properties, transparent pricing, direct WhatsApp scheduling, and digital lease records.
          </p>

          {/* Search Box Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-4 sm:p-5 shadow-2xl text-estate-900 text-left border border-white/20">
            {/* Purpose tabs */}
            <div className="flex gap-2 pb-4 border-b border-estate-100">
              <button
                type="button"
                onClick={() => setPurpose(PropertyPurpose.RENT)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  purpose === PropertyPurpose.RENT
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-estate-100 text-estate-600 hover:bg-estate-200'
                }`}
              >
                Rent a Home
              </button>
              <button
                type="button"
                onClick={() => setPurpose(PropertyPurpose.SALE)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  purpose === PropertyPurpose.SALE
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-estate-100 text-estate-600 hover:bg-estate-200'
                }`}
              >
                Buy a Property
              </button>
              <button
                type="button"
                onClick={() => navigate('/search?zeroBrokerage=true')}
                className="ml-auto hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero Brokerage Only
              </button>
            </div>

            {/* Inputs */}
            <form onSubmit={handleSearch} className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <MapPin className="w-4 h-4 text-estate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter City, Locality or Landmark (e.g. Indiranagar, Bengaluru)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Property Types</option>
                  <option value={PropertyType.APARTMENT}>Apartment / Flat</option>
                  <option value={PropertyType.VILLA}>Villa / Independent House</option>
                  <option value={PropertyType.PLOT}>Residential Plot</option>
                  <option value={PropertyType.COMMERCIAL}>Commercial Space</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full btn-primary py-2.5 px-4 flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <SearchIcon className="w-4 h-4" />
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 max-w-4xl mx-auto border-t border-white/10 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-estate-400 mt-1 font-medium">Verified Listings</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-accent-400">₹0</div>
              <div className="text-xs text-estate-400 mt-1 font-medium">Brokerage on Direct Units</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">48 hrs</div>
              <div className="text-xs text-estate-400 mt-1 font-medium">Average Visit Booking</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">10k+</div>
              <div className="text-xs text-estate-400 mt-1 font-medium">Happy Tenants & Buyers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-primary-600 tracking-wider">Handpicked</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-estate-900 mt-1">
              Featured Properties
            </h2>
            <p className="text-xs sm:text-sm text-estate-500 mt-1">
              Explore freshly verified homes available for rent and sale
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Explore all listings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card p-4 animate-pulse space-y-4">
                <div className="aspect-[16/10] bg-estate-200 rounded-lg" />
                <div className="h-4 bg-estate-200 rounded w-2/3" />
                <div className="h-3 bg-estate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-estate-500 bg-estate-50 rounded-2xl border border-estate-200">
            <Building2 className="w-12 h-12 mx-auto text-estate-300 mb-3" />
            <p className="font-medium text-sm">No properties listed yet.</p>
            <p className="text-xs text-estate-400 mt-1">Run database seed or post your own property.</p>
          </div>
        )}
      </section>

      {/* Zero Brokerage Advantage Section */}
      <section className="bg-emerald-950 text-white py-16 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              The Direct-to-Owner Revolution
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-snug">
              Say Goodbye to Heavy Brokerage Fees.
            </h2>
            <p className="text-emerald-200 text-sm sm:text-base leading-relaxed">
              Traditional brokers charge 1-2 months rent or 2% of the property value. With EstateFlow’s Direct Handling mode, connect directly with verified property owners at zero broker fee.
            </p>
            <div className="space-y-3 pt-2">
              {[
                'Direct phone & WhatsApp contact with verified homeowners',
                'Pre-scheduled physical and virtual walkthrough slots',
                'Automated digital lease record management',
                'Transparent pricing with zero hidden commission markups',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-emerald-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Link
                to="/search?zeroBrokerage=true"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 text-sm"
              >
                Browse Zero Brokerage Homes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-emerald-900/60 p-6 sm:p-8 rounded-2xl border border-emerald-700/50 backdrop-blur-md space-y-6">
            <h3 className="font-bold text-lg text-emerald-100">Brokerage Savings Calculator</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-emerald-800">
                <span className="text-xs text-emerald-300">Monthly Rent</span>
                <span className="font-bold text-base text-white">₹35,000 / mo</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-emerald-800">
                <span className="text-xs text-emerald-300">Traditional Brokerage (1.5 mo)</span>
                <span className="font-bold text-base text-rose-300 line-through">₹52,500</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Your Total Savings</span>
                  <div className="text-3xl font-extrabold text-white mt-0.5">₹52,500</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                    100% Free
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Property Owners CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
              For Property Owners
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              List Your Property & Find High-Quality Tenants Faster
            </h2>
            <p className="text-primary-100 text-sm leading-relaxed">
              Publish your residential or commercial listings in minutes. Get verified inquiries, automate inspection slots, and track leads on an integrated CRM board.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard/owner/listings/new"
              className="bg-white hover:bg-estate-100 text-primary-900 font-bold px-6 py-3.5 rounded-xl transition-all shadow-md text-sm text-center"
            >
              Post Free Listing
            </Link>
            <Link
              to="/login"
              className="bg-primary-800/80 hover:bg-primary-800 text-white font-medium border border-white/20 px-6 py-3.5 rounded-xl transition-all text-sm text-center"
            >
              Owner Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
