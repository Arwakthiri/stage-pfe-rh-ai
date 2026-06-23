import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import RHDashboard from './pages/RHDashboard';
import DashboardRouter from './pages/Dashboard';   // garde le dashboard admin existant
import ProfilePage from './pages/ProfilePage';
import './i18n/index.js';

/* ── Redirection automatique selon le rôle ─────────────────── */
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'employe') return <Navigate to="/employe/dashboard" replace />;
  if (user.role === 'rh') return <Navigate to="/rh/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public ──────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Employé ─────────────────────────────── */}
            <Route
              path="/employe/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employe']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── RH ──────────────────────────────────── */}
            <Route
              path="/rh/dashboard"
              element={
                <ProtectedRoute allowedRoles={['rh']}>
                  <RHDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Admin ───────────────────────────────── */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* ── Profil (tous les rôles) ──────────────── */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ── Redirections ─────────────────────────── */}
            {/* /dashboard → redirige selon le rôle */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleRedirect />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
