import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Building2,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  KeyRound,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devResetCode, setDevResetCode] = useState<string | null>(null);
  const navigate = useNavigate();

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.data?.devResetCode) {
        setDevResetCode(res.data.devResetCode);
      }
      toast.success(res.data?.message || 'Password reset instructions sent!');
      setStep(2);
    } catch (err: any) {
      const responseData = err.response?.data;
      toast.error(responseData?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error('Please enter the reset code');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Please ensure your new password satisfies all complexity requirements');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });

      toast.success(res.data?.message || 'Password reset successful! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.details) {
        const issues = Object.values(responseData.details).flat().join('. ');
        toast.error(issues);
      } else {
        toast.error(responseData?.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-estate-50/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-estate-200 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-estate-900">
              Estate<span className="text-primary-600">Flow</span>
            </span>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2 border border-primary-100">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-estate-900">
            {step === 1 ? 'Forgot Your Password?' : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-estate-500 mt-1 max-w-xs mx-auto">
            {step === 1
              ? "Enter your registered email address and we'll send you a password reset code."
              : `Enter the 6-digit code sent to ${email} and set your new password.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="input-field pl-10 text-sm"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  Send Reset Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {devResetCode && (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-left text-xs text-primary-900">
                <div className="font-semibold flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    Reset Code Simulation:
                  </span>
                  <button
                    type="button"
                    onClick={() => setCode(devResetCode)}
                    className="text-[11px] underline font-bold text-primary-700 hover:text-primary-900 cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <p className="text-[11px] text-primary-700">
                  Your code is{' '}
                  <strong className="font-mono text-sm tracking-widest text-primary-900">
                    {devResetCode}
                  </strong>{' '}
                  (or test bypass{' '}
                  <strong className="font-mono text-sm tracking-widest text-primary-900">
                    123456
                  </strong>
                  ).
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full text-center text-xl font-mono tracking-widest py-2.5 border border-estate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-estate-600">
                  New Password
                </label>
                {newPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-medium ${
                      strengthScore <= 1
                        ? 'text-red-500'
                        : strengthScore <= 3
                        ? 'text-amber-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {strengthScore <= 1 ? 'Weak' : strengthScore <= 3 ? 'Medium' : 'Strong'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-estate-400 hover:text-estate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time criteria checklist */}
              <div className="mt-2 p-2 bg-estate-50 rounded-lg border border-estate-200/80 grid grid-cols-2 gap-1 text-[11px]">
                <div
                  className={`flex items-center gap-1 ${
                    hasMinLength ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasMinLength ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <X className="w-3 h-3 text-estate-400" />
                  )}
                  <span>8+ chars</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    hasUppercase ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasUppercase ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <X className="w-3 h-3 text-estate-400" />
                  )}
                  <span>1 uppercase</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    hasNumber ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasNumber ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <X className="w-3 h-3 text-estate-400" />
                  )}
                  <span>1 number</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    hasSpecial ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasSpecial ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <X className="w-3 h-3 text-estate-400" />
                  )}
                  <span>1 special symbol</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input-field pl-10 text-sm"
                />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3.5 top-3">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim() || !isPasswordValid || !passwordsMatch}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Reset Password & Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-estate-500 hover:text-estate-800 flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change email address
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-estate-100 text-center">
          <p className="text-xs text-estate-600">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
