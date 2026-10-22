import { useState } from 'react';
import { X, Send, Phone, MessageSquare, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { ContactMode } from '../../types';
import api from '../../api/client';
import { toast } from 'sonner';

interface InquiryModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (inquiryId: string) => void;
}

export default function InquiryModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
  onSuccess,
}: InquiryModalProps) {
  const [message, setMessage] = useState(
    'Hi, I am interested in this property. Please let me know more details and when I can view it.'
  );
  const [contactMode, setContactMode] = useState<ContactMode>(ContactMode.WHATSAPP);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/inquiries', {
        propertyId,
        message,
        contactMode,
      });
      setSubmitted(true);
      toast.success('Inquiry sent successfully!');
      onSuccess?.(res.data.id);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-estate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-estate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-estate-400 hover:text-estate-700 rounded-lg hover:bg-estate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-estate-900">Inquiry Sent!</h3>
            <p className="text-sm text-estate-600 max-w-xs mx-auto">
              The property handler has been notified and will contact you via your preferred channel.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <span className="text-xs font-semibold uppercase text-primary-600 tracking-wider">Direct Connect</span>
              <h3 className="text-xl font-bold text-estate-900 mt-0.5">Contact Handler</h3>
              <p className="text-xs text-estate-500 line-clamp-1 mt-1 font-medium">{propertyTitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Preferred Contact Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: ContactMode.WHATSAPP, label: 'WhatsApp', icon: MessageSquare },
                    { mode: ContactMode.CALL, label: 'Phone Call', icon: Phone },
                    { mode: ContactMode.EMAIL, label: 'Email', icon: Mail },
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setContactMode(mode)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                        contactMode === mode
                          ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold shadow-sm'
                          : 'border-estate-300 text-estate-700 hover:bg-estate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the owner when you are looking to move, ask questions..."
                  className="input-field text-sm"
                  required
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Inquiry
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
