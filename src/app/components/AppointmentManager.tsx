import { useState, useEffect } from 'react';
import { citasAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// IMPORTANTE: Importamos el Dialog (Modal) para meter ahí el formulario
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'; 
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Activity, Utensils, Trash2, CheckCircle, XCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';

// IMPORTANTE: Importamos el formulario híbrido que hicimos antes
import AppointmentForm from './AppointmentForm'; 

// Ajustamos la interfaz a lo que devuelve la base de datos
export interface AppointmentDB {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  tipo: string;
  fecha: string;
  hora: string;
  estado: string;
}

export default function AppointmentManager() {
  // --- ESTADOS ---
  const [appointments, setAppointments] = useState<AppointmentDB[]>([]);
  
  // ESTOS SON LOS ESTADOS CLAVE PARA EL REAGENDAMIENTO
  const [citaParaReagendar, setCitaParaReagendar] = useState<AppointmentDB | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- CARGAR DATOS DESDE EL BACKEND ---
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await citasAPI.getAll();
      // Orden cronológico descendente
      const sorted = data.sort((a: AppointmentDB, b: AppointmentDB) => {
        const dateA = new Date(`${a.fecha.substring(0, 10)}T${a.hora.substring(0, 5)}`);
        const dateB = new Date(`${b.fecha.substring(0, 10)}T${b.hora.substring(0, 5)}`);
        return dateB.getTime() - dateA.getTime();
      });
      setAppointments(sorted);
    } catch (error) {
      console.error("Error al cargar citas:", error);
      toast.error("No se pudieron cargar las citas del servidor.");
    }
  };

  // --- ACCIONES CONECTADAS AL BACKEND ---

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const currentApt = appointments.find(a => a.id === id);
      if (!currentApt) return;

      // Enviamos la misma fecha y hora, solo cambiamos el estado
      await citasAPI.update(id, { fecha: currentApt.fecha, hora: currentApt.hora, estado: newStatus });

      toast.success(`Cita marcada como ${newStatus}`);
      fetchAppointments(); // Recargamos para reflejar cambios
    } catch (error) {
      toast.error('Error al actualizar la cita');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await citasAPI.remove(id);
      toast.success('Cita eliminada del sistema');
      fetchAppointments();
    } catch (error) {
      toast.error('Error al eliminar la cita');
    }
  };

  // FUNCIÓN PARA ABRIR EL MODAL DE REAGENDAR
  const handleOpenReagendar = (cita: AppointmentDB) => {
    setCitaParaReagendar(cita);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programada': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Programada</Badge>;
      case 'asignada': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Asignada</Badge>;
      case 'completada': return <Badge className="bg-green-100 text-green-800 border-green-200">Completada</Badge>;
      case 'cancelada': return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="border-blue-900/10 shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-900">Gestión de Citas Administrativa</CardTitle>
        <CardDescription>
          Vista general conectada a la base de datos de la Clínica UTC.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-blue-50/50 rounded-lg border border-dashed border-blue-200">
            <Calendar className="w-12 h-12 mx-auto text-blue-900/20 mb-3" />
            <p className="text-blue-900/60 font-medium">No hay citas registradas en el sistema</p>
          </div>
        ) : (
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
                    
                    <TableCell className="font-semibold text-blue-900">
                      {appointment.paciente_nombre}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {appointment.tipo === 'fisioterapia' ? (
                          <Activity className="w-4 h-4 text-blue-700" />
                        ) : (
                          <Utensils className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="capitalize text-sm">{appointment.tipo}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-blue-900/40" />
                          {format(parseISO(appointment.fecha), "PPP", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {appointment.hora.substring(0, 5)} hrs
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(appointment.estado)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        
                        {(appointment.estado === 'programada' || appointment.estado === 'asignada') && (
                          <>
                            {/* BOTÓN MAGICO DE REAGENDAR */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReagendar(appointment)}
                              className="border-orange-500 text-orange-500 hover:bg-orange-50"
                              title="Re-Agendar Cita"
                            >
                              <Edit className="w-4 h-4 mr-1" /> Re-agendar
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(appointment.id, 'completada')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Marcar como Completada"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(appointment.id, 'cancelada')}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Cancelar Cita"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(appointment.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar de la DB"
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

      {/* EL MODAL PARA REAGENDAR */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Formulario de Cita</DialogTitle>
          </DialogHeader>
          
          {citaParaReagendar && (
            <AppointmentForm 
              patientId={String(citaParaReagendar.paciente_id)} 
              existingAppointment={citaParaReagendar as any} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}