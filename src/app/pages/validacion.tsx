/**
 * ============================================================================
 * ARCHIVO: Validacion.tsx (Versión Final Sincronizada)
 * PROPÓSITO: Pantalla de validación con iconos activos y salto al Dashboard.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// CORRECCIÓN: Ahora todos estos iconos se utilizan en el código
import { AlertCircle, ArrowLeft, ShieldCheck, Mail, Loader2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function Validacion() {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth(); 

  const registrationData = location.state || {};
  const { name, email, password } = registrationData;

  useEffect(() => {
    if (!email) {
      toast.error("Datos de registro no encontrados.");
      navigate('/register');
    }
  }, [email, navigate]);

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }

    try {
      setIsVerifying(true);
      
      // Registro y validación en la tabla de retención del servidor
      await register(name, email, password, verificationCode);
      
      toast.success('¡Bienvenido a la Clínica UTC!', {
        icon: <PartyPopper className="text-orange-500 w-5 h-5" />, // Uso de PartyPopper
      });

      // SALTO AL DASHBOARD: El usuario entra directamente tras validar
      navigate('/patient-dashboard'); 

    } catch (err: any) {
      setError(err.message || 'El código es incorrecto o ha expirado.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('No se pudo reenviar el código.');
      toast.success('Nuevo código enviado a tu Gmail.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <p className="text-xl font-black text-orange-600 uppercase tracking-tight animate-pulse">
          Esperando su Código de Validación
        </p>
        <p className="text-sm font-medium text-slate-500 mt-2 flex items-center justify-center gap-2">
          {/* USO DE MAIL: Aquí el icono Mail deja de estar en amarillo */}
          <Mail className="w-4 h-4 text-blue-900" /> 
          Código enviado a: <span className="font-bold text-blue-900">{email}</span>
        </p>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-orange-600 rounded-3xl">
        <CardHeader className="bg-slate-50/50 border-b p-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shadow-inner">
                 <ShieldCheck className="w-6 h-6 text-orange-600" /> {/* Uso de ShieldCheck */}
             </div>
             <div>
                 <CardTitle className="text-2xl font-black text-blue-900">Validación UTC</CardTitle>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Verificación de Identidad</p>
             </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleVerifyAndRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center text-sm font-bold">
                <AlertCircle className="w-4 h-4 mr-2" /> {/* Uso de AlertCircle */}
                {error}
              </div>
            )}

            <div className="space-y-3 text-center">
              <Label htmlFor="code" className="text-blue-900 font-black uppercase text-[10px] tracking-widest">
                Ingresa el código de 6 dígitos enviado a tu Gmail
              </Label>
              <Input
                id="code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                required
                className="w-full h-16 rounded-2xl font-black text-center text-3xl border-orange-500 border-2 focus:ring-orange-600 shadow-inner bg-orange-50"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white h-14 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
            >
              {isVerifying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> VALIDANDO...</> // Uso de Loader2
              ) : (
                'ENTRAR A MI PANEL CLÍNICO'
              )}
            </Button>

            <div className="text-center pt-5 border-t mt-6 space-y-4">
              <button 
                type="button" 
                onClick={handleResendCode}
                disabled={isResending}
                className="text-[11px] font-black text-blue-900 hover:underline uppercase"
              >
                {isResending ? 'Generando nuevo código...' : 'No recibí el código'}
              </button>
              
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => navigate('/register')}
                className="w-full text-slate-400 font-bold text-xs"
              >
                <ArrowLeft className="w-3 h-3 mr-2" /> CORREGIR CORREO {/* Uso de ArrowLeft */}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}