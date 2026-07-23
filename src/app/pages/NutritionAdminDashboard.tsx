/**
 * ============================================================================
 * ARCHIVO: NutritionAdminDashboard.tsx - VERSIÓN MASTER INTEGRADA (EXTENSA)
 * PROPÓSITO: Panel de Coordinación de Nutrición con Sistema de Notas, Asignación
 * y Re-agendado de citas.
 * COLOR TEMÁTICO: Naranja (#ea580c / orange-600)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, usuariosAPI, notasAPI } from '../lib/api';
import { capitalizeWords } from '../lib/textFormat';
import { esCitaBloqueada, getEstadoBadgeClasses, getEstadoLabel } from '../lib/citasHelpers';
import { formatExpediente } from '../lib/formatExpediente';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "../components/ui/dialog";
import {
  LogOut, Users, Calendar, Clock, Utensils, BarChart3,
  Settings, UserPlus, Loader2, Send, FileEdit, Target, UserCheck,
  X, User, Phone, Building, Trash2, AlertTriangle, Edit2,
  CalendarClock, ChevronUp, Search, Shield, UserX, RotateCcw, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import PatientList from '../components/PatientList';
import DateFilterPicker from '../components/DateFilterPicker';
import MonthFilterPicker from '../components/MonthFilterPicker';
import ViewModeToggle from '../components/ViewModeToggle';
import NotesViewer from '../components/NotesViewer';
import StatisticsPanel from '../components/StatisticsPanel';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import AppointmentForm from '../components/AppointmentForm'; // Importado para re-agendar

// Interfaz sincronizada con PostgreSQL
interface Appointment {
  id: number;
  paciente_id?: number; // Añadido para poder re-agendar
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  numero_consulta?: number | null;
  practicante_id?: number | null;
  practicante_nombre?: string | null;
}

export default function NutritionAdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS DE CITAS
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  
  // --- ESTADO PARA RE-AGENDAR (IDÉNTICO AL PACIENTE) ---
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);

  // --- NUEVOS ESTADOS PARA EL MODAL DE ASIGNACIÓN (NUTRICIÓN) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null);
  const [practicantesArea, setPracticantesArea] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // ESTADOS TABLA PERSONAL ACADÉMICO
  const [personalAcademico, setPersonalAcademico] = useState<any[]>([]);
  const [searchPersonal, setSearchPersonal] = useState('');
  const [todasCitas, setTodasCitas] = useState<Appointment[]>([]);

  // ESTADOS PARA COMUNICADOS
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [revertirCita, setRevertirCita] = useState<Appointment | null>(null);
  const [motivoRevertir, setMotivoRevertir] = useState('');
  const [recuperandoCitaId, setRecuperandoCitaId] = useState<number | null>(null);
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    audiencia: 'practicantes' as 'master' | 'admins' | 'practicantes',
    seleccion: 'todos',
  });
  const [usuariosComunicados, setUsuariosComunicados] = useState<{
    master: any[]; admins: any[]; practicantes: any[];
  }>({ master: [], admins: [], practicantes: [] });

  // ==========================================
  // ESTADOS PARA LA BARRA LATERAL (PERFIL)
  // ==========================================
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Estado inicial dinámico: Unificado bajo 'nombre'
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || '',
    numero_empleado: user?.numero_empleado || ''
  });
  const [backupProfile, setBackupProfile] = useState(profileData);

  // Extracción dinámica para el Header y el Avatar basada en la variable única 'nombre'
  const partesNombre = profileData.nombre.trim().split(' ');
  const inicialesAvatar = (partesNombre[0]?.[0] || '') + (partesNombre[1]?.[0] || '');
  const nombreCortoDisplay = `${partesNombre[0] || ''} ${partesNombre[1] || ''}`.trim();

  const personalFiltrado = personalAcademico.filter(p => {
    if (!searchPersonal) return true;
    const q = searchPersonal.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  /**
   * EFECTO INICIAL: Carga de Citas y Personal
   */
  useEffect(() => {
    const fetchTodayAppointments = async (silent = false) => {
      try {
        if (!silent) setIsLoadingCitas(true);
        const allAppointments: Appointment[] = await citasAPI.getAll();
        setTodasCitas(allAppointments);
        const filtered = allAppointments.filter((apt) => {
          if (apt.tipo !== 'nutricion') return false;
          const cleanAptDate = apt.fecha.split('T')[0];
          const matchesFecha = viewMode === 'day'
            ? cleanAptDate === selectedDate
            : cleanAptDate.startsWith(selectedMonth);
          if (!matchesFecha) return false;
          if (estadoFilter !== 'todos' && apt.estado !== estadoFilter) return false;
          return true;
        });
        filtered.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
        setTodayAppointments(filtered);
      } catch (error) {
        console.error("❌ Error Admin Nutrición -> PostgreSQL:", error);
      } finally {
        if (!silent) setIsLoadingCitas(false);
      }
    };

    const cargarPracticantesEnVivo = async () => {
      try {
        const data = await usuariosAPI.getAll();
        const lista = data.filter((u: any) =>
          u.rol === 'practicante' &&
          u.area?.toLowerCase() === 'nutricion' &&
          (u.estado === 'activo' || u.status === 'activo')
        );
        setPracticantesArea(lista);
        setPersonalAcademico(data
          .filter((u: any) => u.rol === 'practicante' && u.area?.toLowerCase() === 'nutricion')
          .map((p: any) => ({
            id: p.id.toString(),
            name: p.nombre || 'Sin Nombre',
            email: p.email || '',
            status: p.estado || p.status || 'activo',
            rol: p.rol,
          }))
        );
        setUsuariosComunicados({
          master:      data.filter((u: any) => u.rol === 'master'),
          admins:      data.filter((u: any) => u.rol === 'admin' && u.area?.toLowerCase() === 'nutricion'),
          practicantes: lista,
        });
      } catch (error) {
        console.error("Error al cargar practicantes para el select:", error);
      }
    };

    if (!user && !authLoading) {
      navigate('/login');
      return;
    }

    fetchTodayAppointments();
    cargarPracticantesEnVivo();

    const interval = setInterval(cargarPracticantesEnVivo, 30_000);
    const citasInterval = setInterval(() => fetchTodayAppointments(true), 30_000);
    return () => { clearInterval(interval); clearInterval(citasInterval); };
  }, [user, authLoading, navigate, refreshKey, estadoFilter, selectedDate, selectedMonth, viewMode]);

  // Sincronizar datos del perfil si el objeto 'user' se actualiza desde el contexto
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || profileData.nombre,
        telefono: user.telefono || profileData.telefono,
        numero_empleado: user.numero_empleado || profileData.numero_empleado
      });
    }
  }, [user]);

  // --- FUNCIONES DE ASIGNACIÓN ---
  const handleOpenAssignModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedPractitioner(null);
    setIsModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedPractitioner || !selectedAppointment) return;

    try {
      setIsAssigning(true);
      await citasAPI.asignar(selectedAppointment.id, {
        practicante_id: selectedPractitioner.id,
        practicante_nombre: selectedPractitioner.nombre
      });

      toast.success(`Cita asignada a ${selectedPractitioner.nombre} correctamente.`);
      setIsModalOpen(false);
      setSelectedPractitioner(null);
      setSelectedAppointment(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error("Error de conexión con el servidor.");
    } finally {
      setIsAssigning(false);
    }
  };

  const usuariosSegundoSelect = notaNueva.audiencia === 'master'
    ? usuariosComunicados.master
    : notaNueva.audiencia === 'admins'
      ? usuariosComunicados.admins
      : usuariosComunicados.practicantes;

  const getInfoTextoAdmin = () => {
    const selId = parseInt(notaNueva.seleccion, 10);
    const isUser = !isNaN(selId);
    if (notaNueva.audiencia === 'master') return 'Nota Privada: Solo el Master verá este comunicado.';
    if (isUser) {
      const u = usuariosSegundoSelect.find((p: any) => p.id === selId || String(p.id) === notaNueva.seleccion);
      return `Nota Privada: Solo ${u?.nombre || u?.name || 'el usuario seleccionado'} verá este comunicado.`;
    }
    if (notaNueva.audiencia === 'admins') return 'Dirigida a todos los administradores de Nutrición.';
    return 'Dirigida a todos los practicantes de Nutrición.';
  };

  const handlePublicarNotaAdmin = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("Por favor, complete todos los campos requeridos.");
      return;
    }

    const selId = parseInt(notaNueva.seleccion, 10);
    const isUser = !isNaN(selId);
    const payload = {
      titulo: notaNueva.titulo.trim(),
      contenido: notaNueva.contenido.trim(),
      destino: 'nutricion',
      destinatario_rol: notaNueva.audiencia === 'admins' ? 'admin' : notaNueva.audiencia === 'master' ? 'todos' : 'practicante',
      destinatario_id: isUser ? selId : null,
    };

    try {
      setIsEnviando(true);
      await notasAPI.createUniversitaria(payload);
      toast.success("Comunicado emitido correctamente.");
      setNotaNueva({ titulo: '', contenido: '', audiencia: 'practicantes', seleccion: 'todos' });
      setIsNotaModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsEnviando(false);
    }
  };

  // --- FUNCIONES DEL PERFIL ---
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
        nombre: capitalizeWords(profileData.nombre),
        telefono: profileData.telefono
      });

      setIsEditingProfile(false);
      toast.success("Tu perfil se actualizó correctamente en el sistema.");
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      toast.error(error.message || "Error de conexión con la base de datos.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión finalizada');
  };

  const handleConfirmDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
    toast.error("Cuenta eliminada (Simulación). Redirigiendo...");
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 1500);
  };

  const handleGoToManagePractitioners = () => {
    navigate('/administrar-personal');
  };

  const handleNoAsistioAdmin = async (apt: Appointment) => {
    if (!window.confirm(`¿Confirmas que ${apt.paciente_nombre} no se presentó?`)) return;
    try {
      await citasAPI.noAsistio(apt.id);
      toast.success('Cita marcada como no asistió');
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message ?? 'Error');
    }
  };

  const handleConfirmarRevertir = async () => {
    if (!revertirCita || !motivoRevertir.trim()) return;
    try {
      await citasAPI.revertir(revertirCita.id, motivoRevertir);
      toast.success('Cita revertida a programada');
      setRevertirCita(null);
      setMotivoRevertir('');
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message ?? 'Error al revertir');
    }
  };

  const handleRecuperar = async (apt: Appointment) => {
    setRecuperandoCitaId(apt.id);
    try {
      await citasAPI.recuperar(apt.id);
      toast.success(`Cita de ${apt.paciente_nombre} habilitada para retomar`);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message ?? 'Error al recuperar la cita');
    } finally {
      setRecuperandoCitaId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Loader2 className="animate-spin h-10 w-10 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC (marca de agua, igual que MasterAdminDashboard) */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 to-amber-100/20"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      {/* HEADER SUPERIOR (tarjeta flotante, igual estilo que MasterAdminDashboard) */}
      <div className="px-4 pt-6 sm:px-6 lg:px-6 relative z-10">
        <header className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-orange-900/10 mb-6">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-600 to-orange-400 rounded-full flex items-center justify-center shadow-md shrink-0">
                <Utensils className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-2xl font-bold text-orange-900 truncate">Clínica UTC - Nutrición</h1>
                <p className="text-[10px] sm:text-sm text-orange-900/60 font-medium truncate">Panel de Coordinación Académica</p>
              </div>
            </div>

            {/* Perfil del Usuario Integrado */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 sm:gap-4 text-right hover:bg-orange-50 p-1.5 sm:p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0"
            >
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-orange-900 truncate">{nombreCortoDisplay}</p>
                <p className="text-[8px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest truncate">Coordinador</p>
                <p className="text-xs sm:text-sm text-slate-600 font-black flex items-center justify-end gap-0.5 leading-tight mt-0.5 whitespace-nowrap">
                  <LogOut className="w-2.5 h-2.5 shrink-0" /> cerrar sesión
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </button>
          </div>
        </header>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full px-4 pb-9 sm:px-6 lg:px-6 relative z-0">
        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-orange-200 p-1.5 h-auto flex-wrap gap-1.5 shadow-sm rounded-xl">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Calendar className="w-5 h-5 mr-2" /> Citas Agendadas
            </TabsTrigger>
            <TabsTrigger value="practitioners" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Settings className="w-5 h-5 mr-2" /> Personal
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <BarChart3 className="w-5 h-5 mr-2" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Users className="w-5 h-5 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black px-6 py-1.5 text-base">
              <FileEdit className="w-5 h-5 mr-2" /> Comunicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-orange-200 shadow-2xl rounded-3xl overflow-hidden bg-white/95">
              <CardHeader className="bg-orange-50/50 border-b p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div>
                    <CardTitle className="text-orange-900 font-extrabold text-xl">Citas Programadas</CardTitle>
                    <CardDescription className="font-medium italic text-orange-800/60 text-base">
                      {viewMode === 'day'
                        ? `Mostrando citas del ${format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}`
                        : `Mostrando todas las citas de ${format(new Date(selectedMonth + '-01T00:00:00'), 'MMMM yyyy', { locale: es })}`}
                      {estadoFilter !== 'todos' && ` · ${getEstadoLabel(estadoFilter)}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <ViewModeToggle mode={viewMode} onChange={setViewMode} theme="orange" />
                    {viewMode === 'day' ? (
                      <>
                        <DateFilterPicker selectedDate={selectedDate} onChange={setSelectedDate} theme="orange" onPrev={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))} onNext={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))} />
                        {selectedDate !== format(new Date(), 'yyyy-MM-dd') && (
                          <Button
                            variant="outline"
                            className="h-11.75 px-5 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                          >
                            Hoy
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <MonthFilterPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} theme="orange" />
                        {selectedMonth !== format(new Date(), 'yyyy-MM') && (
                          <Button
                            variant="outline"
                            className="h-11.75 px-5 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                            onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
                          >
                            Este mes
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {[
                    { value: 'todos',       label: 'Todos',       active: 'bg-slate-700 text-white',   inactive: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
                    { value: 'programada',  label: 'Programadas', active: 'bg-amber-500 text-white',   inactive: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
                    { value: 'en_atencion', label: 'En Atención', active: 'bg-purple-600 text-white',  inactive: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
                    { value: 'completada',  label: 'Completadas', active: 'bg-green-600 text-white',   inactive: 'bg-green-100 text-green-800 hover:bg-green-200' },
                    { value: 'no_asistio',  label: 'No Asistió',  active: 'bg-gray-500 text-white',    inactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
                    { value: 'incompleta',  label: 'Incompletas', active: 'bg-red-600 text-white',     inactive: 'bg-red-100 text-red-800 hover:bg-red-200' },
                    { value: 'recuperada',  label: 'Recuperadas', active: 'bg-sky-500 text-white',     inactive: 'bg-sky-100 text-sky-800 hover:bg-sky-200' },
                    { value: 'cancelada',   label: 'Canceladas',  active: 'bg-gray-500 text-white',    inactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
                  ].map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => setEstadoFilter(btn.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${estadoFilter === btn.value ? btn.active : btn.inactive}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {isLoadingCitas ? (
                    <div className="flex flex-col items-center py-12 gap-3"><Loader2 className="animate-spin text-orange-600" /><p className="text-sm font-bold text-orange-900/50">Sincronizando agenda...</p></div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl border-orange-100 italic text-slate-400">No se registran citas de nutrición para {viewMode === 'day' ? 'la fecha seleccionada' : 'el mes seleccionado'}.</div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="space-y-2">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border rounded-2xl bg-white hover:border-orange-300 transition-all shadow-sm">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
                            <div className="p-2.5 sm:p-3.5 rounded-full bg-orange-50 text-orange-600 shrink-0"><Utensils className="w-5 h-5 sm:w-6 sm:h-6"/></div>
                            <div className="min-w-0">
                              <p className="font-black text-orange-950 uppercase text-sm sm:text-base truncate">{apt.paciente_nombre}</p>
                              <p className="text-slate-400 font-mono normal-case text-xs sm:text-sm">Expediente: {formatExpediente(apt.paciente_id)}</p>
                              <div className="flex flex-wrap gap-2 sm:gap-3.5 items-center mt-1">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {format(new Date(apt.fecha.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {apt.hora.substring(0,5)} HRS</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${getEstadoBadgeClasses(apt.estado)}`}>{getEstadoLabel(apt.estado)}</span>
                                {apt.estado === 'completada' && apt.numero_consulta && (
                                  <span className="text-xs px-2 py-1 rounded-full font-black bg-slate-100 text-slate-600">
                                    Consulta #{apt.numero_consulta}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                            {apt.practicante_id && (
                              <div className="flex flex-col items-start sm:items-end mr-0 sm:mr-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable Actual:</span>
                                <span className="bg-orange-50 text-orange-700 px-5 py-2 rounded-xl text-sm font-black border border-orange-100 flex items-center gap-2">
                                  <UserCheck className="w-3.5 h-3.5" /> {apt.practicante_nombre || "Asignado"}
                                </span>
                              </div>
                            )}

                            {apt.estado === 'en_atencion' && (
                              <div className="flex flex-wrap items-center gap-3">
                                <Button
                                  variant="outline"
                                  className="h-9.75 border-gray-300 text-gray-600 hover:bg-gray-50 font-bold rounded-xl px-4 flex items-center gap-2 shadow-sm"
                                  onClick={() => handleNoAsistioAdmin(apt)}
                                >
                                  <UserX className="w-4.5 h-4.5" /> No asistió
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-9.75 border-orange-200 text-orange-700 hover:bg-orange-50 font-bold rounded-xl px-4 flex items-center gap-2 shadow-sm"
                                  onClick={() => setRevertirCita(apt)}
                                >
                                  <RotateCcw className="w-4.5 h-4.5" /> Revertir
                                </Button>
                              </div>
                            )}
                            {apt.estado === 'incompleta' && (
                              <Button
                                variant="outline"
                                className="h-9.75 border-amber-300 text-amber-700 hover:bg-amber-50 font-bold rounded-xl px-4 flex items-center gap-2 shadow-sm"
                                disabled={recuperandoCitaId === apt.id}
                                onClick={() => handleRecuperar(apt)}
                              >
                                {recuperandoCitaId === apt.id
                                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Recuperando...</>
                                  : <><AlertTriangle className="w-4.5 h-4.5" /> Recuperar</>
                                }
                              </Button>
                            )}
                            {!esCitaBloqueada(apt) && (
                              <>
                                {/* BOTÓN RE-AGENDAR */}
                                <Button
                                  variant="outline"
                                  className="h-9.75 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl px-5 flex items-center gap-2 shadow-sm"
                                  onClick={() => setReagendarCitaId(reagendarCitaId === apt.id ? null : apt.id)}
                                >
                                  <CalendarClock className="w-5 h-5" />
                                  {reagendarCitaId === apt.id ? "CERRAR" : "RE-AGENDAR"}
                                </Button>

                                <Button
                                  variant={apt.practicante_id ? "outline" : "default"}
                                  className={apt.practicante_id
                                    ? "h-9.75 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl px-5 flex items-center gap-2 shadow-sm"
                                    : "h-9.75 bg-orange-600 hover:bg-orange-700 font-bold rounded-xl px-6 flex items-center gap-2 shadow-md"}
                                  onClick={() => handleOpenAssignModal(apt)}
                                >
                                  <UserPlus className="w-5 h-5" />
                                  {apt.practicante_id ? "RE-ASIGNAR" : "ASIGNAR"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* DESPLEGABLE DEL FORMULARIO PARA REAGENDAR */}
                        {reagendarCitaId === apt.id && (
                          <div className="bg-white border border-orange-900/10 rounded-xl p-5 shadow-inner animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-5 text-orange-900">
                              <CalendarClock className="w-5 h-5" />
                              <span className="text-xs font-black uppercase tracking-widest">
                                Nueva Fecha y Hora para {apt.paciente_nombre}
                              </span>
                            </div>
                            <AppointmentForm
  patientId={apt.paciente_id?.toString() || ''}
  existingAppointment={apt as any}
  onSuccess={() => { setReagendarCitaId(null); setRefreshKey(k => k + 1); }}
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
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practitioners" className="animate-in fade-in duration-500">
            <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50/80 p-7 gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-orange-900 font-extrabold text-2xl">Personal Académico</CardTitle>
                  <CardDescription className="text-gray-500 font-medium italic text-base">Registro y filtro de practicantes y docentes · Área de Nutrición</CardDescription>
                </div>
                <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
                  <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nombre o correo..."
                      value={searchPersonal}
                      onChange={e => setSearchPersonal(e.target.value)}
                      className="pl-9 h-10.75 rounded-xl border-orange-200 text-orange-900 font-medium w-full"
                    />
                  </div>
                  <Button onClick={handleGoToManagePractitioners} className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg transition-transform hover:scale-105 rounded-xl h-10.75 px-5 text-base whitespace-nowrap">
                    Administrar Personal
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                {personalFiltrado.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 font-bold text-sm italic">No se encontró personal académico.</p>
                ) : (
                  <>
                    {/* VISTA MÓVIL — misma información que la tabla, en tarjetas apiladas */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {personalFiltrado.map((p) => {
                        const citaEstaActiva = (c: Appointment) => c.estado !== 'cancelada' && c.estado !== 'completada';
                        const citasMetric = todasCitas.filter(c => String(c.practicante_id) === String(p.id) && citaEstaActiva(c)).length;
                        return (
                          <div key={p.id} className={`p-4 space-y-3 ${p.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'bg-white'}`}>
                            <div className="flex flex-col">
                              <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-orange-950'}`}>{p.name}</span>
                              <span className="text-sm text-gray-400 font-medium italic">{p.email}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="bg-transparent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border-2 text-blue-500 border-blue-400/40">
                                <Shield className="w-3.5 h-3.5" />
                                Practicante
                              </Badge>
                              <span className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                                p.status === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${p.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                {p.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Asignadas</span>
                              <span className={`text-lg font-black ${citasMetric > 0 ? 'text-orange-900' : 'text-slate-300'}`}>{citasMetric}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* VISTA ESCRITORIO */}
                    <div className="hidden md:block">
                    <Table>
                      <TableHeader className="bg-white sticky top-0 z-20 border-b">
                        <TableRow>
                          <TableHead className="pl-4 text-orange-900 font-black uppercase tracking-widest">Información</TableHead>
                          <TableHead className="text-center text-orange-900 font-black uppercase tracking-widest">Rol</TableHead>
                          <TableHead className="text-center text-orange-900 font-black uppercase tracking-widest">Estado</TableHead>
                          <TableHead className="text-right pr-4 text-orange-900 font-black uppercase tracking-widest">Citas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {personalFiltrado.map((p) => {
                          const citaEstaActiva = (c: Appointment) => c.estado !== 'cancelada' && c.estado !== 'completada';
                          const citasMetric = todasCitas.filter(c => String(c.practicante_id) === String(p.id) && citaEstaActiva(c)).length;
                          return (
                            <TableRow key={p.id} className={`group transition-all ${p.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'hover:bg-orange-50/50'}`}>
                              <TableCell className="pl-4">
                                <div className="flex flex-col">
                                  <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-orange-950'}`}>{p.name}</span>
                                  <span className="text-sm text-gray-400 font-medium italic">{p.email}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <Badge variant="outline" className="bg-transparent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border-2 text-blue-500 border-blue-400/40">
                                    <Shield className="w-3.5 h-3.5" />
                                    Practicante
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <span className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                                    p.status === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${p.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    {p.status}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <div className="flex flex-col items-end">
                                  <span className={`text-lg font-black ${citasMetric > 0 ? 'text-orange-900' : 'text-slate-300'}`}>{citasMetric}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">Asignadas</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsPanel area="nutricion" />
          </TabsContent>

          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-3xl border border-orange-200 shadow-xl gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-orange-950 tracking-tight">Comunicación de Nutrición</h3>
                  <p className="text-sm text-slate-500 font-medium">Difusión de avisos internos para el personal del área.</p>
                </div>

                <Dialog open={isNotaModalOpen} onOpenChange={setIsNotaModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black h-13.75 px-10 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95">
                      <Send className="w-5 h-5 mr-3 text-white" /> NUEVA NOTA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
                    <DialogHeader>
                      <DialogTitle className="text-orange-950 text-2xl font-black flex items-center gap-3">
                         <FileEdit className="w-6 h-6 text-orange-500" /> EMITIR AVISO
                      </DialogTitle>
                      <DialogDescription className="font-bold italic text-orange-600/60">
                        Destino: Departamento de Nutrición.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-orange-950 font-black text-[11px] uppercase tracking-widest ml-1">Asunto</Label>
                        <Input className="rounded-xl h-12 border-slate-200" placeholder="Título..." value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-orange-950 font-black text-[11px] uppercase tracking-widest ml-1">Contenido</Label>
                        <Textarea className="rounded-xl min-h-[130px] border-slate-200 resize-none" placeholder="Instrucciones del coordinador..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-orange-950 font-black text-[11px] uppercase tracking-widest ml-1">Audiencia Destino</Label>
                          <Select
                            value={notaNueva.audiencia}
                            onValueChange={(v: any) => {
                              const auto = v === 'master' && usuariosComunicados.master.length > 0
                                ? String(usuariosComunicados.master[0].id)
                                : 'todos';
                              setNotaNueva({ ...notaNueva, audiencia: v, seleccion: auto });
                            }}
                          >
                            <SelectTrigger className="rounded-xl h-10.75 bg-slate-50 border-slate-200 font-bold text-orange-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="master">Para el Jefe de Carrera</SelectItem>
                              <SelectItem value="admins">Administradores de Nutrición</SelectItem>
                              <SelectItem value="practicantes">Practicantes de Nutrición</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-orange-950 font-black text-[11px] uppercase tracking-widest ml-1">Destinatario</Label>
                          <Select
                            value={notaNueva.seleccion}
                            onValueChange={(v) => setNotaNueva({ ...notaNueva, seleccion: v })}
                          >
                            <SelectTrigger className="rounded-xl h-10.75 border-slate-200 bg-white font-bold text-orange-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {notaNueva.audiencia === 'master' ? (
                                usuariosComunicados.master.map((u: any) => (
                                  <SelectItem key={u.id} value={String(u.id)}>
                                    {u.nombre || u.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="todos">
                                    {notaNueva.audiencia === 'admins' ? 'Todos los Administradores' : 'Todos los Practicantes'}
                                  </SelectItem>
                                  {usuariosSegundoSelect.map((u: any) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                      {u.nombre || u.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                        <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                        <p className="text-[11px] text-orange-800 font-bold leading-tight">
                          {getInfoTextoAdmin()}
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                       <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                       <Button onClick={handlePublicarNotaAdmin} disabled={isEnviando} className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 h-11.75 rounded-xl shadow-lg flex-1 active:scale-95">
                        {isEnviando ? "ENVIANDO..." : "PUBLICAR AHORA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 sm:p-8 border border-white shadow-2xl">
                <NotesViewer key={refreshKey} readOnly={false} filterCategory="nutricion" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-16 text-center">
        <div className="inline-block px-7 py-2.5 border-y border-orange-900/10">
          <p className="text-xs text-orange-900/40 font-black uppercase tracking-[0.6em] opacity-40">
            Sistema de Gestión de Academias UTC • 2026
          </p>
        </div>
      </footer>

      {/* MODAL DE ASIGNACIÓN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
          <DialogHeader>
            <DialogTitle className="text-orange-900 text-2xl font-black flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-orange-600" /> Asignar Practicante
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500 italic">
              Paciente: {selectedAppointment?.paciente_nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <Label className="text-orange-950 font-black text-[11px] uppercase tracking-widest ml-1">Seleccionar alumno de Nutrición</Label>
            <Select 
              onValueChange={(val) => {
                const p = practicantesArea.find(u => u.id.toString() === val);
                setSelectedPractitioner(p);
              }}
            >
              <SelectTrigger className="rounded-xl h-13.75 border-orange-200 font-bold focus:ring-orange-500">
                <SelectValue placeholder="Buscar en la plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {practicantesArea.length > 0 ? (
                  practicantesArea.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()} className="font-medium italic uppercase">
                      {p.nombre || p.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs font-black text-slate-400 uppercase">No hay alumnos de nutrición activos</div>
                )}
              </SelectContent>
            </Select>

            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mt-2">
              <p className="text-[11px] text-orange-800 font-bold leading-tight uppercase tracking-tighter italic">
                La asignación permitirá al alumno iniciar la evaluación nutricional inmediatamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            {selectedPractitioner && (
              <Button 
                onClick={handleConfirmAssignment} 
                disabled={isAssigning}
                className="w-full bg-orange-600 hover:bg-black text-white font-black h-13.75 rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isAssigning ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />}
                CONFIRMAR ASIGNACIÓN
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: REVERTIR CITA A PROGRAMADA */}
      <Dialog open={!!revertirCita} onOpenChange={(open) => { if (!open) { setRevertirCita(null); setMotivoRevertir(''); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-900 font-black">Revertir cita a Programada</DialogTitle>
            <DialogDescription>
              Indica el motivo por el que se revierte la consulta de <strong>{revertirCita?.paciente_nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="motivo-revertir-nutri" className="font-bold text-sm">Motivo</Label>
            <Textarea
              id="motivo-revertir-nutri"
              placeholder="Ej: Error al iniciar la consulta, problema técnico..."
              value={motivoRevertir}
              onChange={(e) => setMotivoRevertir(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setRevertirCita(null); setMotivoRevertir(''); }}>Cancelar</Button>
            <Button
              disabled={!motivoRevertir.trim()}
              onClick={handleConfirmarRevertir}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              Confirmar revertir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" /> Mi Perfil
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Drawer */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* Avatar Grande */}
          <div className="flex flex-col items-center mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-orange-600">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">{profileData.nombre}</h3>
            <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Coordinador
            </span>
          </div>

          {/* Sección de Campos */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información Personal</span>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfileClick}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors focus:outline-none"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Datos
                  </button>
                )}
              </div>

                  
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Nombre Completo</Label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-blue-400 absolute left-4" />
                      <input
                        type="text"
                        value={profileData.nombre}
                        disabled={true}
                        className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium transition-all focus:outline-none bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium italic ml-1 mt-0.5">El nombre no puede ser modificado.</p>
                  </div>



              {/* Input Único: Nombre */}
             <div className="space-y-1">
  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Número Personal</Label>
  <div className="relative flex items-center">
    <Phone className="w-4 h-4 text-blue-400 absolute left-4" />
    <input 
      type="tel" // <-- 1. Cambiado a 'tel'
      maxLength={10} // <-- 2. Límite estricto de 10 dígitos
      value={profileData.telefono}
      onChange={(e) => {
        // 3. Esta línea elimina cualquier carácter que NO sea un dígito (\D)
        const soloNumeros = e.target.value.replace(/\D/g, '');
        setProfileData({...profileData, telefono: soloNumeros});
      }}
      disabled={!isEditingProfile}
      className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
    />
  </div>
</div>

              
              
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Empleado</Label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input
                    type="text"
                    value={profileData.numero_empleado}
                    disabled={true}
                    placeholder="Sin asignar"
                    className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium transition-all focus:outline-none bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-gray-400 font-medium italic ml-1 mt-0.5">El número de empleado no puede ser modificado.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input type="text" value="Nutrición Clínica" disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-400 font-medium cursor-not-allowed" />
                </div>
              </div>

              {/* Botones de Edición */}
              {isEditingProfile && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEditProfile} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveProfile} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {/* Acciones de Sesión (Se ocultan al editar) */}
            {!isEditingProfile && (
              <div className="space-y-2 pt-3 border-t border-gray-100 mt-3">
                <button onClick={handleLogout} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                  <Trash2 className="w-4 h-4" /> Eliminar Cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MODAL CONFIRMAR ELIMINACIÓN DE CUENTA      */}
      {/* ========================================== */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-200 ${isDeleteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white max-w-md w-full mx-4 rounded-3xl p-6 shadow-2xl transition-all duration-200 ${isDeleteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center text-gray-900 mb-2">¿Deseas borrar tu cuenta?</h3>
          <p className="text-sm text-gray-500 text-center mb-8">
            Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, configuraciones y acceso al sistema clínico.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors">
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
