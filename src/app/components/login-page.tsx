/**
 * ============================================================================
 * ARCHIVO: Login.page.tsx (Versión de Seguridad - Carpeta Componentes)
 * PROPÓSITO: Asegurar consistencia de autenticación si se usa como componente
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPageComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /**
   * NOTA DE SEGURIDAD:
   * Si este componente se carga y ya hay una sesión activa, 
   * lo sacamos de aquí inmediatamente para evitar bucles.
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🛡️ Redirección de seguridad: Sesión ya activa.");
      const role = (user as any).rol || user.rol;
      if (role === 'admin') {
        navigate(user.area === 'fisioterapia' ? '/physiotherapy-admin' : '/nutrition-admin');
      } else if (role === 'practicante') {
        navigate(user.area === 'fisioterapia' ? '/physiotherapy-practitioner' : '/nutrition-practitioner');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      /**
       * IMPORTANTE:
       * Usamos la lógica atómica: Limpieza de datos + Await estricto.
       */
      const loggedUser = await login(email.trim().toLowerCase(), password);

      if (loggedUser) {
        // Pequeño delay para que el localStorage se asiente
        setTimeout(() => {
          const targetRole = (loggedUser as any).rol || loggedUser.rol;
          
          if (targetRole === 'admin') {
            navigate(loggedUser.area === 'fisioterapia' ? '/physiotherapy-admin' : '/nutrition-admin');
          } else if (targetRole === 'practicante') {
            navigate(loggedUser.area === 'fisioterapia' ? '/physiotherapy-practitioner' : '/nutrition-practitioner');
          } else {
            navigate('/dashboard');
          }
        }, 150);
      }
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-blue-900/5">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">UTC</span>
          </div>
          <CardTitle className="text-2xl font-serif text-blue-900">Bienvenido</CardTitle>
          <CardDescription>Ingresa a tu cuenta institucional</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comp-email">Correo Institucional</Label>
              <Input
                id="comp-email"
                type="email"
                placeholder="nombre@utc.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comp-pass">Contraseña</Label>
              <Input
                id="comp-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-900 hover:bg-blue-800 h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Acceder al Sistema"
              )}
            </Button>

            <div className="text-center text-sm pt-4">
              <span className="text-slate-500">¿Eres nuevo? </span>
              <Link to="/register" className="text-orange-600 font-semibold hover:underline">
                Crea una cuenta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}