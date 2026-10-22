import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, Building2, Clock, Phone, Loader2, ArrowRight } from 'lucide-react';
import { formatDate, getLeadStageColor } from '../../lib/utils';
import api from '../../api/client';

export default function MyInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInquiries() {
      try {
        setLoading(true);
        const res = await api.get('/inquiries/my');
        setInquiries(res.data.data || []);
      } catch (err) {
        console.error('Failed to load inquiries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInquiries();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-estate-200">
        <h1 className="text-2xl font-bold font-display text-estate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-600" />
          My Inquiries
        </h1>
        <p className="text-xs text-estate-500 mt-1">
          Review past inquiries sent to property owners and brokers
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-primary-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-20 bg-estate-50 rounded-2xl border border-estate-200">
          <MessageSquare className="w-12 h-12 text-estate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-estate-900">No inquiries sent yet</h3>
          <p className="text-xs text-estate-500 mt-1">
            Browse properties to inquire directly with owners.
          </p>
          <div className="mt-5">
            <Link to="/search" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              Browse Properties
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="card p-5 hover:border-primary-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getLeadStageColor(inq.stage)}`}>
                      {inq.stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-estate-400">
                      Sent on {formatDate(inq.created_at)}
                    </span>
                  </div>

                  <Link
                    to={`/properties/${inq.property_id}`}
                    className="font-bold text-base text-estate-900 hover:text-primary-600 block line-clamp-1"
                  >
                    {inq.property_title || 'Property Listing'}
                  </Link>

                  <p className="text-xs text-estate-700 bg-estate-50 p-3 rounded-xl border border-estate-100">
                    "{inq.message}"
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-2 sm:pt-0">
                  <span className="text-xs font-medium text-estate-500">
                    Channel: <strong className="text-estate-800">{inq.contact_mode}</strong>
                  </span>
                  <Link
                    to={`/properties/${inq.property_id}`}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
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
