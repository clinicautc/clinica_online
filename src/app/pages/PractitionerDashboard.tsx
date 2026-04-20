import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Users, FileText, Calendar, Clock, Utensils, Activity, Loader2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { endpoints } from '../lib/api';
import { toast } from 'sonner';

import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';

interface Appointment {
  id: number;
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;
  practicante_id?: number | null; 
  paciente_id?: number;
}

export default function PractitionerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);

  // LÓGICA DINÁMICA DE ESTILOS
  const isNutri = user?.area?.toLowerCase() === 'nutricion';
  const AreaIcon = isNutri ? Utensils : Activity;
  const accentColor = isNutri ? 'orange-600' : 'blue-900';
  const accentHover = isNutri ? 'hover:bg-orange-700' : 'hover:bg-blue-950';

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(endpoints.citas);
        
        if (response.ok) {
          const allAppointments: Appointment[] = await response.json();
          const filtered = allAppointments.filter((apt) => {
            const cleanAptDate = apt.fecha.split('T')[0];
            return (
              cleanAptDate === todayStr && 
              apt.tipo?.toLowerCase() === user?.area?.toLowerCase() && 
              (apt.estado === 'programada' || apt.estado === 'asignada' || apt.estado === 'pendiente')
              // 🔥 ¡RESTRICCIÓN ELIMINADA! Ahora ven todas las citas de su área
            );
          });
          setTodayAppointments(filtered);
        }
      } catch (error) {
        toast.error("Error al sincronizar la agenda");
      } finally {
        setIsLoadingCitas(false);
      }
    };

    if (user?.id) fetchTodayAppointments();
  }, [user]);

  const handleAccessForms = (appointment: Appointment) => {
    const areaRuta = user?.area?.toLowerCase() || 'fisioterapia';
    navigate(`/forms/${areaRuta}/${appointment.id}?pacienteId=${appointment.paciente_id}`);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fdf6e9]"><Loader2 className={`h-10 w-10 animate-spin text-${accentColor}`} /></div>;

  return (
    <div className="min-h-screen bg-[#fdf6e9] font-sans pb-20 transition-colors duration-500">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-${isNutri ? '[#ea580c]' : 'blue-900'} rounded-full flex items-center justify-center shadow-md relative`}>
              <AreaIcon className="w-6 h-6 text-white" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Clínica UTC - {isNutri ? 'Nutrición' : 'Fisioterapia'}</h1>
              <p className="text-xs text-gray-500 font-medium italic">Practicante: {user?.nombre || "Usuario"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }} className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-5">
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h2 className={`text-3xl font-extrabold text-${isNutri ? '[#8b4513]' : 'blue-950'} mb-2`}>Panel de {isNutri ? 'Nutrición' : 'Fisioterapia'}</h2>
          <p className="text-gray-500 font-medium">Gestión de consultas y expedientes clínicos en tiempo real.</p>
        </div>

        <Tabs defaultValue="today" className="space-y-10">
          <TabsList className="bg-white border border-gray-100 p-1 h-auto flex-wrap gap-1 shadow-sm rounded-full inline-flex">
            <TabsTrigger value="today" className={`rounded-full px-6 py-2.5 font-bold data-[state=active]:bg-${accentColor} data-[state=active]:text-white`}>
              <Calendar className="w-4 h-4 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className={`rounded-full px-6 py-2.5 font-bold data-[state=active]:bg-${accentColor} data-[state=active]:text-white`}>
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="histories" className={`rounded-full px-6 py-2.5 font-bold data-[state=active]:bg-${accentColor} data-[state=active]:text-white`}>
              <FileText className="w-4 h-4 mr-2" /> Historiales
            </TabsTrigger>
            <TabsTrigger value="notes" className={`rounded-full px-6 py-2.5 font-bold data-[state=active]:bg-${accentColor} data-[state=active]:text-white`}>
              <MessageSquare className="w-4 h-4 mr-2" /> Notas del Docente
            </TabsTrigger>
          </TabsList>

          {/* CITAS DE HOY */}
          <TabsContent value="today">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="border-b border-gray-50 p-8">
                <CardTitle className="text-gray-800 flex items-center gap-3 font-bold">
                  <Clock className={`w-6 h-6 text-${isNutri ? 'orange-500' : 'blue-600'}`} />
                  Agenda Sincronizada - Hoy ({format(new Date(), 'dd/MM/yyyy')})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {isLoadingCitas ? (
                  <div className="py-20 flex flex-col items-center gap-3 text-gray-400 font-bold"><Loader2 className="animate-spin" /> Sincronizando...</div>
                ) : todayAppointments.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-400 italic font-medium">No se encontraron citas para hoy.</div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments.map((apt) => (
                      <div key={apt.id} className={`flex items-center justify-between p-6 border border-gray-100 rounded-[1.5rem] bg-white shadow-sm hover:shadow-md transition-all border-l-8 border-l-${isNutri ? 'orange-500' : 'blue-600'}`}>
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-full bg-${isNutri ? 'orange-50' : 'blue-50'} text-${isNutri ? 'orange-500' : 'blue-600'}`}>
                            <AreaIcon className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-black text-gray-800 text-xl">{apt.paciente_nombre}</p>
                            <div className="flex gap-4 mt-1">
                              <span className="text-sm font-bold text-gray-400 flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-400" /> {apt.hora.substring(0, 5)} hrs</span>
                              <span className="text-[10px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-green-100">{apt.estado}</span>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => handleAccessForms(apt)} className={`bg-${isNutri ? 'orange-600' : 'blue-900'} ${accentHover} text-white font-black px-8 h-14 rounded-2xl shadow-lg transition-transform active:scale-95`}>
                          <FileText className="w-5 h-5 mr-2" /> Ver Evaluación
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients"><div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-50"><PatientList /></div></TabsContent>
          <TabsContent value="histories"><div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-50"><MedicalHistoryViewer filterType={user?.area?.toLowerCase() as any} /></div></TabsContent>
          
          {/* 🔥 NOTAS DEL DOCENTE (Se le pasó el control total a NotesViewer) */}
          <TabsContent value="notes">
            <NotesViewer readOnly filterCategory={user?.area?.toLowerCase() as any} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}