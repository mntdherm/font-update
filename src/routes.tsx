import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSupportDialog } from './contexts/SupportContext';
import { getUser } from './lib/db';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import CustomerProfile from './pages/customer/Profile';
import CustomerCoins from './pages/customer/Coins';
import CustomerAppointments from './pages/customer/Appointments';
import VendorDashboard from './pages/VendorDashboard';
import VendorProfile from './pages/VendorProfile';
import VendorSettings from './pages/VendorSettings';
import VendorOffers from './pages/VendorOffers';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import MobileNav from './components/MobileNav';
import SupportDialog from './components/SupportDialog';

const AppRoutes = () => {
  const { currentUser } = useAuth();
  const { showSupportDialog, setShowSupportDialog } = useSupportDialog();
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadUserRole = async () => {
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        setUserRole(userData?.role || null);
      }
    };
    loadUserRole();
  }, [currentUser]);

  // Close support dialog when route changes
  React.useEffect(() => {
    setShowSupportDialog(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vendor/:id" element={<VendorProfile />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/profile" 
          element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/coins" 
          element={
            <ProtectedRoute>
              <CustomerCoins />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/appointments" 
          element={
            <ProtectedRoute>
              <CustomerAppointments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendor-dashboard" 
          element={
            <ProtectedRoute>
              <VendorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendor-offers" 
          element={
            <ProtectedRoute>
              <VendorOffers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendor-settings" 
          element={
            <ProtectedRoute>
              <VendorSettings />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <MobileNav />
      
      {showSupportDialog && userRole && (
        <SupportDialog
          isOpen={showSupportDialog}
          onClose={() => setShowSupportDialog(false)}
          userRole={userRole as 'customer' | 'vendor'}
        />
      )}
    </div>
  );
};

export default AppRoutes;
