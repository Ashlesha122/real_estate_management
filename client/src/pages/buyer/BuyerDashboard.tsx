import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Heart,
  MessageSquare,
  Calendar,
  Search,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  Building2,
  ShieldCheck
} from 'lucide-react';
import api from '../../api/client';
import { formatDate } from '../../lib/utils';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    wishlistCount: 0,
    inquiryCount: 0,
    visitCount: 0,
  });
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [wRes, iRes, vRes] = await Promise.allSettled([
          api.get('/wishlist?limit=1'),
          api.get('/inquiries/my?limit=1'),
          api.get('/visits/my?limit=5'),
        ]);

        const wishlistCount = wRes.status === 'fulfilled' ? wRes.value.data.total || 0 : 0;
        const inquiryCount = iRes.status === 'fulfilled' ? iRes.value.data.total || 0 : 0;
        const visitCount = vRes.status === 'fulfilled' ? vRes.value.data.total || 0 : 0;
        const visits = vRes.status === 'fulfilled' ? vRes.value.data.data || [] : [];

        setStats({ wishlistCount, inquiryCount, visitCount });
        setRecentVisits(visits);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
            Buyer & Tenant Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display mt-1">
            Welcome, {user?.fullName || 'Seeker'}!
          </h1>
          <p className="text-primary-100 text-xs sm:text-sm mt-1 max-w-xl">
            Track your saved listings, upcoming physical/virtual site inspections, and direct chats with owners.
          </p>
        </div>
        <Link
          to="/search"
          className="bg-white text-primary-900 hover:bg-estate-100 font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow"
        >
          <Search className="w-4 h-4" />
          Explore Properties
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          to="/dashboard/buyer/wishlist"
          className="card p-6 flex items-center gap-4 hover:border-primary-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6 fill-rose-100" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-estate-900">{stats.wishlistCount}</div>
            <div className="text-xs text-estate-500 font-medium">Saved Properties</div>
          </div>
          <ArrowRight className="w-4 h-4 text-estate-300 group-hover:text-primary-600 ml-auto" />
        </Link>

        <Link
          to="/dashboard/buyer/visits"
          className="card p-6 flex items-center gap-4 hover:border-primary-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-estate-900">{stats.visitCount}</div>
            <div className="text-xs text-estate-500 font-medium">Scheduled Visits</div>
          </div>
          <ArrowRight className="w-4 h-4 text-estate-300 group-hover:text-primary-600 ml-auto" />
        </Link>

        <Link
          to="/dashboard/buyer/inquiries"
          className="card p-6 flex items-center gap-4 hover:border-primary-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-estate-900">{stats.inquiryCount}</div>
            <div className="text-xs text-estate-500 font-medium">Active Inquiries</div>
          </div>
          <ArrowRight className="w-4 h-4 text-estate-300 group-hover:text-primary-600 ml-auto" />
        </Link>
      </div>

      {/* Upcoming Visits Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-estate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-base text-estate-900">Upcoming Site Visits</h2>
          </div>
          <Link
            to="/dashboard/buyer/visits"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all visits <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentVisits.length === 0 ? (
          <div className="text-center py-10 text-estate-400">
            <Calendar className="w-10 h-10 mx-auto text-estate-300 mb-2" />
            <p className="text-xs">No upcoming site visits scheduled.</p>
            <Link to="/search" className="text-xs font-bold text-primary-600 hover:underline mt-1 block">
              Browse listings to schedule a walkthrough
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-estate-100">
            {recentVisits.map((v) => (
              <div key={v.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-estate-900">{v.property_title || 'Property Inspection'}</h4>
                  <div className="flex items-center gap-4 text-xs text-estate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-estate-400" />
                      {new Date(v.scheduled_at).toLocaleDateString()} at {new Date(v.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-estate-100">
                      {v.mode}
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      v.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'PROPOSED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-estate-100 text-estate-700'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
