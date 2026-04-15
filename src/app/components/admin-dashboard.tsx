import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogOut, Calendar, Users, FileText, Bell, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AppointmentManagement } from './appointment-management';
import { PatientManagement } from './patient-management';
import { NotesManagement } from './notes-management';
import type { User } from '../App';

type AdminDashboardProps = {
  user: User;
  onLogout: () => void;
};

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const isAdmin = user.role === 'admin';
  const isPracticante = user.role === 'practicante';

  // Obtener estadísticas
  const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const demoPatients = [
    { id: '1', name: 'Juan Pérez', email: 'paciente@utc.edu' },
    { id: '3', name: 'María López', email: 'maria.lopez@utc.edu' },
    { id: '4', name: 'Carlos Ramírez', email: 'carlos.ramirez@utc.edu' },
    { id: '5', name: 'Ana García', email: 'ana.garcia@utc.edu' },
  ];

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((apt: any) => apt.date === today);
  const physiotherapyCount = appointments.filter((apt: any) => apt.service === 'fisioterapia').length;
  const nutritionCount = appointments.filter((apt: any) => apt.service === 'nutricion').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white border-b-2 border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-orange-500 bg-clip-text text-transparent">
                {isAdmin ? 'Panel de Administración UTC' : 'Panel de Practicante UTC'}
              </h1>
              <p className="text-sm text-gray-600">{user.name} - {isAdmin ? 'Administrador' : 'Practicante'}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout} 
              className="flex items-center gap-2 border-blue-900 text-blue-900 hover:bg-blue-50"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} bg-white border-2 border-blue-100`}>
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="appointments" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Citas</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="patients" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Pacientes</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="notes" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notas UTC</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white shadow-md border-2 border-blue-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-blue-900">Total Citas</CardDescription>
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{appointments.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Todas las citas programadas</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md border-2 border-blue-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-blue-900">Citas Hoy</CardDescription>
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{todayAppointments.length}</div>
                  <p className="text-sm text-gray-600 mt-1">{today}</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md border-2 border-blue-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-blue-900">Fisioterapia</CardDescription>
                    <Activity className="w-5 h-5 text-blue-900" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{physiotherapyCount}</div>
                  <p className="text-sm text-gray-600 mt-1">Citas de fisioterapia</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md border-2 border-blue-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-blue-900">Nutrición</CardDescription>
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{nutritionCount}</div>
                  <p className="text-sm text-gray-600 mt-1">Citas de nutrición</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    Citas de Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No hay citas programadas para hoy</p>
                  ) : (
                    <div className="space-y-3">
                      {todayAppointments.slice(0, 5).map((apt: any) => {
                        const patient = demoPatients.find((p) => p.id === apt.userId);
                        return (
                          <div key={apt.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <p className="font-medium text-blue-900">{patient?.name || 'Paciente'}</p>
                              <p className="text-sm text-gray-600 capitalize">{apt.service}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-orange-600">{apt.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Users className="w-5 h-5 text-orange-500" />
                    Pacientes Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoPatients.slice(0, 5).map((patient) => (
                      <div key={patient.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <p className="font-medium text-blue-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActiveTab('patients')}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {isAdmin && (
              <Card className="bg-gradient-to-r from-blue-50 via-white to-orange-50 border-2 border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Acceso Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => setActiveTab('appointments')}
                    >
                      <Calendar className="w-6 h-6 text-blue-900" />
                      <span className="text-blue-900">Gestionar Citas</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => setActiveTab('patients')}
                    >
                      <FileText className="w-6 h-6 text-blue-900" />
                      <span className="text-blue-900">Historiales Médicos</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                      onClick={() => setActiveTab('notes')}
                    >
                      <Bell className="w-6 h-6 text-orange-500" />
                      <span className="text-orange-600">Publicar Notas UTC</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isPracticante && (
              <Card className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Información
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Como practicante, tienes acceso para ver las citas programadas y los historiales médicos de los pacientes. 
                    Las funciones de gestión de citas y publicación de notas están reservadas para administradores.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="appointments">
              <AppointmentManagement />
            </TabsContent>
          )}

          <TabsContent value="patients">
            <PatientManagement />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="notes">
              <NotesManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
