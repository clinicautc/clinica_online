/**
 * ============================================================================
 * ARCHIVO: AppointmentForm.tsx
 * PROPÓSITO: Formulario híbrido para Agendar (POST) o Reagendar (PUT) citas.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDayRender, type DayProps } from 'react-day-picker';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tooltip } from './ui/tooltip';
import { format, isBefore, isAfter, startOfDay, addDays, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '../lib/toast';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { apiFetch, citasAPI, horariosAtencionAPI, HorarioAtencionDia } from '../lib/api';

// Límite de anticipación para agendar — debe mantenerse en sync con
// DIAS_MAXIMOS_ANTICIPACION en utc-api/controllers/citasController.js
const DIAS_MAXIMOS_ANTICIPACION = 90;

// JS: 0=domingo…6=sábado. ISO (igual que horarios_atencion): 1=lunes…7=domingo.
const isoDow = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

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
  existingAppointment?: Appointment;
  onSuccess?: () => void;
}

export default function AppointmentForm({ patientId, existingAppointment, onSuccess }: AppointmentFormProps) {
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
  const [diasCompletos, setDiasCompletos] = useState<string[]>([]);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const [showLimiteFechaModal, setShowLimiteFechaModal] = useState(false);

  // Horario de atención configurado por el master para el área elegida —
  // reemplaza el bloqueo fijo de fin de semana y el rango fijo 8:00-24:00.
  const [reglasHorario, setReglasHorario] = useState<Record<number, HorarioAtencionDia>>({});
  const [diasCerrados, setDiasCerrados] = useState<Set<string>>(new Set());

  const fechaMaxima = startOfDay(addDays(new Date(), DIAS_MAXIMOS_ANTICIPACION));

  useEffect(() => {
    if (isAdmin && currentUser?.area && !isRescheduling) {
      const areaAsignada = currentUser.area.toLowerCase();
      if (areaAsignada === 'fisioterapia' || areaAsignada === 'nutricion') {
        setType(areaAsignada as 'fisioterapia' | 'nutricion');
      }
    }
  }, [currentUser, isAdmin, isRescheduling]);

  // Trae el horario de atención (por día de la semana) y los días cerrados
  // configurados por el master para el área elegida. Sondeo cada 30s (mismo
  // patrón que los dashboards de admin/practicante) para que un cambio de
  // horario hecho por el master mientras el paciente tiene este formulario
  // abierto se refleje sin recargar la página — la hora/día que acaba de
  // cerrarse debe dejar de ofrecerse de inmediato.
  useEffect(() => {
    if (!type) {
      setReglasHorario({});
      setDiasCerrados(new Set());
      return;
    }

    const fetchHorario = () => {
      horariosAtencionAPI.getHorarios(type)
        .then(dias => {
          const porDia: Record<number, HorarioAtencionDia> = {};
          dias.forEach(d => { porDia[d.dia_semana] = d; });
          setReglasHorario(porDia);
        })
        .catch(() => setReglasHorario({}));

      horariosAtencionAPI.getCierres(type)
        .then(cierres => setDiasCerrados(new Set(cierres.map(c => c.fecha.substring(0, 10)))))
        .catch(() => setDiasCerrados(new Set()));
    };

    fetchHorario();
    const interval = setInterval(fetchHorario, 30_000);
    return () => clearInterval(interval);
  }, [type]);

  const generateAvailableSlots = (forDate: Date | undefined) => {
    if (!forDate) return [];
    const regla = reglasHorario[isoDow(forDate)];
    if (!regla || !regla.activo) return [];

    const [hIni] = regla.hora_inicio.split(':').map(Number);
    const [hFin] = regla.hora_fin.split(':').map(Number);

    // hora_fin es un límite exclusivo (la clínica atiende HASTA esa hora,
    // sin incluirla) — con <= se ofrecía "24:00" como horario seleccionable
    // cuando el área cierra a medianoche, una hora de cita que no existe.
    const slots = [];
    for (let hour = hIni; hour < hFin; hour++) {
      const hh = hour.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
    }
    return slots;
  };

  const availableTimeSlots = generateAvailableSlots(date);

  // Carga los días completamente ocupados del mes visible
  useEffect(() => {
    if (!type) {
      setDiasCompletos([]);
      return;
    }
    const mes = format(visibleMonth, 'yyyy-MM');
    citasAPI.getDiasCompletos(mes, type)
      .then(setDiasCompletos)
      .catch(() => setDiasCompletos([]));
  }, [type, visibleMonth]);

  // EFECTO PRINCIPAL: CONSULTA LA BASE DE DATOS CADA VEZ QUE CAMBIA FECHA O ÁREA
  useEffect(() => {
    if (date && type) {
      const fetchDisponibilidad = async () => {
        try {
          const dateStr = format(date, 'yyyy-MM-dd');
          const ocupadasDesdeDB = await citasAPI.getDisponibilidad(dateStr, type);

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
        } catch (error) {
          console.error("Error al consultar disponibilidad:", error);
        }
      };

      fetchDisponibilidad();
    } else {
      setHorasOcupadas([]);
    }
  }, [date, type, isRescheduling, existingAppointment?.id, existingAppointment?.fecha]);

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

    if (isAfter(date, fechaMaxima)) {
      setShowLimiteFechaModal(true);
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
        ? `/citas/${existingAppointment?.id}`
        : '/citas';

      const method = isRescheduling ? 'PUT' : 'POST';

      const payload = isRescheduling
        ? { fecha: dateStr, hora: time, tipo: type, estado: 'programada' } // Añadimos tipo al PUT
        : { paciente_id: Number(patientId), paciente_nombre: patientName, tipo: type, fecha: dateStr, hora: time, estado: 'programada' };

      const response = await apiFetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
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
        if (isRescheduling) {
          toast.success('¡Cita reagendada exitosamente!');
        } else if (result.estado === 'pendiente_reprogramacion') {
          toast.warning('Tu cita fue registrada, pero no hay practicantes disponibles en ese horario. Te contactaremos para reprogramar.');
        } else if (result.asignado) {
          const quienAtiende = result.esFallbackDocente
            ? `Docente a cargo: ${result.asignado.nombre}`
            : `Practicante asignado: ${result.asignado.nombre}`;
          toast.success(`¡Cita agendada! ${quienAtiende}`);
        } else {
          toast.success('¡Cita agendada exitosamente!');
        }
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.reload();
          }
        }, 1500);

      } else {
        throw new Error(result.error || 'Error al guardar la cita');
      }
    } catch (err: any) {
      toast.error(err.message);
      setIsSaving(false); 
    } 
  };

  const isDateDisabled = (d: Date): boolean => {
    if (isToday(d) || isBefore(d, startOfDay(new Date()))) return true;
    if (isAfter(d, fechaMaxima)) return true;
    if (!reglasHorario[isoDow(d)]?.activo) return true;
    if (diasCerrados.has(format(d, 'yyyy-MM-dd'))) return true;
    if (diasCompletos.includes(format(d, 'yyyy-MM-dd'))) return true;
    return false;
  };

  // Motivo por el que un día no se puede seleccionar, solo para los dos casos
  // que no son obvios por contexto (hoy/pasado/fuera del límite de 90 días ya
  // se explican solos): día cerrado (fin de semana según el horario de
  // atención, o cierre puntual) vs. todos los horarios de ese día ya ocupados.
  const getDiaDeshabilitadoTitle = (d: Date): string | undefined => {
    const fechaStr = format(d, 'yyyy-MM-dd');
    if (!reglasHorario[isoDow(d)]?.activo) return 'No laboral';
    if (diasCerrados.has(fechaStr)) return 'Cerrado por la clínica';
    if (diasCompletos.includes(fechaStr)) return 'Sin citas disponibles — todos los horarios ocupados';
    return undefined;
  };

  // useDayRender conserva el render por defecto de react-day-picker; el
  // <Tooltip> reemplaza el `title` nativo (que no se ve en botones
  // disabled ni en mobile, donde no hay hover).
  const DiaConTooltip = (props: DayProps) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dayRender = useDayRender(props.date, props.displayMonth, buttonRef as React.RefObject<HTMLButtonElement>);

    if (dayRender.isHidden) return <div role="gridcell" />;
    if (!dayRender.isButton) return <div {...dayRender.divProps} />;

    const title = dayRender.buttonProps.disabled ? getDiaDeshabilitadoTitle(props.date) : undefined;

    return (
      <Tooltip content={title}>
        <button type="button" ref={buttonRef} {...dayRender.buttonProps} />
      </Tooltip>
    );
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
                onDayClick={(d) => { if (isAfter(d, fechaMaxima)) setShowLimiteFechaModal(true); }}
                disabled={(d) => isDateDisabled(d) || isSaving}
                onMonthChange={setVisibleMonth}
                locale={es}
                className="rounded-md"
                components={{ Day: DiaConTooltip }}
              />
            </div>
            {isSelectedDateToday && (
              <p className="text-xs text-red-500 font-bold text-center mt-2">
                No puedes agendar citas para el mismo día. Selecciona una fecha futura.
              </p>
            )}
          </div>

          {date && type && (
            diasCompletos.includes(format(date, 'yyyy-MM-dd')) ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-center animate-in fade-in duration-300">
                <p className="text-sm text-amber-700 font-medium">
                  Todos los horarios de este día están ocupados. Por favor selecciona otra fecha.
                </p>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-blue-900 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Horario Disponible
                  {date && reglasHorario[isoDow(date)] && (
                    <span className="text-xs font-normal text-blue-900/60">
                      ({reglasHorario[isoDow(date)].hora_inicio.substring(0, 5)} - {reglasHorario[isoDow(date)].hora_fin.substring(0, 5)})
                    </span>
                  )}
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md shadow-inner bg-slate-50">
                  {availableTimeSlots.map((slot) => {
                    const isBlockedByTime = isSelectedDateToday;
                    const isYaOcupada = horasOcupadas.includes(slot);
                    const isOccupied = isYaOcupada || isBlockedByTime;
                    const isSelected = time === slot;

                    // El slot siempre cae dentro del horario de atención (ya
                    // filtrado por generateAvailableSlots) — si aparece gris es
                    // por otra razón, no porque el horario esté cerrado. El
                    // tooltip aclara cuál para no confundir "ya la tomaron" con
                    // "el horario está cerrado".
                    const title = isYaOcupada
                      ? 'Consultas Agotadas'
                      : isBlockedByTime
                      ? 'No se puede agendar el mismo día — mínimo 24 horas de anticipación'
                      : undefined;

                    return (
                      <Tooltip key={slot} content={title} side="bottom" className="w-full">
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            w-full text-xs transition-all duration-200
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
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )
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

      <Dialog open={showLimiteFechaModal} onOpenChange={setShowLimiteFechaModal}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl font-black flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              Fecha fuera de rango
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium mt-1">
              No es posible agendar citas con tanta anticipación.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Límite de anticipación</p>
            <p className="text-blue-900 font-black text-lg">
              {DIAS_MAXIMOS_ANTICIPACION} días
            </p>
            <p className="text-[11px] text-slate-500">Selecciona una fecha dentro de los próximos {DIAS_MAXIMOS_ANTICIPACION} días.</p>
          </div>

          <Button
            type="button"
            onClick={() => setShowLimiteFechaModal(false)}
            className="w-full mt-4 bg-blue-900 hover:bg-blue-800 font-bold shadow-md"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}