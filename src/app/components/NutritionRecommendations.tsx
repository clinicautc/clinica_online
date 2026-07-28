/**
 * ============================================================================
 * ARCHIVO: NutritionRecommendations.tsx
 * PROPÓSITO: Componente para que el profesional escriba recomendaciones y el paciente las lea.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Save, FileText, Loader2, Calendar, User, MessageSquare } from 'lucide-react';
import { toast } from '../lib/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { recomendacionesAPI } from '../lib/api';

interface Recommendation {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  contenido: string;
  creado_por_id: number;
  creado_por_nombre: string;
  fecha_creacion: string;
  area: 'nutricion' | 'fisioterapia';
}

interface NutritionRecommendationsProps {
  pacienteId: string | number;
  pacienteNombre: string;
  area?: 'nutricion' | 'fisioterapia';
  readOnly?: boolean;
}

export default function NutritionRecommendations({ 
  pacienteId, 
  pacienteNombre,
  area = 'nutricion',
  readOnly = false 
}: NutritionRecommendationsProps) {
  const { user } = useAuth();
  const [recomendaciones, setRecomendaciones] = useState('');
  const [historialRecomendaciones, setHistorialRecomendaciones] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const theme = {
    color: area === 'fisioterapia' ? 'text-blue-900' : 'text-amber-700',
    colorAlt: area === 'fisioterapia' ? 'text-blue-600' : 'text-amber-500',
    border: area === 'fisioterapia' ? 'border-blue-900/20' : 'border-amber-400/20',
    bgLight: area === 'fisioterapia' ? 'bg-blue-50' : 'bg-amber-50',
    bgIcon: area === 'fisioterapia' ? 'bg-blue-100' : 'bg-amber-100',
    btn: area === 'fisioterapia' ? 'bg-blue-900 hover:bg-blue-800' : 'bg-amber-600 hover:bg-amber-700',
  };

  useEffect(() => {
    fetchRecommendations();
  }, [pacienteId, area]);

  const fetchRecommendations = async () => {
    try {
      setLoadingHistory(true);
      const data = await recomendacionesAPI.getByPaciente(pacienteId, area);
      setHistorialRecomendaciones(data);
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!recomendaciones.trim()) {
      toast.error('Por favor escribe una recomendación');
      return;
    }
    try {
      setLoading(true);
      await recomendacionesAPI.create({
        paciente_id: pacienteId,
        paciente_nombre: pacienteNombre,
        contenido: recomendaciones,
        creado_por_id: (user as any)?.id,
        creado_por_nombre: (user as any)?.nombre,
        area: area
      });
      toast.success('Guardado correctamente');
      setRecomendaciones('');
      fetchRecommendations();
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95">
          <CardHeader className={`${theme.bgLight} border-b p-4 sm:p-7`}>
            <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}>
              <MessageSquare className="w-7 h-7 shrink-0" />
              <span className="min-w-0">Nueva Recomendación</span>
            </CardTitle>
            <CardDescription className="font-bold italic text-slate-500">
              Escribe las recomendaciones para {pacienteNombre}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-7">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-black text-slate-700 mb-2 block uppercase tracking-wider">
                  Recomendaciones de {area}
                </label>
                <Textarea
                  value={recomendaciones}
                  onChange={(e) => setRecomendaciones(e.target.value)}
                  placeholder={`Escribe aquí las recomendaciones de ${area} para el paciente...`}
                  className={`min-h-[200px] rounded-2xl border-2 ${theme.border} focus:ring-1 resize-none text-sm`}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={loading || !recomendaciones.trim()}
                className={`${theme.btn} text-white font-black px-8 py-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Guardar Recomendación
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de recomendaciones */}
      <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95">
        <CardHeader className={`${theme.bgLight} border-b p-4 sm:p-7`}>
          <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}>
            <FileText className="w-7 h-7 shrink-0" />
            <span className="min-w-0">Historial de Recomendaciones</span>
          </CardTitle>
          <CardDescription className="font-bold italic text-slate-500">
            Recomendaciones previas guardadas para este paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-7">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className={`w-12 h-12 animate-spin ${theme.colorAlt}`} />
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
                Cargando recomendaciones...
              </p>
            </div>
          ) : historialRecomendaciones.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">
                No hay recomendaciones registradas para este paciente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historialRecomendaciones.map((rec) => (
                <div
                  key={rec.id}
                  className={`border ${theme.border} rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.bgIcon}`}>
                        <MessageSquare className={`${theme.colorAlt} w-6 h-6`} />
                      </div>
                      <div>
                        <h4 className={`font-black text-sm uppercase ${theme.color}`}>
                          Recomendación de {rec.area}
                        </h4>
                        <div className="flex gap-4 text-[11px] font-bold text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(rec.fecha_creacion), "PPP 'a las' p", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {rec.creado_por_nombre}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${theme.bgLight} rounded-xl p-4`}>
                    <div 
                      className="text-sm text-slate-700 prose max-w-none" 
                      dangerouslySetInnerHTML={{ __html: rec.contenido || '' }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}