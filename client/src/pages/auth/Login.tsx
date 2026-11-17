import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    try {
      setLoading(true);
      await login(demoEmail, 'Password123!');
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
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
          <h2 className="text-xl font-bold text-estate-900">Welcome Back</h2>
          <p className="text-xs text-estate-500 mt-1">Sign in to manage your properties, leads, and visits</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="you@example.com"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-estate-600">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
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
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-estate-100">
          <p className="text-[11px] font-semibold text-estate-500 uppercase tracking-wider text-center mb-2.5">
            Quick Demo Sign-In
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('owner@estateflow.com')}
              className="px-2 py-2 text-xs font-medium rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-center disabled:opacity-50"
            >
              🏢 Owner
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('buyer@estateflow.com')}
              className="px-2 py-2 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-center disabled:opacity-50"
            >
              🏠 Buyer
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('broker@estateflow.com')}
              className="px-2 py-2 text-xs font-medium rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-center disabled:opacity-50"
            >
              🤝 Broker
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-estate-100 text-center">
          <p className="text-xs text-estate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
