import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, FileText, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { NutritionFormDialog } from './nutrition-form-dialog';
import { PhysiotherapyFormDialog } from './physiotherapy-form-dialog';
import { toast } from 'sonner';

type Appointment = {
  id: string;
  userId: string;
  service: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: string;
};

type AppointmentScheduleProps = {
  userId: string;
};

export function AppointmentSchedule({ userId }: AppointmentScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [showPhysiotherapyForm, setShowPhysiotherapyForm] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [userId]);

  const loadAppointments = () => {
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const userAppointments = allAppointments.filter((apt: Appointment) => apt.userId === userId);
    setAppointments(userAppointments.sort((a: Appointment, b: Appointment) => 
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    ));
  };

  const deleteAppointment = (id: string) => {
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = allAppointments.filter((apt: Appointment) => apt.id !== id);
    localStorage.setItem('appointments', JSON.stringify(updated));
    loadAppointments();
    toast.success('Cita cancelada exitosamente');
  };

  const isAppointmentActive = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const diffMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Activar 30 minutos antes hasta 2 horas después
    return diffMinutes <= 30 && diffMinutes >= -120;
  };

  const handleAccessForm = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    if (appointment.service === 'nutricion') {
      setShowNutritionForm(true);
    } else {
      setShowPhysiotherapyForm(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Mi Horario de Citas</h3>
        <p className="text-sm text-gray-600">
          El acceso a formularios se activa automáticamente 30 minutos antes de tu cita
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tienes citas programadas</p>
            <p className="text-sm text-gray-500 mt-2">Usa la pestaña "Agendar Cita" para programar una nueva</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const isActive = isAppointmentActive(appointment);
            return (
              <Card key={appointment.id} className={isActive ? 'border-2 border-green-500 shadow-lg' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg capitalize">{appointment.service}</CardTitle>
                        {isActive && (
                          <Badge className="bg-green-500">
                            Formulario Disponible
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 text-base">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(appointment.date).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAppointment(appointment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointment.reason && (
                    <p className="text-sm text-gray-600 mb-4">
                      <span className="font-semibold">Motivo:</span> {appointment.reason}
                    </p>
                  )}
                  <Button
                    onClick={() => handleAccessForm(appointment)}
                    disabled={!isActive}
                    className="w-full"
                    variant={isActive ? 'default' : 'outline'}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isActive ? 'Acceder a Formularios' : 'Formulario no disponible aún'}
                  </Button>
                  {!isActive && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Disponible 30 min antes de tu cita
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showNutritionForm && selectedAppointment && (
        <NutritionFormDialog
          open={showNutritionForm}
          onOpenChange={setShowNutritionForm}
          appointmentId={selectedAppointment.id}
        />
      )}

      {showPhysiotherapyForm && selectedAppointment && (
        <PhysiotherapyFormDialog
          open={showPhysiotherapyForm}
          onOpenChange={setShowPhysiotherapyForm}
          appointmentId={selectedAppointment.id}
        />
      )}
    </div>
  );
}
