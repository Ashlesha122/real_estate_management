import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, UserCheck, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import api from '../../api/client';
import { toast } from 'sonner';

export default function MyVisits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/visits/my');
      setVisits(res.data.data || []);
    } catch (err) {
      console.error('Failed to load visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleCancelVisit = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this visit?')) return;
    try {
      await api.patch(`/visits/${id}`, { status: 'CANCELLED' });
      toast.success('Site visit cancelled');
      fetchVisits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel visit');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-estate-200">
        <h1 className="text-2xl font-bold font-display text-estate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600" />
          My Site Visits & Tours
        </h1>
        <p className="text-xs text-estate-500 mt-1">
          Keep track of scheduled property walkthroughs and virtual video inspections
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-primary-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-20 bg-estate-50 rounded-2xl border border-estate-200">
          <Calendar className="w-12 h-12 text-estate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-estate-900">No scheduled visits</h3>
          <p className="text-xs text-estate-500 mt-1">
            Book in-person visits or virtual tours directly from any property page.
          </p>
          <div className="mt-5">
            <Link to="/search" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              Browse Listings
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((v) => (
            <div key={v.id} className="card p-5 hover:border-primary-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        v.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'PROPOSED'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {v.status}
                    </span>
                    <span className="text-xs font-semibold text-estate-600 flex items-center gap-1">
                      {v.mode === 'VIRTUAL' ? <Video className="w-3.5 h-3.5 text-primary-600" /> : <UserCheck className="w-3.5 h-3.5 text-estate-500" />}
                      {v.mode === 'VIRTUAL' ? 'Virtual Tour' : 'In-Person Inspection'}
                    </span>
                  </div>

                  <Link
                    to={`/properties/${v.property_id}`}
                    className="font-bold text-base text-estate-900 hover:text-primary-600 block"
                  >
                    {v.property_title || 'Property Inspection'}
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-estate-600 font-medium">
                    <span className="flex items-center gap-1 text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-primary-600" />
                      {formatDateTime(v.scheduled_at)}
                    </span>
                    {v.handler_name && (
                      <span className="text-estate-500">
                        Handler: <strong className="text-estate-800">{v.handler_name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {v.status !== 'CANCELLED' && v.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancelVisit(v.id)}
                      className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Visit
                    </button>
                  )}
                  <Link
                    to={`/properties/${v.property_id}`}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    View Property <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
