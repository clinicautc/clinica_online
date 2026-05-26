/**
 * ============================================================================
 * ARCHIVO: PatientDashboard.tsx (Versión Sincronizada PostgreSQL)
 * PROPÓSITO: Panel principal del paciente con gestión de citas avanzada.
 * CORRECCIÓN: Sincronización estricta para evitar duplicidad visual al re-agendar.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { 
  LogOut, Calendar, FileText, User, Clock, Utensils, 
  Activity, AlertCircle, Trash2, CalendarClock, ChevronUp, CalendarDays 
} from 'lucide-react';
import { useNavigate } from 'react-router';
import AppointmentForm from '../components/AppointmentForm';
import PatientPlans from '../components/PatientPlans';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- ESTADOS PARA GESTIÓN DE CITAS ---
  const [citasHistoricas, setCitasHistoricas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFiltro, setAreaFiltro] = useState<'nutricion' | 'fisioterapia'>('nutricion');
  
  /**
   * ESTADO PARA RE-AGENDAR
   * Almacena el ID de la cita que se está editando.
   */
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);

  const patientId = (user as any)?.id;
  const patientName = (user as any)?.nombre || "Paciente";
  const patientRole = (user as any)?.rol || "paciente";

  /**
   * SINCRONIZACIÓN Y FILTRADO DE FECHAS
   * Solo se ven citas de hoy en adelante.
   */
  const fetchCitas = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/citas/paciente/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        const hoy = startOfDay(new Date());

        // Filtrado: Si la fecha de la cita es antes de hoy, ya no se muestra.
        const filtradasPorFecha = data.filter((cita: any) => {
          const fechaCita = startOfDay(parseISO(cita.fecha));
          return !isBefore(fechaCita, hoy);
        });
        
        setCitasHistoricas(filtradasPorFecha);
      }
    } catch (error) {
      console.error("Error al cargar citas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [patientId]);

  const handleCancelarCita = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/citas/${id}`, {
          method: 'DELETE',

           headers: {
            email: user?.email || ''
          }
        });
      if (response.ok) {
        toast.success("Cita cancelada exitosamente");
        fetchCitas();
      }
    } catch (error) {
      toast.error("Error al cancelar");
    }
  };

  // Filtrado por área para la vista actual
  const citasFinales = citasHistoricas.filter(cita => 
    cita.tipo.toLowerCase().includes(areaFiltro)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * MANEJADOR DE ÉXITO DE RE-AGENDADO
   * Esta función es CRUCIAL para evitar duplicados visuales.
   */
  const handleReagendarSuccess = () => {
    // 1. Cerramos el formulario de edición inmediatamente
    setReagendarCitaId(null);
    
    // 2. Vaciamos la lista local de citas para forzar un renderizado limpio
    // Esto garantiza que la cita vieja (del 19 de abril) desaparezca de la pantalla.
    setCitasHistoricas([]); 
    
    // 3. Consultamos de nuevo al servidor (donde el UPDATE del index.js ya reemplazó el registro)
    fetchCitas(); 
    
    toast.success("Cita re-agendada exitosamente. El registro anterior ha sido actualizado.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <header className="bg-white border-b border-blue-900/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm sm:text-base">UTC</span>
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-blue-900 truncate">Clínica Universitaria</h1>
                <p className="text-xs text-blue-900/60 truncate">Fisioterapia y Nutrición</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-blue-900 leading-none mb-1">{patientName}</p>
                <p className="text-[10px] sm:text-xs text-blue-900/60 uppercase tracking-wider">{patientRole}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-blue-900/20 text-blue-900 hover:bg-blue-50 h-9">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">¡Hola, {patientName.split(' ')[0]}!</h2>
          <p className="text-sm sm:text-base text-blue-900/70">Gestiona tus citas y consulta tus planes de tratamiento.</p>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-white border border-blue-900/10 inline-flex w-auto min-w-full sm:min-w-0 sm:w-full justify-start sm:justify-center p-1 rounded-xl">
              <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-all duration-300">
                <Calendar className="w-4 h-4 mr-2" /> Agendar Cita
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-all duration-300">
                <User className="w-4 h-4 mr-2" /> Mis Citas
              </TabsTrigger>
              <TabsTrigger value="plans" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-all duration-300">
                <FileText className="w-4 h-4 mr-2" /> Planes Médicos
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4">
            <TabsContent value="appointments">
              <div className="bg-white rounded-xl shadow-sm border border-blue-900/5 overflow-hidden">
                <AppointmentForm patientId={patientId || ''} />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="w-full flex justify-center mt-6 mb-8 px-4">
                <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200/60 shadow-inner w-full max-w-lg md:max-w-2xl relative gap-1.5">
                  <button 
                    onClick={() => { setAreaFiltro('nutricion'); setReagendarCitaId(null); }}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 md:px-10 rounded-[1.5rem] text-xs md:text-sm font-extrabold uppercase transition-all duration-300 ease-in-out tracking-wide ${
                      areaFiltro === 'nutricion' ? 'bg-white text-blue-950 shadow-md transform scale-[1.01]' : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <Utensils className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${areaFiltro === 'nutricion' ? 'text-blue-900' : 'text-slate-400'}`} />
                    Nutrición
                  </button>
                  <button 
                    onClick={() => { setAreaFiltro('fisioterapia'); setReagendarCitaId(null); }}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 md:px-10 rounded-[1.5rem] text-xs md:text-sm font-extrabold uppercase transition-all duration-300 ease-in-out tracking-wide ${
                      areaFiltro === 'fisioterapia' ? 'bg-white text-blue-950 shadow-md transform scale-[1.01]' : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <Activity className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${areaFiltro === 'fisioterapia' ? 'text-blue-900' : 'text-slate-400'}`} />
                    Fisioterapia
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {loading && citasHistoricas.length === 0 ? (
                  <div className="p-10 text-center text-blue-900/40 font-bold uppercase animate-pulse">Sincronizando agenda...</div>
                ) : citasFinales.length > 0 ? (
                  citasFinales.map((cita) => (
                    <div key={cita.id} className="space-y-2">
                      <Card className={`border-l-4 ${areaFiltro === 'nutricion' ? 'border-l-orange-500' : 'border-l-blue-600'} shadow-sm bg-white overflow-hidden rounded-xl transition-all duration-300`}>
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${areaFiltro === 'nutricion' ? 'bg-orange-50' : 'bg-blue-50'} rounded-full flex items-center justify-center shrink-0`}>
                               <Clock className={`w-6 h-6 ${areaFiltro === 'nutricion' ? 'text-orange-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                  {format(parseISO(cita.fecha), "eeee dd 'de' MMMM", { locale: es })}
                                </p>
                              </div>
                              <p className="text-xl font-black text-blue-900">{cita.hora}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                            <div className="text-left sm:text-right flex-1">
                              <p className={`font-black text-xs uppercase ${areaFiltro === 'nutricion' ? 'text-orange-600' : 'text-blue-600'}`}>{cita.tipo}</p>
                              <p className="text-[10px] font-semibold text-slate-500 italic mt-1">
                                Atiende: {cita.practicante_nombre || "Por asignar"}
                              </p>
                            </div>
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setReagendarCitaId(reagendarCitaId === cita.id ? null : cita.id)}
                                className="flex-1 sm:flex-none border-blue-900/10 text-blue-900 font-bold text-[10px] h-9 gap-2 hover:bg-blue-50"
                              >
                                <CalendarClock className="w-4 h-4" />
                                {reagendarCitaId === cita.id ? "CERRAR" : "RE-AGENDAR"}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCancelarCita(cita.id)}
                                className="flex-1 sm:flex-none text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-[10px] h-9 gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> CANCELAR
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {reagendarCitaId === cita.id && (
                        <div className="bg-white border border-blue-900/10 rounded-xl p-5 shadow-inner animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 mb-5 text-blue-900">
                            <CalendarClock className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">
                              Nueva Fecha y Hora para {areaFiltro}
                            </span>
                          </div>
                          <AppointmentForm 
                            patientId={patientId || ''} 
                            isReassign={true} 
                            appointmentId={cita.id} // El AppointmentForm debe usar este ID para el PUT
                            fixedType={areaFiltro} 
                            onSuccess={handleReagendarSuccess} 
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setReagendarCitaId(null)}
                            className="w-full mt-3 text-slate-400 text-[10px] font-bold hover:bg-slate-50"
                          >
                            <ChevronUp className="w-3.5 h-3.5 mr-1" /> CANCELAR EDICIÓN
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
                    <AlertCircle className="w-10 h-10 text-slate-200 mb-2" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">No hay citas programadas para hoy o fechas futuras</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plans">
              <PatientPlans patientId={patientId || ''} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}