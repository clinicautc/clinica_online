/**
 * ============================================================================
 * ARCHIVO: AppointmentForm.tsx (Versión Sincronizada con PostgreSQL)
 * PROPÓSITO: Formulario con conexión real al Backend para guardar en DB.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Importamos para obtener el nombre
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';

interface AppointmentFormProps {
  patientId: string;
}

interface Appointment {
  id?: number;
  paciente_id: number;
  tipo: string; // Sincronizado con columna 'tipo'
  fecha: string;
  hora: string;
  estado: string; // Sincronizado con columna 'estado'
}

export default function AppointmentForm({ patientId }: AppointmentFormProps) {
  const { user } = useAuth(); // Extraemos el usuario actual
  
  const [type, setType] = useState<'fisioterapia' | 'nutricion' | ''>('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/citas');
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error("Error cargando citas ocupadas:", error);
      }
    };
    fetchAppointments();
  }, []);

  const getOccupiedSlots = (selectedDate: Date) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return appointments
      .filter(apt => apt.fecha === dateStr && apt.estado === 'programada')
      .map(apt => apt.hora.substring(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !date || !time) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSaving(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Obtenemos el nombre del paciente desde el contexto de autenticación
    const patientName = (user as any)?.nombre || "Paciente UTC";

    try {
      /**
       * CORRECCIÓN DE COLUMNAS:
       * paciente_nombre: Obligatorio según tu script SQL.
       * tipo: Nombre real en la tabla citas.
       * estado: Nombre real en la tabla citas.
       */
const response = await fetch('http://localhost:3001/api/citas',{
    method: 'POST',
    headers: {'Content-Type': 'application/json',
      email: user?.email || ''},
      body: JSON.stringify({
      paciente_id: Number(patientId),
      paciente_nombre: patientName,
      tipo: type,
      fecha: dateStr,
      hora: time,
      estado: 'programada' }) 
    });

      const result = await response.json();

      if (response.ok) {
        toast.success('¡Cita agendada exitosamente en el sistema!');
        setAppointments([...appointments, result]);
        
        setType('');
        setDate(undefined);
        setTime('');
      } else {
        throw new Error(result.error || 'Error al guardar la cita');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const occupiedSlots = date ? getOccupiedSlots(date) : [];

  return (
    <Card className="border-blue-900/10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-900 text-xl">Agendar Nueva Cita</CardTitle>
        <CardDescription>
          Tu cita se guardará directamente en el sistema de la Clínica UTC.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label className="text-blue-900 font-semibold">Tipo de Servicio</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)} disabled={isSaving}>
              <SelectTrigger className="border-blue-900/20">
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
                onSelect={setDate}
                disabled={isDateDisabled || isSaving}
                locale={es}
                className="rounded-md"
              />
            </div>
          </div>

          {date && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-blue-900 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Horario Disponible (00:00 - 17:00)
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md shadow-inner bg-slate-50">
                {availableTimeSlots.map((slot) => {
                  const isOccupied = occupiedSlots.includes(slot);
                  const isSelected = time === slot;
                  
                  return (
                    <Button
                      key={slot}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        text-xs transition-all duration-200
                        ${isOccupied 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                          : isSelected
                          ? 'bg-blue-900 text-white'
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
            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-6 text-lg font-bold shadow-md"
            disabled={!type || !date || !time || isSaving}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Guardando en Servidor...</span>
              </div>
            ) : (
              'Confirmar Cita Universitaria'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}