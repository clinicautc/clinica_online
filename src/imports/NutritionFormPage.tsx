import React, { useState } from 'react';
// Hooks para navegación y para atrapar parámetros de la URL (como el ID de la cita)
import { useNavigate, useParams } from 'react-router';
// Componentes de la interfaz para estructurar el formulario
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
// Iconos para botones de acción
import { ArrowLeft, Save, X } from 'lucide-react';
// Librería para mostrar notificaciones flotantes (toasts)
import { toast } from 'sonner';

export default function NutritionFormPage() {
  const navigate = useNavigate();
  // Obtenemos el ID de la cita desde la URL (ej: /nutrition/123)
  const { appointmentId } = useParams();

  // --- ESTADO INICIAL DEL FORMULARIO ---
  // Centralizamos todos los campos en un solo objeto para facilitar el manejo
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    temperatura: '',
    diagnostico: '',
    objetivo: '',
    educacionNutricia: '',
    consejeriaNutricia: '',
    requerimientoCaloric: '',
    proteinas: '',
    hco: '',
    lipidos: '',
  });

  // --- MANEJADOR DE CAMBIOS ---
  // Función dinámica que actualiza cualquier campo del objeto formData
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- LÓGICA DE GUARDADO ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Recuperamos los historiales existentes del almacenamiento local
    const histories = JSON.parse(localStorage.getItem('utc_medical_histories') || '[]');
    
    // 2. Creamos el nuevo registro con un ID único y la fecha actual
    const newHistory = {
      id: `hist${Date.now()}`, // Genera un ID basado en el tiempo
      patientId: 'current_user',
      patientName: 'Paciente',
      type: 'nutricion',
      date: new Date().toISOString().split('T')[0], // Formato AAAA-MM-DD
      data: formData, // Aquí guardamos todo lo que el usuario escribió
      createdBy: 'Sistema'
    };
    
    // 3. Guardamos en el arreglo y actualizamos el localStorage
    histories.push(newHistory);
    localStorage.setItem('utc_medical_histories', JSON.stringify(histories));
    
    // 4. Notificamos éxito y regresamos al dashboard
    toast.success('Formulario guardado exitosamente');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-3 sm:p-4 pb-20 sm:pb-4">
      <div className="max-w-4xl mx-auto py-4 sm:py-8">
        
        {/* BOTÓN VOLVER: Adaptable para móvil (escondemos el texto largo en pantallas mini) */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-blue-900 hover:bg-blue-100/50 -ml-2 sm:ml-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Volver al Panel</span>
          <span className="xs:hidden font-bold text-lg">Volver</span>
        </Button>

        {/* TARJETA PRINCIPAL DEL FORMULARIO */}
        <Card className="border-blue-900/10 shadow-lg overflow-hidden">
          {/* Encabezado con un degradado naranja para diferenciarlo de Fisioterapia */}
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/30 border-b border-orange-100">
            <CardTitle className="text-xl sm:text-2xl text-blue-900">
              Formulario de Nutrición
            </CardTitle>
            <CardDescription className="text-blue-900/60">
              Registro de evaluación y plan nutricional
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* --- SECCIÓN: SIGNOS VITALES --- */}
              {/* Usamos un Grid inteligente: 1 columna en móvil, 2 en tablet y 3 en PC */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-900/10 pb-2">
                  <h3 className="text-lg font-bold text-blue-900">Signos Vitales</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 text-sm font-medium">Peso (kg)</Label>
                    <Input
                      type="number"
                      inputMode="decimal" // Optimiza el teclado numérico en móviles
                      value={formData.peso}
                      onChange={(e) => handleChange('peso', e.target.value)}
                      placeholder="75"
                      className="border-blue-900/20 h-11 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 text-sm font-medium">Altura (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.altura}
                      onChange={(e) => handleChange('altura', e.target.value)}
                      placeholder="1.75"
                      className="border-blue-900/20 h-11 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-blue-900 text-sm font-medium">Presión Arterial</Label>
                    <Input
                      value={formData.presionArterial}
                      onChange={(e) => handleChange('presionArterial', e.target.value)}
                      placeholder="120/80"
                      className="border-blue-900/20 h-11 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </section>

              {/* --- SECCIÓN: EVALUACIÓN Y TEXTOS LARGOS --- */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-blue-900 border-b border-blue-900/10 pb-2">Evaluación</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 text-sm font-medium">Diagnósticos Nutricios</Label>
                    <Textarea
                      value={formData.diagnostico}
                      onChange={(e) => handleChange('diagnostico', e.target.value)}
                      className="border-blue-900/20 min-h-[100px] text-base"
                      placeholder="Evaluación detallada..."
                    />
                  </div>
                </div>
              </section>

              {/* --- SECCIÓN: MACRONUTRIENTES --- */}
              {/* Campos pequeños para el cálculo calórico del paciente */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-blue-900 border-b border-blue-900/10 pb-2">Macronutrientes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-blue-900 text-xs font-bold uppercase">Calorías</Label>
                    <Input 
                      value={formData.requerimientoCaloric} 
                      onChange={(e)=>handleChange('requerimientoCaloric', e.target.value)} 
                      className="h-11 border-orange-200" 
                      placeholder="kcal"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 text-xs font-bold uppercase">Prot (g)</Label>
                    <Input value={formData.proteinas} onChange={(e)=>handleChange('proteinas', e.target.value)} className="h-11"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 text-xs font-bold uppercase">HCO (g)</Label>
                    <Input value={formData.hco} onChange={(e)=>handleChange('hco', e.target.value)} className="h-11"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 text-xs font-bold uppercase">Lip (g)</Label>
                    <Input value={formData.lipidos} onChange={(e)=>handleChange('lipidos', e.target.value)} className="h-11"/>
                  </div>
                </div>
              </section>

              {/* --- BOTONES DE ACCIÓN --- */}
              {/* El botón de Guardar es naranja para mantener la identidad de Nutrición */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="submit"
                  className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg shadow-lg order-1 sm:order-2"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Evaluación
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto border-blue-900/20 text-blue-900 h-12 order-2 sm:order-1"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}