import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowRight,
  Home,
  KeyRound,
  Briefcase,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Strength score: 0 to 4
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (!hasUppercase) {
      toast.error('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!hasNumber) {
      toast.error('Password must contain at least one number (0-9)');
      return;
    }
    if (!hasSpecial) {
      toast.error('Password must contain at least one special character (!@#$%^&*)');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
      });

      toast.success('Account created successfully! Welcome to EstateFlow.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.details) {
        // Collect and show all validation failure messages
        const issues = Object.values(responseData.details)
          .flat()
          .join('. ');
        toast.error(issues || 'Validation failed. Please check the form.');
      } else {
        toast.error(responseData?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-estate-50/50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-estate-200 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-estate-900">
              Estate<span className="text-primary-600">Flow</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-estate-900">Create an Account</h2>
          <p className="text-xs text-estate-500 mt-1">Join the premier verified property ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase text-estate-600 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { r: UserRole.BUYER, title: 'Buyer / Tenant', icon: Home, desc: 'Find & rent/buy' },
                { r: UserRole.OWNER, title: 'Property Owner', icon: KeyRound, desc: 'List & manage' },
                { r: UserRole.BROKER, title: 'Licensed Broker', icon: Briefcase, desc: 'Assist & close' },
              ].map(({ r, title, icon: Icon, desc }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    role === r
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-500/20'
                      : 'border-estate-200 hover:bg-estate-50 text-estate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${role === r ? 'text-primary-600' : 'text-estate-400'}`} />
                  <div>
                    <div className={`text-xs font-bold ${role === r ? 'text-primary-900' : 'text-estate-800'}`}>
                      {title}
                    </div>
                    <div className="text-[10px] text-estate-500 leading-tight mt-0.5">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-estate-600">
                Password
              </label>
              {password.length > 0 && (
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
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

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-colors ${
                      strengthScore >= step
                        ? strengthScore <= 1
                          ? 'bg-red-500'
                          : strengthScore <= 3
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-estate-200'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Real-time criteria checklist */}
            <div className="mt-2.5 p-2.5 bg-estate-50 rounded-lg border border-estate-200/80 space-y-1.5">
              <div className="text-[11px] font-semibold text-estate-600 mb-1">
                Password Requirements:
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-estate-400 shrink-0" />
                  )}
                  <span>At least 8 characters</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasUppercase ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasUppercase ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-estate-400 shrink-0" />
                  )}
                  <span>One uppercase letter (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-estate-400 shrink-0" />
                  )}
                  <span>One number (0-9)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasSpecial ? 'text-emerald-600 font-medium' : 'text-estate-500'
                  }`}
                >
                  {hasSpecial ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-estate-400 shrink-0" />
                  )}
                  <span>One special character</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
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
            disabled={loading || (confirmPassword.length > 0 && !passwordsMatch)}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Register Now
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-estate-100 text-center">
          <p className="text-xs text-estate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
