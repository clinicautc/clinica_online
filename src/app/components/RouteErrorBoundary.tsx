/**
 * ============================================================================
 * ARCHIVO: RouteErrorBoundary.tsx
 * PROPÓSITO: Pantalla de error genérica para cualquier ruta (reemplaza la
 * pantalla cruda por defecto de React Router). Existe principalmente para
 * los crashes de "insertBefore/removeChild NotFoundError" que provocan los
 * traductores automáticos del navegador (Chrome/Firefox/Edge en móvil) al
 * mutar el DOM por fuera de React — no son evitables al 100%, así que en vez
 * de dejar caer al usuario a un stack trace, se ofrece recargar la página.
 * ============================================================================
 */

import { useRouteError } from 'react-router';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export default function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('Error de ruta capturado por RouteErrorBoundary:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Ocurrió un error inesperado</h1>
        <p className="text-slate-500 text-sm">
          Algo interrumpió la página. Si tu navegador tiene activada la traducción
          automática, intenta desactivarla para este sitio — puede causar este tipo
          de errores. Recarga para continuar.
        </p>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Recargar página
        </Button>
      </div>
    </div>
  );
}
