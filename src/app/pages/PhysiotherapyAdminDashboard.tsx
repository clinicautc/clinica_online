/**
 * ============================================================================
 * DASHBOARD DE DOCENTE/ADMINISTRADOR DE FISIOTERAPIA (Versión Paso 3 + Perfil)
 * Panel específico para el docente coordinador con sistema de asignación de practicantes.
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
  LogOut, Users, FileText, Calendar, Clock, Activity, BarChart3,
  Settings, UserPlus, Loader2, Send, FileEdit, Target, UserCheck,
  User, X, Edit2, Phone, Building, Trash2, AlertTriangle,
  Search, Shield, UserX, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '../lib/toast';

import PatientList from '../components/PatientList';
import DateFilterPicker from '../components/DateFilterPicker';
import MonthFilterPicker from '../components/MonthFilterPicker';
import ViewModeToggle from '../components/ViewModeToggle';
import NotesViewer from '../components/NotesViewer';
import StatisticsPanel from '../components/StatisticsPanel';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import AppointmentForm from '../components/AppointmentForm'; // NUEVO: Importación del formulario

interface Appointment {
  id: number;
  paciente_id?: number; // NUEVO: Agregado para poder pasar el ID al re-agendar
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  numero_consulta?: number | null;
  practicante_id?: number | null;
  practicante_nombre?: string | null;
}

export default function PhysiotherapyAdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS DE CITAS
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  
  // NUEVO: Estado para controlar el despliegue del formulario de re-agendar
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);

  // --- PASO 3: ESTADOS PARA EL MODAL DE ASIGNACIÓN ---
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null); 
  const [practicantesArea, setPracticantesArea] = useState<any[]>([]); 
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // ESTADOS TABLA PERSONAL ACADÉMICO
  const [personalAcademico, setPersonalAcademico] = useState<any[]>([]);
  const [searchPersonal, setSearchPersonal] = useState('');
  const [todasCitas, setTodasCitas] = useState<Appointment[]>([]);

  // ESTADOS PARA COMUNICADOS (VINCULADOS EN VIVO)
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState<string>('programada');
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
  
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || 'Coordinador Fisioterapia',
    telefono: user?.telefono || '',
    matricula: user?.matricula || '',
    numero_empleado: user?.numero_empleado || '',
    rol: user?.rol || '',
  });
  const [backupProfile, setBackupProfile] = useState(profileData);

  const partesNombre = profileData.nombre.trim().split(' ');
  const inicialesAvatar = (partesNombre[0]?.[0] || '') + (partesNombre[1]?.[0] || '');
  const nombreCortoDisplay = `${partesNombre[0] || ''} ${partesNombre[1] || ''}`.trim();

  const personalFiltrado = personalAcademico.filter(p => {
    if (!searchPersonal) return true;
    const q = searchPersonal.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  useEffect(() => {
    const fetchTodayAppointments = async (silent = false) => {
      try {
        if (!silent) setIsLoadingCitas(true);
        const allAppointments: Appointment[] = await citasAPI.getAll();
        setTodasCitas(allAppointments);
        const filtered = allAppointments.filter((apt) => {
          if (apt.tipo !== 'fisioterapia') return false;
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
        console.error("❌ Error Admin Fisio -> PostgreSQL:", error);
      } finally {
        if (!silent) setIsLoadingCitas(false);
      }
    };

    const cargarPracticantesEnVivo = async () => {
      try {
        const data = await usuariosAPI.getAll();
        const lista = data.filter((u: any) =>
          u.rol === 'practicante' &&
          u.area?.toLowerCase() === 'fisioterapia' &&
          (u.estado === 'activo' || u.status === 'activo')
        );
        setPracticantesArea(lista);
        setPersonalAcademico(data
          .filter((u: any) => u.rol === 'practicante' && u.area?.toLowerCase() === 'fisioterapia')
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
          admins:      data.filter((u: any) => u.rol === 'admin' && u.area?.toLowerCase() === 'fisioterapia'),
          practicantes: lista,
        });
      } catch (error) {
        console.error("Error cargando personal para el select:", error);
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
  }, [user, authLoading, navigate, estadoFilter, selectedDate, selectedMonth, viewMode, refreshKey]);

  // Sincronizar datos del perfil si el objeto 'user' se actualiza
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || profileData.nombre,
        telefono: user.telefono || profileData.telefono,
        matricula: user.matricula || profileData.matricula,
        numero_empleado: user.numero_empleado || profileData.numero_empleado,
        rol: user.rol || profileData.rol
      });
    }
  }, [user]);

  // --- FUNCIÓN PARA ABRIR EL MODAL DE ASIGNACIÓN ---
  const handleOpenAssignModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedPractitioner(null);
    setIsModalOpen(true);
  };

  // --- FUNCIÓN PARA EJECUTAR LA ASIGNACIÓN EN DB ---
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

      const all = await citasAPI.getAll();
      const filtered = all.filter((a: any) => {
        const cleanDate = a.fecha.split('T')[0];
        const matchesFecha = viewMode === 'day' ? cleanDate === selectedDate : cleanDate.startsWith(selectedMonth);
        return matchesFecha && a.tipo === 'fisioterapia' && a.estado === 'programada';
      });
      filtered.sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      setTodayAppointments(filtered);
    } catch (error) {
      console.error("Error al asignar:", error);
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
    if (notaNueva.audiencia === 'admins') return 'Dirigida a todos los administradores de Fisioterapia.';
    return 'Dirigida a todos los practicantes de Fisioterapia.';
  };

  const handlePublicarNotaAdmin = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("Por favor, complete todos los campos.");
      return;
    }

    const selId = parseInt(notaNueva.seleccion, 10);
    const isUser = !isNaN(selId);
    const payload = {
      titulo: notaNueva.titulo.trim(),
      contenido: notaNueva.contenido.trim(),
      destino: 'fisioterapia',
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
        telefono: profileData.telefono,
        matricula: profileData.matricula
      });

      setIsEditingProfile(false);
      toast.success("Tu perfil se actualizó correctamente.");
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
    toast.error("Función deshabilitada temporalmente.");
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
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-blue-900" />
          <p className="text-blue-900 font-medium">Sincronizando con Clínica UTC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC (marca de agua, igual que MasterAdminDashboard) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/25 to-blue-100/25"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      <div className="px-4 pt-6 sm:px-6 lg:px-6 relative z-10">
        <header className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-blue-900/10 mb-6">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shadow-lg shrink-0">
                <Activity className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-2xl font-bold text-blue-900 truncate">Clínica UTC - Fisioterapia</h1>
                <p className="text-[10px] sm:text-sm text-blue-900/60 truncate">Panel de Coordinación Administrativa</p>
              </div>
            </div>

            {/* Perfil del Usuario Integrado (Botón que abre el Drawer) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 sm:gap-4 text-right hover:bg-blue-50 p-1.5 sm:p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            >
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-blue-900 truncate">{nombreCortoDisplay}</p>
                <p className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest truncate">Coordinación de Área</p>
                <p className="text-xs sm:text-sm text-slate-600 font-black flex items-center justify-end gap-0.5 leading-tight mt-0.5 whitespace-nowrap">
                  <LogOut className="w-2.5 h-2.5 shrink-0" /> cerrar sesión
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </button>
          </div>
        </header>
      </div>

      <main className="w-full px-4 pb-9 sm:px-6 lg:px-6 relative z-0">
        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-900/10 p-1.5 h-auto flex-wrap gap-1.5 shadow-sm rounded-xl">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Calendar className="w-5 h-5 mr-2" /> Citas Agendadas
            </TabsTrigger>
            <TabsTrigger value="practitioners" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Settings className="w-5 h-5 mr-2" /> Personal
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <BarChart3 className="w-5 h-5 mr-2" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Users className="w-5 h-5 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black px-6 py-1.5 text-base">
              <FileEdit className="w-5 h-5 mr-2" /> Comunicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-blue-900/10 shadow-2xl rounded-3xl overflow-hidden bg-white/95">
              <CardHeader className="bg-slate-50/50 border-b p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div>
                    <CardTitle className="text-blue-900 font-extrabold text-xl">Citas de Fisioterapia</CardTitle>
                    <CardDescription className="font-medium italic text-base">
                      {viewMode === 'day'
                        ? `Mostrando citas del ${format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}`
                        : `Mostrando todas las citas de ${format(new Date(selectedMonth + '-01T00:00:00'), 'MMMM yyyy', { locale: es })}`}
                      {estadoFilter !== 'todos' && ` · ${getEstadoLabel(estadoFilter)}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <div className="flex flex-col items-center py-12 gap-3">
                      <Loader2 className="animate-spin text-blue-900" />
                      <p className="text-sm font-bold">Consultando agenda...</p>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl border-blue-100 italic text-slate-400">
                      No se registran citas para {viewMode === 'day' ? 'la fecha seleccionada' : 'el mes seleccionado'}.
                    </div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="space-y-2">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border rounded-2xl bg-white hover:border-blue-300 transition-all shadow-sm">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
                            <div className="p-2.5 sm:p-3.5 rounded-full bg-blue-50 text-blue-900 shrink-0">
                              <Activity className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-blue-950 uppercase text-sm sm:text-base truncate">{apt.paciente_nombre}</p>
                              <p className="text-slate-400 font-mono normal-case text-xs sm:text-sm">Expediente: {formatExpediente(apt.paciente_id)}</p>
                              <div className="flex flex-wrap gap-2 sm:gap-3.5 items-center mt-1">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5"/> {format(new Date(apt.fecha.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy')}
                                </span>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5"/> {apt.hora.substring(0,5)} HRS
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${getEstadoBadgeClasses(apt.estado)}`}>
                                  {getEstadoLabel(apt.estado)}
                                </span>
                                {apt.estado === 'completada' && apt.numero_consulta && (
                                  <span className="text-xs px-2 py-1 rounded-full font-black bg-slate-100 text-slate-600">
                                    Consulta #{apt.numero_consulta}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-7">
                            {apt.practicante_id && (
                              <div className="flex flex-col items-start sm:items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                  Responsable:
                                </span>
                                <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-xl text-sm font-black border border-blue-100 flex items-center gap-2 shadow-sm">
                                  <UserCheck className="w-3.5 h-3.5" /> {apt.practicante_nombre || "Asignado"}
                                </span>
                              </div>
                            )}

                            {apt.estado === 'en_atencion' && (
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  className="h-9.75 border-gray-300 text-gray-600 hover:bg-gray-50 font-bold rounded-xl px-4 flex items-center gap-2 shadow-sm"
                                  onClick={() => handleNoAsistioAdmin(apt)}
                                >
                                  <UserX className="w-4.5 h-4.5" /> No asistió
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-9.75 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl px-4 flex items-center gap-2 shadow-sm"
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
                                {/* NUEVO BOTÓN RE-AGENDAR PARA FISIO */}
                                <Button
                                  className="h-10.75 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl px-5 flex items-center gap-2 shadow-sm"
                                  variant="outline"
                                  onClick={() => setReagendarCitaId(reagendarCitaId === apt.id ? null : apt.id)}
                                >
                                  <Calendar className="w-5 h-5" />
                                  {reagendarCitaId === apt.id ? "CERRAR" : "RE-AGENDAR"}
                                </Button>

                                <Button
                                  onClick={() => handleOpenAssignModal(apt)}
                                  className={`h-10.75 rounded-xl font-black transition-all px-7 shadow-md flex items-center gap-2 ${
                                    apt.practicante_id
                                      ? "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                >
                                  <UserPlus className="w-5 h-5" />
                                  {apt.practicante_id ? "RE-ASIGNAR" : "ASIGNAR"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* NUEVO: DESPLEGABLE DEL FORMULARIO PARA REAGENDAR (FISIOTERAPIA) */}
                        {reagendarCitaId === apt.id && (
                          <div className="bg-white border border-blue-900/10 rounded-xl p-5 shadow-inner animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-5 text-blue-900">
                              <Calendar className="w-5 h-5" />
                              <span className="text-xs font-black uppercase tracking-widest">
                                Nueva Fecha y Hora para {apt.paciente_nombre}
                              </span>
                            </div>
                            
                            {/* AQUÍ ESTÁ LA MAGIA PARA NO DUPLICAR */}
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
                              <X className="w-3.5 h-3.5 mr-1" /> CANCELAR EDICIÓN
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
                  <CardTitle className="text-blue-900 font-extrabold text-2xl">Personal Académico</CardTitle>
                  <CardDescription className="text-gray-500 font-medium italic text-base">Registro y filtro de practicantes y docentes · Área de Fisioterapia</CardDescription>
                </div>
                <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
                  <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nombre o correo..."
                      value={searchPersonal}
                      onChange={e => setSearchPersonal(e.target.value)}
                      className="pl-9 h-10.75 rounded-xl border-blue-200 text-blue-900 font-medium w-full"
                    />
                  </div>
                  <Button onClick={handleGoToManagePractitioners} className="bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-lg transition-transform hover:scale-105 rounded-xl h-10.75 px-5 text-base whitespace-nowrap">
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
                              <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>{p.name}</span>
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
                              <span className={`text-lg font-black ${citasMetric > 0 ? 'text-blue-900' : 'text-slate-300'}`}>{citasMetric}</span>
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
                          <TableHead className="pl-4 text-blue-900 font-black uppercase tracking-widest">Información</TableHead>
                          <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Rol</TableHead>
                          <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Estado</TableHead>
                          <TableHead className="text-right pr-4 text-blue-900 font-black uppercase tracking-widest">Citas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {personalFiltrado.map((p) => {
                          const citaEstaActiva = (c: Appointment) => c.estado !== 'cancelada' && c.estado !== 'completada';
                          const citasMetric = todasCitas.filter(c => String(c.practicante_id) === String(p.id) && citaEstaActiva(c)).length;
                          return (
                            <TableRow key={p.id} className={`group transition-all ${p.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'hover:bg-blue-50/50'}`}>
                              <TableCell className="pl-4">
                                <div className="flex flex-col">
                                  <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>{p.name}</span>
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
                                  <span className={`text-lg font-black ${citasMetric > 0 ? 'text-blue-900' : 'text-slate-300'}`}>{citasMetric}</span>
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
            <StatisticsPanel area="fisioterapia" />
          </TabsContent>

          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-3xl border border-blue-900/10 shadow-xl gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-blue-950 tracking-tight">Comunicados Internos</h3>
                  <p className="text-sm text-slate-500 font-medium">Emisión de avisos para el personal de Fisioterapia.</p>
                </div>

                <Dialog open={isNotaModalOpen} onOpenChange={setIsNotaModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 h-11.75 rounded-xl">
                      <Send className="w-4 h-4 mr-2" /> 
                      NUEVO AVISO
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
                    <DialogHeader>
                      <DialogTitle className="text-blue-950 text-2xl font-black flex items-center gap-3">
                         <FileEdit className="w-6 h-6 text-orange-500" /> EMITIR AVISO
                      </DialogTitle>
                      <DialogDescription className="font-bold italic text-blue-600/60">
                        Destino automático: Departamento de Fisioterapia.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Asunto del Comunicado</Label>
                        <Input className="rounded-xl h-12 border-slate-200" placeholder="Título..." value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Mensaje / Instrucción</Label>
                        <Textarea className="rounded-xl min-h-[130px] border-slate-200 resize-none" placeholder="Escriba aquí..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Audiencia Destino</Label>
                          <Select
                            value={notaNueva.audiencia}
                            onValueChange={(v: any) => {
                              const auto = v === 'master' && usuariosComunicados.master.length > 0
                                ? String(usuariosComunicados.master[0].id)
                                : 'todos';
                              setNotaNueva({ ...notaNueva, audiencia: v, seleccion: auto });
                            }}
                          >
                            <SelectTrigger className="rounded-xl h-10.75 bg-slate-50 border-slate-200 font-bold text-blue-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="master">Para el Jefe de Carrera</SelectItem>
                              <SelectItem value="admins">Administradores de Fisioterapia</SelectItem>
                              <SelectItem value="practicantes">Practicantes de Fisioterapia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Destinatario</Label>
                          <Select
                            value={notaNueva.seleccion}
                            onValueChange={(v) => setNotaNueva({ ...notaNueva, seleccion: v })}
                          >
                            <SelectTrigger className="rounded-xl h-10.75 border-slate-200 bg-white font-bold text-blue-900">
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
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <p className="text-[11px] text-blue-800 font-bold leading-tight">
                          {getInfoTextoAdmin()}
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                       <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                       <Button onClick={handlePublicarNotaAdmin} disabled={isEnviando} className="bg-blue-950 text-white font-black px-8 h-11.75 rounded-xl shadow-lg flex-1">
                        {isEnviando ? "PROCESANDO..." : "PUBLICAR AHORA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 sm:p-8 border border-white shadow-2xl">
                <NotesViewer key={refreshKey} readOnly={false} filterCategory="fisioterapia" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-16 text-center">
        <div className="inline-block px-7 py-2.5 border-y border-blue-900/10">
          <p className="text-xs text-blue-900/40 font-black uppercase tracking-[0.6em] opacity-40">
            Sistema de Gestión de Academias UTC • 2026
          </p>
        </div>
      </footer>

      {/* MODAL DE ASIGNACIÓN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
          <DialogHeader>
            <DialogTitle className="text-blue-950 text-2xl font-black flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-blue-600" /> Asignar Practicante
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500 italic">
              Paciente: {selectedAppointment?.paciente_nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Seleccionar alumno de Fisioterapia</Label>
            <Select 
              onValueChange={(val) => {
                const p = practicantesArea.find(u => u.id.toString() === val);
                setSelectedPractitioner(p);
              }}
            >
              <SelectTrigger className="rounded-xl h-13.75 border-slate-200 font-bold">
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
                  <div className="p-4 text-center text-xs font-black text-slate-400">No hay practicantes activos en el área.</div>
                )}
              </SelectContent>
            </Select>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mt-2">
              <p className="text-[11px] text-blue-800 font-bold leading-tight">
                Una vez asignado, el practicante podrá visualizar la cita en su panel y proceder con la evaluación clínica.
              </p>
            </div>
          </div>

          <DialogFooter>
            {selectedPractitioner && (
              <Button 
                onClick={handleConfirmAssignment} 
                disabled={isAssigning}
                className="w-full bg-blue-900 hover:bg-black text-white font-black h-13.75 rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isAssigning ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />}
                ASIGNAR AHORA
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: REVERTIR CITA A PROGRAMADA */}
      <Dialog open={!!revertirCita} onOpenChange={(open) => { if (!open) { setRevertirCita(null); setMotivoRevertir(''); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900 font-black">Revertir cita a Programada</DialogTitle>
            <DialogDescription>
              Indica el motivo por el que se revierte la consulta de <strong>{revertirCita?.paciente_nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="motivo-revertir-fisio" className="font-bold text-sm">Motivo</Label>
            <Textarea
              id="motivo-revertir-fisio"
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
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold"
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
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-blue-100 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100 bg-blue-50/50">
          <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Mi Perfil
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex flex-col items-center mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-blue-700">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-blue-950 text-center">{profileData.nombre}</h3>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Coordinador
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-2">
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
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Número de Empleado</Label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input
                    type="text"
                    value={profileData.numero_empleado}
                    disabled={true}
                    placeholder="Sin asignar"
                    className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium transition-all focus:outline-none bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic ml-1 mt-0.5">El número de empleado no puede ser modificado.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input type="text" value="Fisioterapia Clínica" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-400 font-medium cursor-not-allowed" />
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
              <div className="space-y-2 pt-3 border-t border-slate-100 mt-3">
                <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
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

      {/* MODAL ELIMINAR CUENTA */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-200 ${isDeleteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white max-w-md w-full mx-4 rounded-3xl p-6 shadow-2xl transition-all duration-200 ${isDeleteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center text-blue-950 mb-2">¿Deseas borrar tu cuenta?</h3>
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
