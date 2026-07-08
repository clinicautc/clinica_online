/**
 * ============================================================================
 * ARCHIVO: PatientDashboard.tsx (Versión Sincronizada PostgreSQL + Perfil)
 * PROPÓSITO: Panel principal del paciente con gestión de citas avanzada y Perfil.
 * CORRECCIÓN: Sincronización estricta para evitar duplicidad visual al re-agendar.
 * MODIFICACIÓN: Barra lateral de perfil con restricción de edición en el Nombre.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, usuariosAPI } from '../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { 
  LogOut, Calendar, FileText, User, Clock, Utensils,
  Activity, AlertCircle, Trash2, CalendarClock, ChevronUp, CalendarDays,
  X, Edit2, Phone, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router';
import AppointmentForm from '../components/AppointmentForm';
import PatientPlans from '../components/PatientPlans';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import DateFilterPicker from '../components/DateFilterPicker';
import MonthFilterPicker from '../components/MonthFilterPicker';
import ViewModeToggle from '../components/ViewModeToggle';
import { getEstadoBadgeClasses, getEstadoLabel } from '../lib/citasHelpers';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // --- ESTADOS PARA GESTIÓN DE CITAS ---
  const [citasHistoricas, setCitasHistoricas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFiltro, setAreaFiltro] = useState<'nutricion' | 'fisioterapia'>('nutricion');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  
  /**
   * ESTADO PARA RE-AGENDAR
   * Almacena el ID de la cita que se está editando.
   */
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);

  // ==========================================
  // ESTADOS DEL DRAWER Y PERFIL
  // ==========================================
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nombre: '',
    telefono: '',
    matricula: '',
    email: '',
    rol: '',
    area: ''
  });
  const [backupProfile, setBackupProfile] = useState(profileData);

  const patientId = (user as any)?.id;
  const patientRole = (user as any)?.rol || "paciente";
  const patientName = profileData.nombre || (user as any)?.nombre || "Paciente";

  // Inicializar datos del perfil
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: (user as any).nombre || '',
        telefono: (user as any).telefono || '',
        matricula: (user as any).matricula || '',
        email: (user as any).email || '',
        rol: (user as any).rol || 'paciente',
        area: (user as any).area || ''
      });
    }
  }, [user]);

  /**
   * SINCRONIZACIÓN Y FILTRADO DE FECHAS
   * Solo se ven citas de hoy en adelante.
   */
  const fetchCitas = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const data = await citasAPI.getByPaciente(patientId);

      // Filtrado por el día o mes seleccionado (en vez de "solo futuras").
      const filtradasPorFecha = data.filter((cita: any) => {
        const cleanFecha = cita.fecha.split('T')[0];
        return viewMode === 'day'
          ? cleanFecha === selectedDate
          : cleanFecha.startsWith(selectedMonth);
      });

      filtradasPorFecha.sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      setCitasHistoricas(filtradasPorFecha);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [patientId, selectedDate, selectedMonth, viewMode]);

  const handleCancelarCita = (id: number) => {
    toast('¿Cancelar esta cita?', {
      action: {
        label: 'Sí, cancelar',
        onClick: async () => {
          try {
            await citasAPI.update(id, { estado: 'cancelada' });
            toast.success("Cita cancelada exitosamente");
            fetchCitas();
          } catch {
            toast.error("Error al cancelar");
          }
        }
      },
      cancel: { label: 'No', onClick: () => {} }
    });
  };

  // Filtrado por área para la vista actual
  const citasFinales = citasHistoricas.filter(cita =>
    cita.tipo.toLowerCase() === areaFiltro
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión finalizada');
  };

  // ==========================================
  // FUNCIONES DEL PERFIL (DRAWER)
  // ==========================================
  const handleEditProfileClick = () => {
    setBackupProfile(profileData);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileData(backupProfile);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !user?.email) {
      toast.error("Error de sesión: No se pudo identificar al usuario.");
      return;
    }

    try {
      await usuariosAPI.updateProfile(user.id, {
        nombre: profileData.nombre, // El nombre se manda pero no cambia por la interfaz
        telefono: profileData.telefono,
        matricula: profileData.matricula
      });

      setIsEditingProfile(false);
      toast.success("Tu perfil se actualizó correctamente en el sistema.");
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      toast.error(error.message || "Error de conexión con la base de datos.");
    }
  };

  const handleConfirmDeleteAccount = () => {
    toast.error("Función temporalmente deshabilitada.");
    setIsDeleteModalOpen(false);
  };

  const inicialesAvatar = profileData.nombre
    ? profileData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'U';

  const citaEsAccionable = (cita: any): boolean => {
    if (cita.estado !== 'programada') return false;
    const hoyMX = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    const fechaCita = cita.fecha.split('T')[0];
    if (fechaCita < hoyMX) return false;
    if (fechaCita > hoyMX) return true;
    const horaActual = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false
    });
    return cita.hora.substring(0, 5) > horaActual;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC (marca de agua, igual que MasterAdminDashboard) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-orange-50/60"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      <div className="px-4 pt-6 sm:px-6 lg:px-6 relative z-10">
        <header className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-blue-900/10 mb-6">
          <div className="px-6 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">UTC</span>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-2xl font-bold text-blue-900 truncate">Clínica Universitaria</h1>
                  <p className="text-sm text-blue-900/60 truncate">Fisioterapia y Nutrición</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                {/* PERFIL DEL USUARIO (mismo ícono/botón que los demás paneles) */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-4 text-left sm:text-right w-full sm:w-auto justify-between sm:justify-end hover:bg-blue-50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div>
                    <p className="text-sm font-bold text-blue-900 leading-none mb-1">{patientName}</p>
                    <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-wider">{patientRole}</p>
                    <p className="text-sm text-slate-600 font-black flex items-center gap-0.5 leading-tight mt-0.5">
                      <LogOut className="w-2.5 h-2.5" /> cerrar sesión
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="max-w-[1480px] mx-auto px-4 pb-7 sm:pb-9 sm:px-6 lg:px-6 relative z-10">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">¡Hola, {patientName.split(' ')[0]}!</h2>
          <p className="text-sm sm:text-base text-blue-900/70">Gestiona tus citas y consulta tus planes de tratamiento.</p>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-white border border-blue-900/10 inline-flex w-auto min-w-full sm:min-w-0 sm:w-full justify-start sm:justify-center p-1.5 rounded-xl">
              <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-6 py-1.5 text-base font-bold rounded-lg transition-all duration-300">
                <Calendar className="w-5 h-5 mr-2" /> Agendar Cita
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-6 py-1.5 text-base font-bold rounded-lg transition-all duration-300">
                <User className="w-5 h-5 mr-2" /> Mis Citas
              </TabsTrigger>
              <TabsTrigger value="plans" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-6 py-1.5 text-base font-bold rounded-lg transition-all duration-300">
                <FileText className="w-5 h-5 mr-2" /> Planes Médicos
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

              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <ViewModeToggle mode={viewMode} onChange={setViewMode} theme="blue" />
                {viewMode === 'day' ? (
                  <>
                    <DateFilterPicker selectedDate={selectedDate} onChange={setSelectedDate} theme="blue" onPrev={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))} onNext={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))} />
                    {selectedDate !== format(new Date(), 'yyyy-MM-dd') && (
                      <Button
                        variant="outline"
                        className="h-11.75 px-5 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                        onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                      >
                        Hoy
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <MonthFilterPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} theme="blue" />
                    {selectedMonth !== format(new Date(), 'yyyy-MM') && (
                      <Button
                        variant="outline"
                        className="h-11.75 px-5 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                        onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
                      >
                        Este mes
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="grid gap-4">
                {loading && citasHistoricas.length === 0 ? (
                  <div className="p-10 text-center text-blue-900/40 font-bold uppercase animate-pulse">Sincronizando agenda...</div>
                ) : citasFinales.length > 0 ? (
                  citasFinales.map((cita) => (
                    <div key={cita.id} className="space-y-2">
                      <Card className={`border-l-4 ${areaFiltro === 'nutricion' ? 'border-l-orange-500' : 'border-l-blue-600'} shadow-sm bg-white overflow-hidden rounded-xl transition-all duration-300`}>
                        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 ${areaFiltro === 'nutricion' ? 'bg-orange-50' : 'bg-blue-50'} rounded-full flex items-center justify-center shrink-0`}>
                               <Clock className={`w-7 h-7 ${areaFiltro === 'nutricion' ? 'text-orange-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CalendarDays className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                                  {format(parseISO(cita.fecha), "eeee dd 'de' MMMM", { locale: es })}
                                </p>
                              </div>
                              <p className="text-2xl font-black text-blue-900">{cita.hora.substring(0, 5)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                            <div className="text-left sm:text-right flex-1">
                              <p className={`font-black text-sm uppercase ${areaFiltro === 'nutricion' ? 'text-orange-600' : 'text-blue-600'}`}>{cita.tipo}</p>
                              <p className="text-xs font-semibold text-slate-500 italic mt-1">
                                Atiende: {cita.practicante_nombre || "Por asignar"}
                              </p>
                            </div>

                            {citaEsAccionable(cita) ? (
                              <div className="flex gap-2.5 w-full sm:w-auto">
                                <Button
                                  variant="outline"
                                  onClick={() => setReagendarCitaId(reagendarCitaId === cita.id ? null : cita.id)}
                                  className="flex-1 sm:flex-none border-blue-900/10 text-blue-900 font-bold text-xs h-9.75 px-4 gap-2 hover:bg-blue-50"
                                >
                                  <CalendarClock className="w-5 h-5" />
                                  {reagendarCitaId === cita.id ? "CERRAR" : "RE-AGENDAR"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => handleCancelarCita(cita.id)}
                                  className="flex-1 sm:flex-none text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs h-9.75 px-4 gap-2"
                                >
                                  <Trash2 className="w-5 h-5" /> CANCELAR
                                </Button>
                              </div>
                            ) : (
                              <span className={`text-xs px-3.5 py-1.5 rounded-full font-black border ${getEstadoBadgeClasses(cita.estado)}`}>
                                {getEstadoLabel(cita.estado)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {citaEsAccionable(cita) && reagendarCitaId === cita.id && (
                        <div className="bg-white border border-blue-900/10 rounded-xl p-5 shadow-inner animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 mb-5 text-blue-900">
                            <CalendarClock className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">
                              Nueva Fecha y Hora para {areaFiltro}
                            </span>
                          </div>
                          <AppointmentForm
  patientId={String(user?.id ?? '')}
  existingAppointment={cita}
  onSuccess={() => { setReagendarCitaId(null); fetchCitas(); }}
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
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">No hay citas programadas para {viewMode === 'day' ? 'la fecha seleccionada' : 'el mes seleccionado'}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plans">
              <PatientPlans patientId={patientId || ''} patientName={patientName} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <footer className="py-16 text-center">
        <div className="inline-block px-7 py-2.5 border-y border-blue-900/10">
          <p className="text-xs text-blue-900/40 font-black uppercase tracking-[0.6em] opacity-40">
            Sistema de Gestión de Academias UTC • 2026
          </p>
        </div>
      </footer>

      {/* ========================================== */}
      {/* PANEL LATERAL DEL PERFIL (DRAWER)          */}
      {/* ========================================== */}
      
      {/* Overlay Oscuro */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Panel Lateral */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-blue-100 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100 bg-blue-50/50">
          <h2 className="text-lg font-black text-blue-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Mi Perfil
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-blue-700">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-blue-900 text-center">{profileData.nombre}</h3>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Paciente
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Personal</span>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfileClick}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors focus:outline-none"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Datos
                  </button>
                )}
              </div>

              {/* INPUT BLOQUEADO: NOMBRE DEL PACIENTE */}
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</Label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input 
                    type="text" 
                    value={profileData.nombre}
                    disabled={true} 
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic ml-1 mt-1">El nombre no puede ser modificado por el paciente.</p>
              </div>

              {/* INPUT: NÚMERO DE TELÉFONO */}
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Teléfono</Label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input 
                    type="text" 
                    value={profileData.telefono}
                    onChange={(e) => setProfileData({...profileData, telefono: e.target.value})}
                    disabled={!isEditingProfile}
                    className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border text-blue-900' : 'bg-slate-50 border border-slate-200 text-slate-600 disabled:cursor-not-allowed'}`}
                  />
                </div>
              </div>

              {/* INPUT: MATRÍCULA (SI ES ALUMNO/PACIENTE UTC) */}
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula (Opcional si eres alumno UTC)</Label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input 
                    type="text" 
                    value={profileData.matricula}
                    onChange={(e) => setProfileData({...profileData, matricula: e.target.value})}
                    disabled={!isEditingProfile}
                    placeholder="Ej. UTC-12345"
                    className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border text-blue-900' : 'bg-slate-50 border border-slate-200 text-slate-600 disabled:cursor-not-allowed'}`}
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEditProfile} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {!isEditingProfile && (
              <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                  <Trash2 className="w-4 h-4" /> Eliminar Cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MODAL ELIMINAR CUENTA */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-200 ${isDeleteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white max-w-md w-full mx-4 rounded-3xl p-6 shadow-2xl transition-all duration-200 ${isDeleteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center text-blue-900 mb-2">¿Deseas borrar tu cuenta?</h3>
          <p className="text-sm text-slate-500 text-center mb-8">
            Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, configuraciones y acceso al sistema clínico.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors">
              No, cancelar
            </button>
            <button onClick={handleConfirmDeleteAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}