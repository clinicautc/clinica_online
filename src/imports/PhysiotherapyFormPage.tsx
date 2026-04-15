import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
// Componentes de la UI para tarjetas, botones, entradas de texto y etiquetas
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
// Iconos: Flecha para volver, Disco para guardar y Actividad (pulso) para el header
import { ArrowLeft, Save, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function PhysiotherapyFormPage() {
  const navigate = useNavigate();
  // Extraemos el ID de la cita para saber a qué registro ligar esta evaluación
  const { appointmentId } = useParams();

  // --- ESTADO DEL FORMULARIO ---
  // Un solo objeto que contiene toda la exploración física y el plan de rehabilitación
  const [formData, setFormData] = useState({
    cabello: '',
    ojos: '',
    bocaMucosaOral: '',
    piel: '',
    unas: '',
    hallazgo: '',
    deficienciaExceso: '',
    lesion: '',
    movilidad: '',
    fuerza: '',
    dolor: '',
    tratamiento: '',
    observaciones: '',
  });

  // Función genérica para actualizar cualquier campo del formulario
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- MANEJADOR DE GUARDADO ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Obtenemos los historiales existentes (o un arreglo vacío si no hay nada)
    const histories = JSON.parse(localStorage.getItem('utc_medical_histories') || '[]');
    
    // Creamos el nuevo registro clínico
    const newHistory = {
      id: `hist${Date.now()}`, // ID único basado en milisegundos
      patientId: 'current_user',
      patientName: 'Paciente',
      type: 'fisioterapia', // Etiqueta para filtrar después por especialidad
      date: new Date().toISOString().split('T')[0],
      data: formData, // Guardamos todo el objeto de la exploración
      createdBy: 'Sistema'
    };
    
    histories.push(newHistory);
    localStorage.setItem('utc_medical_histories', JSON.stringify(histories));
    
    // Feedback visual para el usuario
    toast.success('Formulario guardado exitosamente');
    navigate('/dashboard'); // Redirección automática al terminar
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-3 sm:p-4 pb-10">
      <div className="max-w-4xl mx-auto py-4 sm:py-8">
        
        {/* BOTÓN VOLVER: Con efecto de transparencia (ghost) */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-blue-900 hover:bg-blue-100/50 -ml-2 sm:ml-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="border-blue-900/10 shadow-xl overflow-hidden">
          {/* HEADER: Con degradado azul fuerte para resaltar la especialidad médica */}
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Evaluación Fisioterapéutica</CardTitle>
                <CardDescription className="text-blue-100/80">
                  Registro de exploración física y plan de rehabilitación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 px-4 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* --- SECCIÓN 1: EXPLORACIÓN FÍSICA --- */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-blue-900 border-b border-blue-900/10 pb-2">
                  Exploración Física
                </h3>
                {/* Mapeo de campos para no repetir código innecesariamente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'cabello', label: 'Cabello', ph: 'Estado' },
                    { id: 'ojos', label: 'Ojos', ph: 'Estado' },
                    { id: 'bocaMucosaOral', label: 'Boca / Mucosa', ph: 'Estado' },
                    { id: 'piel', label: 'Piel', ph: 'Estado' },
                    { id: 'unas', label: 'Uñas', ph: 'Estado' }
                  ].map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={field.id} className="text-blue-900 font-medium">{field.label}</Label>
                      <Input
                        id={field.id}
                        value={formData[field.id as keyof typeof formData]}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.ph}
                        className="border-blue-900/10 h-11 focus:ring-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* --- SECCIÓN 2: EVALUACIÓN DE LA LESIÓN --- */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-blue-900 border-b border-blue-900/10 pb-2">
                  Evaluación de la Lesión
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 font-medium">Lesión / Afección</Label>
                    <Input
                      value={formData.lesion}
                      onChange={(e) => handleChange('lesion', e.target.value)}
                      placeholder="Ej. Esguince grado II"
                      className="h-11 border-blue-900/10"
                    />
                  </div>
                  {/* Escala EVA: Muy importante en fisioterapia para medir progreso */}
                  <div className="space-y-1.5">
                    <Label className="text-blue-900 font-medium">Nivel de Dolor (EVA: 0-10)</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="10"
                      value={formData.dolor}
                      onChange={(e) => handleChange('dolor', e.target.value)}
                      placeholder="0"
                      className="h-11 border-blue-900/10"
                    />
                  </div>
                </div>
              </div>

              {/* --- SECCIÓN 3: TEXTOS LARGOS --- */}
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-blue-900 border-b border-blue-900/10 pb-2">
                  Plan y Observaciones
                </h3>
                <div className="space-y-1.5">
                  <Label className="text-blue-900 font-medium">Hallazgo Principal</Label>
                  <Textarea
                    value={formData.hallazgo}
                    onChange={(e) => handleChange('hallazgo', e.target.value)}
                    className="min-h-[100px] text-base border-blue-900/10"
                    placeholder="Describa los hallazgos durante la sesión..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-blue-900 font-medium">Tratamiento Aplicado</Label>
                  <Textarea
                    value={formData.tratamiento}
                    onChange={(e) => handleChange('tratamiento', e.target.value)}
                    className="min-h-[120px] text-base border-blue-900/10"
                    placeholder="Ej. Termoterapia, TENS, Ejercicios de Williams..."
                  />
                </div>
              </div>

              {/* --- BOTONES DE ACCIÓN --- */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-blue-900/5">
                <Button
                  type="submit"
                  className="w-full sm:flex-1 bg-blue-900 hover:bg-blue-800 text-white h-12 text-lg shadow-md active:scale-[0.98] transition-all"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Sesión
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto border-blue-900/20 text-blue-900 h-12"
                >
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