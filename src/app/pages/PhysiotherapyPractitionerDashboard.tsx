/**
 * ============================================================================
 * DASHBOARD DE PRACTICANTE DE FISIOTERAPIA (Versión Asignación Filtrada)
 * MODIFICACIÓN: Lógica de Paciente Recurrente para Fisioterapia + Perfil Drawer.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, historialesAPI, usuariosAPI, notasAPI } from '../lib/api';
import { capitalizeWords } from '../lib/textFormat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import {
  LogOut, Users, FileText, Calendar, Clock, Activity, Loader2, History,
  User, X, Edit2, Phone, Building, Trash2, AlertTriangle,
  Send, FileEdit, Target
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateFilterPicker from '../components/DateFilterPicker';
import MonthFilterPicker from '../components/MonthFilterPicker';
import ViewModeToggle from '../components/ViewModeToggle';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import { toast } from 'sonner';

// Interfaz sincronizada con paciente_id para la verificación de historial
interface Appointment {
  id: number;
  paciente_id: number; 
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  practicante_id?: number | null; 
}

export default function PhysiotherapyPractitionerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);
  const [recurrenceMap, setRecurrenceMap] = useState<Record<number, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

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

  // ESTADOS PARA COMUNICADOS
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    audiencia: 'admins' as 'admins' | 'practicantes',
    seleccion: 'todos',
  });
  const [usuariosComunicados, setUsuariosComunicados] = useState<{
    admins: any[]; practicantes: any[];
  }>({ admins: [], practicantes: [] });

  // Inicializar datos del perfil
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        matricula: user.matricula || '',
        email: user.email || '',
        rol: user.rol || '',
        area: user.area || ''
      });
    }
  }, [user]);

  /**
   * EFECTO: Sincronización con la DB Real y Verificación de Historiales
   */
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);

        const allAppointments: Appointment[] = await citasAPI.getAll();

        const filtered = allAppointments.filter((apt) => {
          const cleanAptDate = apt.fecha.split('T')[0];
          const matchesFecha = viewMode === 'day'
            ? cleanAptDate === selectedDate
            : cleanAptDate.startsWith(selectedMonth);
          return (
            matchesFecha &&
            apt.tipo === 'fisioterapia' &&
            (apt.estado === 'programada' || apt.estado === 'asignada' || apt.estado === 'pendiente') &&
            String(apt.practicante_id) === String(user?.id)
          );
        });
        filtered.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));

        setTodayAppointments(filtered);

        // VERIFICACIÓN: Consultamos el servidor por cada paciente asignado
        const recurrenceData: Record<number, boolean> = {};
        await Promise.all(filtered.map(async (apt) => {
          if (apt.paciente_id) {
            try {
              // Consultamos específicamente la recurrencia en fisioterapia
              const data = await historialesAPI.verificarRecurrencia(apt.paciente_id, 'fisioterapia');
              recurrenceData[apt.paciente_id] = data.existe;
            } catch (err) { console.error("Error verificando historial fisio:", err); }
          }
        }));
        setRecurrenceMap(recurrenceData);
      } catch (error) {
        console.error("❌ Error de conexión Practicante Fisio -> PostgreSQL:", error);
      } finally {
        setIsLoadingCitas(false);
      }
    };

    if (user?.id) {
      fetchTodayAppointments();
    }
  }, [user, selectedDate, selectedMonth, viewMode]);

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

    // 1. LIMPIEZA DE DATOS (Prevención del Error de Constraint Único)
    // Dejamos solo números en el teléfono
    const telefonoLimpio = profileData.telefono ? profileData.telefono.replace(/\D/g, '') : null;
    // Si la matrícula está en blanco, enviamos 'null' para que Postgres no lo cuente como duplicado
    const matriculaLimpia = profileData.matricula && profileData.matricula.trim() !== '' ? profileData.matricula.trim() : null;

    try {
      await usuariosAPI.updateProfile(user.id, {
        nombre: capitalizeWords(profileData.nombre),
        telefono: telefonoLimpio,
        matricula: matriculaLimpia // <-- Aquí se aplica la solución
      });

      setIsEditingProfile(false);
      toast.success("Tu perfil se actualizó correctamente.");
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

  // Cargar usuarios para el modal de comunicados
  useEffect(() => {
    if (!user?.id) return;
    const area = user.area?.toLowerCase() || 'fisioterapia';
    usuariosAPI.getAll().then((data: any[]) => {
      setUsuariosComunicados({
        admins:       data.filter((u: any) => u.rol === 'admin' && u.area?.toLowerCase() === area),
        practicantes: data.filter((u: any) => u.rol === 'practicante' && u.area?.toLowerCase() === area && (u.estado === 'activo' || u.status === 'activo')),
      });
    }).catch(() => {});
  }, [user?.id]);

  const usuariosSegundoSelect = notaNueva.audiencia === 'admins'
    ? usuariosComunicados.admins
    : usuariosComunicados.practicantes;

  const getInfoTexto = () => {
    const selId = parseInt(notaNueva.seleccion, 10);
    const isUser = !isNaN(selId);
    if (isUser) {
      const u = usuariosSegundoSelect.find((p: any) => p.id === selId || String(p.id) === notaNueva.seleccion);
      return `Nota Privada: Solo ${u?.nombre || u?.name || 'el usuario seleccionado'} verá este comunicado.`;
    }
    if (notaNueva.audiencia === 'admins') return 'Dirigida a todos los administradores de Fisioterapia.';
    return 'Dirigida a todos los practicantes de Fisioterapia.';
  };

  const handlePublicarNota = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("Por favor, complete todos los campos requeridos.");
      return;
    }
    const selId = parseInt(notaNueva.seleccion, 10);
    const isUser = !isNaN(selId);
    const payload = {
      titulo: notaNueva.titulo.trim(),
      contenido: notaNueva.contenido.trim(),
      destino: 'fisioterapia',
      destinatario_rol: notaNueva.audiencia === 'admins' ? 'admin' : 'practicante',
      destinatario_id: isUser ? selId : null,
    };
    try {
      setIsEnviando(true);
      await notasAPI.createUniversitaria(payload);
      toast.success("Comunicado emitido correctamente.");
      setNotaNueva({ titulo: '', contenido: '', audiencia: 'admins', seleccion: 'todos' });
      setIsNotaModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsEnviando(false);
    }
  };

  /**
   * ACCESO DINÁMICO: Redirige a Evaluación o Seguimiento según el historial
   */
  const handleAccessForms = (appointment: Appointment) => {
    const esRecurrente = recurrenceMap[appointment.paciente_id];
    
    if (esRecurrente) {
      toast.info(`Cargando registros previos de ${appointment.paciente_nombre}`);
      navigate(`/historial/${appointment.paciente_id}/fisioterapia`);
    } else {
      navigate(`/forms/fisioterapia/${appointment.id}`);
    }
  };

  // Generar iniciales para el Avatar
  const inicialesAvatar = profileData.nombre
    ? profileData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'U';
  const partesNombre = (profileData.nombre || user?.nombre || '').trim().split(' ');
  const nombreCortoDisplay = `${partesNombre[0] || ''} ${partesNombre[1] || ''}`.trim() || 'Usuario UTC';

  return (
    <div className="min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC (marca de agua, igual que MasterAdminDashboard) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/25 to-blue-100/25"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      <div className="px-4 pt-6 sm:px-6 lg:px-6 relative z-10">
        <header className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-blue-900/10 mb-6">
          <div className="flex justify-between items-center px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center relative text-white shadow-md">
                <Activity />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Clínica UTC - Fisioterapia</h1>
                <p className="text-sm text-blue-900/60 font-medium">Panel de Practicante</p>
              </div>
            </div>

            {/* Perfil del Usuario Integrado */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-4 text-right hidden sm:flex hover:bg-blue-50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div>
                <p className="text-sm font-bold text-blue-900">{nombreCortoDisplay}</p>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Practicante</p>
                <p className="text-sm text-slate-600 font-black flex items-center gap-0.5 leading-tight mt-0.5">
                  <LogOut className="w-2.5 h-2.5" /> cerrar sesión
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </button>
          </div>
        </header>
      </div>

      <main className="max-w-[1480px] mx-auto px-4 py-9 sm:px-6 lg:px-6 relative z-10">
        <div className="mb-7">
          <h2 className="text-3xl font-bold text-blue-900 mb-2">Panel de Trabajo</h2>
          <p className="text-blue-900/70 text-base">Gestiona pacientes, citas y consulta historiales de fisioterapia</p>
        </div>

        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white border border-blue-900/10 p-1.5 h-auto flex-wrap gap-1.5 shadow-sm">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Calendar className="w-5 h-5 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <Users className="w-5 h-5 mr-2" /> Pacientes
            </TabsTrigger>

            <TabsTrigger value="notes" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold px-6 py-1.5 text-base">
              <FileText className="w-5 h-5 mr-2" /> Notas del Docente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-blue-900/10 shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-700" />
                      Mis Citas Asignadas
                    </CardTitle>
                    <CardDescription className="text-blue-900/60 italic">
                      {viewMode === 'day'
                        ? `Mostrando citas del ${format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}`
                        : `Mostrando todas las citas de ${format(new Date(selectedMonth + '-01T00:00:00'), 'MMMM yyyy', { locale: es })}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ViewModeToggle mode={viewMode} onChange={setViewMode} theme="blue" />
                    {viewMode === 'day' ? (
                      <>
                        <DateFilterPicker selectedDate={selectedDate} onChange={setSelectedDate} theme="blue" />
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
              <CardContent className="space-y-3">
                {isLoadingCitas ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-900" />
                    <p className="text-blue-900/50">Cargando agenda clínica...</p>
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl border-blue-100 bg-blue-50/20 italic text-gray-500">
                    <Calendar className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                    No tienes citas asignadas para {viewMode === 'day' ? 'la fecha seleccionada' : 'el mes seleccionado'}.
                  </div>
                ) : (
                  todayAppointments.map((apt) => (
                    <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow gap-4 border-l-4 border-l-blue-900">
                      <div className="flex items-center gap-5">
                        <div className="p-3.5 rounded-full bg-blue-100 text-blue-900"><Activity className="w-6 h-6"/></div>
                        <div>
                          <p className="font-bold text-blue-900 text-xl">{apt.paciente_nombre}</p>
                          <div className="flex gap-3.5 mt-1">
                            <p className="text-base text-gray-500 font-semibold bg-gray-50 px-2.5 py-1 rounded">
                              <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-900"/> {format(new Date(apt.fecha.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-base text-gray-500 font-semibold bg-gray-50 px-2.5 py-1 rounded">
                              <Clock className="w-3.5 h-3.5 inline mr-1 text-blue-900"/> {apt.hora.substring(0, 5)} hrs
                            </p>
                            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold uppercase border border-green-200">{apt.estado}</span>
                          </div>
                        </div>
                      </div>

                      {/* BOTÓN DINÁMICO: Cambia a Púrpura si el paciente ya tiene historial */}
                      <Button
                        className={`h-10.75 px-5 text-base w-full sm:w-auto font-bold text-white shadow-sm ${
                          recurrenceMap[apt.paciente_id] ? 'bg-purple-700 hover:bg-purple-800' : 'bg-blue-900 hover:bg-blue-800'
                        }`}
                        onClick={() => handleAccessForms(apt)}
                      >
                        {recurrenceMap[apt.paciente_id] ? (
                          <><History className="w-5 h-5 mr-2" /> Ver Historial / Seguimiento</>
                        ) : (
                          <><FileText className="w-5 h-5 mr-2" /> Iniciar Evaluación</>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients"><PatientList /></TabsContent>
          <TabsContent value="histories"><MedicalHistoryViewer filterType="fisioterapia" /></TabsContent>
          <TabsContent value="notes">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-blue-950">Comunicados Internos</h2>
                  <p className="text-sm text-slate-500 font-medium">Avisos del área de Fisioterapia.</p>
                </div>
                <Dialog open={isNotaModalOpen} onOpenChange={setIsNotaModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-900 hover:bg-blue-950 text-white font-black h-13.75 px-10 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95">
                      <Send className="w-5 h-5 mr-3 text-white" /> NUEVO AVISO
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
                    <DialogHeader>
                      <DialogTitle className="text-blue-950 text-2xl font-black flex items-center gap-3">
                        <FileEdit className="w-6 h-6 text-blue-600" /> EMITIR AVISO
                      </DialogTitle>
                      <DialogDescription className="font-bold italic text-blue-600/60">
                        Destino: Área de Fisioterapia.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Asunto</Label>
                        <Input className="rounded-xl h-12 border-slate-200" placeholder="Título..." value={notaNueva.titulo} onChange={(e) => setNotaNueva({ ...notaNueva, titulo: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Mensaje</Label>
                        <Textarea className="rounded-xl min-h-[120px] border-slate-200 resize-none" placeholder="Escriba aquí..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({ ...notaNueva, contenido: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Audiencia Destino</Label>
                          <Select
                            value={notaNueva.audiencia}
                            onValueChange={(v: any) => setNotaNueva({ ...notaNueva, audiencia: v, seleccion: 'todos' })}
                          >
                            <SelectTrigger className="rounded-xl h-10.75 bg-slate-50 border-slate-200 font-bold text-blue-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                              <SelectItem value="todos">
                                {notaNueva.audiencia === 'admins' ? 'Todos los Administradores' : 'Todos los Practicantes'}
                              </SelectItem>
                              {usuariosSegundoSelect.map((u: any) => (
                                <SelectItem key={u.id} value={String(u.id)}>
                                  {u.nombre || u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <p className="text-[11px] text-blue-800 font-bold leading-tight">
                          {getInfoTexto()}
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                      <Button onClick={handlePublicarNota} disabled={isEnviando} className="bg-blue-900 hover:bg-blue-950 text-white font-black px-8 h-11.75 rounded-xl shadow-lg flex-1 active:scale-95">
                        {isEnviando ? "ENVIANDO..." : "PUBLICAR AHORA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <NotesViewer key={refreshKey} readOnly={false} filterCategory="fisioterapia" />
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
              Practicante
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