/**
 * ============================================================================
 * ARCHIVO: ForgotPassword.tsx
 * PROPÓSITO: Recuperación de cuenta en 3 pasos con validación de código.
 * CORRECCIÓN: Solución a Type Narrowing y sincronización con endpoints.ts.
 * ============================================================================
 */

import { useState } from 'react';
import { Check, Mail, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { endpoints } from '../lib/api';
import { toast } from 'sonner';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  // ESTADOS DE DATOS
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ESTADOS DE ERROR
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // VALIDACIONES
  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || !regex.test(value) ? 'Ingresa un email válido' : '';
  };

  const validatePassword = (value: string) => value.length < 8 ? 'Mínimo 8 caracteres' : '';
  const validateConfirm = (value: string) => value !== newPassword ? 'Las contraseñas no coinciden' : '';

  const handleBackToLogin = () => navigate('/login');

  return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-orange-50 font-sans">

        {/* --- SECCIÓN IZQUIERDA: INDICADORES DE PROGRESO --- */}
        <div className="hidden lg:flex w-1/2 items-center justify-end pr-16">
          <div className="max-w-sm w-full">
            <h1 className="text-5xl font-black text-blue-900 mb-4 tracking-tighter uppercase">
              Recuperar<br /><span className="text-orange-600">Acceso</span>
            </h1>
            <p className="text-slate-500 mb-10 font-medium italic">
              {currentStep === 'email' && 'Paso 1: Identifica tu cuenta institucional.'}
              {currentStep === 'code' && 'Paso 2: Verifica tu identidad con el código enviado.'}
              {currentStep === 'password' && 'Paso 3: Define una nueva contraseña segura.'}
              {currentStep === 'success' && '¡Listo! Tu cuenta ha sido restaurada.'}
            </p>

            <div className="flex items-center gap-4">
              {/* Paso 1: Email */}
              <StepIndicator
                  stepNumber={1}
                  label="Email"
                  isActive={currentStep === 'email'}
                  isCompleted={currentStep !== 'email'}
              />
              <div className={`h-0.5 w-12 ${currentStep !== 'email' ? 'bg-blue-900' : 'bg-slate-200'}`} />

              {/* Paso 2: Código */}
              <StepIndicator
                  stepNumber={2}
                  label="Código"
                  isActive={currentStep === 'code'}
                  isCompleted={currentStep === 'password' || currentStep === 'success'}
              />
              <div className={`h-0.5 w-12 ${(currentStep === 'password' || currentStep === 'success') ? 'bg-blue-900' : 'bg-slate-200'}`} />

              {/* Paso 3: Nueva Clave */}
              <StepIndicator
                  stepNumber={3}
                  label="Nueva"
                  isActive={currentStep === 'password'}
                  isCompleted={currentStep === 'success'}
              />
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DERECHA: FORMULARIOS DINÁMICOS --- */}
        <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white p-8 sm:p-10 space-y-8">

            {/* VISTA DE ÉXITO FINAL */}
            {currentStep === 'success' ? (
                <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tighter">¡Éxito Total!</h2>
                  <p className="text-slate-500 text-sm font-medium italic">Tu contraseña ha sido actualizada correctamente. Ya puedes volver a ingresar al sistema.</p>
                  <Button onClick={handleBackToLogin} className="w-full h-12 bg-blue-900 hover:bg-black text-white font-black uppercase rounded-xl">
                    Ir al Inicio de Sesión
                  </Button>
                </div>
            ) : (
                <>
                  {/* FORMULARIO: PASO 1 (EMAIL) */}
                  {currentStep === 'email' && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const err = validateEmail(email);
                        setEmailError(err);
                        if (err) return;
                        try {
                          setLoading(true);
                          const res = await fetch(`${endpoints.usuarios}/forgot-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                          });
                          if (res.ok) { setCurrentStep('code'); toast.success("Código de verificación enviado"); }
                          else { const d = await res.json(); setEmailError(d.error || 'Correo no encontrado'); }
                        } catch { setEmailError('Error de conexión con el servidor'); }
                        finally { setLoading(false); }
                      }} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-blue-900 font-black uppercase text-xs ml-1">Correo Electrónico</Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-blue-900/30" />
                            <Input value={email} onChange={(e) => { setEmail(e.target.value.trim()); setEmailError(''); }} placeholder="usuario@utc.edu.mx" className="pl-12 h-12 rounded-xl border-slate-100 bg-white" />
                          </div>
                          {emailError && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{emailError}</p>}
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95">
                          {loading ? <Loader2 className="animate-spin" /> : "Enviar Código"}
                        </Button>
                      </form>
                  )}

                  {/* FORMULARIO: PASO 2 (CÓDIGO) */}
                  {currentStep === 'code' && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (verificationCode.length !== 6) { setCodeError('Código incompleto'); return; }
                        try {
                          setLoading(true);
                          const res = await fetch(`${endpoints.usuarios}/verify-code`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, code: verificationCode })
                          });
                          if (res.ok) setCurrentStep('password');
                          else { const d = await res.json(); setCodeError(d.error || 'Código incorrecto'); }
                        } catch { setCodeError('Fallo en la verificación'); }
                        finally { setLoading(false); }
                      }} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-blue-900 font-black uppercase text-xs ml-1">Código de 6 Dígitos</Label>
                          <div className="relative">
                            <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-blue-900/30" />
                            <Input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="pl-12 h-14 rounded-xl text-2xl tracking-[0.5em] text-center font-black border-slate-100 bg-white" />
                          </div>
                          {codeError && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{codeError}</p>}
                        </div>
                        <Button type="submit" disabled={loading || verificationCode.length !== 6} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase rounded-xl shadow-lg">
                          {loading ? <Loader2 className="animate-spin" /> : "Validar Código"}
                        </Button>
                      </form>
                  )}

                  {/* FORMULARIO: PASO 3 (NUEVA CONTRASEÑA) */}
                  {currentStep === 'password' && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const pErr = validatePassword(newPassword);
                        const cErr = validateConfirm(confirmPassword);
                        setPasswordError(pErr); setConfirmPasswordError(cErr);
                        if (pErr || cErr) return;
                        try {
                          setLoading(true);
                          const res = await fetch(`${endpoints.usuarios}/reset-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, newPassword })
                          });
                          if (res.ok) setCurrentStep('success');
                          else toast.error("Error al actualizar la base de datos");
                        } catch { toast.error("Error de red"); }
                        finally { setLoading(false); }
                      }} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-blue-900 font-black uppercase text-xs ml-1">Nueva Contraseña</Label>
                          <Input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }} className="h-12 rounded-xl border-slate-100" />
                          {passwordError && <p className="text-red-500 text-xs font-bold">{passwordError}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-blue-900 font-black uppercase text-xs ml-1">Confirmar Contraseña</Label>
                          <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }} className="h-12 rounded-xl border-slate-100" />
                          {confirmPasswordError && <p className="text-red-500 text-xs font-bold">{confirmPasswordError}</p>}
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded-xl shadow-lg">
                          {loading ? <Loader2 className="animate-spin" /> : "Restablecer Ahora"}
                        </Button>
                      </form>
                  )}

                  <div className="pt-4 border-t border-slate-50 text-center">
                    <button onClick={handleBackToLogin} className="text-blue-900/40 hover:text-blue-900 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors">
                      <ArrowLeft className="w-3 h-3" /> Volver al Login
                    </button>
                  </div>
                </>
            )}
          </div>
        </div>
      </div>
  );
}

// COMPONENTE AUXILIAR PARA LOS CÍRCULOS DE PROGRESO
function StepIndicator({ stepNumber, label, isActive, isCompleted }: { stepNumber: number, label: string, isActive: boolean, isCompleted: boolean }) {
  return (
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm transition-all duration-500
        ${isCompleted ? 'bg-blue-900 text-white' : isActive ? 'bg-orange-500 text-white scale-110' : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
          {isCompleted ? <Check className="w-5 h-5" /> : <span className="font-black">{stepNumber}</span>}
        </div>
        <span className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isActive ? 'text-orange-600' : 'text-blue-900/40'}`}>{label}</span>
      </div>
  );
}