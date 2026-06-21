//LOGIN.TSX

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
  import { Check, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

  export default function Login() {
    // --- ESTADOS DEL FORMULARIO ---
    // useState guarda lo que el usuario escribe en tiempo real
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Estado para guardar y mostrar mensajes de error si los datos son incorrectos
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Extraemos la función de login del contexto global
    const { login } = useAuth();
    const navigate = useNavigate();

    // --- LÓGICA DE ENVÍO ---
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); // Evita que la página se recargue al enviar el formulario
      setError(''); // Limpia errores anteriores antes de intentar de nuevo

      // Intentamos iniciar sesión con los datos ingresados
      // Usamos 'await' porque ahora la validación se hace en la base de datos externa
      try {
        const success = await login(email, password);

        if (success) {
          // Si los datos coinciden, mandamos al usuario al panel principal
          navigate('/dashboard');
        } else {
          // Si fallan, activamos el mensaje de error en pantalla
          setError('Correo o contraseña incorrectos');
        }
      } catch {
        // login() rechaza la promesa cuando las credenciales son incorrectas
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
  <div className="mx-auto w-16 h-16 bg-blue-100 shadow-md rounded-full flex items-center justify-center mb-2">
    <img 
      src="/logo.png" 
      alt="Logo UTC"
      className="w-10 h-10 object-contain"/>
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
                <div className="relative group focus-within:text-blue-900">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />
                
                <Input
                  id="email"
                  type="email"
                  value={email} // Vinculado al estado 'email'
                  onChange={(e) => setEmail(e.target.value)} // Actualiza el estado al escribir
                  placeholder="tu@email.com"
                  required
                  className="pl-10 border-blue-900/20 focus:border-blue-900 focus:ring-blue-900" // className="pl-10  mueve el texto para que no choque con el icono
 />
                </div>
              </div>
              
              {/* Campo para la Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-900">Contraseña</Label>

                <div className="relative group focus-within:text-blue-900">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password} // Vinculado al estado 'password'
                  onChange={(e) => setPassword(e.target.value)} // Actualiza el estado al escribir
                  placeholder="Tu contraseña"
                  required
                  className="pl-10 border-blue-900/20 focus:border-blue-900 focus:ring-blue-900" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                </div>
              </div>
              <div className="text-right">
                <Link to="/forgot-password"
                className="text-sm text-blue-900 underline cursor-pointer hover:opacity-80 transition-opacity font-bold">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              
              {/* Botón de acceso con el color azul institucional */}
              <Button 
                type="submit" 
                className="w-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Iniciar Sesión
              </Button>

              {/* SECCIÓN DE REGISTRO: Para usuarios nuevos */}
              <div className="text-center pt-4 border-t border-blue-900/10">
                <p className="text-sm text-blue-900/70 mb-2 font-bold">
                  ¿No estás registrado?
                </p>
                <Link to="/register">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                    Regístrate aquí
                  </Button>
                </Link>
              </div>

              {/* AYUDA DE DESARROLLO: Lista de credenciales para pruebas rápidas */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-[14px] text-blue-900/70 mb-2 font-bold">    versión 1.2.1   </p>
                <div className="text-xs text-blue-900/60 space-y-1">
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }