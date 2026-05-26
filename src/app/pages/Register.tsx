import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {AlertCircle,ArrowLeft,Mail,ShieldCheck,Loader2,Eye,EyeOff} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
  const [verificationCode, setVerificationCode] = useState('');
  
  // ESTADOS DE FLUJO DE VERIFICACIÓN
  const [error, setError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const navigate = useNavigate();

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
  name: `${nombre} ${apellido}`,
  email,
  password
});

      

      toast.success('Datos retenidos. Código enviado a tu Gmail.');
      setCodeSent(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSendingCode(false);
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
await authAPI.verifyRegister({
  email,
  code: verificationCode
});

    toast.success('Cuenta creada exitosamente');
    navigate('/login');

  } catch (err: any) {
    setError(err.message);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-900 rounded-3xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-black text-blue-900 text-center">Registro UTC</CardTitle>
          <CardDescription className="text-center font-medium">
            Crea tu perfil clínico universitario
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center text-sm font-bold">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}


<div className="grid grid-cols-2 gap-3">

  <div className="space-y-2">
    <Label htmlFor="nombre" className="text-blue-900 font-bold">
      Nombre
    </Label>

    <Input
      id="nombre"
      placeholder="Nombre"
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
      required
      className="rounded-xl border-slate-200 focus:border-blue-900"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="apellido" className="text-blue-900 font-bold">
      Apellido
    </Label>

    <Input
      id="apellido"
      placeholder="Apellido"
      value={apellido}
      onChange={(e) => setApellido(e.target.value)}
      required
      className="rounded-xl border-slate-200 focus:border-blue-900"
    />
  </div>

</div>


            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900 font-bold">Correo electrónico</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@utc.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={codeSent}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          <div className="space-y-2">

            <Label
              htmlFor="password"
              className="text-blue-900 font-bold"
            >
              Contraseña
            </Label>

            <div className="relative">

              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl pr-10"
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
                  transition-colors
                "
              >
                {
                  showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                }
              </button>

            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-blue-900 font-bold">Confirmar contraseña</Label>
              <div className="relative">

  <Input
    id="confirmPassword"
    type={
      showConfirmPassword
        ? 'text'
        : 'password'
    }
    value={confirmPassword}
    onChange={(e) =>
      setConfirmPassword(e.target.value)
    }
    placeholder="••••••••"
    required
    className="rounded-xl pr-10"
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
      transition-colors
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
                      <p className="text-red-500 text-xs font-bold">
                        Las contraseñas no coinciden
                      </p>
                    )
                  }
                            <div className="space-y-1 text-xs mt-2">

                 <p className={passwordValidation.minLength ? 'text-green-600' : 'text-slate-400'}>
                   • Mínimo 8 caracteres
                   </p>

                 <p className={passwordValidation.uppercase ? 'text-green-600' : 'text-slate-400'}>
                    • Una letra mayúscula
                     </p>

                 <p className={passwordValidation.lowercase ? 'text-green-600' : 'text-slate-400'}>
                    • Una letra minúscula
                     </p>

                 <p className={passwordValidation.number ? 'text-green-600' : 'text-slate-400'}>
                    • Un número
               </p>

              <p className={passwordValidation.special ? 'text-green-600' : 'text-slate-400'}>
                  • Un carácter especial
             </p>

            </div>
            </div>
            </div>

            {/* CAMPO DINÁMICO: CÓDIGO DE VERIFICACIÓN */}
            {codeSent && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="code" className="text-orange-600 font-black flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Código de Verificación
                </Label>
                <Input
                 id="code"
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
                  className="border-orange-500 focus:ring-orange-500 rounded-xl font-mono text-center text-lg tracking-widest"
                />
              </div>
            )}
            
            {/* --- BOTÓN DE ENVIAR CÓDIGO (UBICACIÓN SOLICITADA) --- */}
            {!codeSent ? (
              <Button 
                type="button" 
                onClick={handleSendCode}
                disabled={isSendingCode ||!isPasswordValid ||!passwordsMatch}
                className={
                  `w-full
                  h-11
                  rounded-xl
                  font-bold
                  transition-all
                  duration-300
                  active:scale-[0.98]

                  ${
                    isPasswordValid && passwordsMatch

                      ? 'bg-blue-900 hover:bg-blue-800 text-white hover:scale-[1.008] hover:shadow-lg transform-gpu cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
                `}
              >
                {isSendingCode ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ENVIANDO...</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" /> ENVIAR CÓDIGO AL CORREO</>
                )}
              </Button>
            ) : (
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setCodeSent(false)} 
                  className="text-xs font-black text-slate-500 hover:text-blue-900 tracking-wide cursor-pointer transition-colors duration-200"
                >
                  ¿No recibiste el codigo?   <br /> 
                   intenta con otro correo
                </button>
              </div>
            )}

            {/* BOTÓN DE REGISTRO FINAL */}
            <Button 
              type="submit"
              disabled={verificationCode.length !== 6 ||!isPasswordValid ||!passwordsMatch}
              className={`
                w-full
                h-11
                rounded-xl
                font-black
                transition-all
                duration-300
                active:scale-[0.98]

                ${
                  verificationCode.length === 6 && isPasswordValid && passwordsMatch
                   ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-[1.008] transform-gpu hover:shadow-lg cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
                      `}
                  >
               REGISTRARSE EN LA CLÍNICA
            </Button>

            <div className="text-center pt-4 border-t border-slate-100">
              <Link to="/login">
                <Button 
                  type="button" 
                  variant="ghost"
                  className="w-full text-blue-900 font-bold hover:bg-blue-50  transform-gpu transition-all duration-300 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}