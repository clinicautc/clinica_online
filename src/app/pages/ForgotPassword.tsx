import { useState } from 'react';
import { Check,Mail,KeyRound,Eye,EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { authAPI } from '../lib/api';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);const [ showConfirmPassword,setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [_confirmPasswordError, setConfirmPasswordError] = useState('');
  const passwordValidation = {
  minLength: newPassword.length >= 8,
  uppercase: /[A-Z]/.test(newPassword),
  lowercase: /[a-z]/.test(newPassword),
  number: /[0-9]/.test(newPassword),
  special: /[^A-Za-z0-9]/.test(newPassword),
};

const isPasswordValid =
  Object.values(passwordValidation)
    .every(Boolean);

const passwordsMatch =
  newPassword === confirmPassword;

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || !regex.test(value) ? 'Ingresa un email válido' : '';
  };

  const validatePassword = (value: string) => {
    return value.length < 8 ? 'Mínimo 8 caracteres' : '';
  };

  const validateConfirm = (value: string) => {
    return value !== newPassword ? 'No coinciden' : '';
  };

  const handleBackToLogin = () => navigate('/');
  const handleResendCode = async () => {

    try {

      setCodeError('');

      await authAPI.resendCode({
        email,
        tipo: 'password'
      });

      toast.success('Código reenviado correctamente.');

    } catch (err: any) {

      setCodeError('Error al reenviar el código');

    }

  };
  // ===============================
  // SUCCESS
  // ===============================
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center space-y-6">
          <Check className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold text-blue-900">¡Contraseña actualizada!</h2>
          <Button onClick={handleBackToLogin}>
            Volver al login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-orange-50">

      {/* IZQUIERDA — en móvil se muestra completa arriba del formulario (no se oculta), centrada. */}
      <div className="flex w-full lg:w-1/2 items-center justify-center lg:justify-end px-6 pt-10 lg:pt-0 lg:pr-10">
        <div className="max-w-sm w-full">

          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            Recupera contraseña
          </h1>

          <p className="text-gray-600 mb-10">
            {currentStep === 'email' && 'Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.'}
            {currentStep === 'code' && 'Te enviamos un código. Escríbelo para continuar.'}
            {currentStep === 'password' && 'Crea una nueva contraseña segura.'}
          </p>


          <div className="flex items-center gap-4">

            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full
                ${currentStep !== 'email'
                  ? 'bg-blue-900 text-white'
                  : 'bg-blue-100 text-blue-900'}`}>
                {currentStep !== 'email' ? '✓' : '1'}
              </div>
              <span className="text-sm mt-2 text-gray-500">Email</span>
            </div>

            <div className="h-1 w-16 bg-gray-200" />

            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full
                ${currentStep === 'password'
                  ? 'bg-blue-900 text-white'
                  : currentStep === 'code'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-900'}`}>
                {currentStep === 'password' ? '✓' : '2'}
              </div>
              <span className="text-sm mt-2 text-gray-500">Código</span>
            </div>

            <div className="h-1 w-16 bg-gray-200" />

            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full
                ${currentStep === 'password'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-900'}`}>
                3
              </div>
              <span className="text-sm mt-2 text-gray-500">Nueva</span>
            </div>

          </div>
        </div>
      </div>
      {/* DERECHA */}

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6">

          {/* EMAIL */}
          {currentStep === 'email' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const err = validateEmail(email);
                setEmailError(err);
                if (err) return;

              try {

                setIsSendingCode(true);

                await authAPI.forgotPassword(email);

                toast.success('Código enviado a tu Correo.');

                setCurrentStep('code');

              } catch (err: any) {

                setEmailError(err.message || 'Error de conexión');

              } finally {

                setIsSendingCode(false);

              }
              }}
              className="space-y-4"
            >
              <Label>Correo electrónico</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <Input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="tu@email.com"
                  className="pl-10"
                />
              </div>

              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}

              <Button type="submit"disabled={isSendingCode}className={`w-full cursor-pointer bg-blue-900 hover:bg-blue-800 ${isSendingCode ? 'opacity-60 cursor-not-allowed' : ''}`}> 
                {isSendingCode ? 'Enviando...' : 'Enviar código'}
              </Button>
            </form>
          )}

          {/* CODE */}
          {currentStep === 'code' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                if (verificationCode.length !== 6) {
                  setCodeError('El código debe tener 6 dígitos');
                  return;
                }

                try {
                await authAPI.verifyResetCode({
                  email,
                  code: verificationCode
                  });

setCurrentStep('password');

                } catch {
                  setCodeError('Error de conexión');
                }
              }}
              className="space-y-4"
            >
              <Label>Código</Label>

              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <Input
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setCodeError('');
                  }}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  className="pl-10 text-center"
                />
              </div>

              {codeError && <p className="text-red-500 text-sm">{codeError}</p>}

              <Button 
                type="submit"
                disabled={verificationCode.length !== 6}
                className={`w-full
                  ${verificationCode.length !== 6
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-900 hover:bg-blue-800 cursor-pointer'
                  }`}
              >
                Verificar
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="
                    text-xs
                    font-black
                    text-slate-500
                    hover:text-blue-900
                    tracking-wide
                    cursor-pointer
                    transition-colors
                    duration-200
                  "
                >

                  ¿No recibiste el código?
                  <br />
                  Reenviar código

                </button>
              </div>
            </form>
          )}

          {/* PASSWORD */}
          {currentStep === 'password' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const pErr = validatePassword(newPassword);
                const cErr = validateConfirm(confirmPassword);

                setPasswordError(pErr);
                setConfirmPasswordError(cErr);

                if (pErr || cErr) return;

                try {
              await authAPI.resetPassword({
                email,
                code: verificationCode,
                newPassword
               });

setCurrentStep('success');

                } catch {
                  setPasswordError('Error de conexión');
                }
              }}
              className="space-y-4"
            >
{/* Campo de usuario oculto: le indica al gestor de contraseñas del navegador
    a qué cuenta corresponde este cambio (mismo patrón que CambiarPasswordInicial.tsx). */}
