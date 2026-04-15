import { createBrowserRouter, Navigate, Outlet } from 'react-router';
// Importación de todas las páginas que componen el sistema
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import PractitionerDashboard from './pages/PractitionerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NutritionFormPage from './pages/NutritionFormPage';
import PhysiotherapyFormPage from './pages/PhysiotherapyFormPage';
// El AuthContext es vital aquí para saber quién está logueado
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- 1. EL GUARDIA DE SEGURIDAD (ProtectedRoute) ---
// Este componente envuelve a las rutas que no son públicas.
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();

  // Si no está logueado, lo rebota al login inmediatamente
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta pide un rol específico (ej. solo practicantes) y el usuario no lo tiene,
  // lo manda a su dashboard principal por seguridad.
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// --- 2. EL DISTRIBUIDOR DE ROLES (DashboardRouter) ---
// Como la URL es siempre '/dashboard', este componente decide qué verás según tu rol.
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'paciente': return <PatientDashboard />;
    case 'practicante': return <PractitionerDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

// --- 3. EL CONTENEDOR RAÍZ (RootLayout) ---
// Este es el cambio que mencionaste. Al envolver todo en el AuthProvider aquí,
// garantizas que todas las rutas hijas tengan acceso a la información del usuario.
function RootLayout() {
  return (
    <AuthProvider>
      {/* El Outlet es el espacio donde se renderizarán las rutas hijas (login, dashboard, etc.) */}
      <Outlet /> 
    </AuthProvider>
  );
}

// --- 4. LA CONFIGURACIÓN DEL ROUTER ---
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />, 
    children: [
      {
        index: true, // Ruta por defecto (/)
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      // Ruta protegida general
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        ),
      },
      // Rutas específicas con parámetros dinámicos (:appointmentId)
      // Solo accesibles para pacientes y practicantes
      {
        path: 'forms/nutricion/:appointmentId',
        element: (
          <ProtectedRoute allowedRoles={['paciente', 'practicante']}>
            <NutritionFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/fisioterapia/:appointmentId',
        element: (
          <ProtectedRoute allowedRoles={['paciente', 'practicante']}>
            <PhysiotherapyFormPage />
          </ProtectedRoute>
        ),
      },
      // El "Comodín" para URLs que no existen: manda al login
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);