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
export type User = {
  id: string;
  nombre: string; // Cambia 'name' por 'nombre' para que coincida con SQL
  email: string;
  rol: 'paciente' | 'practicante' | 'admin' | 'master'; // 'paciente' en lugar de 'patient'
  area?: 'nutricion' | 'fisioterapia'; // Agrega esto para las rutas del Dashboard
};

/**
 * COMPONENTE PRINCIPAL: App
 */
export default function App() {
  // Inicializar datos mock al cargar la aplicación (Descomentado para que la función sea válida)
  useEffect(() => {
    initializeMockData();
    console.log('✅ App cargada desde src/app/App.tsx');
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}