import React, { useState, useEffect } from 'react';
// UI: Shadcn para mantener la consistencia visual (Blue/Orange)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
// UTILS: Manejo de fechas profesional con date-fns
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale'; // Idioma español para el calendario
import { mockAppointments, availableTimeSlots } from '../lib/mockData';
import { toast } from 'sonner'; // Notificaciones tipo "toast"
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

/**
 * NOTA: Interface para tipar las props. 
 * Necesitamos el patientId para saber a quién pertenece la cita.
 */
interface AppointmentFormProps {
  patientId: string;
}

export default function AppointmentForm({ patientId }: AppointmentFormProps) {
  // --- 1. ESTADOS (REACTIVE DATA) ---
  // Guardamos el tipo de servicio, la fecha seleccionada y la hora.
  const [type, setType] = useState<'fisioterapia' | 'nutricion' | ''>('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  // Estado local para la lista de todas las citas (inicia con mocks)
  const [appointments, setAppointments] = useState(mockAppointments);

  /**
   * NOTA: EFECTO DE PERSISTENCIA (LocalStorage)
   * Al cargar el componente, verificamos si ya hay citas guardadas en el navegador.
   * Si no hay, inicializamos el LocalStorage con los datos de prueba (mocks).
   */
  useEffect(() => {
    const stored = localStorage.getItem('utc_appointments');
    if (stored) {
      setAppointments(JSON.parse(stored));
    } else {
      localStorage.setItem('utc_appointments', JSON.stringify(mockAppointments));
    }
  }, []);

  // --- 2. LÓGICA DE NEGOCIO (DISPONIBILIDAD) ---
  
  /**
   * NOTA: getOccupiedSlots
   * Esta función es la "policía" del tiempo. Recibe una fecha y filtra 
   * todas las citas existentes para ver qué horas ya están tomadas.
   */
  const getOccupiedSlots = (selectedDate: Date) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd'); // Formato estándar ISO
    return appointments
      .filter(apt => apt.date === dateStr && apt.status === 'programada')
      .map(apt => apt.time); // Ejemplo de retorno: ["09:00", "14:00"]
  };

  /**
   * NOTA: handleSubmit
   * Aquí ocurre la magia del guardado. Valida que todo esté lleno 
   * y que el horario no se haya ocupado mientras el usuario elegía.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !date || !time) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const occupiedSlots = getOccupiedSlots(date);
    
    // VALIDACIÓN DE ÚLTIMO MOMENTO
    if (occupiedSlots.includes(time)) {
      toast.error('Este horario ya está ocupado. Por favor elige otro.');
      return;
    }

    // CREACIÓN DEL OBJETO (Se usa Date.now() para generar un ID único temporal)
    const newAppointment = {
      id: `apt${Date.now()}`,
      patientId,
      patientName: 'Usuario Autenticado', 
      type,
      date: dateStr,
      time,
      status: 'programada' as const,
    };

    // ACTUALIZACIÓN DE ESTADO Y ALMACENAMIENTO
    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    localStorage.setItem('utc_appointments', JSON.stringify(updatedAppointments));

    toast.success('Cita agendada exitosamente');
    
    // RESET: Limpiamos el formulario para una nueva entrada
    setType('');
    setDate(undefined);
    setTime('');
  };

  /**
   * NOTA: isDateDisabled
   * Evita que los alumnos o pacientes agenden citas en el pasado.
   * startOfDay asegura que hoy sea seleccionable, pero ayer no.
   */
  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  // CÁLCULO DE HORAS OCUPADAS (Se recalcula cada vez que cambia 'date' o 'appointments')
  const occupiedSlots = date ? getOccupiedSlots(date) : [];

  return (
    <Card className="border-blue-900/10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-900 text-xl">Agendar Nueva Cita</CardTitle>
        <CardDescription>
          Completa el formulario para reservar tu espacio en la clínica UTC.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECCIÓN 1: TIPO DE SERVICIO */}
          <div className="space-y-2">
            <Label className="text-blue-900 font-semibold">Tipo de Servicio</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger className="border-blue-900/20 focus:ring-blue-900">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                <SelectItem value="nutricion">Nutrición</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SECCIÓN 2: CALENDARIO INTERACTIVO */}
          <div className="space-y-2">
            <Label className="text-blue-900 font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Selecciona una Fecha
            </Label>
            <div className="border border-blue-900/20 rounded-lg p-4 bg-white shadow-inner flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={isDateDisabled} // Bloquea el pasado
                locale={es} // Días y meses en español
                className="rounded-md"
              />
            </div>
          </div>

          {/* SECCIÓN 3: SELECTOR DE HORAS (GRID DINÁMICO) */}
          {/* NOTA: Solo se muestra si ya elegiste una fecha */}
          {date && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-blue-900 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Horario Disponible
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {availableTimeSlots.map((slot) => {
                  const isOccupied = occupiedSlots.includes(slot);
                  const isSelected = time === slot;
                  
                  return (
                    <Button
                      key={slot}
                      type="button"
                      // NOTA: Cambio de color según estado (Ocupado, Seleccionado, Disponible)
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        transition-all duration-200
                        ${isOccupied 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-50' 
                          : isSelected
                          ? 'bg-blue-900 text-white scale-105'
                          : 'border-blue-900/20 text-blue-900 hover:bg-blue-50'
                        }
                      `}
                      onClick={() => !isOccupied && setTime(slot)}
                      disabled={isOccupied}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOTÓN DE ACCIÓN FINAL */}
          <Button 
            type="submit" 
            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-6 text-lg font-bold shadow-md"
            // Se deshabilita si falta algún dato
            disabled={!type || !date || !time}
          >
            Confirmar Cita Universitaria
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}