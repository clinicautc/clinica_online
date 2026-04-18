import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';

import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

import { AlertCircle, Check, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // 🔥 AQUÍ ESTÁ EL CAMBIO REAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError('Correo o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      
      <Card className="w-full max-w-md border-blue-900/10 shadow-xl">
        
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 shadow-md rounded-full flex items-center justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Logo UTC"
              className="w-10 h-10 object-contain"
            />
          </div>

          <CardTitle className="text-2xl font-bold text-blue-900">
            Clínica Universitaria
          </CardTitle>

          <CardDescription className="text-blue-900/70">
            Fisioterapia y Nutrición
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/*  MENSAJE DE ERROR FUNCIONAL */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">Correo electrónico</Label>

              <div className="relative group focus-within:text-blue-900">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />

                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="pl-10 border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
                />
              </div>
            </div>
            
            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-900">Contraseña</Label>

              <div className="relative group focus-within:text-blue-900">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className="pl-10 border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* FORGOT */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-900 underline cursor-pointer hover:opacity-80 transition-opacity"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            
            {/* BUTTON */}
            <Button 
              type="submit" 
              className="w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Iniciar Sesión
            </Button>

            {/* REGISTER */}
            <div className="text-center pt-4 border-t border-blue-900/10">
              <p className="text-sm text-blue-900/70 mb-2">
                ¿No estás registrado?
              </p>

              <Link to="/register">
                <Button 
                  type="button" 
                  variant="outline"
                    className="w-full cursor-pointer border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"

                >
                  Regístrate aquí
                </Button>
              </Link>
            </div>

            {/* TEST USERS */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-900/70 mb-2 font-semibold">Usuarios de prueba:</p>
              <div className="text-xs text-blue-900/60 space-y-1">
                <p><strong>Admin Nutrición:</strong> docente.nutricion@utc.edu.mx / admin123</p>
                <p><strong>Admin Fisioterapia:</strong> docente.fisioterapia@utc.edu.mx / admin123</p>
                <p><strong>Practicante:</strong> practicante1@utc.edu.mx / prac123</p>
                <p><strong>Paciente:</strong> paciente1@gmail.com / pac123</p>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}