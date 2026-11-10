import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout, PublicLayout } from './components/layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { PublicRoomsPage } from './pages/PublicRoomsPage';
import { PublicBranchesPage } from './pages/PublicBranchesPage';
import { BranchesPage } from './pages/BranchesPage';
import { CustomersPage } from './pages/CustomersPage';
import { RoomsPage } from './pages/RoomsPage';
import { BookingsPage } from './pages/BookingsPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { UsersPage } from './pages/UsersPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { PublicServicesPage } from './pages/PublicServicesPage';
import { AdminServicesPage } from './pages/AdminServicesPage';
import { AdminRevenuePage } from './pages/AdminRevenuePage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Shared Layout (Auto-inherits PublicHeader & PublicFooter) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<PublicRoomsPage />} />
            <Route path="/branches" element={<PublicBranchesPage />} />
            <Route path="/services" element={<PublicServicesPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/my-bookings" element={<UserProfilePage />} />
          </Route>

          {/* Standalone Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application & Admin Management Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin Management Endpoints */}
            <Route path="/admin" element={<Navigate to="/admin/revenue" replace />} />
            <Route path="/admin/revenue" element={<AdminRevenuePage />} />
            <Route path="/admin/bookings" element={<BookingsPage />} />
            <Route path="/admin/rooms" element={<RoomsPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/branches" element={<BranchesPage />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />

            {/* Backward-compatibility Redirects */}
            <Route path="/revenue" element={<Navigate to="/admin/revenue" replace />} />
            <Route path="/bookings" element={<Navigate to="/admin/bookings" replace />} />
            <Route path="/customers" element={<Navigate to="/admin/customers" replace />} />
            <Route path="/users" element={<Navigate to="/admin/users" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
