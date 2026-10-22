import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { PropertySummary, VisitStatus, LeadStage } from '../../types';
import { formatPrice, formatDate, formatDateTime, getStatusColor, getLeadStageColor } from '../../lib/utils';
import api from '../../api/client';
import { toast } from 'sonner';

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, lRes, vRes] = await Promise.allSettled([
        api.get('/properties/assigned'),
        api.get('/leads?limit=20'),
        api.get('/visits/handler?limit=20'),
      ]);

      setProperties(pRes.status === 'fulfilled' ? pRes.value.data.data || [] : []);
      setLeads(lRes.status === 'fulfilled' ? lRes.value.data.data || [] : []);
      setVisits(vRes.status === 'fulfilled' ? vRes.value.data.data || [] : []);
    } catch (err) {
      console.error('Failed to load broker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmVisit = async (visitId: string) => {
    try {
      await api.patch(`/visits/${visitId}`, { status: VisitStatus.CONFIRMED });
      toast.success('Site visit confirmed! Notification sent to buyer.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm visit');
    }
  };

  const handleCancelVisit = async (visitId: string) => {
    try {
      await api.patch(`/visits/${visitId}`, { status: VisitStatus.CANCELLED });
      toast.success('Visit cancelled');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel visit');
    }
  };

  const handleStageChange = async (leadId: string, stage: LeadStage) => {
    try {
      await api.patch(`/leads/${leadId}`, { stage });
      toast.success(`Lead moved to ${stage.replace(/_/g, ' ')}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update lead');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-estate-900 via-primary-950 to-primary-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" /> Broker Partner Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">
            Agent Dashboard • {user?.fullName}
          </h1>
          <p className="text-estate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Coordinate site visits, lead status updates, and buyer negotiations for your assigned client properties.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Assigned Listings</span>
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{properties.length}</div>
          <div className="text-xs text-estate-500 mt-1">Properties under your care</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Active Leads</span>
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{leads.length}</div>
          <div className="text-xs text-estate-500 mt-1">Buyers seeking information</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-estate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Site Visits</span>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-display text-estate-900">{visits.length}</div>
          <div className="text-xs text-estate-500 mt-1">Upcoming walkthroughs</div>
        </div>
      </div>

      {/* Visits Scheduling Queue */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-estate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-base text-estate-900">Visit Requests Queue</h2>
          </div>
          <span className="text-xs text-estate-500 font-medium">
            {visits.filter((v) => v.status === 'PROPOSED').length} pending confirmation
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-primary-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-8 text-xs text-estate-400">
            No site visit appointments currently scheduled.
          </div>
        ) : (
          <div className="divide-y divide-estate-100">
            {visits.map((v) => (
              <div key={v.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'PROPOSED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-estate-100 text-estate-700'
                      }`}
                    >
                      {v.status}
                    </span>
                    <span className="text-xs text-estate-500 uppercase font-semibold">
                      {v.mode}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-estate-900">{v.property_title || 'Property'}</h4>
                  <div className="flex items-center gap-4 text-xs text-estate-600">
                    <span className="flex items-center gap-1 text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5" /> {formatDateTime(v.scheduled_at)}
                    </span>
                    <span>Buyer: <strong>{v.buyer_name}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {v.status === 'PROPOSED' && (
                    <button
                      onClick={() => handleConfirmVisit(v.id)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}
                  {v.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancelVisit(v.id)}
                      className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Properties Grid */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-base text-estate-900 pb-3 border-b border-estate-100">
          Assigned Properties Under Management
        </h2>

        {properties.length === 0 ? (
          <div className="text-center py-8 text-xs text-estate-400">
            No properties assigned yet. Owners can assign you when creating or managing listings.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <div key={p.id} className="border border-estate-200 rounded-xl p-4 space-y-2 hover:border-primary-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                  <span className="text-xs font-bold text-estate-900">
                    {formatPrice(Number(p.asking_price))}
                  </span>
                </div>
                <Link to={`/properties/${p.id}`} className="font-bold text-sm text-estate-900 hover:text-primary-600 block line-clamp-1">
                  {p.title}
                </Link>
                <p className="text-xs text-estate-500">
                  {[p.locality, p.city].filter(Boolean).join(', ')}
                </p>
                <div className="pt-2 border-t border-estate-100 flex justify-between items-center text-xs">
                  <span className="text-estate-400">{p.type} • For {p.purpose}</span>
                  <Link to={`/properties/${p.id}`} className="text-primary-600 font-semibold hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
