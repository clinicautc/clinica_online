/**
 * ============================================================================
 * DASHBOARD DE DOCENTE/ADMINISTRADOR DE FISIOTERAPIA (Versión Paso 3 + Perfil)
 * Panel específico para el docente coordinador con sistema de asignación de practicantes.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, usuariosAPI, notasAPI } from '../lib/api';
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
  User, X, Edit2, Phone, Building, Trash2, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import StatisticsPanel from '../components/StatisticsPanel';
import PractitionerManagement from '../components/PractitionerManagement';
import AppointmentForm from '../components/AppointmentForm'; // NUEVO: Importación del formulario

interface Appointment {
  id: number;
  paciente_id?: number; // NUEVO: Agregado para poder pasar el ID al re-agendar
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
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
  
  // NUEVO: Estado para controlar el despliegue del formulario de re-agendar
  const [reagendarCitaId, setReagendarCitaId] = useState<number | null>(null);

  // --- PASO 3: ESTADOS PARA EL MODAL DE ASIGNACIÓN ---
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null); 
  const [practicantesArea, setPracticantesArea] = useState<any[]>([]); 
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // ESTADOS PARA COMUNICADOS (VINCULADOS EN VIVO)
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    emailDestinatario: 'ninguno'
  });

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
    rol: user?.rol || '',
  });
  const [backupProfile, setBackupProfile] = useState(profileData);

  const partesNombre = profileData.nombre.trim().split(' ');
  const inicialesAvatar = (partesNombre[0]?.[0] || '') + (partesNombre[1]?.[0] || '');
  const nombreCortoDisplay = `${partesNombre[0] || ''} ${partesNombre[1] || ''}`.trim();

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const allAppointments: Appointment[] = await citasAPI.getAll();
        const filtered = allAppointments.filter((apt) => {
          const cleanAptDate = apt.fecha.split('T')[0];
          return (
            cleanAptDate === todayStr &&
            apt.tipo === 'fisioterapia' &&
            apt.estado === 'programada'
          );
        });
        setTodayAppointments(filtered);
      } catch (error) {
        console.error("❌ Error Admin Fisio -> PostgreSQL:", error);
      } finally {
        setIsLoadingCitas(false);
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
      } catch (error) {
        console.error("Error cargando personal para el select:", error);
      }
    };

    const savedUser = localStorage.getItem('utc_current_user');
    if (!user && !authLoading && !savedUser) {
      navigate('/login');
      return;
    }

    fetchTodayAppointments();
    cargarPracticantesEnVivo();
    
    const interval = setInterval(cargarPracticantesEnVivo, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, navigate]);

  // Sincronizar datos del perfil si el objeto 'user' se actualiza
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || profileData.nombre,
        telefono: user.telefono || profileData.telefono,
        matricula: user.matricula || profileData.matricula,
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

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const all = await citasAPI.getAll();
      const filtered = all.filter((a: any) => {
        const cleanDate = a.fecha.split('T')[0];
        return cleanDate === todayStr && a.tipo === 'fisioterapia' && a.estado === 'programada';
      });
      setTodayAppointments(filtered);
    } catch (error) {
      console.error("Error al asignar:", error);
      toast.error("Error de conexión con el servidor.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePublicarNotaAdmin = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("Por favor, complete todos los campos.");
      return;
    }

    try {
      setIsEnviando(true);
      const payload = {
        titulo: notaNueva.titulo.trim(),
        contenido: notaNueva.contenido.trim(),
        destino: 'fisioterapia',
        creado_por: user?.id,
        creado_por_nombre: `Coordinador: ${user?.nombre || user?.name || "Fisioterapia"}`,
        destinatario_especifico: notaNueva.emailDestinatario === 'ninguno' ? null : notaNueva.emailDestinatario
      };

      await notasAPI.createUniversitaria(payload);

      toast.success("Comunicado emitido correctamente.");
      setNotaNueva({ titulo: '', contenido: '', emailDestinatario: 'ninguno' });
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
        nombre: profileData.nombre,
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
  };

  const handleConfirmDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
    toast.error("Función deshabilitada temporalmente.");
  };

  const handleGoToManagePractitioners = () => {
    navigate('/administrar-practicantes');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 overflow-x-hidden" style={arialStyle}>
      <header className="bg-white border-b border-blue-900/10 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Clínica UTC - Fisioterapia</h1>
                <p className="text-sm text-blue-900/60">Panel de Coordinación Administrativa</p>
              </div>
            </div>
            
            {/* Perfil del Usuario Integrado (Botón que abre el Drawer) */}
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-4 text-right hidden sm:flex hover:bg-blue-50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div>
                <p className="text-sm font-bold text-blue-900">{nombreCortoDisplay}</p>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Coordinación de Área</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-0">
        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-900/10 p-1 h-auto flex-wrap gap-1 shadow-sm rounded-xl">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Agenda de Hoy
            </TabsTrigger>
            <TabsTrigger value="practitioners" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Settings className="w-4 h-4 mr-2" /> Personal
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <BarChart3 className="w-4 h-4 mr-2" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black">
              <FileEdit className="w-4 h-4 mr-2" /> Comunicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-blue-900/10 shadow-2xl rounded-3xl overflow-hidden bg-white/95">
              <CardHeader className="bg-slate-50/50 border-b p-6">
                <CardTitle className="text-blue-900 font-extrabold">Citas de Fisioterapia</CardTitle>
                <CardDescription className="font-medium italic">Sincronización en vivo con la base de datos de la clínica</CardDescription>
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
                      No se registran citas para el día de hoy.
                    </div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="space-y-2">
                        <div className="flex items-center justify-between p-5 border rounded-2xl bg-white hover:border-blue-300 transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-50 text-blue-900">
                              <Activity className="w-5 h-5"/>
                            </div>
                            <div>
                              <p className="font-black text-blue-950 uppercase text-sm">{apt.paciente_nombre}</p>
                              <div className="flex gap-3 items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> {apt.hora.substring(0,5)} HRS
                                </span>
                                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-black border border-green-100">
                                  {apt.estado}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            {apt.practicante_id && (
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                  Responsable:
                                </span>
                                <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl text-xs font-black border border-blue-100 flex items-center gap-2 shadow-sm">
                                  <UserCheck className="w-3 h-3" /> {apt.practicante_nombre || "Asignado"}
                                </span>
                              </div>
                            )}

                            {/* NUEVO BOTÓN RE-AGENDAR PARA FISIO */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl px-4 flex items-center gap-2 shadow-sm"
                              onClick={() => setReagendarCitaId(reagendarCitaId === apt.id ? null : apt.id)}
                            >
                              <Calendar className="w-4 h-4" />
                              {reagendarCitaId === apt.id ? "CERRAR" : "RE-AGENDAR"}
                            </Button>

                            <Button 
                              onClick={() => handleOpenAssignModal(apt)}
                              className={`h-11 rounded-xl font-black transition-all px-6 shadow-md flex items-center gap-2 ${
                                apt.practicante_id 
                                  ? "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50" 
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              <UserPlus className="w-4 h-4" />
                              {apt.practicante_id ? "RE-ASIGNAR" : "ASIGNAR"}
                            </Button>
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

          <TabsContent value="practitioners">
            <Card className="border-blue-900/10 shadow-2xl rounded-3xl overflow-hidden bg-white/95">
              <CardHeader className="flex flex-row items-center justify-between border-b p-6">
                <div>
                  <CardTitle className="text-blue-900 font-extrabold text-xl">Plantilla de Practicantes</CardTitle>
                  <CardDescription className="font-medium italic">Gestión de accesos para el área de Fisioterapia</CardDescription>
                </div>
                <Button onClick={handleGoToManagePractitioners} className="bg-blue-900 hover:bg-blue-800 font-bold shadow-lg"><UserPlus className="w-4 h-4 mr-2" /> Dar de Alta</Button>
              </CardHeader>
              <CardContent className="p-6">
                <PractitionerManagement area="fisioterapia" />
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
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 h-12 rounded-xl">
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
                      <div className="space-y-2">
                        <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1 text-orange-600">Usuario Específico (Opcional)</Label>
                        <Select value={notaNueva.emailDestinatario} onValueChange={(v) => setNotaNueva({...notaNueva, emailDestinatario: v})}>
                          <SelectTrigger className="rounded-xl h-12 border-orange-200 bg-orange-50/20 font-bold">
                            <SelectValue placeholder="Seleccionar Practicante" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ninguno" className="font-black text-blue-900">--- TODOS LOS PRACTICANTES ---</SelectItem>
                            {practicantesArea.map((p) => (
                              <SelectItem key={p.email} value={p.email} className="font-medium italic">
                                {p.nombre || p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                       <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                       <Button onClick={handlePublicarNotaAdmin} disabled={isEnviando} className="bg-blue-950 text-white font-black px-8 h-12 rounded-xl shadow-lg flex-1">
                        {isEnviando ? "PROCESANDO..." : "PUBLICAR AHORA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-2xl">
                <NotesViewer key={refreshKey} readOnly={false} filterCategory="fisioterapia" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

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
              <SelectTrigger className="rounded-xl h-14 border-slate-200 font-bold">
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
                className="w-full bg-blue-900 hover:bg-black text-white font-black h-14 rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isAssigning ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />}
                ASIGNAR AHORA
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
              Coordinador
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
                  <input type="text" value="Fisioterapia Clínica" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-400 font-medium cursor-not-allowed" />
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