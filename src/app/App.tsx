/**
 * ============================================================================
 * ARCHIVO: App.tsx
 * PROPÓSITO: Componente raíz de la aplicación UTC Clínica
 * ============================================================================
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { initializeMockData } from './lib/mockData';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

// 1. DEFINE Y EXPORTA EL TIPO USER AQUÍ
// Esta interfaz asegura que el objeto de usuario sea consistente en toda la App
export type User = {
  id: string;
  nombre: string; // Cambia 'name' por 'nombre' para que coincida con SQL
  email: string;
  rol: 'paciente' | 'practicante' | 'admin' | 'master'; // 'paciente' en lugar de 'patient'
  area?: 'nutricion' | 'fisioterapia'; // Agrega esto para las rutas del Dashboard
};

/**
 * COMPONENTE PRINCIPAL: App
 * * Se encarga de:
 * 1. Proveer el contexto de autenticación (AuthProvider)
 * 2. Inyectar el sistema de rutas (RouterProvider)
 * 3. Inicializar los servicios de notificaciones (Toaster)
 */
export default function App() {
  // Inicializar datos mock al cargar la aplicación 
  // Esto asegura que al recargar la página existan historiales clínicos de ejemplo
  useEffect(() => {
    initializeMockData();
    console.log('✅ App cargada desde src/app/App.tsx');
  }, []);

  return (
    <AuthProvider>
      {/* El RouterProvider utiliza el archivo 'routes.ts' importado arriba.
        Si la redirección falla al hacer navigate, es necesario agregar la ruta
        '/medical-history-viewer/:patientId' dentro de la definición del objeto 'router'.
      */}
      <RouterProvider router={router} />
      
      {/* Sistema global de notificaciones toast — expand:true evita que se
          apilen como cartas encimadas (comportamiento por defecto de sonner);
          con esto cada toast queda completo, uno debajo del otro. */}
      <Toaster position="top-right" richColors closeButton expand />
    </AuthProvider>
  );
}