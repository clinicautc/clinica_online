/**
 * ============================================================================
 * DASHBOARD DE PRACTICANTE DE NUTRICIÓN (Versión Sincronizada DB - Final)
 * Panel específico para estudiantes con datos en tiempo real y persistencia.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Users, FileText, Calendar, Clock, Utensils, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format, parseISO, isSameDay } from 'date-fns';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';
import { toast } from 'sonner';

// Interfaz sincronizada con las columnas de pgAdmin
interface Appointment {
  id: number;
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;    
}

export default function NutritionPractitionerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);

  /**
   * EFECTO: Sincronización con la DB Real y Persistencia
   */
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        
        // Generamos la fecha de hoy en formato ISO local para comparación
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        /**
         * Consultamos el endpoint sincronizado y filtramos en el cliente
         * para garantizar exactitud con la zona horaria de la Ciudad de México.
         */
        const response = await fetch(`http://localhost:3001/api/citas`);
        
        if (response.ok) {
          const allAppointments: Appointment[] = await response.json();
          
          const filtered = allAppointments.filter((apt) => {
            // Limpiamos la fecha de la DB (formato ISO) para comparar solo YYYY-MM-DD
            const cleanAptDate = apt.fecha.split('T')[0];
            
            return (
              cleanAptDate === todayStr && 
              apt.tipo === 'nutricion' && 
              apt.estado === 'programada'
            );
          });

          setTodayAppointments(filtered);
        }
      } catch (error) {
        console.error("❌ Error de conexión Practicante Nutrición -> PostgreSQL:", error);
        toast.error("Error al sincronizar la agenda del día");
      } finally {
        setIsLoadingCitas(false);
      }
    };

    // Verificación de sesión para resiliencia F5
    const savedUser = localStorage.getItem('utc_current_user');
    if (!user && !authLoading && !savedUser) {
      navigate('/login');
      return;
    }

    fetchTodayAppointments();
  }, [user, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * MODIFICACIÓN: Redirección al Formulario Maestro Integrado
   */
  /**
 * MODIFICACIÓN: Redirección al Formulario Maestro Integrado
 * Ajustado a la ruta definida en routes.tsx: /forms/nutricion/:appointmentId
 */
const handleAccessForms = (appointment: Appointment) => {
  // El appointment.id se pasa como parámetro a la URL
  navigate(`/forms/nutricion/${appointment.id}`);
};

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          <p className="text-orange-900 font-medium">Recuperando sesión clínica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-white border-b border-orange-900/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center relative">
                <Utensils className="w-6 h-6 text-white" />
                {/* PUNTO VERDE DE ESTADO MINIMALISTA */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">Clínica UTC - Nutrición</h1>
                <p className="text-sm text-orange-900/60 font-serif italic">Practicante: {user?.name || (user as any)?.nombre || "Usuario UTC"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-orange-900/20 text-orange-900 hover:bg-orange-50 transition-colors">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Panel de Nutrición</h2>
          <p className="text-orange-900/70">Gestión de consultas y expedientes clínicos en tiempo real.</p>
        </div>

        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white border border-orange-900/10 p-1 h-auto flex-wrap gap-1 shadow-sm">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="histories" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Historiales
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Notas del Docente
            </TabsTrigger>
          </TabsList>

          {/* Citas de Hoy - SINCRONIZADO CON POSTGRESQL */}
          <TabsContent value="today_appointments">
            <Card className="border-orange-900/10 shadow-md">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Agenda Sincronizada - Hoy ({format(new Date(), 'dd/MM/yyyy')})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingCitas ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                      <p className="text-orange-900/50">Consultando base de datos...</p>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg border-orange-100 bg-orange-50/20">
                       <Calendar className="w-12 h-12 text-orange-200 mx-auto mb-3" />
                       <p className="text-gray-500 font-medium italic">No se encontraron citas de nutrición programadas para hoy.</p>
                    </div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow gap-4 border-l-4 border-l-orange-600">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-orange-50">
                            <Utensils className="w-5 h-5 text-orange-600"/>
                          </div>
                          <div>
                            <p className="font-bold text-orange-900 text-lg">{apt.paciente_nombre}</p>
                            <div className="flex gap-3 mt-1">
                              <p className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded font-semibold">
                                <Clock className="w-3 h-3 text-orange-600"/> {apt.hora.substring(0,5)} hrs
                              </p>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider self-center border border-green-200">
                                {apt.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 shadow-sm font-bold text-white"
                          onClick={() => handleAccessForms(apt)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Evaluación
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestañas de contenido estático/proporcional */}
          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          <TabsContent value="histories">
            <MedicalHistoryViewer filterType="nutricion" />
          </TabsContent>

          <TabsContent value="notes">
            <NotesViewer readOnly filterCategory="nutricion" />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 Universidad Tres Culturas - Sistema de Gestión de Clínica Universitaria</p>
        <p className="mt-1 font-serif italic text-[10px]">Conexión PostgreSQL Activa</p>
      </footer>
    </div>
  );
}