/**
 * ============================================================================
 * ARCHIVO: MedicalHistoryViewer.tsx - VERSIÓN FINAL SINCRONIZADA
 * PROPÓSITO: Visor de expedientes clínicos con soporte para datos de PostgreSQL.
 * CORRECCIÓN: Manejo de IDs nulos y carga robusta de tablas específicas.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input'; // <--- ¡SOLO FALTA AGREGAR ESTA LÍNEA!
import {
  FileText, Search, Loader2, ArrowLeft, Calendar,
  User, Activity, Utensils, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { endpoints } from '../lib/api';
import { toast } from 'sonner';

interface MedicalHistory {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  tipo: 'fisioterapia' | 'nutricion';
  datos: any;
  fecha_creacion: string;
  appointment_id?: number | null;
}

interface Props {
  filterType?: 'fisioterapia' | 'nutricion';
}

export default function MedicalHistoryViewer({ filterType }: Props) {
  const { patientId } = useParams(); // Si venimos de una ruta específica
  const navigate = useNavigate();

  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistories = async () => {
      try {
        setLoading(true);
        // Llamamos al endpoint unificado que configuramos en el index.js
        const response = await fetch(endpoints.historiales);

        if (response.ok) {
          const data: MedicalHistory[] = await response.json();

          // FILTRADO INTELIGENTE
          let filtered = data;

          // 1. Filtrar por Área (Fisio o Nutrición)
          if (filterType) {
            filtered = filtered.filter(h => h.tipo === filterType);
          }

          // 2. Filtrar por Paciente específico (si existe el ID en la URL)
          if (patientId) {
            filtered = filtered.filter(h => String(h.paciente_id) === String(patientId));
          }

          setHistories(filtered);
        }
      } catch (error) {
        toast.error("Error de conexión con PostgreSQL");
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [filterType, patientId]);

  // Lógica de búsqueda por nombre
  const filteredList = histories.filter(h =>
      h.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
          <p className="text-blue-900/60 font-black uppercase tracking-widest animate-pulse">Sincronizando Expedientes...</p>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* HEADER DEL VISOR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-blue-950 uppercase flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              {patientId ? `Expediente del Paciente` : `Archivo Clínico Global`}
            </h2>
            <p className="text-slate-500 font-medium italic">
              Área: <span className="capitalize text-blue-600 font-bold">{filterType || 'Todas'}</span>
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
                placeholder="Buscar por nombre de paciente..."
                className="pl-10 rounded-xl border-blue-100 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {patientId && (
              <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl border-blue-200 text-blue-900 font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER
              </Button>
          )}
        </div>

        {/* LISTADO DE RESULTADOS */}
        {filteredList.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="flex flex-col items-center py-16">
                <FileText className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold italic">No se encontraron registros clínicos en esta categoría.</p>
              </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredList.map((history) => (
                  <Card key={history.id} className="overflow-hidden border-blue-100 hover:shadow-lg transition-all group">
                    <CardHeader className="bg-slate-50/50 border-b py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${history.tipo === 'fisioterapia' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {history.tipo === 'fisioterapia' ? <Activity className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                          </div>
                          <div>
                            <CardTitle className="text-blue-950 font-black uppercase text-sm">{history.paciente_nombre}</CardTitle>
                            <CardDescription className="flex items-center gap-2 font-bold text-[10px]">
                              <Calendar className="w-3 h-3" />
                              {history.fecha_creacion ? format(new Date(history.fecha_creacion), "dd 'de' MMMM, yyyy - HH:mm", { locale: es }) : 'Fecha no registrada'}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-black uppercase text-[9px] bg-white">
                          ID Cita: {history.appointment_id || 'S/N'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Resumen de Datos Guardados */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Base</p>
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                            <User className="w-3 h-3" /> Sexo: <span className="font-bold text-blue-900">{history.datos.pagina_1?.sexo || 'N/R'}</span>
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Edad: <span className="font-bold text-blue-900">{history.datos.pagina_1?.edad || 'N/R'} años</span>
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo de Consulta</p>
                          <p className="text-xs text-slate-600 italic line-clamp-2">
                            "{history.datos.pagina_1?.motivo || 'Sin descripción del motivo.'}"
                          </p>
                        </div>

                        <div className="flex items-center justify-end">
                          <Button
                              onClick={() => navigate(`/forms/${history.tipo}/${history.appointment_id || history.id}?pId=${history.paciente_id}`)}
                              className="bg-blue-900 hover:bg-black text-white font-black uppercase text-xs rounded-xl h-12 px-8"
                          >
                            Ver Expediente Completo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
        )}
      </div>
  );
}