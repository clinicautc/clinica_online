import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { LogOut, Calendar, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import AppointmentForm from '../components/AppointmentForm';
import PatientSchedule from '../components/PatientSchedule';
import PatientPlans from '../components/PatientPlans';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header Responsivo */}
      <header className="bg-white border-b border-blue-900/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            
            {/* Logo y Nombre Clínica */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm sm:text-base">UTC</span>
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-blue-900 truncate">Clínica Universitaria</h1>
                <p className="text-xs text-blue-900/60 truncate">Fisioterapia y Nutrición</p>
              </div>
            </div>

            {/* Info Usuario y Logout */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-blue-900 leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] sm:text-xs text-blue-900/60 uppercase tracking-wider">{user?.role}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-blue-900/20 text-blue-900 hover:bg-blue-50 h-9"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* contenido del main  */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            ¡Hola, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-sm sm:text-base text-blue-900/70">
            Gestiona tus citas y consulta tus planes de tratamiento de forma sencilla.
          </p>
        </div>

        {/* Tabs  Horizontal para Móviles */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-white border border-blue-900/10 inline-flex w-auto min-w-full sm:min-w-0 sm:w-full justify-start sm:justify-center p-1">
              <TabsTrigger 
                value="appointments"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-4 py-2"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Cita
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-4 py-2"
              >
                <User className="w-4 h-4 mr-2" />
                Mis Citas
              </TabsTrigger>
              <TabsTrigger 
                value="plans"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap px-4 py-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Planes Médicos
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenido de los Tabs con margen superior */}
          <div className="mt-4">
            <TabsContent value="appointments" className="animate-in fade-in-50 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-blue-900/5 overflow-hidden">
                <AppointmentForm patientId={user?.id || ''} />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="animate-in fade-in-50 duration-300">
              <PatientSchedule patientId={user?.id || ''} />
            </TabsContent>

            <TabsContent value="plans" className="animate-in fade-in-50 duration-300">
              <PatientPlans patientId={user?.id || ''} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}