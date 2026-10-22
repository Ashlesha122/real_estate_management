import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  PlusCircle,
  Eye,
  MessageSquare,
  Calendar,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { PropertySummary, PropertyStatus } from '../../types';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';
import api from '../../api/client';
import { toast } from 'sonner';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [pRes, lRes] = await Promise.allSettled([
        api.get('/properties/my'),
        api.get('/leads?limit=5'),
      ]);

      const props = pRes.status === 'fulfilled' ? pRes.value.data.data || [] : [];
      const leadItems = lRes.status === 'fulfilled' ? lRes.value.data.data || [] : [];

      setProperties(props);
      setLeads(leadItems);
    } catch (err) {
      console.error('Failed to load owner dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalViews = properties.reduce((acc, p: any) => acc + (p.view_count || 0), 0);
  const activeCount = properties.filter((p) => p.status === PropertyStatus.ACTIVE).length;
  const draftCount = properties.filter((p) => p.status === PropertyStatus.DRAFT).length;
  const underOfferCount = properties.filter((p) => p.status === PropertyStatus.UNDER_OFFER).length;

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/properties/${id}/publish`);
      toast.success('Property published to live search!');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish property');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-estate-900 via-primary-950 to-primary-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Owner Management Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">
            Welcome, {user?.fullName || 'Owner'}!
          </h1>
          <p className="text-estate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Manage your rental and sale listings, review inbound buyer inquiries, and finalize digital lease records.
          </p>
        </div>
        <Link
          to="/dashboard/owner/listings/new"
          className="btn-primary py-3 px-5 flex items-center gap-2 shadow-lg hover:shadow-primary-500/20 text-sm flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          + Post New Property
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Listings</span>
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{properties.length}</div>
          <div className="text-xs text-estate-500 mt-1">
            <span className="text-emerald-600 font-bold">{activeCount} active</span> • {draftCount} drafts
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Views</span>
            <Eye className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{totalViews}</div>
          <div className="text-xs text-estate-500 mt-1">Across all properties</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Inbound Leads</span>
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{leads.length}</div>
          <div className="text-xs text-estate-500 mt-1">Inquiries & tour requests</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Under Offer</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{underOfferCount}</div>
          <div className="text-xs text-estate-500 mt-1">Negotiations in progress</div>
        </div>
      </div>

      {/* Quick Navigation Pills */}
      <div className="flex flex-wrap gap-2.5 border-b border-estate-200 pb-3">
        <Link
          to="/dashboard/owner/listings"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
        >
          My Listings ({properties.length})
        </Link>
        <Link
          to="/dashboard/owner/leads"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-estate-100 text-estate-700 hover:bg-estate-200 transition-colors"
        >
          Leads CRM Board
        </Link>
        <Link
          to="/dashboard/owner/leases"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-estate-100 text-estate-700 hover:bg-estate-200 transition-colors"
        >
          Lease & Sale Records
        </Link>
      </div>

      {/* Listings Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-estate-100">
          <div>
            <h2 className="font-bold text-base text-estate-900">Your Properties</h2>
            <p className="text-xs text-estate-500">Live listings, drafts, and assigned units</p>
          </div>
          <Link
            to="/dashboard/owner/listings"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Manage All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-primary-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-14 text-estate-400">
            <Building2 className="w-12 h-12 mx-auto text-estate-300 mb-3" />
            <p className="text-sm font-semibold text-estate-700">You haven't posted any properties yet.</p>
            <p className="text-xs text-estate-400 mt-1">Post your apartment, villa, or commercial property for free.</p>
            <Link
              to="/dashboard/owner/listings/new"
              className="mt-4 inline-flex items-center gap-2 btn-primary text-xs py-2 px-4"
            >
              <PlusCircle className="w-4 h-4" />
              Post Your First Property
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-estate-200 text-estate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Property</th>
                  <th className="py-3 px-2">Type / Purpose</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-estate-100">
                {properties.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-estate-50/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80'}
                          alt={p.title}
                          className="w-12 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                        <div>
                          <Link to={`/properties/${p.id}`} className="font-bold text-estate-900 hover:text-primary-600 line-clamp-1">
                            {p.title}
                          </Link>
                          <span className="text-[11px] text-estate-400">
                            {[p.locality, p.city].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-estate-700">
                      {p.type} (For {p.purpose})
                    </td>
                    <td className="py-3 px-2 font-bold text-estate-900">
                      {formatPrice(Number(p.asking_price))}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      {p.status === PropertyStatus.DRAFT && (
                        <button
                          onClick={() => handlePublish(p.id)}
                          className="btn-primary text-[11px] py-1 px-2.5 font-bold"
                        >
                          Publish Live
                        </button>
                      )}
                      <Link
                        to={`/properties/${p.id}`}
                        className="btn-outline text-[11px] py-1 px-2.5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
