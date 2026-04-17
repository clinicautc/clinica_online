/**
 * ============================================================================
 * DASHBOARD DE PRACTICANTE DE FISIOTERAPIA (Versión Sincronizada DB)
 * Panel específico para estudiantes con acceso a citas en vivo desde PostgreSQL.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, Users, FileText, Calendar, Clock, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';

// Interfaz sincronizada con el esquema de la base de datos PostgreSQL
interface Appointment {
  id: number;
  paciente_nombre: string; 
  tipo: string;      
  fecha: string;
  hora: string;
  estado: string;    
}

export default function PhysiotherapyPractitionerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingCitas, setIsLoadingCitas] = useState(true);

  /**
   * EFECTO: Sincronización con la DB Real
   * Filtramos por fecha actual y área 'fisioterapia' directamente desde la API
   */
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingCitas(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // Petición al backend sincronizada
        const response = await fetch(`http://localhost:3001/api/citas`);
        
        if (response.ok) {
          const allAppointments: Appointment[] = await response.json();
          
          const filtered = allAppointments.filter((apt) => {
            // Normalización de la fecha de la DB (YYYY-MM-DD)
            const cleanAptDate = apt.fecha.split('T')[0];
            
            return (
              cleanAptDate === todayStr && 
              apt.tipo === 'fisioterapia' && 
              apt.estado === 'programada'
            );
          });

          setTodayAppointments(filtered);
        }
      } catch (error) {
        console.error("❌ Error de conexión Practicante Fisio -> PostgreSQL:", error);
      } finally {
        setIsLoadingCitas(false);
      }
    };

    fetchTodayAppointments();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * MODIFICACIÓN: Redirección al Formulario Maestro Unificado
   * Apunta a la ruta del MasterForm pasando el ID de la cita.
   */
  /**
 * MODIFICACIÓN: Redirección al Formulario Maestro Unificado
 */
const handleAccessForms = (appointment: Appointment) => {
  // Cambiamos 'physiotherapy-master-form' por 'forms/fisioterapia'
  navigate(`/forms/fisioterapia/${appointment.id}`);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* HEADER */}
      <header className="bg-white border-b border-blue-900/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center relative">
                <Activity className="w-6 h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Clínica UTC - Fisioterapia</h1>
                <p className="text-sm text-blue-900/60 font-medium">Panel de Practicante</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-900">
                  {user?.name || (user as any)?.nombre || "Practicante UTC"}
                </p>
                <p className="text-xs text-blue-900/60 font-bold uppercase tracking-tighter">Fisioterapia</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-blue-900/20 text-blue-900 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Panel de Trabajo</h2>
          <p className="text-blue-900/70">Gestiona pacientes, citas y consulta historiales de fisioterapia</p>
        </div>

        <Tabs defaultValue="today_appointments" className="space-y-6">
          <TabsList className="bg-white border border-blue-900/10 p-1 h-auto flex-wrap gap-1 shadow-sm">
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="histories" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Historiales
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white font-bold">
              <FileText className="w-4 h-4 mr-2" /> Notas del Docente
            </TabsTrigger>
          </TabsList>

          {/* Citas de Hoy - FISIOTERAPIA - SINCRONIZADO */}
          <TabsContent value="today_appointments">
            <Card className="border-blue-900/10 shadow-md">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-700" />
                  Agenda Sincronizada - Hoy ({format(new Date(), 'dd/MM/yyyy')})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingCitas ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-900" />
                      <p className="text-blue-900/50">Cargando agenda clínica...</p>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl border-blue-100 bg-blue-50/20">
                      <Calendar className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium italic text-sm">
                        No tienes citas de fisioterapia programadas para hoy.
                      </p>
                    </div>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow gap-4 border-l-4 border-l-blue-900">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-blue-100">
                            <Activity className="w-5 h-5 text-blue-900"/>
                          </div>
                          <div>
                            <p className="font-bold text-blue-900 text-lg">{apt.paciente_nombre}</p>
                            <div className="flex gap-3 mt-1">
                              <p className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded font-semibold">
                                <Clock className="w-3 h-3 text-blue-900"/> {apt.hora.substring(0, 5)} hrs
                              </p>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider self-center border border-green-200">
                                {apt.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white shadow-sm font-bold"
                          onClick={() => handleAccessForms(apt)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Iniciar Evaluación
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pacientes */}
          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          {/* Historiales - solo FISIOTERAPIA */}
          <TabsContent value="histories">
            <MedicalHistoryViewer filterType="fisioterapia" />
          </TabsContent>

          {/* Notas del Docente - solo FISIOTERAPIA */}
          <TabsContent value="notes">
            <NotesViewer readOnly filterCategory="fisioterapia" />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 Universidad Tres Culturas - Sistema de Gestión de Clínica Universitaria</p>
        <p className="mt-1 font-serif italic text-[10px]">Sincronización de Base de Datos Activa</p>
      </footer>
    </div>
  );
}