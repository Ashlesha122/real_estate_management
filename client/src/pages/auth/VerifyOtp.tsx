import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyOtp() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { user, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.phoneVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(code);
      toast.success('Phone verified successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await resendOtp();
      toast.success('New OTP sent to your phone!');
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-estate-50/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-estate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4 border border-primary-100">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-estate-900">Verify Your Phone</h2>
        <p className="text-xs text-estate-500 mt-1 max-w-xs mx-auto">
          We have sent a verification code to <span className="font-semibold text-estate-700">{user?.phone || 'your phone'}</span>
        </p>
        <p className="text-[11px] text-primary-600 font-mono mt-1">
          (Development mode: Check server console for mock SMS OTP)
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0 0 0 0 0 0"
              className="w-full text-center text-2xl font-mono tracking-widest py-3 border border-estate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length === 0}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Confirm & Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-estate-100 flex items-center justify-between text-xs text-estate-600">
          <span>Didn't receive code?</span>
          <button
            type="button"
            disabled={countdown > 0 || resending}
            onClick={handleResend}
            className="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50 flex items-center gap-1"
          >
            {resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}
