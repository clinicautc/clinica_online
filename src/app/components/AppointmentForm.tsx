/**
 * ============================================================================
 * ARCHIVO: AppointmentForm.tsx
 * PROPÓSITO: Formulario híbrido para Agendar (POST) o Reagendar (PUT) citas.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { format, isBefore, startOfDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';

interface Appointment {
  id?: number;
  paciente_id: number;
  tipo: string; 
  fecha: string;
  hora: string;
  estado: string; 
}

interface AppointmentFormProps {
  patientId: string;
  existingAppointment?: Appointment; // Novedad: Si pasas esto, el form entra en "Modo Reagendar"
}

export default function AppointmentForm({ patientId, existingAppointment }: AppointmentFormProps) {
  const { user } = useAuth();
  const currentUser = user as any;
  const isAdmin = currentUser?.rol === 'admin';
  const isRescheduling = !!existingAppointment; // Bandera booleana
  
  // ESTADO NUEVO: Almacena exclusivamente las horas bloqueadas por la base de datos
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  
  // Si estamos reagendando, inicializamos los estados con los datos de la cita existente
  const [type, setType] = useState<'fisioterapia' | 'nutricion' | ''>(
    (existingAppointment?.tipo as 'fisioterapia' | 'nutricion') || ''
  );
  
  const [date, setDate] = useState<Date | undefined>(
    existingAppointment?.fecha ? parseISO(existingAppointment.fecha) : undefined
  );
  
  const [time, setTime] = useState(
    existingAppointment?.hora ? existingAppointment.hora.substring(0, 5) : ''
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAdmin && currentUser?.area && !isRescheduling) {
      const areaAsignada = currentUser.area.toLowerCase();
      if (areaAsignada === 'fisioterapia' || areaAsignada === 'nutricion') {
        setType(areaAsignada as 'fisioterapia' | 'nutricion');
      }
    }
  }, [currentUser, isAdmin, isRescheduling]);

  const generateAvailableSlots = () => {
    const slots = [];
    for (let hour = 0; hour <= 16; hour++) {
      const hh = hour.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
      slots.push(`${hh}:30`);
    }
    slots.push("17:00");
    return slots;
  };

  const availableTimeSlots = generateAvailableSlots();

  // EFECTO PRINCIPAL: CONSULTA LA BASE DE DATOS CADA VEZ QUE CAMBIA FECHA O ÁREA
  useEffect(() => {
    if (date && type) {
      const fetchDisponibilidad = async () => {
        try {
          const dateStr = format(date, 'yyyy-MM-dd');
          const response = await fetch(`http://localhost:3001/api/citas/disponibilidad?fecha=${dateStr}&tipo=${type}`);
          
          if (response.ok) {
            const ocupadasDesdeDB = await response.json(); // Array de strings: ['08:00', '09:30']
            
            // Si estamos reagendando, DEBEMOS excluir la hora original de la cita 
            // de la lista de ocupadas, solo si estamos consultando el mismo día original.
            if (isRescheduling && existingAppointment && existingAppointment.fecha.substring(0, 10) === dateStr) {
              const horaOriginalCorta = existingAppointment.hora.substring(0, 5);
              const filtradas = ocupadasDesdeDB.filter((h: string) => h.substring(0, 5) !== horaOriginalCorta);
              
              // Map para asegurar formato '08:00'
              setHorasOcupadas(filtradas.map((h: string) => h.substring(0, 5)));
            } else {
              setHorasOcupadas(ocupadasDesdeDB.map((h: string) => h.substring(0, 5)));
            }
          }
        } catch (error) {
          console.error("Error al consultar disponibilidad:", error);
        }
      };

      fetchDisponibilidad();
    } else {
      setHorasOcupadas([]);
    }
  }, [date, type, isRescheduling, existingAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !date || !time) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (isToday(date)) {
      toast.error("Las citas deben agendarse con un mínimo de 24 horas de anticipación.");
      return;
    }

    // Validación doble (aunque el botón esté bloqueado, por si lo hackean)
    if (horasOcupadas.includes(time)) {
      toast.error(`El horario de las ${time} ya está ocupado en el área de ${type}. Por favor selecciona otro.`);
      return;
    }

    setIsSaving(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const patientName = currentUser?.nombre || "Paciente UTC";

    try {
      // ---------------------------------------------------------
      // MAGIA HÍBRIDA: Decide dinámicamente si es POST o PUT
      // ---------------------------------------------------------
      const endpoint = isRescheduling 
        ? `http://localhost:3001/api/citas/${existingAppointment?.id}` 
        : 'http://localhost:3001/api/citas';
        
      const method = isRescheduling ? 'PUT' : 'POST';
      
      const payload = isRescheduling 
        ? { fecha: dateStr, hora: time, tipo: type, estado: 'programada' } // Añadimos tipo al PUT
        : { paciente_id: Number(patientId), paciente_nombre: patientName, tipo: type, fecha: dateStr, hora: time, estado: 'programada' };

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          email: user?.email || '' // Usado por tus middlewares backend
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Manejo del error HTTP 409 (Conflicto de Horario por concurrencia)
      if (response.status === 409) {
        toast.error(result.error);
        setIsSaving(false);
        // Recargar la disponibilidad para que se bloquee el botón
        setHorasOcupadas(prev => [...prev, time]);
        setTime('');
        return;
      }

      if (response.ok) {
        toast.success(isRescheduling ? '¡Cita reagendada exitosamente!' : '¡Cita agendada exitosamente!');
        
        // Auto-Refresh
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } else {
        throw new Error(result.error || 'Error al guardar la cita');
      }
    } catch (err: any) {
      toast.error(err.message);
      setIsSaving(false); 
    } 
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const isSelectedDateToday = date ? isToday(date) : false;

  return (
    <Card className="border-blue-900/10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-900 text-xl">
          {isRescheduling ? 'Reagendar Cita' : 'Agendar Nueva Cita'}
        </CardTitle>
        <CardDescription>
          {isRescheduling 
            ? 'Selecciona la nueva fecha y hora para esta cita.' 
            : 'Tu cita se guardará directamente en el sistema de la Clínica UTC.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label className="text-blue-900 font-semibold">Tipo de Servicio</Label>
            {/* Si estamos reagendando, NO se puede cambiar el área */}
            <Select 
              value={type} 
              onValueChange={(value: any) => { setType(value); setTime(''); }} 
              disabled={isSaving || isAdmin || isRescheduling}
            >
              <SelectTrigger className={`border-blue-900/20 ${(isAdmin || isRescheduling) ? 'bg-gray-100 cursor-not-allowed opacity-80' : ''}`}>
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                <SelectItem value="nutricion">Nutrición</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-blue-900 font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Selecciona una Fecha
            </Label>
            <div className="border border-blue-900/20 rounded-lg p-4 bg-white flex justify-center">
              <Calendar
  mode="single"
  selected={date}
  onSelect={(newDate) => { setDate(newDate); setTime(''); }}
  // 👇 MODIFICA ESTA LÍNEA 👇
  disabled={(date) => {
    const esFinDeSemana = date.getDay() === 0 || date.getDay() === 6;
    const esDiaDeshabilitado = typeof isDateDisabled === 'function' ? isDateDisabled(date) : isDateDisabled;
    
    return esFinDeSemana || esDiaDeshabilitado || isSaving;
  }}
  // 👆 ==================== 👆
  locale={es}
  className="rounded-md"
