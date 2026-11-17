import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  MapPin,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  Percent
} from 'lucide-react';
import { PropertyPurpose, PropertyType, PropertySummary } from '../types';
import PropertyCard from '../components/property/PropertyCard';
import api from '../api/client';
import { formatPrice } from '../lib/utils';

export default function Landing() {
  const [purpose, setPurpose] = useState<PropertyPurpose>(PropertyPurpose.RENT);
  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [featuredProperties, setFeaturedProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Brokerage Savings Calculator State
  const [calcMode, setCalcMode] = useState<'RENT' | 'BUY'>('RENT');
  const [calcRentAmount, setCalcRentAmount] = useState<number>(35000);
  const [calcBuyAmount, setCalcBuyAmount] = useState<number>(12000000); // 1.2 Cr

  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const { data } = await api.get('/search?limit=12&sort=newest');
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

  const handleQuickCity = (city: string) => {
    const params = new URLSearchParams();
    if (purpose) params.set('purpose', purpose);
    params.set('city', city);
    navigate(`/search?${params.toString()}`);
  };

  // Filter properties based on city pill
  const filteredProperties = useMemo(() => {
    if (selectedCity === 'ALL') return featuredProperties.slice(0, 6);
    return featuredProperties
      .filter((p) => p.city?.toLowerCase() === selectedCity.toLowerCase())
      .slice(0, 6);
  }, [featuredProperties, selectedCity]);

  // Calculator savings math
  const calculatedSavings = useMemo(() => {
    if (calcMode === 'RENT') {
      const traditionalBrokerage = Math.round(calcRentAmount * 1.5);
      return {
        brokerage: traditionalBrokerage,
        netSavings: traditionalBrokerage,
      };
    } else {
      const traditionalBrokerage = Math.round(calcBuyAmount * 0.02);
      return {
        brokerage: traditionalBrokerage,
        netSavings: traditionalBrokerage,
      };
    }
  }, [calcMode, calcRentAmount, calcBuyAmount]);

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-950 via-estate-900 to-estate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle backdrop blobs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-primary-200">
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
            Verified Properties with Zero Brokerage
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-tight max-w-4xl mx-auto">
            Find Your Dream Home with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-200 to-accent-300">
              Zero Hassle & Zero Brokerage
            </span>
          </h1>

          <p className="text-base sm:text-lg text-estate-300 max-w-2xl mx-auto leading-relaxed">
            Verified luxury apartments, villas and penthouses across Bengaluru, Mumbai, Delhi NCR, Hyderabad and Chennai. Connect directly with owners.
          </p>

          {/* Search Box Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-4 sm:p-5 shadow-2xl text-estate-900 text-left border border-white/20">
            {/* Purpose tabs */}
            <div className="flex gap-2 pb-4 border-b border-estate-100 items-center">
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
                  className="w-full h-full btn-primary py-2.5 px-4 flex items-center justify-center gap-2 text-sm shadow-md font-bold"
                >
                  <SearchIcon className="w-4 h-4" />
                  Search
                </button>
              </div>
            </form>

            {/* Popular City Quick Filter Tags */}
            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs text-estate-500">
              <span className="font-semibold text-estate-700">Top Metros:</span>
              {['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleQuickCity(c)}
                  className="px-2.5 py-0.5 rounded-full bg-estate-100 hover:bg-primary-50 hover:text-primary-700 text-estate-600 transition-colors font-medium"
                >
                  {c === 'Bangalore' ? 'Bengaluru' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 max-w-3xl mx-auto border-t border-white/10 text-center">
            <div>
              <div className="text-2xl font-extrabold text-white">100%</div>
              <div className="text-xs text-estate-400 mt-0.5 font-medium">RERA & Title Verified</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent-400">₹0</div>
              <div className="text-xs text-estate-400 mt-0.5 font-medium">Brokerage on Direct Units</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">Direct</div>
              <div className="text-xs text-estate-400 mt-0.5 font-medium">Owner WhatsApp Connect</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">5 Metros</div>
              <div className="text-xs text-estate-400 mt-0.5 font-medium">Curated Prime Listings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section with City Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-primary-600 tracking-wider">Verified Listings</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-estate-900 mt-1">
              Featured Properties
            </h2>
            <p className="text-xs sm:text-sm text-estate-500 mt-0.5">
              Explore verified homes available for rent and sale
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

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4">
          {[
            { label: 'All Metros', value: 'ALL' },
            { label: 'Bengaluru', value: 'Bangalore' },
            { label: 'Mumbai', value: 'Mumbai' },
            { label: 'Delhi NCR', value: 'Delhi' },
            { label: 'Hyderabad', value: 'Hyderabad' },
            { label: 'Chennai', value: 'Chennai' },
          ].map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCity(c.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCity === c.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
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
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-estate-500 bg-estate-50 rounded-2xl border border-estate-200">
            <Building2 className="w-12 h-12 mx-auto text-estate-300 mb-3" />
            <p className="font-medium text-sm">No properties in this category yet.</p>
            <p className="text-xs text-estate-400 mt-1">Select another city tab or browse all listings.</p>
          </div>
        )}
      </section>

      {/* Brokerage Savings Advantage Section */}
      <section className="bg-emerald-950 text-white py-14 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct Owner Transparency
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-snug">
              Save Big on Brokerage Fees.
            </h2>
            <p className="text-emerald-200 text-sm sm:text-base leading-relaxed">
              Traditional brokers charge 1-2 months rent or 2% of the property value. With EstateFlow’s Direct Owner listings, connect directly with verified property owners at zero commission.
            </p>
            <div className="space-y-2.5 pt-1">
              {[
                'Direct phone & WhatsApp contact with verified homeowners',
                'Pre-scheduled physical and virtual inspection slots',
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
            <div className="pt-3">
              <Link
                to="/search?zeroBrokerage=true"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg text-sm"
              >
                Browse Zero Brokerage Homes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Calculator Card */}
          <div className="lg:col-span-5 bg-emerald-900/70 p-6 sm:p-7 rounded-2xl border border-emerald-700/60 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <h3 className="font-bold text-base text-emerald-100 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" /> Savings Calculator
              </h3>
              <div className="flex gap-1 bg-emerald-950/60 p-1 rounded-lg border border-emerald-800">
                <button
                  type="button"
                  onClick={() => setCalcMode('RENT')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    calcMode === 'RENT' ? 'bg-emerald-500 text-emerald-950' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  Rent
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('BUY')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    calcMode === 'BUY' ? 'bg-emerald-500 text-emerald-950' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  Buy
                </button>
              </div>
            </div>

            {/* Slider */}
            {calcMode === 'RENT' ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-emerald-200">
                  <span>Monthly Rent:</span>
                  <span className="font-bold text-white text-sm">₹{calcRentAmount.toLocaleString('en-IN')} / mo</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="250000"
                  step="5000"
                  value={calcRentAmount}
                  onChange={(e) => setCalcRentAmount(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-emerald-400">
                  <span>₹15,000</span>
                  <span>₹2,50,000</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-emerald-200">
                  <span>Property Price:</span>
                  <span className="font-bold text-white text-sm">{formatPrice(calcBuyAmount)}</span>
                </div>
                <input
                  type="range"
                  min="4000000"
                  max="50000000"
                  step="1000000"
                  value={calcBuyAmount}
                  onChange={(e) => setCalcBuyAmount(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-emerald-400">
                  <span>₹40 Lakhs</span>
                  <span>₹5 Crores+</span>
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex justify-between items-center text-emerald-300">
                <span>Traditional Brokerage {calcMode === 'RENT' ? '(1.5 mo)' : '(2%)'}</span>
                <span className="font-bold text-rose-300 line-through text-sm">
                  ₹{calculatedSavings.brokerage.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-300">
                <span>EstateFlow Fee</span>
                <span className="font-bold text-emerald-300 text-sm">₹0 (Free)</span>
              </div>
              <div className="pt-2.5 border-t border-emerald-800 flex justify-between items-end">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
                    Your Savings
                  </span>
                  <div className="text-2xl font-extrabold text-white mt-0.5">
                    ₹{calculatedSavings.netSavings.toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                  100% Free
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Property Owners CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
              For Property Owners
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              List Your Property & Find Direct Tenants
            </h2>
            <p className="text-primary-100 text-sm leading-relaxed">
              Publish your listings in minutes. Receive direct verified inquiries, schedule walkthrough slots, and track leads on an integrated dashboard.
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
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
