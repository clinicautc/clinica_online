//LOGIN.TSX

  import React, { useState } from 'react';
  // Importamos herramientas de navegación para mover al usuario entre pantallas
  import { useNavigate, Link } from 'react-router';

  // Importamos el "cerebro" de la autenticación para validar los datos
  import { useAuth } from '../contexts/AuthContext';
  // Icono de advertencia para mostrar cuando algo sale mal
  import { AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';

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
      } catch (err: any) {
        // PRIMER INICIO: login() rechaza la promesa con esta marca en vez de
        // un error real. Redirigimos al cambio de contraseña obligatorio.
        if (err?.requiereCambioPassword) {
          navigate('/cambiar-password-inicial', {
            state: { email: err.email, passwordActual: password }
          });
          return;
        }

        // En cualquier otro caso, las credenciales son incorrectas
        setError('Correo o contraseña incorrectos');
      }
    };

    return (
      // Contenedor principal
      <div
        className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center p-3 lg:p-6"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* CAPAS ESTÉTICAS UTC (mismo fondo de marca de agua del panel master) */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60"></div>
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

        {/* Contenedor Principal (Tarjeta Dividida) */}
        <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1000px] lg:min-h-[714px] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">

          {/* Panel Izquierdo (Branding e Instrucciones) — en móvil se muestra completo arriba
              del formulario para no ocultar contenido; en desktop va a la izquierda. */}
          <div className="order-1 flex lg:w-5/12 bg-[#002f6c] relative items-center justify-center p-8 overflow-hidden">
            {/* Patrón de fondo sutil */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>

            <div className="relative z-10 text-center text-white w-full">
              <div className="w-24 h-24 bg-white rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                <img src="/logo-mark.png" alt="Logo UTC" className="w-full h-full object-contain p-2.5" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Clínica Universitaria</h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-5">
                Accede a tu portal para gestionar citas y servicios de Fisioterapia y Nutrición.
              </p>

              {/* Instrucciones integradas en el panel izquierdo */}
              <div className="text-left bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl mb-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-1.5 bg-white/20 text-white rounded-lg shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5 text-sm">Iniciar Sesión</strong>
                    <span className="text-blue-100 text-xs leading-relaxed block">Usa esta opción si ya tienes una cuenta registrada o si la universidad te proporcionó credenciales de acceso.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-[#f26522]/80 text-white rounded-lg shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5 text-sm">Crear Cuenta</strong>
                    <span className="text-blue-100 text-xs leading-relaxed block">Usa esta opción si eres un paciente nuevo y aún no tienes datos de acceso al portal.</span>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center space-x-2 text-xs font-semibold bg-white/10 px-4 py-2 rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span>Sistema UTC</span>
              </div>
            </div>

            {/* Elementos decorativos (círculos) */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#f26522] rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
          </div>

          {/* Panel Derecho (Formulario de Login) — debajo del panel azul en móvil */}
          <div className="order-2 w-full lg:w-7/12 p-6 sm:p-10 lg:px-14 lg:py-8 flex flex-col justify-center" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>

            <div className="mb-6 text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-2">¡Bienvenido!</h3> <br /> 
              <p className="text-slate-500 text-sm">Por favor, ingresa tus credenciales para continuar.</p>
            </div>

            {/* Formulario */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* MENSAJE DE ERROR: Solo aparece si el estado 'error' tiene texto */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-sm shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Campo para el Correo */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Correo institucional</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email} // Vinculado al estado 'email'
                    onChange={(e) => setEmail(e.target.value)} // Actualiza el estado al escribir
                    required
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all placeholder-slate-400 font-medium text-slate-800 shadow-sm"
                    placeholder="usuario@utc.edu.mx"
                  />
                </div>
              </div>

              {/* Campo para la Contraseña */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Contraseña</label> 
                  <Link to="/forgot-password" className="text-xs font-bold text-[#f26522] hover:text-[#d1551a] hover:underline transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link> 
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password} // Vinculado al estado 'password'
                    onChange={(e) => setPassword(e.target.value)} // Actualiza el estado al escribir
                    required
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all placeholder-slate-400 font-medium text-slate-800 shadow-sm"
                    placeholder="••••••••"
                  />

                  {/* Botón Mostrar/Ocultar */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Opciones Extra (Recordarme) */}
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[#002f6c] focus:ring-[#002f6c] border-gray-300 rounded cursor-pointer" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                  Mantener sesión iniciada
                </label>
              </div>

              {/* Botón de acceso con el color azul institucional */}
              <button
                type="submit"
                className="w-full bg-[#002f6c] hover:bg-[#001f4c] active:transform active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-[0_4px_14px_0_rgba(0,47,108,0.39)] hover:shadow-[0_6px_20px_rgba(0,47,108,0.23)] transition-all duration-200 mt-4 flex justify-center items-center gap-2 cursor-pointer"
              >
                Iniciar Sesión
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">   {/* http://www.w3.org/2000/svg para dibujar una flecha en el boton*/}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </form>

            {/* SECCIÓN DE REGISTRO: Para usuarios nuevos, y footer con versión */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center lg:text-left flex flex-col lg:flex-row justify-between items-center gap-4">
              <p className="text-sm font-medium text-slate-600">
                ¿Primera vez aquí?  
                <Link to="/register" className=" text-[#002f6c] hover:text-[#f26522] font-bold underline decoration-2 decoration-[#002f6c]/30 underline-offset-2 transition-colors ml-3">
                  Crear cuenta
                </Link>
              </p>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">v1.2.1</span>
            </div>
          </div>
        </div>
      </div>
    );
  }