<input
  type="email"
  name="username"
  autoComplete="username"
  value={email}
  readOnly
  aria-hidden="true"
  tabIndex={-1}
  style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}
/>

<Label>Nueva contraseña</Label>

<div className="relative">

  <Input
    type={
      showPassword
        ? 'text'
        : 'password'
    }
    autoComplete="new-password"
    value={newPassword}
    onChange={(e) => {
      setNewPassword(e.target.value);
      setPasswordError('');
    }}
    className="pr-10"
  />

  <button
    type="button"
    onClick={() =>
      setShowPassword(!showPassword)
    }
    className="
      absolute
      right-3
      top-1/2
      -translate-y-1/2
      text-slate-400
      hover:text-blue-900
    "
  >
    {
      showPassword
        ? (
          <EyeOff className="w-4 h-4" />
        )
        : (
          <Eye className="w-4 h-4" />
        )
    }
  </button>

</div>

{
  passwordError && (
    <p className="text-red-500 text-sm">
      {passwordError}
    </p>
  )
}

<Label>
  Confirmar contraseña
</Label>

<div className="relative">

  <Input
    type={
      showConfirmPassword
        ? 'text'
        : 'password'
    }
    autoComplete="new-password"
    value={confirmPassword}
    onChange={(e) => {
      setConfirmPassword(e.target.value);
      setConfirmPasswordError('');
    }}
    className="pr-10"
  />

  <button
    type="button"
    onClick={() =>
      setShowConfirmPassword(
        !showConfirmPassword
      )
    }
    className="
      absolute
      right-3
      top-1/2
      -translate-y-1/2
      text-slate-400
      hover:text-blue-900
    "
  >
    {
      showConfirmPassword
        ? (
          <EyeOff className="w-4 h-4" />
        )
        : (
          <Eye className="w-4 h-4" />
        )
    }
  </button>

</div>

{
  confirmPassword &&
  !passwordsMatch && (
    <p className="text-red-500 text-sm">
      Las contraseñas no coinciden
    </p>
  )
}

<div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Requisitos de contraseña</p>
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs font-medium">
    <li className={`flex items-center gap-1.5 ${passwordValidation.minLength ? 'text-green-600' : 'text-slate-400'}`}>
      {passwordValidation.minLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">•</span>} Mínimo 8 caracteres
    </li>
    <li className={`flex items-center gap-1.5 ${passwordValidation.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">•</span>} Una letra mayúscula
    </li>
    <li className={`flex items-center gap-1.5 ${passwordValidation.lowercase ? 'text-green-600' : 'text-slate-400'}`}>
      {passwordValidation.lowercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">•</span>} Una letra minúscula
    </li>
    <li className={`flex items-center gap-1.5 ${passwordValidation.number ? 'text-green-600' : 'text-slate-400'}`}>
      {passwordValidation.number ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">•</span>} Un número
    </li>
    <li className={`flex items-center gap-1.5 ${passwordValidation.special ? 'text-green-600' : 'text-slate-400'}`}>
      {passwordValidation.special ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">•</span>} Un carácter especial
    </li>
  </ul>
</div>

              <Button disabled={!isPasswordValid ||!passwordsMatch}
  className={`w-full
    ${
      isPasswordValid &&
      passwordsMatch
        ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
        : 'bg-gray-400 cursor-not-allowed'
    }
  `}
>
                Guardar contraseña
              </Button>
            </form>
          )}

          <div className="text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm text-blue-900 underline cursor-pointer hover:opacity-80 transition-opacity"
            >
              Volver al inicio de sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}