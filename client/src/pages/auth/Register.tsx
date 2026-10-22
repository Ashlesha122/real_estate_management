import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Building2, Mail, Lock, User, Phone, Loader2, ArrowRight, Home, KeyRound, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName,
        email,
        phone,
        password,
        role,
      });
      toast.success('Registration successful! Please verify your phone number.');
      navigate('/verify');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
              Password (min 8 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
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
