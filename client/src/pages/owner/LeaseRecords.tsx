import { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Calendar,
  DollarSign,
  User,
  Phone,
  CheckCircle2,
  Building2,
  X,
  Loader2
} from 'lucide-react';
import { RecordType, PropertySummary } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import api from '../../api/client';
import { toast } from 'sonner';

export default function LeaseRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    recordType: RecordType.LEASE,
    counterpartyName: '',
    counterpartyPhone: '',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, pRes] = await Promise.allSettled([
        api.get('/lease-records'),
        api.get('/properties/my'),
      ]);

      const recs = rRes.status === 'fulfilled' ? rRes.value.data.data || [] : [];
      const props = pRes.status === 'fulfilled' ? pRes.value.data.data || [] : [];

      setRecords(recs);
      setProperties(props);
      if (props.length > 0 && !formData.propertyId) {
        setFormData((prev) => ({ ...prev, propertyId: props[0].id }));
      }
    } catch (err) {
      console.error('Failed to load lease records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId) {
      toast.error('Please select a property');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/lease-records', {
        propertyId: formData.propertyId,
        recordType: formData.recordType,
        counterpartyName: formData.counterpartyName,
        counterpartyPhone: formData.counterpartyPhone || null,
        amount: Number(formData.amount),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        notes: formData.notes || null,
      });

      toast.success('Lease / Sale record created successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-estate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-estate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Lease & Sale Records
          </h1>
          <p className="text-xs text-estate-500 mt-1">
            Official agreements, tenant lease terms, sale deed records, and payment tracking
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2 self-start sm:self-auto shadow"
        >
          <PlusCircle className="w-4 h-4" />
          + New Agreement Record
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-primary-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-estate-50 rounded-2xl border border-estate-200">
          <FileText className="w-12 h-12 text-estate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-estate-900">No finalized agreements recorded yet</h3>
          <p className="text-xs text-estate-500 mt-1">
            Record tenancy contracts and sale transactions to automatically update property availability.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Add Record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((r) => (
            <div key={r.id} className="card p-5 space-y-3 hover:border-primary-300 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-estate-100">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    r.record_type === 'LEASE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {r.record_type} AGREEMENT
                </span>
                <span className="text-sm font-bold text-estate-900">
                  {formatPrice(Number(r.amount))}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-estate-900 line-clamp-1">{r.property_title || 'Property'}</h4>
                <div className="text-xs text-estate-500 flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5 text-estate-400" />
                  <span>Tenant/Buyer: <strong>{r.counterparty_name}</strong></span>
                </div>
                {r.counterparty_phone && (
                  <div className="text-xs text-estate-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-estate-400" />
                    <span>{r.counterparty_phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-estate-100 flex items-center justify-between text-xs text-estate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-estate-400" />
                  {formatDate(r.start_date)} {r.end_date ? `to ${formatDate(r.end_date)}` : ''}
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>

              {r.notes && (
                <p className="text-[11px] text-estate-600 bg-estate-50 p-2 rounded border border-estate-100">
                  {r.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-estate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-estate-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-estate-400 hover:text-estate-700 rounded-lg hover:bg-estate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-estate-900 mb-1">Add Agreement Record</h3>
            <p className="text-xs text-estate-500 mb-4">
              Record a signed lease agreement or property sale deed
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Property *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.locality}, {p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Record Type
                  </label>
                  <select
                    value={formData.recordType}
                    onChange={(e) => setFormData({ ...formData, recordType: e.target.value as RecordType })}
                    className="input-field text-sm"
                  >
                    <option value={RecordType.LEASE}>Lease / Tenancy</option>
                    <option value={RecordType.SALE}>Sale Deed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Rent/Sale Amount"
                    className="input-field text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Counterparty Name *
                  </label>
                  <input
                    type="text"
                    value={formData.counterpartyName}
                    onChange={(e) => setFormData({ ...formData, counterpartyName: e.target.value })}
                    placeholder="Tenant/Buyer Name"
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.counterpartyPhone}
                    onChange={(e) => setFormData({ ...formData, counterpartyPhone: e.target.value })}
                    placeholder="+91..."
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    End Date (Lease expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Terms, notice period, lock-in duration..."
                  className="input-field text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
