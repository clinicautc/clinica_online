/**
 * ============================================================================
 * ARCHIVO: MasterAdminDashboard.tsx - VERSIÓN MASTER CENTRALIZADA
 * PROPÓSITO: Gestión global de personal y difusión de comunicados segmentados.
 * MODIFICACIÓN: Inserción de columna ROL con diseño de bordes coloreados (Outline).
 * NUEVO: Barra lateral (Drawer) del Perfil de Usuario con Edición y Matrícula.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { usuariosAPI, notasAPI, citasAPI } from '../lib/api';
import { capitalizeWords } from '../lib/textFormat';
import { esCitaBloqueada, getEstadoBadgeClasses, getEstadoLabel } from '../lib/citasHelpers';
import { formatExpediente } from '../lib/formatExpediente';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Search,
  Filter,
  GraduationCap,
  Users,
  FileText,
  BarChart3,
  FileEdit,
  LogOut,
  Send,
  Trash2,
  UserCheck,
  Shield,
  Target,
  User, X, Edit2, Phone, Building, AlertTriangle,
  Calendar, Clock, UserPlus, CalendarClock, ChevronUp, Loader2, Utensils, Activity,
  UserX, RotateCcw
} from 'lucide-react';
import { toast } from '../lib/toast';

// Importación de tipos y componentes adicionales
import PatientList from '../components/PatientList';
import HorarioAtencionPanel from '../components/HorarioAtencionPanel';
import DateFilterPicker from '../components/DateFilterPicker';
import MonthFilterPicker from '../components/MonthFilterPicker';
import ViewModeToggle from '../components/ViewModeToggle';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import StatisticsPanel from '../components/StatisticsPanel';
import NotesViewer from '../components/NotesViewer';
import AppointmentForm from '../components/AppointmentForm';

interface Appointment {
  id: number;
  paciente_id?: number;
  paciente_nombre: string;
  tipo: string;
  fecha: string;
  hora: string;
  estado: string;
  numero_consulta?: number | null;
  practicante_id?: number | null;
  practicante_nombre?: string | null;
}

const AUDIENCIA_MAP: Record<string, { destino: string; destinatario_rol: string }> = {
  general:      { destino: 'todos',        destinatario_rol: 'todos' },
  admins_nutri: { destino: 'nutricion',    destinatario_rol: 'admin' },
  admins_fisio: { destino: 'fisioterapia', destinatario_rol: 'admin' },
  pracs_nutri:  { destino: 'nutricion',    destinatario_rol: 'practicante' },
  pracs_fisio:  { destino: 'fisioterapia', destinatario_rol: 'practicante' },
};

const LABEL_TODOS: Record<string, string> = {
  admins_nutri: 'Todos los Administradores',
  admins_fisio: 'Todos los Administradores',
  pracs_nutri:  'Todos los Practicantes',
  pracs_fisio:  'Todos los Practicantes',
};

export default function ManageAdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS PRINCIPALES
  const [practicantes, setPracticantes] = useState<any[]>([]); // Cambiado a any para acceder a rol y área
  // ... otros estados
const [searchTerm, setSearchTerm] = useState('');
const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');
const [roleFilter, setRoleFilter] = useState<'todos' | 'admin' | 'practicante'>('todos'); // <-- AGREGAR ESTO

  // ESTADOS PARA COMUNICADOS SEGMENTADOS
  // audiencia: codifica área + rol en un solo valor (simplifica la UI)
  // seleccion: 'todos'|'admin'|'practicante' para General, o ID numérico para persona específica
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    audiencia: 'general' as 'general' | 'admins_nutri' | 'admins_fisio' | 'pracs_nutri' | 'pracs_fisio',
    seleccion: 'todos',
  });
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);

  // ESTADOS DE CITAS AGENDADAS
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Lista completa de citas (sin filtrar por fecha/área), usada para calcular
  // la carga de trabajo (citas asignadas / por asignar) en la tabla de Personal.
  const [todasCitas, setTodasCitas] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [citasAreaFilter, setCitasAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('programada');
  // Búsqueda dentro de "Citas Programadas" — filtro puramente en pantalla
  // (no dispara una nueva carga a la API), aplicado sobre lo que ya trajeron
  // citasAreaFilter/estadoFilter/fecha. Busca por nombre del paciente, por
  // nombre del responsable (practicante/docente asignado), y por el correo
  // del paciente vía emailPorPacienteId (ver cargarPracticantes) — el objeto
  // Appointment no trae el correo directamente, así que se cruza por id.
  const [busquedaCita, setBusquedaCita] = useState('');
  const [emailPorPacienteId, setEmailPorPacienteId] = useState<Record<string, string>>({});
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);
  const [revertirCita, setRevertirCita] = useState<Appointment | null>(null);
  const [motivoRevertir, setMotivoRevertir] = useState('');
  const [recuperandoCitaId, setRecuperandoCitaId] = useState<number | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // ==========================================
  // ESTADOS PARA LA BARRA LATERAL (PERFIL)
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

  // EFECTO DE CARGA INICIAL Y ACTUALIZACIÓN AUTOMÁTICA
  useEffect(() => {
    cargarPracticantes();
    const interval = setInterval(() => {
      cargarPracticantes();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, areaFilter]);

  // EFECTO DE CARGA DE CITAS AGENDADAS (filtra por área, día/mes y fecha elegida)
  useEffect(() => {
    cargarCitas();
    const interval = setInterval(() => cargarCitas(true), 30_000);
    return () => clearInterval(interval);
  }, [citasAreaFilter, estadoFilter, selectedDate, selectedMonth, viewMode]);

  // Inicializar datos del perfil cuando el usuario carga
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || 'Administrador Master',
        telefono: user.telefono || '',
        matricula: user.matricula || '',
        email: user.email || '',
        rol: user.rol || 'master',
        area: user.area || ''
      });
    }
  }, [user]);

  /**
   * CARGA DE DATOS DESDE LA API (POSTGRESQL)
   */
  const cargarPracticantes = async () => {
    try {
      const data = await usuariosAPI.getAll();

      const listaMapeada = data
        .filter((u: any) => u.rol === 'practicante' || u.rol === 'admin')
        .map((p: any) => ({
          id: p.id.toString(),
          name: p.nombre || 'Sin Nombre',
          email: p.email || 'sin@correo.com',
          telefono: p.telefono || '',
          area: p.area ? p.area.toLowerCase() : 'fisioterapia',
          status: p.estado || p.status || 'activo',
          dateAdded: p.fecha_creacion || new Date().toISOString(),
          rol: p.rol // Sincronizado con la base de datos para mostrar el cargo
        }));

      setPracticantes(listaMapeada);

      // Mapa id→correo de pacientes, construido de esta misma respuesta (ya
      // trae a todos los usuarios) para no pedirle a la API una lista aparte
      // solo para poder buscar citas por correo — ver busquedaCita.
      const mapaCorreos: Record<string, string> = {};
      data
        .filter((u: any) => u.rol === 'paciente')
        .forEach((p: any) => { mapaCorreos[String(p.id)] = (p.email || '').toLowerCase(); });
      setEmailPorPacienteId(mapaCorreos);
    } catch (error) {
      console.error("Error al cargar docentes:", error);
      toast.error('Error de conexión con el servidor PostgreSQL');
    }
  };

  /**
   * CARGA DE CITAS AGENDADAS (AMBAS ÁREAS, FILTRABLE POR EL SELECTOR DE ÁREA Y FECHA)
   */
  const cargarCitas = async (silent = false) => {
    try {
      if (!silent) setIsLoadingCitas(true);
      const todas: Appointment[] = await citasAPI.getAll();
      setTodasCitas(todas);
      const filtradas = todas.filter((apt) => {
        const matchesArea = citasAreaFilter === 'todos' ? true : apt.tipo === citasAreaFilter;
        if (!matchesArea) return false;
        const cleanAptDate = apt.fecha.split('T')[0];
        const matchesFecha = viewMode === 'day'
          ? cleanAptDate === selectedDate
          : cleanAptDate.startsWith(selectedMonth);
        if (!matchesFecha) return false;
        if (estadoFilter !== 'todos' && apt.estado !== estadoFilter) return false;
        return true;
      });
      filtradas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      setAppointments(filtradas);
    } catch (error) {
      console.error("Error Master -> Citas:", error);
    } finally {
      if (!silent) setIsLoadingCitas(false);
    }
  };

  // Usuarios que aparecen en el segundo select según la audiencia elegida
  const usuariosSegundoSelect = practicantes.filter(u => {
    switch (notaNueva.audiencia) {
      case 'admins_nutri':  return u.rol === 'admin'       && u.area === 'nutricion';
      case 'admins_fisio':  return u.rol === 'admin'       && u.area === 'fisioterapia';
      case 'pracs_nutri':   return u.rol === 'practicante' && u.area === 'nutricion';
      case 'pracs_fisio':   return u.rol === 'practicante' && u.area === 'fisioterapia';
      default: return false;
    }
  });

  const getInfoTexto = () => {
    const selId = parseInt(notaNueva.seleccion, 10);
    if (!isNaN(selId)) {
      const u = practicantes.find(p => p.id === String(selId));
      return `Nota Privada: Solo ${u?.name ?? 'el usuario seleccionado'} verá esta publicación.`;
    }
    if (notaNueva.audiencia === 'general') {
      if (notaNueva.seleccion === 'admin')       return 'Dirigida a todos los docentes de ambas áreas.';
      if (notaNueva.seleccion === 'practicante') return 'Dirigida a todos los practicantes de ambas áreas.';
      return 'Público General: Todos los usuarios del sistema verán esta publicación.';
    }
    return `Dirigida a ${LABEL_TODOS[notaNueva.audiencia]}.`;
  };

  // LOGICA DE FILTRADO EN TIEMPO REAL
  const practicantesFiltrados = practicantes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === 'todos' ? true : p.area === areaFilter;
  const matchesRole = roleFilter === 'todos' ? true : p.rol === roleFilter;

  return matchesSearch && matchesArea && matchesRole;
});

  /**
   * PRACTICANTES ACTIVOS DEL ÁREA DE LA CITA SELECCIONADA (PARA EL MODAL DE ASIGNACIÓN)
   */
  const practicantesParaAsignar = practicantes.filter(p =>
    p.rol === 'practicante' &&
    p.area === selectedAppointment?.tipo &&
    p.status === 'activo'
  );



  const handlePublicarNota = async () => {
    if (!notaNueva.titulo || !notaNueva.contenido) {
      toast.error("El título y contenido son obligatorios");
      return;
    }

    const selId = parseInt(notaNueva.seleccion, 10);
    const isUser = !isNaN(selId);
    const map = AUDIENCIA_MAP[notaNueva.audiencia];

    const payload = {
      titulo: notaNueva.titulo,
      contenido: notaNueva.contenido,
      destino: map.destino,
      destinatario_rol: (notaNueva.audiencia === 'general' && !isUser)
        ? notaNueva.seleccion          // 'todos' | 'admin' | 'practicante'
        : map.destinatario_rol,
      destinatario_id: isUser ? selId : null,
    };

    try {
      setIsEnviando(true);
      await notasAPI.createUniversitaria(payload);
      toast.success('Comunicado publicado exitosamente');
      setIsNotaModalOpen(false);
      setNotaNueva({ titulo: '', contenido: '', audiencia: 'general', seleccion: 'todos' });
    } catch (error) {
      toast.error("Error al publicar en la base de datos");
    } finally {
      setIsEnviando(false);
    }
  };

  /**
   * ASIGNAR / RE-ASIGNAR PRACTICANTE A UNA CITA
   */
  const handleOpenAssignModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedPractitioner(null);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedPractitioner || !selectedAppointment) return;

    try {
      setIsAssigning(true);
      await citasAPI.asignar(selectedAppointment.id, {
        practicante_id: selectedPractitioner.id,
        practicante_nombre: selectedPractitioner.name
      });

      toast.success(`Cita asignada a ${selectedPractitioner.name} correctamente.`);
      setIsAssignModalOpen(false);
      setSelectedPractitioner(null);
      setSelectedAppointment(null);
      cargarCitas();
    } catch (error) {
      toast.error("Error de conexión con el servidor.");
    } finally {
      setIsAssigning(false);
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
      const telefonoLimpio = profileData.telefono?.replace(/\D/g, '') || undefined;
      const matriculaLimpia = profileData.matricula?.trim() || undefined;
      await usuariosAPI.updateProfile(user.id, {
        nombre: capitalizeWords(profileData.nombre),
        telefono: telefonoLimpio,
        matricula: matriculaLimpia
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

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión finalizada');
  };

  const handleNoAsistioAdmin = async (apt: Appointment) => {
    if (!window.confirm(`¿Confirmas que ${apt.paciente_nombre} no se presentó?`)) return;
    try {
      await citasAPI.noAsistio(apt.id);
      toast.success('Cita marcada como no asistió');
      cargarCitas();
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
      cargarCitas();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al revertir');
    }
  };

  const handleRecuperar = async (apt: Appointment) => {
    setRecuperandoCitaId(apt.id);
    try {
      await citasAPI.recuperar(apt.id);
      toast.success(`Cita de ${apt.paciente_nombre} habilitada para retomar`);
      cargarCitas();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al recuperar la cita');
    } finally {
      setRecuperandoCitaId(null);
    }
  };

  // Generar iniciales para el Avatar
  const partesNombre = profileData.nombre.trim().split(' ');
  const inicialesAvatar = (partesNombre[0]?.[0] || '') + (partesNombre[1]?.[0] || '');
  const nombreCortoDisplay = `${partesNombre[0] || ''} ${partesNombre[1] || ''}`.trim() || 'Master';

  return (
    <div className="size-full min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      <div className="relative z-10 size-full p-4 sm:p-6">
        {/* HEADER INSTITUCIONAL */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm mb-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 bg-blue-900 rounded-lg shadow-md shrink-0">
                <span className="text-white font-bold text-[10px] sm:text-sm">UTC</span>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-2xl font-bold truncate">
                  <span className="text-blue-900">Control</span>{' '}
                  <span className="text-orange-600">Master</span>
                </h1>
                <p className="text-[10px] sm:text-sm text-gray-500 font-medium tracking-wide truncate">Universidad Tres Culturas</p>
              </div>
            </div>

            {/* Perfil del Usuario Integrado (Botón que abre el Drawer) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 sm:gap-4 text-right hover:bg-slate-50 p-1.5 sm:p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            >
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-blue-900 truncate">{nombreCortoDisplay}</p>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-orange-600 truncate">Gestión de Academias</p>
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

        <div className="w-full space-y-7">
          <Tabs defaultValue="stats" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-1.5 border border-gray-100 overflow-x-auto">
              <TabsList className="bg-transparent flex justify-start gap-2.5 h-auto">
                <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold">
                  <Calendar className="w-5 h-5" /> Citas Agendadas
                </TabsTrigger>
                <TabsTrigger value="practitioners" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold">
                  <GraduationCap className="w-5 h-5" /> Personal Académico
                </TabsTrigger>
                <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold">
                  <Users className="w-5 h-5" /> Pacientes
                </TabsTrigger>
                <TabsTrigger value="horarios" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold">
                  <CalendarClock className="w-5 h-5" /> Horarios de Atención
                </TabsTrigger>

                <TabsTrigger value="stats" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold">
                  <BarChart3 className="w-5 h-5" /> Estadísticas
                </TabsTrigger>
                <TabsTrigger value="admin_notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold">
                  <FileEdit className="w-5 h-5" /> Comunicados
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTENIDO: CITAS AGENDADAS (AMBAS ÁREAS) */}
            <TabsContent value="today_appointments" className="animate-in fade-in duration-500">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="bg-gray-50/80 border-b p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                      <CardTitle className="text-blue-900 font-extrabold text-xl">Citas Programadas</CardTitle>
                      <CardDescription className="text-gray-500 font-medium italic text-base">
                        {viewMode === 'day'
                          ? `Mostrando citas del ${format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}`
                          : `Mostrando todas las citas de ${format(new Date(selectedMonth + '-01T00:00:00'), 'MMMM yyyy', { locale: es })}`}
                        {estadoFilter !== 'todos' && ` · ${getEstadoLabel(estadoFilter)}`}
                        {citasAreaFilter !== 'todos' && ` · Área: ${citasAreaFilter}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Select value={citasAreaFilter} onValueChange={(v: any) => setCitasAreaFilter(v)}>
                        <SelectTrigger className="w-[184px] bg-white border-blue-200 text-blue-900 font-bold h-11.75 rounded-xl shadow-sm text-base">
                          <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos" className="font-bold">Ambas áreas</SelectItem>
                          <SelectItem value="nutricion">Solo Nutrición</SelectItem>
                          <SelectItem value="fisioterapia">Solo Fisioterapia</SelectItem>
                        </SelectContent>
                      </Select>
                      <ViewModeToggle mode={viewMode} onChange={setViewMode} theme="blue" />
                      {viewMode === 'day' ? (
                        <>
                          <DateFilterPicker
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                            theme="blue"
                            onPrev={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))}
                            onNext={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))}
                          />
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
                  <div className="relative mt-5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar citas del responsable por nombre o correo..."
                      value={busquedaCita}
                      onChange={(e) => setBusquedaCita(e.target.value)}
                      className="pl-9 h-10.75 rounded-xl border-blue-200 text-blue-900 font-medium w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {[
                      { value: 'todos',       label: 'Todos',       active: 'bg-slate-700 text-white',   inactive: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
                      { value: 'programada',  label: 'Programadas', active: 'bg-amber-500 text-white',   inactive: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
                      { value: 'en_atencion', label: 'En Atención', active: 'bg-purple-600 text-white',  inactive: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
                      { value: 'completada',  label: 'Completadas', active: 'bg-green-600 text-white',   inactive: 'bg-green-100 text-green-800 hover:bg-green-200' },
                      { value: 'no_asistio',  label: 'No Asistió',  active: 'bg-gray-500 text-white',    inactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
                      { value: 'incompleta',  label: 'Incompletas', active: 'bg-[#FEB2E6] text-slate-900', inactive: 'bg-[#FEB2E6]/30 text-pink-800 hover:bg-[#FEB2E6]/50' },
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
                <CardContent className="p-7">
                  <div className="space-y-3.5">
                    {(() => {
                      const q = busquedaCita.trim().toLowerCase();
                      const appointmentsFiltrados = q === ''
                        ? appointments
                        : appointments.filter((apt) => {
                            const correoResponsable = practicantes.find((p) => p.id === String(apt.practicante_id))?.email || '';
                            return (
                              apt.paciente_nombre.toLowerCase().includes(q) ||
                              (apt.practicante_nombre || '').toLowerCase().includes(q) ||
                              (emailPorPacienteId[String(apt.paciente_id)] || '').includes(q) ||
                              correoResponsable.toLowerCase().includes(q)
                            );
                          });

                      if (isLoadingCitas) {
                        return (
                          <div className="flex flex-col items-center py-12 gap-3">
                            <Loader2 className="animate-spin text-blue-900" />
                            <p className="text-base font-bold text-blue-900/50">Sincronizando agenda...</p>
                          </div>
                        );
                      }

                      if (appointmentsFiltrados.length === 0) {
                        return (
                          <div className="text-center py-12 border-2 border-dashed rounded-3xl border-blue-100 italic text-slate-400">
                            {q !== ''
                              ? 'Ningún paciente coincide con la búsqueda.'
                              : `No se registran citas para ${viewMode === 'day' ? 'la fecha seleccionada' : 'el mes seleccionado'}.`}
                          </div>
                        );
                      }

                      return appointmentsFiltrados.map((apt) => (
                        <div key={apt.id} className="space-y-2">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border rounded-2xl bg-white hover:border-blue-300 transition-all shadow-sm">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
                              <div className={`p-2.5 sm:p-3.5 rounded-full shrink-0 ${apt.tipo === 'nutricion' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-900'}`}>
                                {apt.tipo === 'nutricion' ? <Utensils className="w-5 h-5 sm:w-6 sm:h-6" /> : <Activity className="w-5 h-5 sm:w-6 sm:h-6" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-blue-950 uppercase text-sm sm:text-base truncate">{apt.paciente_nombre}</p>
                                <p className="text-slate-400 font-mono normal-case text-xs sm:text-sm">Expediente: {formatExpediente(apt.paciente_id)}</p>
                                <div className="flex flex-wrap gap-2 sm:gap-3.5 items-center mt-1">
                                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(new Date(apt.fecha.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.hora.substring(0, 5)} HRS</span>
                                  <Badge variant="outline" className={`text-[10px] font-black uppercase px-2.5 py-1 ${apt.tipo === 'nutricion' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                    {apt.tipo}
                                  </Badge>
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
                                  <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-xl text-sm font-black border border-blue-100 flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5" /> {apt.practicante_nombre || "Asignado"}
                                  </span>
                                  {(() => {
                                    const correoResponsable = practicantes.find((p) => p.id === String(apt.practicante_id))?.email;
                                    return correoResponsable ? (
                                      <span className="text-[11px] text-slate-400 font-medium mt-1">{correoResponsable}</span>
                                    ) : null;
                                  })()}
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
                                  <Button
                                    className="h-9.75 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl px-5 flex items-center gap-2 shadow-sm"
                                    variant="outline"
                                    onClick={() => setReagendarCitaId(reagendarCitaId === apt.id ? null : apt.id)}
                                  >
                                    <CalendarClock className="w-5 h-5" />
                                    {reagendarCitaId === apt.id ? "CERRAR" : "RE-AGENDAR"}
                                  </Button>

                                  <Button
                                    variant={apt.practicante_id ? "outline" : "default"}
                                    className={apt.practicante_id
                                      ? "h-9.75 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl px-5 flex items-center gap-2 shadow-sm"
                                      : "h-9.75 bg-blue-900 hover:bg-blue-800 font-bold rounded-xl px-6 flex items-center gap-2 shadow-md"}
                                    onClick={() => handleOpenAssignModal(apt)}
                                  >
                                    <UserPlus className="w-5 h-5" />
                                    {apt.practicante_id ? "RE-ASIGNAR" : "ASIGNAR"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {reagendarCitaId === apt.id && (
                            <div className="bg-white border border-blue-900/10 rounded-xl p-5 shadow-inner animate-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-2 mb-5 text-blue-900">
                                <CalendarClock className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-widest">
                                  Nueva Fecha y Hora para {apt.paciente_nombre}
                                </span>
                              </div>
                              <AppointmentForm
                                patientId={apt.paciente_id?.toString() || ''}
                                existingAppointment={apt as any}
                                onSuccess={() => { setReagendarCitaId(null); cargarCitas(); }}
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
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTENIDO: GESTIÓN DE DOCENTES */}
            <TabsContent value="practitioners" className="animate-in fade-in duration-500">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50/80 p-7 gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-blue-900 font-extrabold text-2xl">Personal Académico</CardTitle>
                    <CardDescription className="text-gray-500 font-medium italic text-base">Registro y filtro de practicantes y docentes</CardDescription>
                  </div>
                  <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
                    <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 h-10.75 rounded-xl border-blue-200 text-blue-900 font-medium w-full"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                      <SelectTrigger className="w-[175px] bg-white border-blue-200 text-blue-900 font-bold h-10.75 rounded-xl shadow-sm text-base">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                          <SelectValue placeholder="Filtrar por rol" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                        <SelectItem value="practicante">Practicantes</SelectItem>
                        <SelectItem value="admin">Docentes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={areaFilter} onValueChange={(v: any) => setAreaFilter(v)}>
                      <SelectTrigger className="w-[175px] bg-white border-blue-200 text-blue-900 font-bold h-10.75 rounded-xl shadow-sm text-base">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                          <SelectValue placeholder="Filtrar por área" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="font-bold">Ambas</SelectItem>
                        <SelectItem value="nutricion">Nutrición</SelectItem>
                        <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => navigate('/administrar-personal')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg transition-transform hover:scale-105 rounded-xl h-10.75 px-5 text-base">
                      Administrar Personal
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {/* VISTA MÓVIL — misma información que la tabla, en tarjetas apiladas */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {practicantesFiltrados.map((p) => {
                      const citaEstaActiva = (c: Appointment) => c.estado !== 'cancelada' && c.estado !== 'completada';
                      const citasMetric = p.rol === 'admin'
                        ? todasCitas.filter(c => c.tipo === p.area && !c.practicante_id && citaEstaActiva(c)).length
                        : todasCitas.filter(c => String(c.practicante_id) === String(p.id) && citaEstaActiva(c)).length;
                      const citasLabel = p.rol === 'admin' ? 'Por Asignar' : 'Asignadas';
                      return (
                        <div key={p.id} className={`p-4 space-y-3 ${p.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'bg-white'}`}>
                          <div className="flex flex-col">
                            <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>
                              {p.name}
                            </span>
                            <span className="text-sm text-gray-400 font-medium italic">{p.email}</span>
                            <span className="text-sm text-gray-400 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {p.telefono || 'S/N'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`bg-transparent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border-2 ${
                                p.rol === 'admin'
                                  ? "text-purple-700 border-purple-500/40"
                                  : "text-blue-500 border-blue-400/40"
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {p.rol === 'admin' ? 'Docente Titular' : 'Practicante'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-tighter shadow-sm ${
                                p.area === 'nutricion'
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {p.area || 'GENERAL'}
                            </Badge>
                            <span className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                              p.status === 'activo'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${p.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                              {p.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{citasLabel}</span>
                            <span className={`text-lg font-black ${citasMetric > 0 ? 'text-blue-900' : 'text-slate-300'}`}>
                              {citasMetric}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* VISTA ESCRITORIO */}
                  <div className="hidden md:block">
                  <Table containerClassName="overflow-x-visible">
                    <TableHeader className="bg-white sticky top-0 z-20 border-b">
                      <TableRow>
                        <TableHead className="pl-4 text-blue-900 font-black uppercase tracking-widest whitespace-normal">Información del Docente</TableHead>
                        <TableHead className="text-blue-900 font-black uppercase tracking-widest whitespace-normal">Teléfono</TableHead>
                        {/* NUEVA CABECERA ROL */}
                        <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Rol</TableHead>
                        <TableHead className="text-blue-900 font-black uppercase tracking-widest text-center">Area</TableHead>
                        <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Estado</TableHead>
                        <TableHead className="text-right pr-4 text-blue-900 font-black uppercase tracking-widest">Citas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {practicantesFiltrados.map((p) => {
                        const citaEstaActiva = (c: Appointment) => c.estado !== 'cancelada' && c.estado !== 'completada';
                        const citasMetric = p.rol === 'admin'
                          ? todasCitas.filter(c => c.tipo === p.area && !c.practicante_id && citaEstaActiva(c)).length
                          : todasCitas.filter(c => String(c.practicante_id) === String(p.id) && citaEstaActiva(c)).length;
                        const citasLabel = p.rol === 'admin' ? 'Por Asignar' : 'Asignadas';
                        return (
                        <TableRow
                          key={p.id}
                          className={`group transition-all ${p.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'hover:bg-blue-50/50'}`}
                        >
                          <TableCell className="pl-4 whitespace-normal break-words">
                            <div className="flex flex-col">
                              <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>
                                {p.name}
                              </span>
                              <span className="text-sm text-gray-400 font-medium italic">{p.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal break-words text-slate-600 font-medium">{p.telefono || 'S/N'}</TableCell>

                          {/* COLUMNA ROL: DISEÑO DE BORDES COLOREADOS SIN FONDO (OUTLINE) */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge
                                variant="outline"
                                className={`bg-transparent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border-2 ${
                                  p.rol === 'admin'
                                    ? "text-purple-700 border-purple-500/40"
                                    : "text-blue-500 border-blue-400/40"
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                                {p.rol === 'admin' ? 'Docente Titular' : 'Practicante'}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-tighter shadow-sm ${
                                p.area === 'nutricion'
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {p.area || 'GENERAL'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <span className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                                p.status === 'activo'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${p.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                {p.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <div className="flex flex-col items-end">
                              <span className={`text-lg font-black ${citasMetric > 0 ? 'text-blue-900' : 'text-slate-300'}`}>
                                {citasMetric}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                {citasLabel}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients" className="space-y-6">
              <PatientList />
            </TabsContent>

            {/* CONTENIDO: HORARIOS DE ATENCIÓN (AMBAS ÁREAS) */}
            <TabsContent value="horarios" className="animate-in fade-in duration-500">
              <HorarioAtencionPanel />
            </TabsContent>

            <TabsContent value="histories">
              <MedicalHistoryViewer filterType={areaFilter === 'todos' ? undefined : areaFilter} />
            </TabsContent>

            <TabsContent value="stats">
              <StatisticsPanel area={areaFilter === 'todos' ? 'general' : areaFilter} />
            </TabsContent>

            <TabsContent value="admin_notes">
              <div className="bg-gradient-to-br from-orange-100/50 via-white to-blue-100/50 rounded-3xl p-4 sm:p-10 border border-white shadow-inner">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-blue-950 tracking-tight">Comunicación Master UTC</h2>
                    <p className="text-gray-500 font-medium">Difusión de avisos dirigidos a toda la universidad o usuarios específicos.</p>
                  </div>
                  
                  <Dialog open={isNotaModalOpen} onOpenChange={setIsNotaModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-900 hover:bg-black text-white px-8 py-7 rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:-translate-y-1">
                        <FileEdit className="w-6 h-6 text-orange-500" />
                        <span className="font-black uppercase tracking-widest text-sm">Nueva Publicación</span>
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="sm:max-w-[550px] rounded-[2rem] border-none shadow-2xl p-8" style={arialStyle}>
                      <DialogHeader>
                        <DialogTitle className="text-blue-900 text-2xl font-black flex items-center gap-3">
                          <Send className="w-6 h-6 text-orange-600" /> EMITIR COMUNICADO
                        </DialogTitle>
                        <DialogDescription className="font-medium">
                          Configure el alcance y destino de la información oficial.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Asunto / Título</Label>
                          <Input className="rounded-xl border-slate-200 h-12" placeholder="Título del aviso..." value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Contenido del Mensaje</Label>
                          <Textarea className="rounded-xl border-slate-200 min-h-[140px] resize-none" placeholder="Escriba el mensaje aquí..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1"> Destino</Label>
                            <Select
                              value={notaNueva.audiencia}
                              onValueChange={(v: any) => setNotaNueva({...notaNueva, audiencia: v, seleccion: 'todos'})}
                            >
                              <SelectTrigger className="rounded-xl h-10.75 bg-slate-50 border-slate-200 font-bold text-blue-900">
                                <SelectValue placeholder="Audiencia" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general"> Todos </SelectItem>
                                <SelectItem value="admins_nutri">Administradores Nutrición</SelectItem>
                                <SelectItem value="admins_fisio">Administradores Fisioterapia</SelectItem>
                                <SelectItem value="pracs_nutri">Practicantes Nutrición</SelectItem>
                                <SelectItem value="pracs_fisio">Practicantes Fisioterapia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Destinatario</Label>
                            <Select
                              value={notaNueva.seleccion}
                              onValueChange={(v) => setNotaNueva({...notaNueva, seleccion: v})}
                            >
                              <SelectTrigger className="rounded-xl h-10.75 border-slate-200 bg-white font-bold text-blue-900">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {notaNueva.audiencia === 'general' ? (
                                  <>
                                    <SelectItem value="todos">Público General</SelectItem>
                                    <SelectItem value="admin">Todos los Administradores</SelectItem>
                                    <SelectItem value="practicante">Todos los Practicantes</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="todos">{LABEL_TODOS[notaNueva.audiencia]}</SelectItem>
                                    {usuariosSegundoSelect.map((u) => (
                                      <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                          <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                          <p className="text-[10px] text-blue-800 font-medium leading-tight italic">
                            {getInfoTexto()}
                          </p>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                        <Button 
                          onClick={handlePublicarNota} 
                          disabled={isEnviando}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-black px-10 h-11.75 rounded-xl shadow-lg transition-all"
                        >
                          {isEnviando ? "PROCESANDO..." : "PUBLICAR AHORA"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-3 sm:p-8 border border-white shadow-xl">
                  <NotesViewer readOnly={false} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <footer className="py-16 text-center">
          <div className="inline-block px-7 py-2.5 border-y border-gray-100">
            <p className="text-xs text-gray-400 font-black uppercase tracking-[0.6em] opacity-40">
              Sistema de Gestión de Academias UTC • 2026
            </p>
          </div>
        </footer>
      </div>

      {/* MODAL DE ASIGNACIÓN DE PRACTICANTE (CITAS AGENDADAS) */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-2xl font-black flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-blue-600" /> Asignar Practicante
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500 italic">
              Paciente: {selectedAppointment?.paciente_nombre} · Área: {selectedAppointment?.tipo}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Seleccionar practicante del área</Label>
            <Select
              onValueChange={(val) => {
                const p = practicantesParaAsignar.find(u => u.id.toString() === val);
                setSelectedPractitioner(p);
              }}
            >
              <SelectTrigger className="rounded-xl h-13.75 border-blue-200 font-bold focus:ring-blue-500">
                <SelectValue placeholder="Buscar en la plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {practicantesParaAsignar.length > 0 ? (
                  practicantesParaAsignar.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()} className="font-medium italic uppercase">
                      {p.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs font-black text-slate-400 uppercase">No hay practicantes activos en esta área</div>
                )}
              </SelectContent>
            </Select>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-2">
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
            <DialogTitle className="text-blue-900 font-black">Revertir cita a Programada</DialogTitle>
            <DialogDescription>
              Indica el motivo por el que se revierte la consulta de <strong>{revertirCita?.paciente_nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="motivo-revertir-master" className="font-bold text-sm">Motivo</Label>
            <Textarea
              id="motivo-revertir-master"
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
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold"
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
              Jefa de carrera
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
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Matrícula Institucional</Label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input
                    type="text"
                    value={profileData.matricula}
                    disabled={true}
                    placeholder="Sin asignar"
                    className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium transition-all focus:outline-none bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic ml-1 mt-0.5">La matrícula no puede ser modificada.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input type="text" value="Control Global" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-400 font-medium cursor-not-allowed" />
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
