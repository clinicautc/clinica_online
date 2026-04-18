/**
 * ============================================================================
 * ARCHIVO: PatientSchedule.tsx (Versión Sincronizada con PostgreSQL)
 * PROPÓSITO: Visualización de citas en tiempo real desde la base de datos.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, Activity, Loader2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientScheduleProps {
  patientId: string;
}

// Interfaz para coincidir con las columnas de tu tabla SQL
interface Appointment {
  id: number;
  tipo_servicio: string;
  fecha: string;
  hora: string;
  status: 'programada' | 'completada' | 'cancelada';
}

export default function PatientSchedule({ patientId }: PatientScheduleProps) {
  // --- 1. ESTADOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 2. CARGA DE DATOS DESDE EL BACKEND ---
  useEffect(() => {
    const fetchMyAppointments = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        /**
         * NOTA SHERLOCK: 
         * Llamamos al endpoint de citas filtrando por el ID del paciente.
         * Asegúrate de que tu backend tenga esta ruta configurada.
         */
        const response = await fetch(`http://localhost:3001/api/citas/paciente/${patientId}`);
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar tus citas.');
        }

        const data = await response.json();
        
        // Ordenamos las citas por fecha (la más cercana primero)
        const sortedData = data.sort((a: Appointment, b: Appointment) => 
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );

        setAppointments(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAppointments();
  }, [patientId]);

  // --- 3. GESTIÓN DE ESTADOS VISUALES ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-blue-900/5">
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin mb-4" />
        <p className="text-blue-900/60 font-medium">Consultando agenda UTC...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-sm text-red-600 underline hover:text-red-800"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-500" />
        Próximas Citas Programadas
      </h3>

      {appointments.length === 0 ? (
        <Card className="border-dashed border-2 border-blue-900/10 bg-blue-50/30">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Calendar className="w-12 h-12 text-blue-900/20 mb-3" />
            <p className="text-blue-900/50 font-medium">No tienes citas agendadas actualmente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {appointments.map((apt) => (
            <Card key={apt.id} className="group hover:border-blue-900/30 transition-all duration-300 shadow-sm overflow-hidden">
              <div className={`h-1.5 w-full ${apt.tipo_servicio === 'fisioterapia' ? 'bg-blue-600' : 'bg-orange-500'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="capitalize font-semibold text-blue-900 border-blue-900/10">
                    {apt.tipo_servicio}
                  </Badge>
                  <Badge className={
                    apt.status === 'programada' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                    apt.status === 'completada' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }>
                    {apt.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-blue-900 pt-2">
                  Consulta de {apt.tipo_servicio === 'fisioterapia' ? 'Rehabilitación' : 'Nutrición Clínica'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center text-sm text-blue-900/70 bg-blue-50/50 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 mr-3 text-blue-900" />
                  <span className="font-medium">
                    {format(parseISO(apt.fecha), "EEEE, d 'de' MMMM", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-blue-900/70 bg-orange-50/50 p-2 rounded-lg">
                  <Clock className="w-4 h-4 mr-3 text-orange-600" />
                  <span className="font-medium">
                    {apt.hora.substring(0, 5)} hrs
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}