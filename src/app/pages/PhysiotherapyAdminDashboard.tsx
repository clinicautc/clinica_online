/**
 * ============================================================================
 * DASHBOARD DE DOCENTE/ADMINISTRADOR DE FISIOTERAPIA (Versión Paso 3)
 * Panel específico para el docente coordinador con sistema de asignación de practicantes.
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
  LogOut, Users, FileText, Calendar, Clock, Activity, BarChart3, 
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

interface Appointment {
  id: number;
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  practicante_id?: number | null; // Agregado para el flujo de asignación [cite: 5]
  practicante_nombre?: string | null;
}

export default function PhysiotherapyAdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS DE CITAS
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);

  // --- PASO 3: ESTADOS PARA EL MODAL DE ASIGNACIÓN ---
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el Modal
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null); // Estado para el Practicante Seleccionado
  const [practicantesArea, setPracticantesArea] = useState<any[]>([]); // Lista de Practicantes
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
              apt.tipo === 'fisioterapia' && 
              apt.estado === 'programada'
            );
          });
          setTodayAppointments(filtered);
        }
      } catch (error) {
        console.error("❌ Error Admin Fisio -> PostgreSQL:", error);
      } finally {
        setIsLoadingCitas(false);
      }
    };

    /**
     * CARGAR PRACTICANTES EN VIVO:
     * El Admin solo debe ver a los practicantes de su misma área (Fisioterapia).
     */
    const cargarPracticantesEnVivo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/usuarios');
        if (response.ok) {
          const data = await response.json();
          // Filtrado estricto por rol 'practicante' y área 'fisioterapia' [cite: 1, 9]
          const lista = data.filter((u: any) => 
            u.rol === 'practicante' && 
            u.area?.toLowerCase() === 'fisioterapia' &&
            (u.estado === 'activo' || u.status === 'activo')
          );
          setPracticantesArea(lista);
        }
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

  // --- FUNCIÓN PARA ABRIR EL MODAL DE ASIGNACIÓN ---
  const handleOpenAssignModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedPractitioner(null); // Reseteamos selección previa
    setIsModalOpen(true);
  };

  // --- FUNCIÓN PARA EJECUTAR LA ASIGNACIÓN EN DB ---
  // --- FUNCIÓN PARA EJECUTAR LA ASIGNACIÓN EN DB CORREGIDA ---
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
        
        // CORRECCIÓN 1: Cerrar el modal automáticamente
        setIsModalOpen(false); 
        
        // CORRECCIÓN 2: Limpiar los estados de selección para la siguiente vez
        setSelectedPractitioner(null);
        setSelectedAppointment(null);

        // CORRECCIÓN 3: Refrescar la lista de citas para que el Admin vea el cambio
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const res = await fetch(`http://localhost:3001/api/citas`);
        if (res.ok) {
          const all = await res.json();
          const filtered = all.filter((a: any) => {
            const cleanDate = a.fecha.split('T')[0];
            return cleanDate === todayStr && a.tipo === 'fisioterapia' && a.estado === 'programada';
          });
          setTodayAppointments(filtered);
        }
      } else {
        toast.error("El servidor no pudo procesar la asignación.");
      }
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

  const handleAccessForms = (appointment: Appointment) => {
    navigate(`/forms/fisioterapia/${appointment.id}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100" style={arialStyle}>
      <header className="bg-white border-b border-blue-900/10 shadow-sm">
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
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-blue-900">
                   {(user as any)?.nombre || user?.name || "Coordinador"}
                </p>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Coordinación de Área</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-100 text-red-600 hover:bg-red-50 font-bold">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
            <div key={apt.id} className="flex items-center justify-between p-5 border rounded-2xl bg-white hover:border-blue-300 transition-all shadow-sm">
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
              
              {/* LÓGICA DE ASIGNACIÓN Y RE-ASIGNACIÓN CORREGIDA */}
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
                  {/* 1. Busca tu DialogTrigger */}
                  <DialogTrigger asChild>
  {/* 2. Verifica que el hijo sea un Button de Shadcn o un <button> estándar */}
  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 h-12 rounded-xl">
    <UserPlus className="w-4 h-4 mr-2" /> 
    ASIGNAR PRACTICANTE
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

      {/* --- PASO 3: MODAL DE ASIGNACIÓN (VENTANA EMERGENTE) --- */}
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
            {/* BOTÓN DINÁMICO: Solo se activa si hay un usuario seleccionado */}
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
    </div>
  );
}