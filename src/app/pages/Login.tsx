/**
 * ============================================================================
 * ARCHIVO: Login.tsx (Versión Final Sincronizada - Sherlock)
 * PROPÓSITO: Punto de entrada unificado para el DashboardRouter.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Diagnóstico inicial
    console.log("🚀 [INICIO]: Intentando acceder con:", email.trim().toLowerCase());
    
    setError('');
    setIsLoading(true);

    try {
      // 1. Llamada al AuthContext (Validación contra PostgreSQL)
      const user = await login(email.trim().toLowerCase(), password);

      if (user) {
        console.log("✅ [AUTENTICADO]: Datos de usuario cargados.");
        console.log("🔀 [REDIRECCIÓN]: Delegando navegación al DashboardRouter...");

        /**
         * AJUSTE CRUCIAL:
         * En lugar de manejar rutas individuales aquí, enviamos a todos a '/dashboard'.
         * El componente DashboardRouter en routes.tsx se encargará de procesar
         * el rol y el área (fisioterapia/nutrición) de forma segura.
         */
        navigate('/dashboard');
        
        // NO ejecutamos setIsLoading(false) en éxito para evitar parpadeos
        // o re-renderizados del Login mientras el router procesa el cambio.
      }
    } catch (err: any) {
      // En caso de error, apagamos el loading y mostramos el mensaje
      console.error("❌ [ERROR]:", err.message);
      setError(err.message || 'Credenciales incorrectas');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-blue-900/10 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">UTC</span>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">Clínica Universitaria</CardTitle>
          <CardDescription className="text-blue-900/70">Fisioterapia y Nutrición</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-900 hover:bg-blue-800 h-11 transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validando...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <div className="text-center pt-4 border-t border-blue-900/10">
              <p className="text-sm text-blue-900/70 mb-2">¿No estás registrado?</p>
              <Link to="/register">
                <Button type="button" variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50">
                  Crear cuenta nueva
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}