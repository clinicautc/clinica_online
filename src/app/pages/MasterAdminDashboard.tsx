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
  Calendar, Clock, UserPlus, CalendarClock, ChevronUp, Loader2, Utensils, Activity
} from 'lucide-react';
import { toast } from 'sonner';

// Importación de tipos y componentes adicionales
import PatientList from '../components/PatientList';
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
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [citasAreaFilter, setCitasAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);
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
  }, [citasAreaFilter, selectedDate, selectedMonth, viewMode]);

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
          area: p.area ? p.area.toLowerCase() : 'fisioterapia',
          status: p.estado || p.status || 'activo',
          dateAdded: p.fecha_creacion || new Date().toISOString(),
          rol: p.rol // Sincronizado con la base de datos para mostrar el cargo
        }));

      setPracticantes(listaMapeada);
    } catch (error) {
      console.error("Error al cargar docentes:", error);
      toast.error('Error de conexión con el servidor PostgreSQL');
    }
  };

  /**
   * CARGA DE CITAS AGENDADAS (AMBAS ÁREAS, FILTRABLE POR EL SELECTOR DE ÁREA Y FECHA)
   */
  const cargarCitas = async () => {
    try {
      setIsLoadingCitas(true);
      const todas: Appointment[] = await citasAPI.getAll();
      setTodasCitas(todas);
      const filtradas = todas.filter((apt) => {
        const cleanAptDate = apt.fecha.split('T')[0];
        const matchesArea = citasAreaFilter === 'todos' ? true : apt.tipo === citasAreaFilter;
        const matchesFecha = viewMode === 'day'
          ? cleanAptDate === selectedDate
          : cleanAptDate.startsWith(selectedMonth);
        return matchesFecha && matchesArea;
      });
      // ORDEN DESCENDENTE: más reciente primero (fecha y, dentro del mismo día, hora)
      filtradas.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
      setAppointments(filtradas);
    } catch (error) {
      console.error("Error Master -> Citas:", error);
    } finally {
      setIsLoadingCitas(false);
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
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 bg-blue-900 rounded-lg shadow-md">
                <span className="text-white font-bold text-sm">UTC</span>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-blue-900">Control</span>{' '}
                  <span className="text-orange-600">Master</span>
                </h1>
                <p className="text-sm text-gray-500 font-medium tracking-wide">Universidad Tres Culturas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Perfil del Usuario Integrado (Botón que abre el Drawer) */}
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-4 text-right hidden sm:flex hover:bg-slate-50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div>
                  <p className="text-sm font-bold text-blue-900">{nombreCortoDisplay}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">Gestión de Academias</p>
                  <p className="text-sm text-slate-600 font-black flex items-center gap-0.5 leading-tight mt-0.5">
                    <LogOut className="w-2.5 h-2.5" /> cerrar sesión
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </button>

              
           </div>
          </div>
        </header>

        <div className="max-w-[1480px] mx-auto space-y-7">
          <Tabs defaultValue="practitioners" className="space-y-6">
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
                </CardHeader>
                <CardContent className="p-7">
                  <div className="space-y-3.5">
                    {isLoadingCitas ? (
                      <div className="flex flex-col items-center py-12 gap-3">
                        <Loader2 className="animate-spin text-blue-900" />
                        <p className="text-base font-bold text-blue-900/50">Sincronizando agenda...</p>
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-3xl border-blue-100 italic text-slate-400">
                        No se registran citas para {viewMode === 'day' ? 'la fecha seleccionada' : 'el mes seleccionado'}.
                      </div>
                    ) : (
                      appointments.map((apt) => (
                        <div key={apt.id} className="space-y-2">
                          <div className="flex items-center justify-between p-6 border rounded-2xl bg-white hover:border-blue-300 transition-all shadow-sm">
                            <div className="flex items-center gap-5">
                              <div className={`p-3.5 rounded-full ${apt.tipo === 'nutricion' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-900'}`}>
                                {apt.tipo === 'nutricion' ? <Utensils className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                              </div>
                              <div>
                                <p className="font-black text-blue-950 uppercase text-base">{apt.paciente_nombre}</p>
                                <div className="flex gap-3.5 items-center">
                                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(new Date(apt.fecha.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.hora.substring(0, 5)} HRS</span>
                                  <Badge variant="outline" className={`text-[10px] font-black uppercase px-2.5 py-1 ${apt.tipo === 'nutricion' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                    {apt.tipo}
                                  </Badge>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${getEstadoBadgeClasses(apt.estado)}`}>{getEstadoLabel(apt.estado)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-5">
                              {apt.practicante_id && (
                                <div className="flex flex-col items-end mr-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable Actual:</span>
                                  <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-xl text-sm font-black border border-blue-100 flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5" /> {apt.practicante_nombre || "Asignado"}
                                  </span>
                                </div>
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTENIDO: GESTIÓN DE DOCENTES */}
            <TabsContent value="practitioners" className="animate-in fade-in duration-500">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/80 p-7 gap-4">
                  <div className="shrink-0">
                    <CardTitle className="text-blue-900 font-extrabold text-2xl">Personal Académico</CardTitle>
                    <CardDescription className="text-gray-500 font-medium italic text-base">Registro y filtro de practicantes y docentes</CardDescription>
                  </div>
                  <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
                    <div className="relative min-w-[280px]">
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

                <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-white sticky top-0 z-20 border-b">
                      <TableRow>
                        <TableHead className="pl-4 text-blue-900 font-black uppercase tracking-widest">Información del Docente</TableHead>
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
                          <TableCell className="pl-4">
                            <div className="flex flex-col">
                              <span className={`text-base font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>
                                {p.name}
                              </span>
                              <span className="text-sm text-gray-400 font-medium italic">{p.email}</span>
                            </div>
                          </TableCell>

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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients">
              <PatientList />
            </TabsContent>

            <TabsContent value="histories">
              <MedicalHistoryViewer filterType={areaFilter === 'todos' ? undefined : areaFilter} />
            </TabsContent>

            <TabsContent value="stats">
              <StatisticsPanel area={areaFilter === 'todos' ? 'general' : areaFilter} />
            </TabsContent>

            <TabsContent value="admin_notes">
              <div className="bg-gradient-to-br from-orange-100/50 via-white to-blue-100/50 rounded-3xl p-10 border border-white shadow-inner">
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
                
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl">
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

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-blue-700">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-blue-950 text-center">{profileData.nombre}</h3>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Jefa de carrera
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

              <div className="space-y-1">
  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Nombre Completo</Label>
  <div className="relative flex items-center">
    <User className="w-4 h-4 text-blue-400 absolute left-4" />
    <input 
      type="text" 
      maxLength={40} // <-- 1. Límite estricto de 40 caracteres
      value={profileData.nombre}
      onChange={(e) => {
        // 2. Esta línea elimina cualquier cosa que NO sea letra, acento, ñ, o espacio
        const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        
        // Opcional: Si quieres que no puedan poner múltiples espacios seguidos, puedes usar:
        // const nombreLimpio = soloLetras.replace(/\s{2,}/g, ' ');
        
        setProfileData({...profileData, nombre: soloLetras});
      }}
      disabled={!isEditingProfile}
      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
    />
  </div>
</div>

             <div className="space-y-1">
  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Número Personal</Label>
  <div className="relative flex items-center">
    <Phone className="w-4 h-4 text-blue-400 absolute left-4" />
    <input 
      type="tel" // <-- 1. Cambiado a 'tel'
      maxLength={15} // <-- 2. Límite estricto de 15 dígitos
      value={profileData.telefono}
      onChange={(e) => {
        // 3. Esta línea elimina cualquier carácter que NO sea un dígito (\D)
        const soloNumeros = e.target.value.replace(/\D/g, '');
        setProfileData({...profileData, telefono: soloNumeros});
      }}
      disabled={!isEditingProfile}
      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
    />
  </div>
</div>

              {(profileData.rol === 'practicante' || profileData.rol === 'paciente') && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Matrícula Institucional</Label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 text-blue-400 absolute left-4" />
                    <input 
                      type="text" 
                      value={profileData.matricula}
                      onChange={(e) => setProfileData({...profileData, matricula: e.target.value})}
                      disabled={!isEditingProfile}
                      placeholder="Ej. UTC-12345"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input type="text" value="Control Global" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-400 font-medium cursor-not-allowed" />
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