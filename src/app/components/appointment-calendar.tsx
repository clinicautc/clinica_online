import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { format, parseISO } from 'date-fns';

type AppointmentCalendarProps = {
  userId?: string;
};

type TimeSlot = {
  time: string;
  available: boolean;
  appointmentInfo?: {
    service: string;
    patientName?: string;
  };
};

export function AppointmentCalendar({ userId }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);

  // --------------------------------------------------------------------------
  // CORRECCIÓN: CONEXIÓN REAL A LA BASE DE DATOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/citas');
        if (response.ok) {
          const data = await response.json();
          // Filtramos solo las citas activas ('programada' o 'asignada')
          const activeAppointments = data.filter((apt: any) => 
            apt.estado === 'programada' || apt.estado === 'asignada' || apt.status === 'programada'
          );
          setAppointments(activeAppointments);
        }
      } catch (error) {
        console.error("Error cargando citas para el calendario:", error);
      }
    };
    fetchAppointments();
  }, []);
  // --------------------------------------------------------------------------

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  // --------------------------------------------------------------------------
  // CORRECCIÓN: ADAPTACIÓN DE MAPEO A ESTRUCTURA POSTGRESQL
  // --------------------------------------------------------------------------
  const getAppointmentsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    return appointments.filter((apt) => {
      // Soportar tanto 'fecha' (Postgres crudo) como 'date' (Alias del frontend)
      const dbDate = apt.fecha ? apt.fecha.substring(0, 10) : apt.date;
      return dbDate === dateStr;
    });
  };

  const getTimeSlotsForSelectedDate = (): TimeSlot[] => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const dayAppointments = appointments.filter((apt) => {
      const dbDate = apt.fecha ? apt.fecha.substring(0, 10) : apt.date;
      return dbDate === dateStr;
    });

    return timeSlots.map((time) => {
      const appointment = dayAppointments.find((apt) => {
        // Extraemos solo "HH:mm" del formato de hora del backend
        let dbTime = apt.hora || apt.time || '';
        if (dbTime.length > 0 && dbTime.indexOf(':') === 1) {
          dbTime = '0' + dbTime; 
        }
        return dbTime.substring(0, 5) === time;
      });

      if (appointment) {
        return {
          time,
          available: false,
          appointmentInfo: {
            service: appointment.tipo || appointment.service, // Soportar ambos nombres
            patientName: appointment.paciente_nombre || appointment.patientName,
          },
        };
      }
      return {
        time,
        available: true,
      };
    });
  };
  // --------------------------------------------------------------------------

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const selectedDateSlots = getTimeSlotsForSelectedDate();
  const availableCount = selectedDateSlots.filter((slot) => slot.available).length;
  const occupiedCount = selectedDateSlots.filter((slot) => !slot.available).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendario */}
        <Card className="border-2 border-blue-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
                className="border-blue-200 text-blue-900 hover:bg-blue-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-blue-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                className="border-blue-200 text-blue-900 hover:bg-blue-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-blue-900 mb-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: startingDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                
                // 1. CALCULAMOS EL DÍA DE LA SEMANA (0 = Domingo, 6 = Sábado)
                const dayOfWeek = (startingDayOfWeek + i) % 7;
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                const dayAppointments = getAppointmentsForDate(day);
                // Si es fin de semana, ignoramos las citas para no mostrar puntos naranjas
                const hasAppointments = dayAppointments.length > 0 && !isWeekend;

                return (
                  <button
                    key={day}
                    onClick={() => !isWeekend && handleDayClick(day)} // Previene el clic
                    disabled={isWeekend} // Deshabilita el botón en HTML nativo
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                      transition-all duration-200 relative
                      
                      /* 2. ESTILOS PARA FIN DE SEMANA (Bloqueado) */
                      ${isWeekend ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border-2 border-gray-200' : ''}
                      
                      /* 3. ESTILOS NORMALES (Ocultos si es fin de semana) */
                      ${isSelected(day) && !isWeekend ? 'bg-blue-900 text-white shadow-lg scale-105' : ''}
                      ${isToday(day) && !isSelected(day) && !isWeekend ? 'bg-orange-100 border-2 border-orange-500 text-blue-900' : ''}
                      ${!isSelected(day) && !isToday(day) && !isWeekend ? 'bg-white border-2 border-blue-100 text-blue-900 hover:bg-blue-50 hover:border-blue-300' : ''}
                    `}
                  >
                    <span className="font-semibold">{day}</span>
                    {hasAppointments && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayAppointments.slice(0, 3).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${
                              isSelected(day) ? 'bg-orange-300' : 'bg-orange-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded" />
                <span className="text-gray-700">Día actual</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-white border-2 border-blue-100 rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-orange-500 rounded-full" />
                </div>
                <span className="text-gray-700">Tiene citas programadas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios del día seleccionado */}
        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="w-5 h-5 text-orange-500" />
              Horarios - {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
            </CardTitle>
            <div className="flex gap-4 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-700">Disponible: {availableCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-gray-700">Ocupado: {occupiedCount}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {selectedDateSlots.map((slot) => (
                <div
                  key={slot.time}
                  className={`
                    p-3 rounded-lg border-2 flex justify-between items-center
                    ${slot.available
                      ? 'bg-green-50 border-green-300'
                      : 'bg-orange-50 border-orange-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${slot.available ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <span className="font-semibold text-blue-900">{slot.time}</span>
                    {!slot.available && slot.appointmentInfo && (
                      <Badge variant="outline" className="capitalize border-orange-500 text-orange-700">
                        {slot.appointmentInfo.service}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={slot.available ? 'default' : 'secondary'} className={slot.available ? 'bg-green-600' : 'bg-orange-600'}>
                    {slot.available ? 'Disponible' : 'Ocupado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-900">Información</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Este calendario muestra la disponibilidad de horarios para citas. Los horarios marcados en naranja están ocupados, 
            mientras que los verdes están disponibles. Puedes agendar una nueva cita en la pestaña "Agendar Cita".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}