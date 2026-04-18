/**
 * ============================================================================
 * ARCHIVO: NutritionAdminDashboard.tsx - VERSIÓN MASTER INTEGRADA (EXTENSA)
 * PROPÓSITO: Panel de Coordinación de Nutrición con Sistema de Notas y Asignación.
 * COLOR TEMÁTICO: Naranja (#ea580c / orange-600)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  LogOut, Users, FileText, Calendar, Clock, Utensils, BarChart3, 
  Settings, UserPlus, Loader2, Send, FileEdit, Target, UserCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import StatisticsPanel from '../components/StatisticsPanel';
import PractitionerManagement from '../components/PractitionerManagement';
import { Badge } from '../components/ui/badge';

// Interfaz sincronizada con PostgreSQL
interface Appointment {
  id: number;
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  practicante_id?: number | null; // Agregado para el flujo de asignación
  practicante_nombre?: string | null;
}

export default function NutritionAdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS DE CITAS
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);

  // --- NUEVOS ESTADOS PARA EL MODAL DE ASIGNACIÓN (NUTRICIÓN) ---
  const [isModalOpen, setIsModalOpen] = useState(false); // Control de ventana emergente
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null); // Alumno seleccionado
  const [practicantesArea, setPracticantesArea] = useState<any[]>([]); // Lista filtrada de Nutrición
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

  /**
   * EFECTO INICIAL: Carga de Citas y Personal
   */
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(`http://localhost:3001/api/citas`);
        
        if (response.ok) {
          const allAppointments: Appointment[] = await response.json();
          const filtered = allAppointments.filter((apt) => {
            const cleanAptDate = apt.fecha.split('T')[0];
            return (
              cleanAptDate === todayStr && 
              apt.tipo === 'nutricion'
            );
          });
          setTodayAppointments(filtered);
        }
      } catch (error) {
        console.error("❌ Error Admin Nutrición -> PostgreSQL:", error);
      } finally {
        setIsLoadingCitas(false);
      }
    };

    const cargarPracticantesEnVivo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/usuarios');
        if (response.ok) {
          const data = await response.json();
          // Filtrado estricto por rol 'practicante' y área 'nutricion'
          const lista = data.filter((u: any) => 
            u.rol === 'practicante' && 
            u.area?.toLowerCase() === 'nutricion' &&
            (u.estado === 'activo' || u.status === 'activo')
          );
          setPracticantesArea(lista);
        }
      } catch (error) {
        console.error("Error al cargar practicantes para el select:", error);
      }
    };

    const savedUser = localStorage.getItem('utc_current_user');
    if (!user && !authLoading && !savedUser) {
      navigate('/login');
      return;
    }

    fetchTodayAppointments();
    cargarPracticantesEnVivo();

    // Sincronización cada 30 segundos
    const interval = setInterval(cargarPracticantesEnVivo, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, navigate, refreshKey]);

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
      const response = await fetch(`http://localhost:3001/api/citas/${selectedAppointment.id}/asignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          practicante_id: selectedPractitioner.id,
          practicante_nombre: selectedPractitioner.nombre 
        })
      });

      if (response.ok) {
        toast.success(`Cita asignada a ${selectedPractitioner.nombre} correctamente.`);
        setIsModalOpen(false); // Cierre automático del modal
        setSelectedPractitioner(null);
        setSelectedAppointment(null);
        setRefreshKey(prev => prev + 1); // Refrescar la lista de citas
      } else {
        toast.error("El servidor no pudo procesar la asignación.");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor.");
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * FUNCIÓN: handlePublicarNotaAdmin
   */
  const handlePublicarNotaAdmin = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("Por favor, complete todos los campos requeridos.");
      return;
    }

    try {
      setIsEnviando(true);
      const payload = {
        titulo: notaNueva.titulo.trim(),
        contenido: notaNueva.contenido.trim(),
        destino: 'nutricion',
        creado_por: user?.id,
        creado_por_nombre: `Coordinador: ${user?.nombre || user?.name || "Nutrición"}`,
        destinatario_especifico: notaNueva.emailDestinatario === 'ninguno' ? null : notaNueva.emailDestinatario
      };

      const response = await fetch('http://localhost:3001/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Comunicado emitido correctamente.");
        setNotaNueva({ titulo: '', contenido: '', emailDestinatario: 'ninguno' });
        setIsNotaModalOpen(false);
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsEnviando(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToManagePractitioners = () => {
    navigate('/administrar-practicantes');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Loader2 className="animate-spin h-10 w-10 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100" style={arialStyle}>
      <header className="bg-white border-b border-orange-900/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">Clínica UTC - Nutrición</h1>
                <p className="text-sm text-orange-900/60 font-medium">Panel de Coordinación Académica</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-orange-900">{(user as any)?.nombre || user?.name}</p>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Docente Titular</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-100 text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-orange-200 p-1 h-auto flex-wrap gap-1 shadow-sm rounded-xl">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Agenda de Hoy
            </TabsTrigger>
            <TabsTrigger value="practitioners" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Settings className="w-4 h-4 mr-2" /> Personal
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <BarChart3 className="w-4 h-4 mr-2" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black">
              <FileEdit className="w-4 h-4 mr-2" /> Comunicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today_appointments">
            <Card className="border-orange-200 shadow-2xl rounded-3xl overflow-hidden bg-white/95">
              <CardHeader className="bg-orange-50/50 border-b p-6">
                <CardTitle className="text-orange-900 font-extrabold">Citas Programadas</CardTitle>
                <CardDescription className="font-medium italic text-orange-800/60">Consulta de hoy: {format(new Date(), 'dd/MM/yyyy')}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {isLoadingCitas ? (
                    <div className="flex flex-col items-center py-12 gap-3"><Loader2 className="animate-spin text-orange-600" /><p className="text-sm font-bold text-orange-900/50">Sincronizando agenda...</p></div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl border-orange-100 italic text-slate-400">No se registran citas de nutrición para hoy.</div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-5 border rounded-2xl bg-white hover:border-orange-300 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-orange-50 text-orange-600"><Utensils className="w-5 h-5"/></div>
                          <div>
                            <p className="font-black text-orange-950 uppercase text-sm">{apt.paciente_nombre}</p>
                            <div className="flex gap-3 items-center">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.hora.substring(0,5)} HRS</span>
                              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-black border border-green-100">{apt.estado}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* NUEVO BOTÓN DE ASIGNACIÓN ADAPTADO A NUTRICIÓN */}
                        {!apt.practicante_id ? (
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 font-bold rounded-xl px-5 flex items-center gap-2" 
                            onClick={() => handleOpenAssignModal(apt)}
                          >
                            <UserPlus className="w-4 h-4" /> Asignar Practicante
                          </Button>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable:</span>
                            <span className="bg-orange-50 text-orange-700 px-4 py-1.5 rounded-xl text-xs font-black border border-orange-100 flex items-center gap-2">
                              <UserCheck className="w-3 h-3" /> {apt.practicante_nombre || "Asignado"}
                            </span>
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
            <Card className="border-orange-200 shadow-2xl rounded-3xl overflow-hidden bg-white/95">
              <CardHeader className="flex flex-row items-center justify-between border-b p-6">
                <div>
                  <CardTitle className="text-orange-900 font-extrabold text-xl">Plantilla de Practicantes</CardTitle>
                  <CardDescription className="font-medium italic">Gestión de accesos para el departamento de Nutrición</CardDescription>
                </div>
                <Button onClick={handleGoToManagePractitioners} className="bg-orange-600 hover:bg-orange-700 font-bold shadow-lg"><UserPlus className="w-4 h-4 mr-2" /> Dar de Alta</Button>
              </CardHeader>
              <CardContent className="p-6">
                <PractitionerManagement area="nutricion" />
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
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black h-14 px-10 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95">
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
                      <div className="space-y-2">
                        <Label className="text-orange-600 font-black text-[11px] uppercase tracking-widest ml-1">Usuario Específico (Opcional)</Label>
                        <Select value={notaNueva.emailDestinatario} onValueChange={(v) => setNotaNueva({...notaNueva, emailDestinatario: v})}>
                          <SelectTrigger className="rounded-xl h-12 border-orange-300 bg-orange-50/20 font-bold">
                            <SelectValue placeholder="Seleccionar Practicante" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ninguno" className="font-black text-orange-900">--- TODOS LOS PRACTICANTES ---</SelectItem>
                            {practicantesArea.map((p) => (
                              <SelectItem key={p.email} value={p.email} className="font-medium italic">
                                {p.nombre || p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                        <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                        <p className="text-[11px] text-orange-800 font-bold leading-tight">
                          {notaNueva.emailDestinatario === 'ninguno' 
                            ? "PUBLICACIÓN GENERAL: Todos los practicantes de Nutrición visualizarán este aviso." 
                            : `PUBLICACIÓN PRIVADA: Este mensaje se enviará directamente al perfil seleccionado.`}
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                       <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                       <Button onClick={handlePublicarNotaAdmin} disabled={isEnviando} className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 h-12 rounded-xl shadow-lg flex-1 active:scale-95">
                        {isEnviando ? "ENVIANDO..." : "PUBLICAR AHORA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-2xl">
                <NotesViewer key={refreshKey} readOnly={false} filterCategory="nutricion" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* --- PASO 3: MODAL DE ASIGNACIÓN (VENTANA EMERGENTE NARANJA) --- */}
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
              <SelectTrigger className="rounded-xl h-14 border-orange-200 font-bold focus:ring-orange-500">
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
                className="w-full bg-orange-600 hover:bg-black text-white font-black h-14 rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isAssigning ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />}
                CONFIRMAR ASIGNACIÓN
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}