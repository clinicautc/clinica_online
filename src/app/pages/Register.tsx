import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import {AlertCircle,ArrowLeft,Mail,ShieldCheck,Loader2,Eye,EyeOff,User,Lock,Check,X,Phone} from 'lucide-react';
import { toast } from '../lib/toast';
import { authAPI } from '../lib/api';
import { capitalizeWords } from '../lib/textFormat';
import { useAuth } from '../contexts/AuthContext';

// En móvil, salir de la app para abrir el correo y leer el código puede hacer
// que el navegador descargue la pestaña por memoria y la recargue al volver.
// sessionStorage sobrevive exactamente ese caso (a diferencia del estado de
// React) — así el borrador del registro y el paso "esperando código" no se
// pierden, evitando el ciclo de pedir un código nuevo cada vez que se recarga.
const DRAFT_KEY = 'utc_registro_draft';

function loadDraft(): Partial<{
  nombre: string; apellido: string; email: string; password: string;
  confirmPassword: string; telefono: string; verificationCode: string; codeSent: boolean;
}> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function Register() {
  const draft = loadDraft();
  const [nombre, setNombre] = useState(draft.nombre || '');
  const [apellido, setApellido] = useState(draft.apellido || '');
  const [email, setEmail] = useState(draft.email || '');
  const [password, setPassword] = useState(draft.password || '');
  const [confirmPassword, setConfirmPassword] = useState(draft.confirmPassword || '');
  const [telefono, setTelefono] = useState(draft.telefono || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword,setShowConfirmPassword] = useState(false);
  const passwordValidation = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch =password === confirmPassword;
  const [verificationCode, setVerificationCode] = useState(draft.verificationCode || '');

  // ESTADOS DE FLUJO DE VERIFICACIÓN
  const [error, setError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(draft.codeSent || false);
  const [_isVerified, _setIsVerified] = useState(false);

  const navigate = useNavigate();
  const { completarRegistro } = useAuth();

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        nombre, apellido, email, password, confirmPassword, telefono, verificationCode, codeSent
      }));
    } catch {
      // sessionStorage no disponible (modo privado, etc.) — el flujo sigue funcionando,
      // solo se pierde la recuperación tras una recarga.
    }
  }, [nombre, apellido, email, password, confirmPassword, telefono, verificationCode, codeSent]);

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  };

  // --- 1. LÓGICA PARA ENVIAR CÓDIGO VÍA RESEND ---
  // Reemplaza la función handleSendCode en Register.tsx
