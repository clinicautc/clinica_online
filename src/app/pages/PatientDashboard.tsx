import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { 
  Calendar, Clock, LogOut, Loader2,
  Utensils, Activity, ClipboardList, PlusCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { endpoints } from '../lib/api';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  paciente_id: number;
  tipo: string;
  fecha: string;
  hora: string;
  estado: string;
  practicante_nombre?: string | null;
}

export default function PatientDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estados de Citas
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [errorCitas, setErrorCitas] = useState(false);
  
  // Estados para agendar
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [serviceType, setServiceType] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);

  // Estados para Planes Médicos
  const [activePlanTab, setActivePlanTab] = useState<'nutricion' | 'fisioterapia'>('nutricion');

  // Generador de horarios (00:00 a 17:00)
  const timeSlots: string[] = [];
  for (let i = 0; i <= 17; i++) {
    const hour = i.toString().padStart(2, '0');
    timeSlots.push(`${hour}:00`);
    if (i !== 17) timeSlots.push(`${hour}:30`);
  }

  // Carga de datos inicial
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
      return;
    }
    if (user) fetchAppointments();
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    try {
      setLoadingCitas(true);
      setErrorCitas(false);
      const res = await fetch(endpoints.citas);
      if (res.ok) {
        const data: Appointment[] = await res.json();
        setAppointments(data.filter(a => String(a.paciente_id) === String(user?.id)));
      } else {
        setErrorCitas(true);
      }
    } catch (err) {
      setErrorCitas(true);
    } finally {
      setLoadingCitas(false);
    }
  };

  // Validación: Deshabilitar horas pasadas si el día seleccionado es HOY
  const isTimeDisabled = (time: string) => {
    if (!selectedDate) return true;
    const now = new Date();
    
    // Verificamos si la fecha seleccionada es hoy
    const isToday = selectedDate.getDate() === now.getDate() &&
                    selectedDate.getMonth() === now.getMonth() &&
                    selectedDate.getFullYear() === now.getFullYear();
    
    if (!isToday) return false;

    // Si es hoy, comparamos las horas
    const [hours, minutes] = time.split(':').map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    if (hours < currentHours) return true;
    if (hours === currentHours && minutes <= currentMinutes) return true;
    return false;
  };

  const handleBookAppointment = async () => {
    if (!serviceType || !selectedDate || !selectedTime) {
      toast.error("Por favor selecciona servicio, fecha y horario.");
      return;
    }

    try {
      setIsBooking(true);
      const response = await fetch(endpoints.citas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: user?.id,
          paciente_nombre: user?.nombre,
          tipo: serviceType,
          fecha: format(selectedDate, 'yyyy-MM-dd'),
          hora: `${selectedTime}:00`,
          estado: 'programada'
        })
      });

      if (response.ok) {
        toast.success("¡Cita agendada con éxito!");
        fetchAppointments();
        setSelectedTime(""); // Limpiamos la hora tras agendar
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsBooking(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-blue-900/10 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-black">UTC</div>
            <div>
              <h1 className="text-lg font-bold text-blue-900 leading-tight">Clínica Universitaria</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Fisioterapia y Nutrición</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">{user?.nombre}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">PACIENTE</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }} className="rounded-xl border-slate-200">
              <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-blue-950">¡Hola, {user?.nombre?.split(' ')[0]}!</h2>
          <p className="text-slate-500 font-medium">Gestiona tus citas y consulta tus planes de tratamiento de forma sencilla.</p>
        </div>

        <Tabs defaultValue="agendar" className="space-y-6">
          <TabsList className="bg-white border border-blue-100 p-1 h-14 rounded-2xl shadow-sm w-full grid grid-cols-3">
            <TabsTrigger value="agendar" className="rounded-xl font-bold data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <PlusCircle className="w-4 h-4 mr-2" /> Agendar Cita
            </TabsTrigger>
            <TabsTrigger value="mis-citas" className="rounded-xl font-bold data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" /> Mis Citas
            </TabsTrigger>
            <TabsTrigger value="planes" className="rounded-xl font-bold data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4 mr-2" /> Planes Médicos
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AGENDAR */}
          <TabsContent value="agendar">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-8">
                
                {/* Contenedor Superior: Servicio y Calendario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest">Tipo de Servicio</label>
                    <Select onValueChange={setServiceType}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nutricion">Nutrición</SelectItem>
                        <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Selecciona una Fecha
                    </label>
                    <div className="flex justify-center p-2 border rounded-2xl border-slate-100 bg-slate-50/30">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md"
                        locale={es}
                        // 🔥 VALIDACIÓN: Deshabilita días anteriores a hoy
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </div>
                  </div>
                </div>

                {/* Contenedor Inferior: Selector de Horas */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Horario Disponible (00:00 - 17:00)
                  </label>
                  
                  <div className="border border-slate-200 rounded-xl p-3 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-2">
                      {timeSlots.map((time) => {
                        const disabled = isTimeDisabled(time);
                        const isSelected = selectedTime === time;
                        return (
                          <Button
                            key={time}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            disabled={disabled}
                            onClick={() => setSelectedTime(time)}
                            className={`h-10 text-sm font-bold rounded-lg transition-all ${
                              isSelected 
                                ? 'bg-blue-900 text-white shadow-md' 
                                : disabled 
                                  ? 'opacity-30 bg-slate-50 cursor-not-allowed' 
                                  : 'text-blue-900 border-blue-100 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleBookAppointment} 
                  disabled={isBooking || !selectedTime || !selectedDate || !serviceType}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-800 text-white font-black rounded-2xl text-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all"
                >
                  {isBooking ? <Loader2 className="animate-spin" /> : "Confirmar Cita Universitaria"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MIS CITAS */}
          <TabsContent value="mis-citas">
            {errorCitas ? (
              <div className="bg-red-50 border border-red-100 p-12 rounded-[2.5rem] flex flex-col items-center text-center gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h3 className="text-xl font-black text-red-900">No se pudieron cargar tus citas.</h3>
                <Button onClick={fetchAppointments} variant="link" className="text-red-600 underline">Reintentar conexión</Button>
              </div>
            ) : loadingCitas ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>
            ) : appointments.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold italic">No tienes citas programadas.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map(cita => (
                  <Card key={cita.id} className="rounded-2xl border-slate-100 shadow-md group hover:shadow-xl transition-all overflow-hidden">
                    <div className={`h-2 w-full ${cita.tipo === 'fisioterapia' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge className={`${cita.tipo === 'fisioterapia' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'} hover:bg-transparent border-none uppercase font-black text-[10px]`}>
                          {cita.tipo}
                        </Badge>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-black text-[9px]">
                          {cita.estado}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-black text-slate-800 mt-2">
                        Consulta de {cita.tipo.charAt(0).toUpperCase() + cita.tipo.slice(1)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold capitalize">
                            {cita.fecha.includes('T') ? format(new Date(cita.fecha), "EEEE, dd 'de' MMMM", { locale: es }) : cita.fecha}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold">{cita.hora.substring(0, 5)} HRS</span>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Especialista Asignado</p>
                          <p className="text-sm font-bold text-slate-700">
                            {cita.practicante_nombre ? cita.practicante_nombre : 'Pendiente de asignación'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: PLANES MÉDICOS (SUB-PESTAÑAS RESTAURADAS) */}
          <TabsContent value="planes">
            <Card className="rounded-3xl border-slate-100 shadow-xl p-8 bg-white">
              <div className="mb-8">
                <CardTitle className="text-xl font-black text-blue-950 mb-1">Mis Planes de Tratamiento</CardTitle>
                <CardDescription className="font-bold text-slate-500">Consulta tus planes de alimentación y ejercicios</CardDescription>
              </div>

              {/* Botones de sub-navegación tipo píldora */}
              <div className="flex gap-3 mb-16">
                <Button 
                  variant={activePlanTab === 'nutricion' ? 'default' : 'outline'}
                  onClick={() => setActivePlanTab('nutricion')}
                  className={`rounded-full px-6 font-bold transition-all ${
                    activePlanTab === 'nutricion' 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Utensils className="w-4 h-4 mr-2" /> Nutrición
                </Button>

                <Button 
                  variant={activePlanTab === 'fisioterapia' ? 'default' : 'outline'}
                  onClick={() => setActivePlanTab('fisioterapia')}
                  className={`rounded-full px-6 font-bold transition-all ${
                    activePlanTab === 'fisioterapia' 
                      ? 'bg-blue-900 hover:bg-blue-950 text-white shadow-md' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-4 h-4 mr-2" /> Fisioterapia
                </Button>
              </div>
              
              {/* Contenido Dinámico de la Sub-pestaña */}
              <div className="flex flex-col items-center justify-center py-10 min-h-[250px]">
                {activePlanTab === 'nutricion' ? (
                  <>
                    <Utensils className="w-20 h-20 mb-6 text-orange-400/50" />
                    <p className="font-medium text-slate-400 text-lg">No tienes planes de alimentación asignados</p>
                  </>
                ) : (
                  <>
                    <Activity className="w-20 h-20 mb-6 text-blue-400/50" />
                    <p className="font-medium text-slate-400 text-lg">No tienes planes de fisioterapia asignados</p>
                  </>
                )}
              </div>

            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}