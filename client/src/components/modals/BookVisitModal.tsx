import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, UserCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { VisitMode, ContactMode } from '../../types';
import api from '../../api/client';
import { toast } from 'sonner';

interface BookVisitModalProps {
  propertyId: string;
  propertyTitle: string;
  handlerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookVisitModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
  onSuccess,
}: BookVisitModalProps) {
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('11:00');
  const [mode, setMode] = useState<VisitMode>(VisitMode.IN_PERSON);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Combine date and time to ISO
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

      // Check if scheduledAt is in the future
      if (new Date(scheduledAt) <= new Date()) {
        toast.error('Scheduled visit time must be in the future');
        setLoading(false);
        return;
      }

      // First check/create inquiry
      const inqRes = await api.post('/inquiries', {
        propertyId,
        message: `Requested site visit (${mode === VisitMode.IN_PERSON ? 'In-Person' : 'Virtual'}) on ${date} at ${time}. ${notes ? `Note: ${notes}` : ''}`,
        contactMode: ContactMode.WHATSAPP,
        preferredVisitTime: scheduledAt,
      });

      const inquiryId = inqRes.data.id;

      // Now create visit
      await api.post('/visits', {
        inquiryId,
        scheduledAt,
        mode,
        notes: notes || undefined,
      });

      setBooked(true);
      toast.success('Site visit booked successfully!');
      onSuccess?.();
      setTimeout(() => {
        setBooked(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book site visit');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-estate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-estate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-estate-400 hover:text-estate-700 rounded-lg hover:bg-estate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {booked ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-estate-900">Visit Scheduled!</h3>
            <p className="text-sm text-estate-600 max-w-xs mx-auto">
              Your appointment is confirmed. The owner will meet you at the requested date and time.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <span className="text-xs font-semibold uppercase text-primary-600 tracking-wider">Appointment</span>
              <h3 className="text-xl font-bold text-estate-900 mt-0.5">Schedule Site Visit</h3>
              <p className="text-xs text-estate-500 line-clamp-1 mt-1 font-medium">{propertyTitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Visit Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(VisitMode.IN_PERSON)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      mode === VisitMode.IN_PERSON
                        ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-estate-300 text-estate-700 hover:bg-estate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    In-Person Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(VisitMode.VIRTUAL)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      mode === VisitMode.VIRTUAL
                        ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-estate-300 text-estate-700 hover:bg-estate-50'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Virtual Video Tour
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={minDateStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-field text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Preferred Time
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input-field text-sm"
                    required
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Notes or Questions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Coming with family, interested in parking space..."
                  className="input-field text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-estate-600 hover:text-estate-900 rounded-lg hover:bg-estate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm flex items-center gap-2 py-2 px-5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Confirm Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
