import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import AcademicLoadPage from './pages/AcademicLoadPage';
import CompaniesPage from './pages/CompaniesPage';
import DualProjectsPage from './pages/DualProjectsPage';
import EvaluationsPage from './pages/EvaluationsPage';

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
            <Route path="/usuarios" element={<Protected><UsersPage /></Protected>} />
            <Route path="/kardex" element={<Protected><AcademicLoadPage /></Protected>} />
            <Route path="/empresas" element={<Protected><CompaniesPage /></Protected>} />
            <Route path="/proyectos" element={<Protected><DualProjectsPage /></Protected>} />
            <Route path="/evaluaciones" element={<Protected><EvaluationsPage /></Protected>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
