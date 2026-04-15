import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { LogOut, Calendar, Users, FileText, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import AppointmentManager from '../components/AppointmentManager';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import NotesManager from '../components/NotesManager';

export default function AdminDashboard() {
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Logo y Título */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm sm:text-base">UTC</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-blue-900 leading-tight">Clínica Universitaria</h1>
                <p className="text-xs sm:text-sm text-blue-900/60">Panel de Administración</p>
              </div>
            </div>

            {/* Usuario y Botón */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-blue-900">{user?.name}</p>
                <p className="text-xs text-blue-900/60 capitalize">{user?.role}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-blue-900/20 text-blue-900 hover:bg-blue-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-1">
            Gestión Centralizada
          </h2>
          <p className="text-sm sm:text-base text-blue-900/70">
            Control de citas, pacientes y registros académicos.
          </p>
        </div>

        {/* Tabs con Scroll Horizontal en móvil */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-white border border-blue-900/10 inline-flex w-auto sm:w-full justify-start sm:justify-center">
              <TabsTrigger 
                value="appointments"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Citas
              </TabsTrigger>
              <TabsTrigger 
                value="patients"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
              >
                <Users className="w-4 h-4 mr-2" />
                Pacientes
              </TabsTrigger>
              <TabsTrigger 
                value="histories"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" />
                Historiales
              </TabsTrigger>
              <TabsTrigger 
                value="notes"
                className="data-[state=active]:bg-blue-900 data-[state=active]:text-white whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Notas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="appointments">
              <AppointmentManager />
            </TabsContent>
            <TabsContent value="patients">
              <PatientList />
            </TabsContent>
            <TabsContent value="histories">
              <MedicalHistoryViewer />
            </TabsContent>
            <TabsContent value="notes">
              <NotesManager />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}