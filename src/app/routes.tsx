import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import MasterDashboard from './pages/MasterDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PractitionerDashboard from './pages/PractitionerDashboard';
import NutritionAdminDashboard from './pages/NutritionAdminDashboard';
import PhysiotherapyAdminDashboard from './pages/PhysiotherapyAdminDashboard';

import NutritionMasterForm from './pages/NutritionMasterForm';
import PhysiotherapyMasterForm from './pages/PhysiotherapyMasterForm';

import MedicalHistoryViewer from './components/MedicalHistoryViewer';
import StatisticsPage from './pages/StatisticsPage';
import ManagePractitionersPage from './pages/ManagePractitionersPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const userRole = (user as any)?.rol;
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const currentRole = (user as any).rol;
  const currentArea = user.area;

  switch (currentRole) {
    case 'master': return <MasterDashboard />;
    case 'paciente': return <PatientDashboard />;
    case 'practicante': return <PractitionerDashboard />;
    case 'admin':
      if (currentArea === 'nutricion') return <NutritionAdminDashboard />;
      // --- ESTA ES LA LÍNEA NUEVA QUE AGREGAMOS ---
      if (currentArea === 'fisioterapia') return <PhysiotherapyAdminDashboard />;
      // ---------------------------------------------
      return <MasterDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/dashboard', element: <ProtectedRoute><DashboardRouter /></ProtectedRoute> },
  { path: '/forms/nutricion/:appointmentId', element: <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}><NutritionMasterForm /></ProtectedRoute> },
  { path: '/forms/fisioterapia/:appointmentId', element: <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}><PhysiotherapyMasterForm /></ProtectedRoute> },
  { path: '/medical-history-viewer/:patientId', element: <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}><MedicalHistoryViewer /></ProtectedRoute> },
  { path: '/estadisticas', element: <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}><StatisticsPage /></ProtectedRoute> },
  { path: '/administrar-practicantes', element: <ProtectedRoute allowedRoles={['admin', 'master']}><ManagePractitionersPage /></ProtectedRoute> },
  { path: '*', element: <Navigate to="/login" replace /> }
]);