// Modificación en Register.tsx para el "Filtro de Retención"
const handleSendCode = async () => {
    // Validamos que no falte nada antes de "retenerlo" en la DB temporal
    if (!nombre || !apellido || !email || !password) {
      setError('Llena todos los campos para recibir tu código.');
      return;
    }

    try {
      setIsSendingCode(true);

      // Enviamos TODO al backend para que lo guarde en registro_temporal
await authAPI.sendRegisterCode({
  name: `${capitalizeWords(nombre)} ${capitalizeWords(apellido)}`,
  email,
  password,
  telefono: telefono || undefined
});



      toast.success(' Código enviado a tu Correo.');
      setCodeSent(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSendingCode(false);
    }
};

const handleResendCode = async () => {

  try {

    setIsResendingCode(true);

await authAPI.resendCode({

  email,

  tipo: 'registro'

});

    toast.success(
      'Código reenviado correctamente.'
    );

  } catch (err: any) {

    setError(err.message);

  } finally {

    setIsResendingCode(false);

  }

};

  // --- 2. LÓGICA DE REGISTRO FINAL ---
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (password !== confirmPassword) {
    setError('Las contraseñas no coinciden');
    return;
  }
  if (!isPasswordValid) {
  setError('La contraseña no cumple los requisitos de seguridad.');
  return;
  }

  try {
    await completarRegistro(email, verificationCode);

    clearDraft();
    toast.success('Cuenta creada exitosamente');
    navigate('/dashboard');

  } catch (err: any) {
    setError(err.message);
  }
};

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center p-3 lg:p-6"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* CAPAS ESTÉTICAS UTC (mismo fondo de marca de agua del panel master) */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      {/* Contenedor Principal (Tarjeta Dividida) */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">

        {/* PANEL IZQUIERDO (Instrucciones) - Consistente con el Login. En móvil se muestra
            completo arriba del formulario para no ocultar contenido. */}
        <div className="order-1 flex lg:w-5/12 bg-[#002f6c] relative items-center justify-center p-8 overflow-hidden">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>

          <div className="relative z-10 w-full text-center">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-5 shadow-lg flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform">
              <img src="/logo-mark.png" alt="Logo UTC" className="w-full h-full object-contain p-2.5" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">Únete a la Clínica</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-5">
              Crea tu perfil clínico universitario en unos pocos pasos y gestiona tu salud de forma integral.
            </p>

            {/* Instrucciones de Registro */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <strong className="text-white block mb-0.5 text-sm">Ingresa tus datos</strong>
                  <span className="text-blue-100 text-xs leading-relaxed block">Escribe tu nombre, apellidos y un correo electrónico que uses normalmente.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <strong className="text-white block mb-0.5 text-sm">Crea tu contraseña</strong>
                  <span className="text-blue-100 text-xs leading-relaxed block">Inventa una palabra secreta de al menos 8 letras. Asegúrate de combinar mayúsculas, minúsculas, algún número y un símbolo (como @, ! o #), es importante escribirla igual en cada recuadro. Mira cómo se ponen en verde los requisitos debajo mientras escribes</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#f26522] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <strong className="text-white block mb-0.5 text-sm">Verifica tu correo</strong>
                  <span className="text-blue-100 text-xs leading-relaxed block">Por seguridad, te enviaremos un código a tu correo. Busca en tu bandeja de entrada o spam y escribelo para terminar de registrarte.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Círculos decorativos */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
        </div>

        {/* PANEL DERECHO (Formulario) — debajo del panel azul en móvil */}
        <div className="order-2 w-full lg:w-7/12 p-6 sm:p-10 lg:px-14 lg:py-8 flex flex-col justify-center bg-white/95 backdrop-blur-md overflow-y-auto">

          <div className="mb-5 text-center lg:text-left">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#002f6c] mb-1">Registro UTC</h3>
            <p className="text-slate-500 text-sm font-medium">Crea tu perfil clínico universitario</p>
          </div>

          {/* Formulario */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-sm shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Fila: Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="nombre" className="block text-sm font-bold text-[#002f6c]">Nombre</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="nombre"
                    autoComplete="given-name"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                    maxLength={40}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800 placeholder-slate-400 font-medium"
                    placeholder="Tu nombre"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Solo letras y espacios, sin números ni símbolos.</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="apellido" className="block text-sm font-bold text-[#002f6c]">Apellido</label>
                <div className="relative group">
                  <input
                    type="text"
                    id="apellido"
                    autoComplete="family-name"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                    maxLength={40}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800 placeholder-slate-400 font-medium"
                    placeholder="Tus apellidos"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Solo letras y espacios, sin números ni símbolos.</p>
              </div>
            </div>

            {/* Campo Correo */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-bold text-[#002f6c]">Correo electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={codeSent}
                  required
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800 placeholder-slate-400 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder=""
                />
              </div>
            </div>

            {/* Campo Teléfono (opcional) */}
            <div className="space-y-1">
              <label htmlFor="telefono" className="block text-sm font-bold text-[#002f6c]">
                Número de teléfono <span className="text-slate-400 font-medium">(opcional)</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                </div>
                <input
                  type="tel"
                  id="telefono"
                  autoComplete="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="10 dígitos"
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">
                Solo números (máximo 10 dígitos). Nos permite contactarte si la clínica necesita darte información sobre tu cita o tu seguimiento.
              </p>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-bold text-[#002f6c]">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#002f6c] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-[#002f6c]">Confirmar contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-10 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-medium
                    ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-400 focus:ring-green-400/20' : 'border-red-400 focus:ring-red-400/20') : 'border-slate-200 focus:ring-[#002f6c]/20 focus:border-[#002f6c]'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#002f6c] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-xs font-bold">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* VALIDADOR INTERACTIVO DE CONTRASEÑA */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Requisitos de contraseña</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs font-medium">
                <RequirementItem isValid={passwordValidation.minLength} text="Mínimo 8 caracteres" />
                <RequirementItem isValid={passwordValidation.uppercase} text="Una letra mayúscula" />
                <RequirementItem isValid={passwordValidation.lowercase} text="Una letra minúscula" />
                <RequirementItem isValid={passwordValidation.number} text="Un número" />
                <RequirementItem isValid={passwordValidation.special} text="Un carácter especial" />
              </ul>
            </div>

            {/* CAMPO DINÁMICO: CÓDIGO DE VERIFICACIÓN */}
            {codeSent && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label htmlFor="code" className="flex items-center gap-1 text-sm font-bold text-[#f26522]">
                  <ShieldCheck className="w-4 h-4" /> Código de Verificación
                </label>
                <input
                  id="code"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={verificationCode}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setVerificationCode(value);
                  }}
                  required
                  className="w-full px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522] transition-all text-slate-800"
                />
              </div>
            )}

            {/* --- BOTÓN DE ENVIAR CÓDIGO (UBICACIÓN SOLICITADA) --- */}
            {!codeSent ? (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode ||!isPasswordValid ||!passwordsMatch}
                className={`w-full font-bold py-2.5 rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98] flex justify-center items-center gap-2
                  ${isPasswordValid && passwordsMatch
                    ? 'bg-[#002f6c] hover:bg-[#001f4c] text-white shadow-[#002f6c]/30 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                  }`}
              >
                {isSendingCode ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Mail className="w-4 h-4" /> Enviar código al correo</>
                )}
              </button>
            ) : (
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResendingCode}
                  className="text-xs font-bold text-[#f26522] hover:text-[#d1551a] tracking-wide cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ¿No recibiste el código?
                  <br />
                  Reenviar código
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => setCodeSent(false)}
                    className="text-xs font-bold text-slate-500 hover:text-[#002f6c] tracking-wide cursor-pointer transition-colors"
                  >
                    Cambiar correo
                  </button>
                </div>
              </div>
            )}

            {/* BOTÓN DE REGISTRO FINAL */}
            <button
              type="submit"
              disabled={verificationCode.length !== 6 ||!isPasswordValid ||!passwordsMatch}
              className={`w-full font-bold py-2.5 rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98]
                ${verificationCode.length === 6 && isPasswordValid && passwordsMatch
                  ? 'bg-[#f26522] hover:bg-[#d1551a] text-white shadow-[#f26522]/30 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                }`}
            >
              Registrarse en la clínica
            </button>
          </form>

          {/* Enlace Volver */}
          <div className="mt-5 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#002f6c] hover:text-[#f26522] transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Volver al inicio de sesión
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para la lista de requisitos interactiva
function RequirementItem({ isValid, text }: { isValid: boolean, text: string }) {
  return (
    <li className={`flex items-center gap-1.5 transition-colors duration-300 ${isValid ? 'text-green-600' : 'text-slate-400'}`}>
      {isValid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />}
      <span>{text}</span>
    </li>
  );
}
