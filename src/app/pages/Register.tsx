import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // ===============================
  // ENVIAR CÓDIGO
  // ===============================
  const handleSendCode = async () => {
    setError('');

    if (!email) {
      return setError('Ingresa un correo primero');
    }

    try {
      setSendingCode(true);

      const res = await fetch('http://localhost:3001/api/usuarios/register-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        alert('Código enviado a tu correo 📧');
      }

    } catch {
      setError('Error al enviar código');
    } finally {
      setSendingCode(false);
    }
  };

  // ===============================
  // REGISTRO
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      return setError('El código debe tener 6 dígitos');
    }

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    try {
      const verifyResponse = await fetch('http://localhost:3001/api/usuarios/verify-register-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Código inválido');
        return;
      }

      const success = await register(name, email, password);

      if (success) {
        navigate('/dashboard');
      } else {
        setError('Error al registrar usuario');
      }

    } catch {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-blue-900/10 shadow-xl">

        <CardHeader className="space-y-3 text-center">
<div className="mx-auto w-16 h-16 bg-blue-100 shadow-md rounded-full flex items-center justify-center mb-2">
  <img 
    src="/logo.png" 
    alt="Logo UTC"
    className="w-10 h-10 object-contain"
  />
</div>
          <CardTitle className="text-2xl font-bold text-blue-900">
            Crear Cuenta Nueva
          </CardTitle>
          <CardDescription className="text-blue-900/70">
            Regístrate como paciente para agendar tus citas
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* NOMBRE */}
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode}
                className={`w-full mt-2
                  ${sendingCode
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-900 hover:bg-blue-800 cursor-pointer'
                  }`}
              >
                {sendingCode ? 'Enviando...' : 'Enviar código'}
              </Button>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CÓDIGO */}
            <div className="space-y-2">
              <Label>Código de verificación</Label>
              <Input
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }}
                placeholder="Ingrese su codigo de 6 dígitos"
                maxLength={6}
                inputMode="numeric"
                className="text-center tracking-widest"
              />
            </div>

            {/* BOTÓN */}
            <Button 
              type="submit"
              disabled={code.length !== 6}
              className={`w-full h-11 text-white
                ${code.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                }`}
            >
              Registrarse
            </Button>

            <div className="text-center pt-4 border-t border-blue-900/10">
              <Link to="/login">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer border-blue-900 text-blue-900 hover:bg-blue-50 h-11"
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