import { useState } from 'react';
import { Check,Mail,Lock,KeyRound,Eye,EyeOff } from 'lucide-react';
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
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
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

      {/* IZQUIERDA */}
      <div className="hidden lg:flex w-1/2 items-center justify-end pr-10">
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
                ${currentStep === 'password' || currentStep === 'success'
                  ? 'bg-blue-900 text-white'
                  : currentStep === 'code'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-900'}`}>
                {currentStep === 'password' || currentStep === 'success' ? '✓' : '2'}
              </div>
              <span className="text-sm mt-2 text-gray-500">Código</span>
            </div>

            <div className="h-1 w-16 bg-gray-200" />

            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full
                ${currentStep === 'success'
                  ? 'bg-blue-900 text-white'
                  : currentStep === 'password'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-900'}`}>
                {currentStep === 'success' ? '✓' : '3'}
              </div>
              <span className="text-sm mt-2 text-gray-500">Nueva</span>
            </div>

          </div>
        </div>
      </div>
      {
  currentStep === 'password' && (
    <div className="
      hidden
      xl:flex
      flex-col
      justify-center
      px-10
      text-sm
      space-y-3
      min-w-[260px]
    ">
      <h3 className="text-blue-900 font-bold ">Contraseña segura</h3>

      <p className={
        passwordValidation.minLength
          ? 'text-green-600 font-medium'
          : 'text-slate-400'
      }>
        • Mínimo 8 caracteres
      </p>

      <p className={
        passwordValidation.uppercase
          ? 'text-green-600 font-medium'
          : 'text-slate-400'
      }>
        • Una letra mayúscula
      </p>

      <p className={
        passwordValidation.lowercase
          ? 'text-green-600 font-medium'
          : 'text-slate-400'
      }>
        • Una letra minúscula
      </p>

      <p className={
        passwordValidation.number
          ? 'text-green-600 font-medium'
          : 'text-slate-400'
      }>
        • Un número
      </p>

      <p className={
        passwordValidation.special
          ? 'text-green-600 font-medium'
          : 'text-slate-400'
      }>
        • Un carácter especial
      </p>

    </div>
  )
}

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
                newPassword
               });

setCurrentStep('success');

                } catch {
                  setPasswordError('Error de conexión');
                }
              }}
              className="space-y-4"
            >
<Label>Nueva contraseña</Label>

<div className="relative">

  <Input
    type={
      showPassword
        ? 'text'
        : 'password'
    }
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