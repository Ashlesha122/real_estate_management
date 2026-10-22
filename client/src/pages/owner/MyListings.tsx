import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Upload,
  UserCheck,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PropertySummary, PropertyStatus, PropertyPurpose, HandlingMode } from '../../types';
import { formatPrice, formatDate, getStatusColor, getPropertyTypeLabel } from '../../lib/utils';
import api from '../../api/client';
import { toast } from 'sonner';

export default function MyListings() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedPropertyForBroker, setSelectedPropertyForBroker] = useState<PropertySummary | null>(null);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [assigningBroker, setAssigningBroker] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/my');
      setProperties(res.data.data || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/properties/${id}/publish`);
      toast.success('Property published to active listings!');
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Publishing failed. Check required details.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: PropertyStatus) => {
    try {
      await api.patch(`/properties/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid status transition');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Listing deleted');
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot delete this property');
    }
  };

  const openBrokerModal = async (property: PropertySummary) => {
    setSelectedPropertyForBroker(property);
    try {
      const res = await api.get('/brokers');
      setBrokers(res.data || []);
    } catch {
      toast.error('Failed to load verified brokers');
    }
  };

  const handleAssignBroker = async (brokerId: string) => {
    if (!selectedPropertyForBroker) return;
    try {
      setAssigningBroker(true);
      await api.patch(`/properties/${selectedPropertyForBroker.id}`, {
        brokerId,
        handlingMode: HandlingMode.BROKER_ASSISTED,
      });
      toast.success('Broker assigned successfully!');
      setSelectedPropertyForBroker(null);
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign broker');
    } finally {
      setAssigningBroker(false);
    }
  };

  const filtered = filterStatus === 'ALL'
    ? properties
    : properties.filter((p) => p.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-estate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-estate-900">My Listings</h1>
          <p className="text-xs text-estate-500 mt-1">
            Manage your properties, review status machine transitions, and assign licensed brokers
          </p>
        </div>
        <Link
          to="/dashboard/owner/listings/new"
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 self-start sm:self-auto shadow"
        >
          <PlusCircle className="w-4 h-4" />
          + Post New Property
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', PropertyStatus.ACTIVE, PropertyStatus.DRAFT, PropertyStatus.UNDER_OFFER, PropertyStatus.SOLD, PropertyStatus.RENTED, PropertyStatus.INACTIVE].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === st
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="py-20 flex justify-center text-primary-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-estate-50 rounded-2xl border border-estate-200">
          <Building2 className="w-12 h-12 text-estate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-estate-900">No properties in this category</h3>
          <p className="text-xs text-estate-500 mt-1">Create a new listing to start getting buyer inquiries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-5 hover:border-primary-200 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Details */}
                <div className="flex items-start gap-4">
                  <img
                    src={p.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80'}
                    alt={p.title}
                    className="w-24 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                      <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {p.purpose} • {getPropertyTypeLabel(p.type)}
                      </span>
                      <span className="text-xs text-estate-400">
                        {p.handling_mode === 'DIRECT' ? '⚡ Zero Brokerage' : '🤝 Broker Assisted'}
                      </span>
                    </div>

                    <Link to={`/properties/${p.id}`} className="font-bold text-base text-estate-900 hover:text-primary-600 line-clamp-1">
                      {p.title}
                    </Link>

                    <p className="text-xs text-estate-500">
                      {[p.locality, p.city].filter(Boolean).join(', ')} • Created on {formatDate(p.created_at)}
                    </p>

                    <div className="text-sm font-extrabold text-estate-900">
                      {formatPrice(Number(p.asking_price))}
                      {p.purpose === PropertyPurpose.RENT && <span className="text-xs font-normal text-estate-500">/mo</span>}
                    </div>
                  </div>
                </div>

                {/* Status transitions & Actions */}
                <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end flex-shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-estate-100">
                  <div className="flex items-center gap-2">
                    {p.status === PropertyStatus.DRAFT && (
                      <button
                        onClick={() => handlePublish(p.id)}
                        className="btn-primary text-xs py-1.5 px-3 font-bold"
                      >
                        Publish Live
                      </button>
                    )}

                    {p.status === PropertyStatus.ACTIVE && (
                      <button
                        onClick={() => handleStatusChange(p.id, PropertyStatus.UNDER_OFFER)}
                        className="text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-1.5 px-3 rounded-lg"
                      >
                        Mark Under Offer
                      </button>
                    )}

                    {p.status === PropertyStatus.UNDER_OFFER && (
                      <>
                        <button
                          onClick={() => handleStatusChange(p.id, p.purpose === PropertyPurpose.RENT ? PropertyStatus.RENTED : PropertyStatus.SOLD)}
                          className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-1.5 px-3 rounded-lg"
                        >
                          Mark as {p.purpose === PropertyPurpose.RENT ? 'Rented' : 'Sold'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(p.id, PropertyStatus.ACTIVE)}
                          className="text-xs font-semibold bg-estate-100 hover:bg-estate-200 text-estate-700 py-1.5 px-3 rounded-lg"
                        >
                          Re-activate
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => openBrokerModal(p)}
                      className="text-xs font-semibold text-estate-700 hover:bg-estate-100 border border-estate-300 py-1.5 px-2.5 rounded-lg flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                      Assign Broker
                    </button>

                    <Link
                      to={`/properties/${p.id}`}
                      className="btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>

                    {(p.status === PropertyStatus.DRAFT || p.status === PropertyStatus.INACTIVE) && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Delete Property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broker Assignment Modal */}
      {selectedPropertyForBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-estate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-estate-200 space-y-4">
            <h3 className="font-bold text-base text-estate-900">Assign a Licensed Broker</h3>
            <p className="text-xs text-estate-500">
              Select an authorized real estate agent to coordinate site visits and handle buyer negotiations for this property.
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-estate-100">
              {brokers.length === 0 ? (
                <div className="py-6 text-center text-xs text-estate-400">
                  No verified brokers available yet.
                </div>
              ) : (
                brokers.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-estate-900">{b.full_name}</div>
                      <div className="text-[11px] text-estate-500">{b.email} • {b.phone}</div>
                    </div>
                    <button
                      onClick={() => handleAssignBroker(b.id)}
                      disabled={assigningBroker}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPropertyForBroker(null)}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
