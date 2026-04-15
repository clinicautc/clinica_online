import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockAppointments, Appointment } from '../lib/mockData';
import { Calendar, Clock, Activity, Utensils, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';

interface PatientScheduleProps {
  patientId: string;
}

export default function PatientSchedule({ patientId }: PatientScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('utc_appointments');
    const allAppointments = stored ? JSON.parse(stored) : mockAppointments;
    
    const patientAppointments = allAppointments
      .filter((apt: Appointment) => apt.patientId === patientId)
      .sort((a: Appointment, b: Appointment) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    
    setAppointments(patientAppointments);
  }, [patientId]);

  const isAppointmentToday = (appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.date);
    return isSameDay(appointmentDate, new Date());
  };

  const canAccessForms = (appointment: Appointment) => {
    return isAppointmentToday(appointment) && appointment.status === 'programada';
  };

  const handleAccessForms = (appointment: Appointment) => {
    navigate(`/forms/${appointment.type}/${appointment.id}`);
  };

  return (
    <div className="space-y-4">
      <Card className="border-blue-900/10">
        <CardHeader>
          <CardTitle className="text-blue-900">Mi Horario de Citas</CardTitle>
          <CardDescription>
            Próximas citas programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-blue-900/30 mb-3" />
              <p className="text-blue-900/60">No tienes citas programadas</p>
              <p className="text-sm text-blue-900/40 mt-1">
                Agenda una cita en la pestaña "Citas"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-blue-900/10 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          appointment.type === 'fisioterapia' 
                            ? 'bg-blue-100' 
                            : 'bg-orange-100'
                        }`}>
                          {appointment.type === 'fisioterapia' ? (
                            <Activity className="w-5 h-5 text-blue-900" />
                          ) : (
                            <Utensils className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 capitalize">
                            {appointment.type}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-blue-900/60 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(appointment.date), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {appointment.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isAppointmentToday(appointment) && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Hoy
                        </Badge>
                      )}
                    </div>

                    {/* ELIMINA ESTE BLOQUE COMPLETAMENTE */}
{canAccessForms(appointment) && (
  <Button
    onClick={() => handleAccessForms(appointment)}
    className="bg-blue-900 hover:bg-blue-800 text-white"
    size="sm"
  >
    <FileText className="w-4 h-4 mr-2" />
    Acceder a Formularios
  </Button>
)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