/>
            </div>
            {isSelectedDateToday && (
              <p className="text-xs text-red-500 font-bold text-center mt-2">
                No puedes agendar citas para el mismo día. Selecciona una fecha futura.
              </p>
            )}
          </div>

          {date && type && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-blue-900 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Horario Disponible (00:00 - 17:00)
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md shadow-inner bg-slate-50">
                {availableTimeSlots.map((slot) => {
                  const isBlockedByTime = isSelectedDateToday;
                  const isOccupied = horasOcupadas.includes(slot) || isBlockedByTime;
                  const isSelected = time === slot;
                  
                  return (
                    <Button
                      key={slot}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        text-xs transition-all duration-200
                        ${isOccupied 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 border-dashed border-gray-300 hover:bg-gray-200' 
                          : isSelected
                          ? 'bg-blue-900 text-white shadow-md scale-105'
                          : 'border-blue-900/20 text-blue-900 hover:bg-blue-50'
                        }
                      `}
                      onClick={() => !isOccupied && setTime(slot)}
                      disabled={isOccupied || isSaving}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className={`w-full text-white py-6 text-lg font-bold shadow-md transition-all ${isRescheduling ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800'}`}
            disabled={!type || !date || !time || isSaving || isSelectedDateToday}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Validando disponibilidad...</span>
              </div>
            ) : (
              isRescheduling ? 'Confirmar Reagendamiento' : 'Confirmar Cita Universitaria'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}