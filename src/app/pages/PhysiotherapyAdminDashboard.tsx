/**
 * ============================================================================
 * ARCHIVO: PhysiotherapyAdminDashboard.tsx
 * PROPÓSITO: Panel de Coordinación de Fisioterapia con Sistema de Notas y Asignación.
 * COLOR TEMÁTICO: Azul (#1e3a8a / blue-900)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
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
import { endpoints } from '../lib/api';

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
    practicante_id?: number | null;
    practicante_nombre?: string | null;
}

export default function PhysiotherapyAdminDashboard() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const arialStyle = { fontFamily: 'Arial, sans-serif' };

    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [isLoadingCitas, setIsLoadingCitas] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null);
    const [practicantesArea, setPracticantesArea] = useState<any[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

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
                const response = await fetch(endpoints.citas);

                if (response.ok) {
                    const allAppointments: Appointment[] = await response.json();
                    const filtered = allAppointments.filter((apt) => {
                        // CORRECCIÓN: Manejo robusto de fechas de PostgreSQL
                        const cleanAptDate = apt.fecha.includes('T') ? apt.fecha.split('T')[0] : apt.fecha;
                        return (
                            cleanAptDate === todayStr &&
                            apt.tipo === 'fisioterapia'
                        );
                    });
                    setTodayAppointments(filtered);
                }
            } catch (error) {
                console.error("❌ Error Admin Fisioterapia -> Citas:", error);
            } finally {
                setIsLoadingCitas(false);
            }
        };

        const cargarPracticantesEnVivo = async () => {
            try {
                const response = await fetch(endpoints.usuarios);
                if (response.ok) {
                    const data = await response.json();
                    const lista = data.filter((u: any) =>
                        u.rol === 'practicante' &&
                        u.area?.toLowerCase() === 'fisioterapia' &&
                        (u.estado === 'activo' || u.status === 'activo')
                    );
                    setPracticantesArea(lista);
                }
            } catch (error) {
                console.error("Error al cargar practicantes:", error);
            }
        };

        if (!user && !authLoading) {
            navigate('/login');
            return;
        }

        void fetchTodayAppointments();
        void cargarPracticantesEnVivo();

        const interval = setInterval(() => void cargarPracticantesEnVivo(), 30000);
        return () => clearInterval(interval);
    }, [user, authLoading, navigate, refreshKey]);

    const handleOpenAssignModal = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setSelectedPractitioner(null);
        setIsModalOpen(true);
    };

    const handleConfirmAssignment = async () => {
        if (!selectedPractitioner || !selectedAppointment) return;

        try {
            setIsAssigning(true);
            const response = await fetch(`${endpoints.citas}/${selectedAppointment.id}/asignar`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    practicante_id: selectedPractitioner.id,
                    practicante_nombre: selectedPractitioner.nombre
                })
            });

            if (response.ok) {
                toast.success(`Asignación exitosa: ${selectedPractitioner.nombre}`);
                setIsModalOpen(false);
                setRefreshKey(prev => prev + 1);
            } else {
                toast.error("Error en la asignación del servidor.");
            }
        } catch (error) {
            toast.error("Fallo de conexión.");
        } finally {
            setIsAssigning(false);
        }
    };

    const handlePublicarNotaAdmin = async () => {
        if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
            toast.error("Complete todos los campos.");
            return;
        }

        try {
            setIsEnviando(true);
            const response = await fetch(endpoints.notas, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: notaNueva.titulo.trim(),
                    contenido: notaNueva.contenido.trim(),
                    destino: 'fisioterapia',
                    creado_por: user?.id,
                    creado_por_nombre: `Coordinador: ${user?.nombre || "Fisioterapia"}`,
                    destinatario_especifico: notaNueva.emailDestinatario === 'ninguno' ? null : notaNueva.emailDestinatario
                })
            });

            if (response.ok) {
                toast.success("Comunicado publicado.");
                setNotaNueva({ titulo: '', contenido: '', emailDestinatario: 'ninguno' });
                setIsNotaModalOpen(false);
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            toast.error("Error al conectar con la API.");
        } finally {
            setIsEnviando(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-blue-50"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100" style={arialStyle}>
            <header className="bg-white border-b border-blue-900/10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-blue-950">Clínica UTC - Fisioterapia</h1>
                            <p className="text-sm text-blue-900/60 font-medium tracking-tight">Coordinación de Departamento</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-blue-950">{user?.nombre}</p>
                            <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase">Docente Titular</Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-100 text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4 mr-2" /> Salir
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <Tabs defaultValue="today_appointments" className="space-y-6">
                    <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200 p-1 h-auto flex-wrap gap-1 shadow-sm rounded-xl">
                        <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold"><Calendar className="w-4 h-4 mr-2" /> Agenda</TabsTrigger>
                        <TabsTrigger value="practitioners" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold"><Settings className="w-4 h-4 mr-2" /> Alumnos</TabsTrigger>
                        <TabsTrigger value="statistics" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold"><BarChart3 className="w-4 h-4 mr-2" /> Métricas</TabsTrigger>
                        <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold"><Users className="w-4 h-4 mr-2" /> Pacientes</TabsTrigger>
                        {/* CAMBIO CLAVE: Enviamos el filtro 'fisioterapia' para que el visor sepa qué tabla buscar */}
                        <TabsTrigger value="histories" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold"><FileText className="w-4 h-4 mr-2" /> Historiales</TabsTrigger>
                        <TabsTrigger value="notes" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-black"><FileEdit className="w-4 h-4 mr-2" /> Comunicados</TabsTrigger>
                    </TabsList>

                    <TabsContent value="today_appointments">
                        <Card className="border-blue-200 shadow-xl rounded-3xl overflow-hidden bg-white/95">
                            <CardHeader className="bg-blue-50/50 border-b p-6">
                                <CardTitle className="text-blue-950 font-extrabold uppercase text-sm tracking-widest">Citas del día ({format(new Date(), 'dd/MM/yyyy')})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {isLoadingCitas ? (
                                        <div className="flex flex-col items-center py-12 gap-3"><Loader2 className="animate-spin text-blue-900" /><p className="text-xs font-bold text-blue-900/40 uppercase">Sincronizando agenda...</p></div>
                                    ) : todayAppointments.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed rounded-3xl border-blue-100 italic text-slate-400">No hay citas registradas para hoy.</div>
                                    ) : (
                                        todayAppointments.map((apt) => (
                                            <div key={apt.id} className="flex items-center justify-between p-5 border rounded-2xl bg-white hover:border-blue-300 transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-full bg-blue-50 text-blue-600"><Activity className="w-5 h-5"/></div>
                                                    <div>
                                                        <p className="font-black text-blue-950 uppercase text-sm">{apt.paciente_nombre}</p>
                                                        <div className="flex gap-3 items-center mt-1">
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.hora.substring(0,5)} HRS</span>
                                                            <Badge className="text-[9px] bg-green-50 text-green-700 border-green-200 uppercase font-black">{apt.estado}</Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {apt.practicante_id && (
                                                        <div className="flex flex-col items-end mr-2">
                                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Responsable:</span>
                                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-100 flex items-center gap-2">
                                                                <UserCheck className="w-3 h-3" /> {apt.practicante_nombre || "Asignado"}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant={apt.practicante_id ? "outline" : "default"}
                                                        className={apt.practicante_id
                                                            ? "border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl px-4"
                                                            : "bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl px-5 shadow-lg"}
                                                        onClick={() => handleOpenAssignModal(apt)}
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-2" />
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
                        <Card className="border-blue-200 shadow-xl rounded-3xl overflow-hidden bg-white/95">
                            <CardHeader className="flex flex-row items-center justify-between border-b p-6">
                                <div><CardTitle className="text-blue-900 font-extrabold text-xl uppercase">Plantilla de Practicantes</CardTitle><CardDescription className="font-medium italic">Gestión de accesos de Fisioterapia</CardDescription></div>
                                <Button onClick={() => navigate('/administrar-practicantes')} className="bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg"><UserPlus className="w-4 h-4 mr-2" /> Dar de Alta</Button>
                            </CardHeader>
                            <CardContent className="p-6"><PractitionerManagement area="fisioterapia" /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="statistics"><StatisticsPanel area="fisioterapia" /></TabsContent>
                    <TabsContent value="patients"><PatientList /></TabsContent>

                    {/* CORRECCIÓN: Pasamos filterType="fisioterapia" para que busque en la tabla correcta */}
                    <TabsContent value="histories"><MedicalHistoryViewer filterType="fisioterapia" /></TabsContent>

                    <TabsContent value="notes">
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-3xl border border-blue-200 shadow-xl gap-6">
                                <div className="text-center md:text-left">
                                    <h3 className="text-2xl font-black text-blue-950 uppercase tracking-tighter">Comunicación Interna</h3>
                                    <p className="text-sm text-slate-500 font-medium">Difusión de avisos para el departamento de Fisioterapia.</p>
                                </div>
                                <Dialog open={isNotaModalOpen} onOpenChange={setIsNotaModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-900 hover:bg-black text-white font-black h-14 px-10 rounded-2xl shadow-2xl transition-all hover:-translate-y-1"><Send className="w-5 h-5 mr-3" /> NUEVA NOTA</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
                                        <DialogHeader>
                                            <DialogTitle className="text-blue-950 text-2xl font-black flex items-center gap-3"><FileEdit className="w-6 h-6 text-blue-600" /> EMITIR AVISO</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                            <div className="space-y-2"><Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Asunto</Label><Input className="rounded-xl h-12 border-slate-200 shadow-sm" placeholder="Título..." value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} /></div>
                                            <div className="space-y-2"><Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Contenido</Label><Textarea className="rounded-xl min-h-[130px] border-slate-200 resize-none shadow-sm" placeholder="Instrucciones..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} /></div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-600 font-black text-[11px] uppercase tracking-widest ml-1">Destinatario (Opcional)</Label>
                                                <Select value={notaNueva.emailDestinatario} onValueChange={(v) => setNotaNueva({...notaNueva, emailDestinatario: v})}>
                                                    <SelectTrigger className="rounded-xl h-12 border-blue-300 bg-blue-50/20 font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ninguno" className="font-black text-blue-900">--- TODOS ---</SelectItem>
                                                        {practicantesArea.map((p) => (<SelectItem key={p.email} value={p.email} className="font-medium italic">{p.nombre}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter className="gap-2">
                                            <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">CANCELAR</Button>
                                            <Button onClick={handlePublicarNotaAdmin} disabled={isEnviando} className="bg-blue-900 hover:bg-black text-white font-black px-8 h-12 rounded-xl shadow-lg flex-1 transition-all">{isEnviando ? "ENVIANDO..." : "PUBLICAR AHORA"}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-2xl"><NotesViewer key={refreshKey} readOnly={false} filterCategory="fisioterapia" /></div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8" style={arialStyle}>
                    <DialogHeader>
                        <DialogTitle className="text-blue-900 text-2xl font-black flex items-center gap-3"><UserPlus className="w-6 h-6 text-blue-600" /> Asignar Practicante</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500 italic">Paciente: {selectedAppointment?.paciente_nombre}</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1 text-center block">Seleccionar alumno disponible</Label>
                        <Select onValueChange={(val) => setSelectedPractitioner(practicantesArea.find(u => u.id.toString() === val))}>
                            <SelectTrigger className="rounded-xl h-14 border-blue-200 font-bold focus:ring-blue-500"><SelectValue placeholder="Buscar en la plantilla..." /></SelectTrigger>
                            <SelectContent>
                                {practicantesArea.length > 0 ? practicantesArea.map((p) => (<SelectItem key={p.id} value={p.id.toString()} className="font-medium italic uppercase">{p.nombre}</SelectItem>)) : <div className="p-4 text-center text-xs font-black text-slate-400 uppercase">No hay alumnos activos</div>}
                            </SelectContent>
                        </Select>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-2 shadow-inner"><p className="text-[10px] text-blue-800 font-bold leading-tight uppercase italic text-center">La asignación habilitará el acceso al expediente inmediatamente.</p></div>
                    </div>
                    <DialogFooter>
                        {selectedPractitioner && (
                            <Button onClick={handleConfirmAssignment} disabled={isAssigning} className="w-full bg-blue-900 hover:bg-black text-white font-black h-14 rounded-2xl shadow-2xl transition-all active:scale-95">
                                {isAssigning ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />} CONFIRMAR ASIGNACIÓN
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}