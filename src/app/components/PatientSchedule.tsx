/**
 * ============================================================================
 * ARCHIVO: PatientSchedule.tsx (Versión Unificada: CRUD + Filtro Estricto + Funciones Extra)
 * PROPÓSITO: Visualización, filtrado, eliminación y búsqueda de citas.
 * REGLAS: 
 * 1. Filtra por patientId en la tabla 'citas'.
 * 2. Solo muestra citas de HOY o FUTURAS.
 * 3. Permite eliminación lógica (DELETE) sincronizada con el backend.
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input'; // Asegúrate de tener este componente UI
import { 
  Calendar, Clock, Activity, Loader2, AlertCircle, 
  Info, Trash2, RefreshCcw, Search, Filter 
} from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientScheduleProps {
  patientId: string;
}

interface Appointment {
  id: number;
  tipo: string; 
  fecha: string;
  hora: string;
  estado: 'programada' | 'completada' | 'cancelada';
}

export default function PatientSchedule({ patientId }: PatientScheduleProps) {
  // --- 1. ESTADOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nutricion' | 'fisioterapia'>('fisioterapia');
  
  // --- NUEVAS FUNCIONALIDADES: ESTADOS ---
  const [searchQuery, setSearchQuery] = useState(''); // Estado para búsqueda por Folio
  const [refreshing, setRefreshing] = useState(false); // Estado para actualización visual

  // --- 2. LÓGICA DE NORMALIZACIÓN Y TIEMPO ---
  const normalize = (text: string) =>
    text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const isRecentOrFuture = (fecha: string) => {
    const today = startOfDay(new Date());
    const aptDate = parseISO(fecha);
    return !isBefore(aptDate, today);
  };

  // --- 3. ACCIONES CRUD & REFRESH ---
  const fetchMyAppointments = useCallback(async (isSilent = false) => {
    if (!patientId) return;
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3001/api/citas/paciente/${patientId}`);
      
      if (!response.ok) throw new Error('Error de conexión con la base de datos de UTC.');
      
      const data = await response.json();
      
      const normalizedData = data.map((cita: any) => ({
        ...cita,
        tipo: cita.tipo || cita.tipo_servicio || 'General',
        estado: cita.estado || cita.status || 'programada'
      }));

      setAppointments(normalizedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyAppointments(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas cancelar y eliminar esta cita de forma permanente?")) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/citas/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      } else {
        throw new Error("No se pudo eliminar la cita del servidor.");
      }
    } catch (err) {
      alert("Error al conectar con el servidor para eliminar.");
    }
  };

  const handleReschedule = (apt: Appointment) => {
    alert(`Redirigiendo a reagendar cita de ${apt.tipo} (Folio: ${apt.id})`);
  };

  // --- 4. CARGA DE DATOS INICIAL ---
  useEffect(() => {
    fetchMyAppointments();
  }, [fetchMyAppointments]);

  // --- 5. FILTRADO AVANZADO (FECHA + ÁREA + BÚSQUEDA) ---
  const filteredAppointments = appointments.filter((apt) => {
    const matchesDate = isRecentOrFuture(apt.fecha);
    const matchesArea = normalize(apt.tipo).includes(activeTab);
    const matchesSearch = apt.id.toString().includes(searchQuery); // Filtro por Folio
    
    return matchesDate && matchesArea && matchesSearch;
  });

  // --- 6. RENDERIZADO DE ESTADOS ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-blue-900/5">
        <Loader2 className="w-10 h-10 text-blue-900 animate-spin mb-4" />
        <p className="text-blue-900/60 font-black uppercase tracking-widest text-xs">Sincronizando Agenda UTC...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* SECCIÓN DE CABECERA Y HERRAMIENTAS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Selector de Área */}
        <div className="flex justify-center items-center bg-slate-100 p-1.5 rounded-full w-full md:w-fit border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab('nutricion')}
            className={`flex-1 md:flex-none md:px-8 py-2.5 rounded-full text-xs font-black uppercase transition-all ${
              activeTab === 'nutricion' ? 'bg-white shadow-md text-blue-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Nutrición
          </button>
          <button
            onClick={() => setActiveTab('fisioterapia')}
            className={`flex-1 md:flex-none md:px-8 py-2.5 rounded-full text-xs font-black uppercase transition-all ${
              activeTab === 'fisioterapia' ? 'bg-white shadow-md text-blue-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Fisioterapia
          </button>
        </div>

        {/* Buscador y Refresh */}
        <div className="flex items-center gap-2 w-full md:w-fit">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar Folio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all bg-white"
            />
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-4 h-4 text-blue-900" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${activeTab === 'fisioterapia' ? 'bg-blue-600' : 'bg-orange-500'} rounded-lg shadow-md`}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">
            Próximas de {activeTab}
          </h3>
        </div>
        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-black">
          {filteredAppointments.length} REGISTROS
        </Badge>
      </div>

      {filteredAppointments.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[40px] transition-all">
          <CardContent className="flex flex-col items-center justify-center p-20">
            <Info className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest text-center">
              {searchQuery ? `No se hallaron coincidencias para el folio ${searchQuery}` : `Sin citas de ${activeTab} vigentes.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {filteredAppointments.map((apt) => (
            <Card key={apt.id} className="group hover:border-blue-900/20 transition-all duration-300 shadow-sm overflow-hidden rounded-[32px] border-none bg-white">
              <div className={`h-2.5 w-full ${activeTab === 'fisioterapia' ? 'bg-blue-600' : 'bg-orange-500'}`} />
              
              <CardHeader className="pb-2 space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="font-black text-[10px] text-blue-900 border-blue-900/10 bg-slate-50 px-3 py-1 uppercase">
                    MODALIDAD: {apt.tipo}
                  </Badge>
                  <Badge className={
                    apt.estado === 'programada' ? 'bg-green-600 text-white shadow-sm' :
                    apt.estado === 'completada' ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-400 text-white shadow-sm'
                  }>
                    {apt.estado.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-blue-900 font-bold leading-tight">
                  Consulta de {activeTab === 'fisioterapia' ? 'Rehabilitación Física' : 'Evaluación Nutricional'}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center text-sm text-blue-900/80 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <Calendar className="w-4 h-4 mr-3 text-blue-900" />
                    <span className="font-bold">
                      {format(parseISO(apt.fecha), "dd 'de' MMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-orange-900/80 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                    <Clock className="w-4 h-4 mr-3 text-orange-600" />
                    <span className="font-black tracking-tight">{apt.hora.substring(0, 5)} hrs</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleReschedule(apt)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-900 text-white text-[10px] font-black uppercase py-3.5 rounded-xl hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-blue-900/10"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Reagendar
                  </button>
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase py-3.5 rounded-xl hover:bg-red-600 hover:text-white hover:scale-[1.02] transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
                
                <div className="flex justify-center pt-2">
                  <span className="text-[9px] bg-slate-100 text-slate-400 px-4 py-1 rounded-full font-black uppercase tracking-widest">
                    Folio Interno: UTC-{apt.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}