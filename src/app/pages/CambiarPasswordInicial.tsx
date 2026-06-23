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
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';

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
        await authAPI.forgotPassword(state.email);
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
      await authAPI.resendCode({ email: state.email, tipo: 'password' });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-blue-900/10 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 shadow-md rounded-full flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-blue-900" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">
            Cambia tu contraseña
          </CardTitle>
          <CardDescription className="text-blue-900/70">
            {step === 'code'
              ? <>Es tu primer inicio de sesión. Te enviamos un código a <strong>{state.email}</strong>.</>
              : 'Define una nueva contraseña segura para continuar.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {codeError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-blue-900">Código de verificación</Label>
                <div className="relative group focus-within:text-blue-900">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />
                  <Input
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
                    className="pl-10 text-center border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={verificationCode.length !== 6 || isSendingCode}
                className={`w-full transition-all duration-300 ${
                  verificationCode.length !== 6
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                    : 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                }`}
              >
                {isSendingCode ? 'Enviando código...' : 'Verificar'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-xs font-black text-slate-500 hover:text-blue-900 tracking-wide cursor-pointer transition-colors"
                >
                  ¿No recibiste el código? Reenviar código
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="passwordNueva" className="text-blue-900">Nueva contraseña</Label>
                <div className="relative group focus-within:text-blue-900">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />
                  <Input
                    id="passwordNueva"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Crea una contraseña segura"
                    required
                    autoComplete="new-password"
                    className="pl-10 pr-10 border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
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

              {/* Checklist de requisitos — misma lógica que ForgotPassword.tsx */}
              <div className="text-xs space-y-1 bg-blue-50/50 rounded-lg p-3">
                <p className={passwordValidation.minLength ? 'text-green-600 font-medium' : 'text-slate-400'}>• Mínimo 8 caracteres</p>
                <p className={passwordValidation.uppercase ? 'text-green-600 font-medium' : 'text-slate-400'}>• Una letra mayúscula</p>
                <p className={passwordValidation.lowercase ? 'text-green-600 font-medium' : 'text-slate-400'}>• Una letra minúscula</p>
                <p className={passwordValidation.number ? 'text-green-600 font-medium' : 'text-slate-400'}>• Un número</p>
                <p className={passwordValidation.special ? 'text-green-600 font-medium' : 'text-slate-400'}>• Un carácter especial</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarPassword" className="text-blue-900">Confirmar nueva contraseña</Label>
                <div className="relative group focus-within:text-blue-900">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-all duration-200" />
                  <Input
                    id="confirmarPassword"
                    name="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    autoComplete="new-password"
                    className="pl-10 pr-10 border-blue-900/20 focus:border-blue-900 focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmarPassword && !passwordsMatch && (
                  <p className="text-red-500 text-sm">Las contraseñas no coinciden</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                className={`w-full transition-all duration-300 ${
                  isPasswordValid && passwordsMatch
                    ? 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar y continuar'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
