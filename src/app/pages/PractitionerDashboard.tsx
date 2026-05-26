import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
// Iconos temáticos: Actividad para Fisio y Utensilios para Nutrición
import { LogOut, Users, FileText, Calendar, Clock, Utensils, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
// Librerías de fechas para que el sistema sepa exactamente qué es "hoy"
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockAppointments, Appointment } from '../lib/mockData';

// Componentes modulares que hacen que este Dashboard no esté saturado de código
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesViewer from '../components/NotesViewer';

export default function PractitionerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Estado para guardar las citas que el practicante debe atender hoy
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  // --- LÓGICA DE CARGA DE DATOS ---
  useEffect(() => {
    // 1. Intentamos leer de LocalStorage (datos reales guardados) o usamos los Mock (datos de prueba)
    const stored = localStorage.getItem('utc_appointments');
    const allAppointments = stored ? JSON.parse(stored) : mockAppointments;
    
    // 2. FILTRADO INTELIGENTE: 
    // Comparamos la fecha de la cita con la fecha actual del sistema (new Date())
    // Y solo mostramos las que están en estado 'programada'
    const filtered = allAppointments.filter((apt: Appointment) => 
      isSameDay(parseISO(apt.date), new Date()) && apt.status === 'programada'
    );
    setTodayAppointments(filtered);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- NAVEGACIÓN DINÁMICA A FORMULARIOS ---
  const handleAccessForms = (appointment: Appointment) => {
    // Dependiendo del tipo de cita, el sistema te manda al formulario correcto
    if (appointment.type === 'nutricion') {
      navigate(`/forms/nutricion/${appointment.id}`);
    } else if (appointment.type === 'fisioterapia') {
      navigate(`/forms/fisioterapia/${appointment.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* HEADER: Identidad visual UTC */}
      <header className="bg-white border-b border-blue-900/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">UTC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Clínica Universitaria</h1>
                <p className="text-sm text-blue-900/60">Panel de Practicante</p>
              </div>
            </div>
            {/* Info del Practicante (Nombre y Carrera) */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-900">{user?.name}</p>
                <p className="text-xs text-blue-900/60 capitalize">{user?.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-blue-900/20 text-blue-900">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Panel de Control</h2>
          <p className="text-blue-900/70">Gestiona pacientes, citas y consulta historiales médicos</p>
        </div>

        {/* --- SISTEMA DE PESTAÑAS (TABS) --- */}
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="bg-white border border-blue-900/10 p-1 h-auto flex-wrap">
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="today_appointments" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" /> Citas de Hoy
            </TabsTrigger>
            <TabsTrigger value="histories" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Historiales
            </TabsTrigger>
            {/* Pestaña de Notas: Donde el profesor deja retroalimentación */}
            <TabsTrigger value="notes" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" /> Notas Uni
            </TabsTrigger>
          </TabsList>

          {/* CONTENIDO 1: Lista general de pacientes registrados */}
          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          {/* CONTENIDO 2: Agenda específica del día actual */}
          <TabsContent value="today_appointments">
            <Card className="border-blue-900/10">
              <CardHeader>
                <CardTitle className="text-blue-900">Agenda de Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayAppointments.length === 0 ? (
                    <p className="text-center py-4 text-gray-500 italic">No tienes citas programadas para hoy.</p>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm gap-4">
                        <div className="flex items-center gap-4">
                          {/* Icono dinámico según la carrera (Fisio o Nutri) */}
                          <div className={`p-2 rounded-full ${apt.type === 'fisioterapia' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            {apt.type === 'fisioterapia' ? <Activity className="w-5 h-5 text-blue-900"/> : <Utensils className="w-5 h-5 text-orange-600"/>}
                          </div>
                          <div>
                            <p className="font-bold text-blue-900">{apt.patientName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3"/> {apt.time} - <span className="capitalize">{apt.type}</span>
                            </p>
                          </div>
                        </div>
                        {/* Botón para saltar directo a la evaluación clínica */}
                        <Button 
                          size="sm" 
                          className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800"
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

          {/* CONTENIDO 3: Visor de expedientes pasados */}
          <TabsContent value="histories">
            <MedicalHistoryViewer />
          </TabsContent>

          {/* CONTENIDO 4: Notas académicas (Modo Solo Lectura para el alumno) */}
          <TabsContent value="notes">
            <NotesViewer readOnly />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}