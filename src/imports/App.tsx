// Importamos el proveedor de rutas de 'react-router'
// Este componente es el que "activa" la navegación en toda la app
import { RouterProvider } from 'react-router';

// Importamos la configuración de rutas que definiste en otro archivo
// Aquí es donde residen las direcciones de Login, Register, Dashboards, etc.
import { router } from './routes';

// Importamos el componente de notificaciones (Toast)
// 'sonner' es una librería moderna para mostrar mensajes flotantes (como "Guardado con éxito")
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    /* Usamos un Fragmento de React (<> ... </>) para envolver los dos elementos
      principales sin añadir nodos extra innecesarios al DOM (HTML).
    */
    <>
      {/* 1. PROVEEDOR DE RUTAS: 
        Le pasamos el objeto 'router' que contiene toda la lógica de navegación.
        Sin este componente, los links (<Link />) y el hook 'useNavigate' no funcionarían.
      */}
      <RouterProvider router={router} />

      {/* 2. COMPONENTE DE NOTIFICACIONES (TOASTER):
        Al ponerlo aquí, en la raíz de la app, permites que cualquier página
        (el Register, el Formulario de Fisio, etc.) pueda disparar un mensaje flotante.
        
        Se queda "escuchando" globalmente para aparecer cuando lo llames con toast.success().
      */}
      <Toaster />
    </>
  );
}