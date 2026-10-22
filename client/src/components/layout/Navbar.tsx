import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import NotificationBell from '../notifications/NotificationBell';
import {
  Building2,
  Menu,
  X,
  User,
  LogOut,
  PlusCircle,
  Heart,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case UserRole.OWNER:
        return '/dashboard/owner';
      case UserRole.BROKER:
        return '/dashboard/broker';
      case UserRole.BUYER:
      default:
        return '/dashboard/buyer';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-estate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-estate-900 group-hover:text-primary-600 transition-colors">
                Estate<span className="text-primary-600">Flow</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/search"
              className="text-sm font-medium text-estate-600 hover:text-primary-600 transition-colors"
            >
              Explore Properties
            </Link>

            {isAuthenticated && user?.role === UserRole.BUYER && (
              <>
                <Link
                  to="/dashboard/buyer/wishlist"
                  className="text-sm font-medium text-estate-600 hover:text-primary-600 transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  Wishlist
                </Link>
                <Link
                  to="/dashboard/buyer/visits"
                  className="text-sm font-medium text-estate-600 hover:text-primary-600 transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-estate-400" />
                  Visits
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === UserRole.OWNER && (
              <>
                <Link
                  to="/dashboard/owner/listings"
                  className="text-sm font-medium text-estate-600 hover:text-primary-600 transition-colors"
                >
                  My Listings
                </Link>
                <Link
                  to="/dashboard/owner/leads"
                  className="text-sm font-medium text-estate-600 hover:text-primary-600 transition-colors"
                >
                  Leads CRM
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === UserRole.BROKER && (
              <Link
                to="/dashboard/broker"
                className="text-sm font-medium text-estate-600 hover:text-primary-600 transition-colors"
              >
                Assigned Properties
              </Link>
            )}
          </nav>

          {/* Desktop Action & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user?.role === UserRole.OWNER ? (
              <Link
                to="/dashboard/owner/listings/new"
                className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 hover:bg-primary-100 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Post Property
              </Link>
            ) : !isAuthenticated ? (
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-accent-50 text-accent-700 hover:bg-accent-100 px-3 py-1.5 rounded-full border border-accent-200 transition-colors"
              >
                Post Property <span className="bg-accent-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">FREE</span>
              </Link>
            ) : null}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NotificationBell />

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-estate-100 transition-colors text-left focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm border border-primary-200">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user?.fullName?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="hidden lg:block text-xs">
                      <div className="font-semibold text-estate-900 leading-tight">{user?.fullName}</div>
                      <div className="text-estate-500 text-[10px] uppercase font-bold tracking-wider">{user?.role}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-estate-400" />
                  </button>

                  {isProfileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-estate-200 py-1.5 z-50 text-sm animate-in fade-in"
                      onMouseLeave={() => setIsProfileOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-estate-100">
                        <p className="font-medium text-estate-900 truncate">{user?.fullName}</p>
                        <p className="text-xs text-estate-500 truncate">{user?.email}</p>
                      </div>

                      <Link
                        to={getDashboardLink()}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-estate-700 hover:bg-estate-50"
                      >
                        <LayoutDashboard className="w-4 h-4 text-estate-400" />
                        Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-estate-700 hover:bg-estate-50"
                      >
                        <User className="w-4 h-4 text-estate-400" />
                        Profile Settings
                      </Link>

                      <div className="border-t border-estate-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-estate-700 hover:text-estate-900 hover:bg-estate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm py-2 px-4 shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-estate-600 hover:text-estate-900 hover:bg-estate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-estate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/search"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-estate-700 hover:bg-estate-100"
          >
            Explore Properties
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardLink()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-estate-700 hover:bg-estate-100"
              >
                Dashboard ({user?.role})
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-estate-700 hover:bg-estate-100"
              >
                Profile & Settings
              </Link>
              {user?.role === UserRole.OWNER && (
                <Link
                  to="/dashboard/owner/listings/new"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-primary-600 bg-primary-50"
                >
                  + Post New Property
                </Link>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-estate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 border border-estate-300 rounded-lg font-medium text-estate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-primary-600 text-white rounded-lg font-medium"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
