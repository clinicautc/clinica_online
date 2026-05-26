/**
 * ============================================================================
 * ARCHIVO: routes.tsx (Versión de Blindaje Total - Sincronizada con Master)
 * PROPÓSITO: Sincronización absoluta de rutas, incluyendo el nuevo rol Master y Visor de Historiales.
 * ============================================================================
 */

import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from './contexts/AuthContext';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import PhysiotherapyPractitionerDashboard from './pages/PhysiotherapyPractitionerDashboard';
import NutritionPractitionerDashboard from './pages/NutritionPractitionerDashboard';
import PhysiotherapyAdminDashboard from './pages/PhysiotherapyAdminDashboard';
import NutritionAdminDashboard from './pages/NutritionAdminDashboard';
// --- 1. IMPORTAMOS EL NUEVO DASHBOARD MASTER ---
import MasterAdminDashboard from './pages/MasterAdminDashboard'; 
// --- iMPort para la seccion de olvidar contraseñas --
import ForgotPassword from './pages/ForgotPassword';

// --- CORRECCIÓN DE IMPORTACIONES (Sincronizadas con archivos físicos) ---
import NutritionMasterForm from './pages/NutritionMasterForm';
import PhysiotherapyMasterForm from './pages/PhysiotherapyMasterForm';

import StatisticsPage from './pages/StatisticsPage';
import ManagePractitionersPage from './pages/ManagePractitionersPage';

// --- NUEVA IMPORTACIÓN: VISOR DE HISTORIALES ---
import MedicalHistoryViewer from './components/MedicalHistoryViewer'; 

/**
 * COMPONENTE: ProtectedRoute
 */
function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: string[]
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          <p className="text-blue-900 font-medium font-serif">Sincronizando con Clínica UTC...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user as any)?.rol;
  
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * COMPONENTE: DashboardRouter
 * Redirecciona al usuario a su panel correspondiente según rol y área.
 */
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const currentRole = (user as any).rol;
  const currentArea = user.area;

  console.log("🕵️ Sherlock verificando acceso:", { currentRole, currentArea });

  switch (currentRole) {
    case 'master':
      return <MasterAdminDashboard />;

    case 'paciente':
      return <PatientDashboard />;
      
    case 'practicante':
      if (currentArea === 'fisioterapia') {
        return <PhysiotherapyPractitionerDashboard />;
      } 
      if (currentArea === 'nutricion') {
        return <NutritionPractitionerDashboard />;
      }
      return <Navigate to="/login" replace />;

    case 'admin':
      if (currentArea === 'fisioterapia') {
        return <PhysiotherapyAdminDashboard />;
      } 
      if (currentArea === 'nutricion') {
        return <NutritionAdminDashboard />;
      }
      return <Navigate to="/login" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}

/**
 * CONFIGURACIÓN DE RUTAS
 */
console.log('✅ Rutas cargadas desde src/app/routes.tsx');
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardRouter />
      </ProtectedRoute>
    )
  },
  
  /**
   * RUTAS DE FORMULARIOS (Sincronizadas con la DB)
   */
  {
    path: '/forms/nutricion/:appointmentId', 
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <NutritionMasterForm />
      </ProtectedRoute>
    )
  },
  {
    path: '/forms/fisioterapia/:appointmentId',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <PhysiotherapyMasterForm />
      </ProtectedRoute>
    )
  },

  /**
   * RUTA: VISOR DE HISTORIAL CLÍNICO (Sincronizada con Dashboards)
   * Esta ruta permite cargar el historial por paciente e identificar el área.
   */
  /**
 * RUTA: VISOR DE HISTORIAL CLÍNICO (Sincronizada con Dashboards)
 * Esta es la pieza que falta para que el Login no te expulse.
 */
{
  path: '/historial/:id/:area', // <--- Asegúrate de que coincida con el navigate del dashboard
  element: (
    <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
      <MedicalHistoryViewer />
    </ProtectedRoute>
  )
},
// Mantén esta también por si algún componente usa el nombre largo
{
  path: '/medical-history-viewer/:patientId',
  element: (
    <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
      <MedicalHistoryViewer />
    </ProtectedRoute>
  )
},

  /**
   * RUTAS ADMINISTRATIVAS
   */
  {
    path: '/estadisticas',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <StatisticsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/administrar-practicantes',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'master']}>
        <ManagePractitionersPage />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);