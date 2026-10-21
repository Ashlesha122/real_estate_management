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
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<Search />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === UserRole.BUYER) return <Navigate to="/dashboard/buyer" />;
  if (user.role === UserRole.OWNER) return <Navigate to="/dashboard/owner" />;
  if (user.role === UserRole.BROKER) return <Navigate to="/dashboard/broker" />;
  return <Navigate to="/" />;
}
