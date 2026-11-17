import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Landing from './pages/Landing';
import Search from './pages/Search';
import PropertyDetailPage from './pages/PropertyDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import Profile from './pages/Profile';

// Buyer
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import Wishlist from './pages/buyer/Wishlist';
import MyInquiries from './pages/buyer/MyInquiries';
import MyVisits from './pages/buyer/MyVisits';

// Owner
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyListings from './pages/owner/MyListings';
import CreateListing from './pages/owner/CreateListing';
import LeadsBoard from './pages/owner/LeadsBoard';
import LeaseRecords from './pages/owner/LeaseRecords';

// Broker
import BrokerDashboard from './pages/broker/BrokerDashboard';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-estate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-estate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Auth Routes (Redirect to /dashboard if already signed in) */}
          <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
          <Route path="/register" element={<PublicAuthRoute><Register /></PublicAuthRoute>} />

          {/* Secure Application Routes (Authentication Required First) */}
          <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetailPage /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><VerifyOtp /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Buyer routes */}
          <Route path="/dashboard/buyer" element={<ProtectedRoute roles={[UserRole.BUYER]}><BuyerDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/buyer/wishlist" element={<ProtectedRoute roles={[UserRole.BUYER]}><Wishlist /></ProtectedRoute>} />
          <Route path="/dashboard/buyer/inquiries" element={<ProtectedRoute roles={[UserRole.BUYER]}><MyInquiries /></ProtectedRoute>} />
          <Route path="/dashboard/buyer/visits" element={<ProtectedRoute roles={[UserRole.BUYER]}><MyVisits /></ProtectedRoute>} />

          {/* Owner routes */}
          <Route path="/dashboard/owner" element={<ProtectedRoute roles={[UserRole.OWNER]}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/owner/listings" element={<ProtectedRoute roles={[UserRole.OWNER]}><MyListings /></ProtectedRoute>} />
          <Route path="/dashboard/owner/listings/new" element={<ProtectedRoute roles={[UserRole.OWNER]}><CreateListing /></ProtectedRoute>} />
          <Route path="/dashboard/owner/leads" element={<ProtectedRoute roles={[UserRole.OWNER]}><LeadsBoard /></ProtectedRoute>} />
          <Route path="/dashboard/owner/leases" element={<ProtectedRoute roles={[UserRole.OWNER]}><LeaseRecords /></ProtectedRoute>} />

          {/* Broker routes */}
          <Route path="/dashboard/broker" element={<ProtectedRoute roles={[UserRole.BROKER]}><BrokerDashboard /></ProtectedRoute>} />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.BUYER) return <Navigate to="/dashboard/buyer" replace />;
  if (user.role === UserRole.OWNER) return <Navigate to="/dashboard/owner" replace />;
  if (user.role === UserRole.BROKER) return <Navigate to="/dashboard/broker" replace />;
  return <Navigate to="/search" replace />;
}
