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
import CambiarPasswordInicial from './pages/CambiarPasswordInicial';

// --- CORRECCIÓN DE IMPORTACIONES (Sincronizadas con archivos físicos) ---
import NutritionMasterFormRouteResolver from './pages/NutritionMasterFormRouteResolver';
import PhysiotherapyMasterFormRouteResolver from './pages/PhysiotherapyMasterFormRouteResolver';
import NutritionMasterForm from './pages/NutritionMasterForm';
import PhysiotherapyMasterForm from './pages/PhysiotherapyMasterForm';
import HojaEvolutiva from './pages/HojaEvolutiva';
import SeguimientoNutricional from './pages/SeguimientoNutricional';

import StatisticsPage from './pages/StatisticsPage';
import ManagePersonnelPage from './pages/ManagePersonnelPage';

// --- NUEVA IMPORTACIÓN: VISOR DE HISTORIALES ---
import MedicalHistoryViewer from './components/MedicalHistoryViewer'; 

// --Nueva pagina de Notas Evolutivas
// --- NUEVA IMPORTACIÓN: HOJA EVOLUTIVA ---
import EvolucionSeguimientoCaptura from './pages/captura/EvolucionSeguimientoCaptura';
import SeguimientoNutricionalCaptura from './pages/captura/SeguimientoNutricionalCaptura';
import ConsultaWorkspace from './pages/ConsultaWorkspace';
import RouteErrorBoundary from './components/RouteErrorBoundary';

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
const routeDefinitions = [
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
    path: '/cambiar-password-inicial',
    element: <CambiarPasswordInicial />
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
        <NutritionMasterFormRouteResolver />
      </ProtectedRoute>
    )
  },
  {
    // Vista documental de solo lectura, idéntica al PDF — a donde manda "Ver Expediente".
    path: '/forms/nutricion/:appointmentId/documento',
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
        <PhysiotherapyMasterFormRouteResolver />
      </ProtectedRoute>
    )
  },
  {
    // Vista documental de solo lectura, idéntica al PDF — a donde manda "Ver Expediente".
    path: '/forms/fisioterapia/:appointmentId/documento',
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
  path: '/medical-history-viewer/:id',
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
    path: '/administrar-personal',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'master']}>
        <ManagePersonnelPage />
      </ProtectedRoute>
    )
  },
  /**
   * RUTA: HOJA EVOLUTIVA
   */
  {
    path: '/hoja-evolutiva/:appointmentId',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <EvolucionSeguimientoCaptura />
      </ProtectedRoute>
    )
  },
  {
    path: '/forms/seguimiento/:appointmentId',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <EvolucionSeguimientoCaptura />
      </ProtectedRoute>
    )
  },
  {
    // Vista documental de solo lectura, idéntica al PDF — a donde manda "Ver Expediente".
    // Fisioterapia (Nota de Evolución) — sin bloqueo por columna.
    path: '/forms/seguimiento/:appointmentId/documento',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <HojaEvolutiva />
      </ProtectedRoute>
    )
  },
  /**
   * RUTAS: SEGUIMIENTO NUTRICIONAL — exclusivo de nutrición, documento por
   * columnas con bloqueo progresivo (ver seguimientoNutricionalController.js).
   */
  {
    path: '/forms/seguimiento-nutricional/:appointmentId',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <SeguimientoNutricionalCaptura />
      </ProtectedRoute>
    )
  },
  {
    path: '/forms/seguimiento-nutricional/:appointmentId/documento',
    element: (
      <ProtectedRoute allowedRoles={['practicante', 'admin', 'master']}>
        <SeguimientoNutricional />
      </ProtectedRoute>
    )
  },

  /**
   * RUTA: WORKSPACE DE CONSULTA (popup window)
   * Usa :id para que los formularios internos resuelvan params.id correctamente.
   */
  {
    path: '/consulta/:id',
    element: (
      <ProtectedRoute allowedRoles={['practicante']}>
        <ConsultaWorkspace />
      </ProtectedRoute>
    )
  },

  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
];

// errorElement se agrega a todas las rutas de forma uniforme: si el DOM se
// corrompe por un traductor automático del navegador (o cualquier otro
// error de render), el usuario ve una pantalla recuperable en vez de la
// pantalla cruda por defecto de React Router.
export const router = createBrowserRouter(
  routeDefinitions.map(route => ({ ...route, errorElement: <RouteErrorBoundary /> }))
);