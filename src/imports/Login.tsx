import React, { useState } from 'react';
// Importamos herramientas de navegación para mover al usuario entre pantallas
import { useNavigate, Link } from 'react-router';
// Importamos el "cerebro" de la autenticación para validar los datos
import { useAuth } from '../contexts/AuthContext';
// Componentes visuales de la interfaz (Botones, Inputs, Etiquetas, Tarjetas)
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
// Icono de advertencia para mostrar cuando algo sale mal
import { AlertCircle } from 'lucide-react';

export default function Login() {
  // --- ESTADOS DEL FORMULARIO ---
  // useState guarda lo que el usuario escribe en tiempo real
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estado para guardar y mostrar mensajes de error si los datos son incorrectos
  const [error, setError] = useState('');

  // Extraemos la función de login del contexto global
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- LÓGICA DE ENVÍO ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    setError(''); // Limpia errores anteriores antes de intentar de nuevo

    // Intentamos iniciar sesión con los datos ingresados
    const success = login(email, password);

    if (success) {
      // Si los datos coinciden, mandamos al usuario al panel principal
      navigate('/dashboard');
    } else {
      // Si fallan, activamos el mensaje de error en pantalla
      setError('Correo o contraseña incorrectos');
    }
  };

  return (
    // Contenedor principal centrado con el fondo degradado oficial de la clínica
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      
      {/* Tarjeta contenedora del Login con sombra para resaltar */}
      <Card className="w-full max-w-md border-blue-900/10 shadow-xl">
        
        {/* ENCABEZADO: Logo de la UTC y Títulos */}
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">UTC</span>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">
            Clínica Universitaria
          </CardTitle>
          <CardDescription className="text-blue-900/70">
            Fisioterapia y Nutrición
          </CardDescription>
        </CardHeader>

        {/* CUERPO: Formulario de entrada */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* MENSAJE DE ERROR: Solo aparece si el estado 'error' tiene texto */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {/* Campo para el Correo */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email} // Vinculado al estado 'email'
                onChange={(e) => setEmail(e.target.value)} // Actualiza el estado al escribir
                placeholder="tu@correo.com"
                required
                className="border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
              />
            </div>
            
            {/* Campo para la Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-900">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password} // Vinculado al estado 'password'
                onChange={(e) => setPassword(e.target.value)} // Actualiza el estado al escribir
                placeholder="••••••••"
                required
                className="border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
              />
            </div>
            
            {/* Botón de acceso con el color azul institucional */}
            <Button 
              type="submit" 
              className="w-full bg-blue-900 hover:bg-blue-800 text-white"
            >
              Iniciar Sesión
            </Button>

            {/* SECCIÓN DE REGISTRO: Para usuarios nuevos */}
            <div className="text-center pt-4 border-t border-blue-900/10">
              <p className="text-sm text-blue-900/70 mb-2">
                ¿No estás registrado?
              </p>
              <Link to="/register">
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                >
                  Crear cuenta nueva
                </Button>
              </Link>
            </div>

            {/* AYUDA DE DESARROLLO: Lista de credenciales para pruebas rápidas */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-900/70 mb-2 font-semibold">Usuarios de prueba:</p>
              <div className="text-xs text-blue-900/60 space-y-1">
                <p><strong>Admin:</strong> admin1@utc.edu.mx / admin123</p>
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