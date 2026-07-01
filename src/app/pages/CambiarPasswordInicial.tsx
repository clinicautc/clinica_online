// CAMBIAR-PASSWORD-INICIAL.TSX
// Pantalla obligatoria para practicantes en su primer inicio de sesión.
// Solo es alcanzable viniendo de Login.tsx (necesita email + passwordActual
// en location.state); si se llega de cualquier otra forma, se manda a /login.
//
// Lógica de código y de validación de contraseña: misma que ForgotPassword.tsx
// (reutiliza authAPI.forgotPassword / resendCode / verifyResetCode).

import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import { AlertCircle, Eye, EyeOff, KeyRound, Lock, Check, X } from 'lucide-react';

interface LocationState {
  email: string;
  passwordActual: string;
}

type Step = 'code' | 'password';

export default function CambiarPasswordInicial() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completarPrimerInicio } = useAuth();

  const state = location.state as LocationState | null;

  const [step, setStep] = useState<Step>('code');

  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Misma regla que ForgotPassword: 8+ caracteres, mayúscula, minúscula, número y especial.
  const passwordValidation = {
    minLength: passwordNueva.length >= 8,
    uppercase: /[A-Z]/.test(passwordNueva),
    lowercase: /[a-z]/.test(passwordNueva),
    number: /[0-9]/.test(passwordNueva),
    special: /[^A-Za-z0-9]/.test(passwordNueva),
  };
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = passwordNueva === confirmarPassword;

  const yaEnvioCodigo = useRef(false);

  useEffect(() => {
    if (!state?.email || yaEnvioCodigo.current) return;
    yaEnvioCodigo.current = true;

    (async () => {
      try {
        setIsSendingCode(true);
        await authAPI.sendCodigoPrimerInicio(state.email);
      } catch {
        setCodeError('No se pudo enviar el código. Usa "Reenviar código" para intentar de nuevo.');
      } finally {
        setIsSendingCode(false);
      }
    })();
  }, [state?.email]);

  if (!state?.email || !state?.passwordActual) {
    return <Navigate to="/login" replace />;
  }

  const handleResendCode = async () => {
    try {
      setCodeError('');
      await authAPI.resendCode({ email: state.email, tipo: 'primer_inicio' });
    } catch {
      setCodeError('Error al reenviar el código.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setCodeError('El código debe tener 6 dígitos.');
      return;
    }

    try {
      await authAPI.verifyResetCode({ email: state.email, code: verificationCode });
      setStep('password');
    } catch (err: any) {
      setCodeError(err.message || 'Código incorrecto o expirado.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid || !passwordsMatch) return;

    try {
      setIsSubmitting(true);
      await completarPrimerInicio(state.email, state.passwordActual, passwordNueva);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
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

      {/* Contenedor Principal (Tarjeta Dividida) - mismo diseño que Login/Registro */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">

        {/* PANEL IZQUIERDO (Instrucciones) */}
        <div className="hidden lg:flex lg:w-5/12 bg-[#002f6c] relative items-center justify-center p-8 overflow-hidden">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>

          <div className="relative z-10 w-full text-center">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-5 shadow-lg flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform">
              <img src="/logo-mark.png" alt="Logo UTC" className="w-full h-full object-contain p-2.5" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">Protege tu cuenta</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-5">
              Es tu primer inicio de sesión. Sigue estos pasos para verificar tu identidad y definir tu nueva contraseña.
            </p>

            {/* Instrucciones de Cambio de Contraseña */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <strong className="text-white block mb-0.5 text-sm">Revisa tu correo</strong>
                  <span className="text-blue-100 text-xs leading-relaxed block">Te enviamos un código de 6 dígitos a tu correo institucional.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <strong className="text-white block mb-0.5 text-sm">Verifica el código</strong>
                  <span className="text-blue-100 text-xs leading-relaxed block">Ingresa el código recibido para confirmar que eres tú.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#f26522] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <strong className="text-white block mb-0.5 text-sm">Crea tu contraseña</strong>
                  <span className="text-blue-100 text-xs leading-relaxed block">Define una nueva contraseña segura cumpliendo los requisitos indicados.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Círculos decorativos */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
        </div>

        {/* PANEL DERECHO (Formulario) */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 lg:px-14 lg:py-8 flex flex-col justify-center bg-white/95 backdrop-blur-md overflow-y-auto">

          {/* Header móvil */}
          <div className="flex lg:hidden justify-center mb-6">
            <div className="w-16 h-16 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center bg-white">
              <img src="/logo-mark.png" alt="Logo UTC" className="w-full h-full object-contain p-1.5" />
            </div>
          </div>

          <div className="mb-5 text-center lg:text-left">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#002f6c] mb-1">Cambia tu contraseña</h3>
            <p className="text-slate-500 text-sm font-medium">
              {step === 'code'
                ? <>Te enviamos un código a <strong className="text-[#002f6c]">{state.email}</strong>.</>
                : 'Define una nueva contraseña segura para continuar.'}
            </p>
          </div>

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-3.5">
              {/* Campo de usuario oculto: le indica al gestor de contraseñas del
                  navegador a qué cuenta corresponde este formulario, para que no
                  intente asociar el cambio con la última cuenta usada (ej. master). */}
              <input
                type="email"
                name="username"
                autoComplete="username"
                value={state.email}
                readOnly
                aria-hidden="true"
                tabIndex={-1}
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}
              />

              {codeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-sm shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="verificationCode" className="block text-sm font-bold text-[#002f6c]">Código de verificación</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                  </div>
                  <input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setCodeError('');
                    }}
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verificationCode.length !== 6 || isSendingCode}
                className={`w-full font-bold py-2.5 rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98] ${
                  verificationCode.length !== 6
                    ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                    : 'bg-[#002f6c] hover:bg-[#001f4c] text-white shadow-[#002f6c]/30 cursor-pointer'
                }`}
              >
                {isSendingCode ? 'Enviando código...' : 'Verificar'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-xs font-bold text-slate-500 hover:text-[#002f6c] tracking-wide cursor-pointer transition-colors"
                >
                  ¿No recibiste el código? Reenviar código
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Mismo campo de usuario oculto que en el paso de código. */}
              <input
                type="email"
                name="username"
                autoComplete="username"
                value={state.email}
                readOnly
                aria-hidden="true"
                tabIndex={-1}
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-sm shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="passwordNueva" className="block text-sm font-bold text-[#002f6c]">Nueva contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                  </div>
                  <input
                    id="passwordNueva"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Crea una contraseña segura"
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all text-slate-800 placeholder-slate-400 font-medium"
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

              {/* Checklist de requisitos — misma lógica que ForgotPassword.tsx */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Requisitos de contraseña</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs font-medium">
                  <RequirementItem isValid={passwordValidation.minLength} text="Mínimo 8 caracteres como @, !, #. " />
                  <RequirementItem isValid={passwordValidation.uppercase} text="Una letra mayúscula" />
                  <RequirementItem isValid={passwordValidation.lowercase} text="Una letra minúscula" />
                  <RequirementItem isValid={passwordValidation.number} text="Un número" />
                  <RequirementItem isValid={passwordValidation.special} text="Un carácter especial" />
                </ul>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmarPassword" className="block text-sm font-bold text-[#002f6c]">Confirmar nueva contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#002f6c] transition-colors" />
                  </div>
                  <input
                    id="confirmarPassword"
                    name="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-10 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-medium
                      ${confirmarPassword.length > 0 ? (passwordsMatch ? 'border-green-400 focus:ring-green-400/20' : 'border-red-400 focus:ring-red-400/20') : 'border-slate-200 focus:ring-[#002f6c]/20 focus:border-[#002f6c]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#002f6c] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmarPassword && !passwordsMatch && (
                  <p className="text-red-500 text-xs font-bold">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                className={`w-full font-bold py-2.5 rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98] ${
                  isPasswordValid && passwordsMatch
                    ? 'bg-[#f26522] hover:bg-[#d1551a] text-white shadow-[#f26522]/30 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar y continuar'}
              </button>
            </form>
          )}
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
