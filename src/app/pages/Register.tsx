import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
// Importamos el hook de autenticación para registrar al usuario
import { useAuth } from '../contexts/AuthContext';
// Componentes de la interfaz (Shadcn UI)
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
// Iconos: Círculo de alerta para errores y Flecha para navegar atrás
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function Register() {
  // --- ESTADOS LOCALES ---
  // Guardamos cada campo del formulario de forma independiente
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); // Para mostrar mensajes de error al usuario

  const { register } = useAuth();
  const navigate = useNavigate();

  // --- LÓGICA DE ENVÍO ---
  // Agregamos 'async' para manejar la espera de la base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos al intentar registrar

    // 1. VALIDACIÓN: Las contraseñas deben ser idénticas
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // 2. VALIDACIÓN: Longitud mínima por seguridad
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // Intentamos el registro a través del Contexto usando 'await'
      const success = await register(name, email, password);
      
      if (success) {
        // Si todo sale bien, lo mandamos directo al dashboard
        navigate('/dashboard');
      } else {
        // Si el correo ya existe en el sistema
        setError('Este correo ya está registrado o hubo un problema');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error(err);
    }
  };

  return (
    // Fondo con degradado que mantiene la estética de toda la app
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-blue-900/10 shadow-xl">
        
        {/* ENCABEZADO: Logo circular de la UTC */}
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">UTC</span>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">
            Crear Cuenta Nueva
          </CardTitle>
          <CardDescription className="text-blue-900/70">
            Regístrate como paciente para agendar tus citas
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* MENSAJE DE ERROR: Solo aparece si el estado 'error' tiene texto */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm animate-in fade-in zoom-in-95">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {/* CAMPO: NOMBRE */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-blue-900">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                required
                className="border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
              />
            </div>
            
            {/* CAMPO: CORREO */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
              />
            </div>
            
            {/* CAMPO: CONTRASEÑA */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-900">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
              />
            </div>
            
            {/* CAMPO: CONFIRMAR CONTRASEÑA */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-blue-900">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
              />
            </div>
            
            {/* BOTÓN DE ACCIÓN: Usamos el color naranja para diferenciarlo de los botones de navegación */}
            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11"
            >
              Registrarse
            </Button>

            {/* OPCIÓN PARA VOLVER: En caso de que ya tenga cuenta */}
            <div className="text-center pt-4 border-t border-blue-900/10">
              <Link to="/login">
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full border-blue-900 text-blue-900 hover:bg-blue-50 h-11"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}