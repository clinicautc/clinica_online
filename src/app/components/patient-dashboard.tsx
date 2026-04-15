import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogOut, Calendar, FileText, Apple, Dumbbell, CalendarDays } from 'lucide-react';
import { AppointmentForm } from './appointment-form';
import { AppointmentSchedule } from './appointment-schedule';
import { AppointmentCalendar } from './appointment-calendar';
import { NutritionPlans } from './nutrition-plans';
import { ExercisePlans } from './exercise-plans';
import type { User } from '../App';

type PatientDashboardProps = {
  user: User;
  onLogout: () => void;
};

export function PatientDashboard({ user, onLogout }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState('appointments');
  const [showPlans, setShowPlans] = useState<'nutrition' | 'exercise' | null>(null);

  if (showPlans === 'nutrition') {
    return <NutritionPlans user={user} onBack={() => setShowPlans(null)} onLogout={onLogout} />;
  }

  if (showPlans === 'exercise') {
    return <ExercisePlans user={user} onBack={() => setShowPlans(null)} onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white border-b-2 border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-orange-500 bg-clip-text text-transparent">
                Clínica UTC
              </h1>
              <p className="text-sm text-gray-600">Bienvenido, {user.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-100" onClick={() => setActiveTab('appointments')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-900" />
                </div>
                <CardTitle className="text-lg text-blue-900">Mis Citas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">Programa y gestiona tus citas</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-100" onClick={() => setShowPlans('nutrition')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Apple className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg text-blue-900">Nutrición</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">Planes de alimentación y formularios</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-100" onClick={() => setShowPlans('exercise')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-blue-900" />
                </div>
                <CardTitle className="text-lg text-blue-900">Fisioterapia</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">Planes de ejercicios y rehabilitación</CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-md border-2 border-blue-100">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-blue-100">
                <TabsTrigger 
                  value="appointments" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
                >
                  <Calendar className="w-4 h-4" />
                  Agendar Cita
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger 
                  value="schedule" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4" />
                  Mi Horario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="appointments" className="mt-6">
                <AppointmentForm userId={user.id} />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <AppointmentCalendar userId={user.id} />
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <AppointmentSchedule userId={user.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
