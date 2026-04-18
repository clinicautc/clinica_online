import { useState } from 'react';
import { Check, Mail, Lock, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  // SUCCESS
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

          {/* PROGRESO */}
          <div className="flex items-center gap-4">

            {/* 1 */}
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

            {/* 2 */}
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

            {/* 3 */}
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

      {/* DERECHA */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6">

          {/* MOBILE HEADER */}
          <div className="lg:hidden text-center space-y-2 mb-4">
            <h1 className="text-xl font-bold text-blue-900">
              Recupera tu contraseña
            </h1>

            <p className="text-sm text-gray-600">
              {currentStep === 'email' && 'Ingresa tu correo electrónico para recuperar tu cuenta.'}
              {currentStep === 'code' && 'Te enviamos un código. Escríbelo para continuar.'}
              {currentStep === 'password' && 'Crea una nueva contraseña segura.'}
            </p>
          </div>

          {/* EMAIL */}
          {currentStep === 'email' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const err = validateEmail(email);
                setEmailError(err);
                if (err) return;

                try {
                  const response = await fetch('http://localhost:3001/api/usuarios/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                  });

                  if (response.ok) {
                    setCurrentStep('code');
                  } else {
                    const data = await response.json();
                    setEmailError(data.error);
                  }

                } catch {
                  setEmailError('Error de conexión');
                }
              }}
              className="space-y-4"
            >
              <Label>Correo electrónico</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-10"
                />
              </div>

              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}

              <Button type="submit" className="w-full cursor-pointer bg-blue-900 hover:bg-blue-800">
                Enviar código
              </Button>
            </form>
          )}

          {/* CODE */}
          {currentStep === 'code' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                try {
                  const response = await fetch('http://localhost:3001/api/usuarios/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email,
                      code: verificationCode
                    })
                  });

                  if (response.ok) {
                    setCurrentStep('password');
                  } else {
                    const data = await response.json();
                    setCodeError(data.error);
                  }

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
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="pl-10 text-center"
                />
              </div>

              {codeError && <p className="text-red-500 text-sm">{codeError}</p>}

              <Button type="submit" className="w-full cursor-pointer bg-blue-900 hover:bg-blue-800">
                Verificar
              </Button>
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
                  const response = await fetch('http://localhost:3001/api/usuarios/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email,
                      newPassword
                    })
                  });

                  if (response.ok) {
                    setCurrentStep('success');
                  } else {
                    setPasswordError('Error al actualizar contraseña');
                  }

                } catch {
                  setPasswordError('Error de conexión');
                }
              }}
              className="space-y-4"
            >
              <Label>Nueva contraseña</Label>

              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}

              <Label>Confirmar contraseña</Label>

              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {confirmPasswordError && (
                <p className="text-red-500 text-sm">{confirmPasswordError}</p>
              )}

              <Button className="w-full cursor-pointer bg-orange-500 hover:bg-orange-600">
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