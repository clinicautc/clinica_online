import { useState, useEffect } from 'react';
// UI: Componentes de tabla y tarjetas de Shadcn
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge'; // Para etiquetas de estado (colores)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// UTILS: Formateo de fechas y manejo de datos locales
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockAppointments, Appointment } from '../lib/mockData';
// ICONOS: Visuales para diferenciar Nutrición de Fisioterapia
import { Calendar, Clock, Activity, Utensils, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AppointmentManager() {
  // --- 1. ESTADO DE LA LISTA ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  /**
   * NOTA: CARGA Y ORDENAMIENTO
   * Al montar el componente, leemos de LocalStorage.
   * IMPORTANTE: Usamos .sort() para que las citas más recientes 
   * aparezcan hasta arriba (orden cronológico descendente).
   */
  useEffect(() => {
    const stored = localStorage.getItem('utc_appointments');
    const allAppointments = stored ? JSON.parse(stored) : mockAppointments;
    
    const sorted = allAppointments.sort((a: Appointment, b: Appointment) => {
      // Creamos objetos Date combinando fecha y hora para comparar
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    setAppointments(sorted);
  }, []);

  /**
   * NOTA: FUNCIÓN DE PERSISTENCIA
   * Cada vez que cambiamos algo (completar, cancelar o borrar),
   * debemos actualizar el estado de React Y el LocalStorage.
   */
  const updateAppointments = (updated: Appointment[]) => {
    setAppointments(updated);
    localStorage.setItem('utc_appointments', JSON.stringify(updated));
  };

  // --- 2. ACCIONES DE GESTIÓN ---

  const handleComplete = (id: string) => {
    const updated = appointments.map(apt => 
      apt.id === id ? { ...apt, status: 'completada' as const } : apt
    );
    updateAppointments(updated);
    toast.success('Cita marcada como completada');
  };

  const handleCancel = (id: string) => {
    const updated = appointments.map(apt => 
      apt.id === id ? { ...apt, status: 'cancelada' as const } : apt
    );
    updateAppointments(updated);
    toast.error('Cita cancelada');
  };

  const handleDelete = (id: string) => {
    // El filter elimina el elemento del arreglo permanentemente
    const updated = appointments.filter(apt => apt.id !== id);
    updateAppointments(updated);
    toast.success('Cita eliminada del sistema');
  };

  /**
   * NOTA: getStatusBadge
   * Lógica visual para que el usuario identifique el estado de un vistazo.
   * Azul = Pendiente, Verde = Listo, Rojo = Cancelado.
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programada':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Programada</Badge>;
      case 'completada':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completada</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="border-blue-900/10 shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-900">Gestión de Citas Administrativa</CardTitle>
        <CardDescription>
          Vista general para practicantes y administración de la Clínica UTC.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* CASO: NO HAY DATOS */}
        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-blue-50/50 rounded-lg border border-dashed border-blue-200">
            <Calendar className="w-12 h-12 mx-auto text-blue-900/20 mb-3" />
            <p className="text-blue-900/60 font-medium">No hay citas registradas en el sistema</p>
          </div>
        ) : (
          /* CASO: TABLA DE CITAS */
          <div className="border border-blue-900/10 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-900/5 hover:bg-blue-900/5">
                  <TableHead className="text-blue-900 font-bold">Paciente</TableHead>
                  <TableHead className="text-blue-900 font-bold">Servicio</TableHead>
                  <TableHead className="text-blue-900 font-bold">Fecha y Hora</TableHead>
                  <TableHead className="text-blue-900 font-bold">Estado</TableHead>
                  <TableHead className="text-blue-900 font-bold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* COLUMNA PACIENTE */}
                    <TableCell className="font-semibold text-blue-900">
                      {appointment.patientName}
                    </TableCell>

                    {/* COLUMNA TIPO (Icono + Texto) */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {appointment.type === 'fisioterapia' ? (
                          <Activity className="w-4 h-4 text-blue-700" />
                        ) : (
                          <Utensils className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="capitalize text-sm">{appointment.type}</span>
                      </div>
                    </TableCell>

                    {/* COLUMNA FECHA/HORA */}
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-blue-900/40" />
                          {format(parseISO(appointment.date), "PPP", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {appointment.time} hrs
                        </span>
                      </div>
                    </TableCell>

                    {/* COLUMNA ESTADO */}
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>

                    {/* COLUMNA ACCIONES (BOTONES DINÁMICOS) */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* NOTA: Solo mostramos Completar/Cancelar si la cita está pendiente */}
                        {appointment.status === 'programada' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleComplete(appointment.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Marcar como Completada"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancel(appointment.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Cancelar Cita"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {/* Botón de eliminar siempre visible para limpieza de DB */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(appointment.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}