import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Users, Search, FileText, Calendar, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type Patient = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
};

export function PatientManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const demoPatients: Patient[] = [
    { id: '1', name: 'Juan Pérez', email: 'paciente@utc.edu', phone: '555-0101', age: 28, gender: 'Masculino' },
    { id: '3', name: 'María López', email: 'maria.lopez@utc.edu', phone: '555-0102', age: 34, gender: 'Femenino' },
    { id: '4', name: 'Carlos Ramírez', email: 'carlos.ramirez@utc.edu', phone: '555-0103', age: 45, gender: 'Masculino' },
    { id: '5', name: 'Ana García', email: 'ana.garcia@utc.edu', phone: '555-0104', age: 29, gender: 'Femenino' },
    { id: '6', name: 'Pedro Sánchez', email: 'pedro.sanchez@utc.edu', phone: '555-0105', age: 52, gender: 'Masculino' },
    { id: '7', name: 'Laura Martínez', email: 'laura.martinez@utc.edu', phone: '555-0106', age: 31, gender: 'Femenino' },
  ];

  const filteredPatients = demoPatients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPatientAppointments = (patientId: string) => {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.filter((apt: any) => apt.userId === patientId);
  };

  const getPatientNutritionForms = (patientId: string) => {
    const forms = JSON.parse(localStorage.getItem('nutritionForms') || '[]');
    const appointments = getPatientAppointments(patientId);
    return forms.filter((form: any) =>
      appointments.some((apt: any) => apt.id === form.appointmentId)
    );
  };

  const getPatientPhysiotherapyForms = (patientId: string) => {
    const forms = JSON.parse(localStorage.getItem('physiotherapyForms') || '[]');
    const appointments = getPatientAppointments(patientId);
    return forms.filter((form: any) =>
      appointments.some((apt: any) => apt.id === form.appointmentId)
    );
  };

  const openPatientHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowHistory(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestión de Pacientes
          </CardTitle>
          <CardDescription>
            Administra pacientes y accede a sus historiales médicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="searchPatient">Buscar Paciente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="searchPatient"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{filteredPatients.length}</p>
              <p className="text-sm text-gray-600">Pacientes Encontrados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{demoPatients.length}</p>
              <p className="text-sm text-gray-600">Total de Pacientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {JSON.parse(localStorage.getItem('appointments') || '[]').length}
              </p>
              <p className="text-sm text-gray-600">Citas Totales</p>
            </div>
          </div>

          {/* Lista de pacientes */}
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron pacientes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPatients.map((patient) => {
                const appointments = getPatientAppointments(patient.id);
                return (
                  <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{patient.name}</CardTitle>
                          <CardDescription>{patient.email}</CardDescription>
                        </div>
                        <Badge variant="outline">{appointments.length} citas</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {patient.phone && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Teléfono:</span> {patient.phone}
                          </p>
                        )}
                        {patient.age && patient.gender && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Edad/Género:</span> {patient.age} años, {patient.gender}
                          </p>
                        )}
                        <Button
                          onClick={() => openPatientHistory(patient)}
                          className="w-full bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Historial Médico
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Historial Médico */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historial Médico - {selectedPatient?.name}
            </DialogTitle>
            <DialogDescription>{selectedPatient?.email}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            {selectedPatient && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="appointments">Citas</TabsTrigger>
                  <TabsTrigger value="nutrition">Nutrición</TabsTrigger>
                  <TabsTrigger value="physiotherapy">Fisioterapia</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información del Paciente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nombre Completo</p>
                          <p className="text-base">{selectedPatient.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Correo Electrónico</p>
                          <p className="text-base">{selectedPatient.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Teléfono</p>
                          <p className="text-base">{selectedPatient.phone || 'No registrado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Edad</p>
                          <p className="text-base">{selectedPatient.age ? `${selectedPatient.age} años` : 'No registrado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Género</p>
                          <p className="text-base">{selectedPatient.gender || 'No registrado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">ID del Paciente</p>
                          <p className="text-base font-mono text-sm">{selectedPatient.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="appointments" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Historial de Citas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const appointments = getPatientAppointments(selectedPatient.id);
                        if (appointments.length === 0) {
                          return <p className="text-gray-600 text-center py-8">No hay citas registradas</p>;
                        }
                        return (
                          <div className="space-y-3">
                            {appointments.map((apt: any) => (
                              <div key={apt.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge className={apt.service === 'fisioterapia' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                                    {apt.service}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(apt.createdAt).toLocaleDateString('es-MX')}
                                  </span>
                                </div>
                                <p className="text-sm">
                                  <span className="font-medium">Fecha:</span> {new Date(apt.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Hora:</span> {apt.time}
                                </p>
                                {apt.reason && (
                                  <p className="text-sm mt-2">
                                    <span className="font-medium">Motivo:</span> {apt.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="nutrition" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        Evaluaciones de Nutrición
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const forms = getPatientNutritionForms(selectedPatient.id);
                        if (forms.length === 0) {
                          return <p className="text-gray-600 text-center py-8">No hay evaluaciones de nutrición</p>;
                        }
                        return (
                          <div className="space-y-4">
                            {forms.map((form: any) => (
                              <div key={form.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-gray-500 mb-3">
                                  Evaluación: {new Date(form.submittedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="font-medium text-gray-700">Peso</p>
                                    <p>{form.weight} kg</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Altura</p>
                                    <p>{form.height} cm</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">IMC</p>
                                    <p>{(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Comidas/día</p>
                                    <p>{form.mealsPerDay || 'No especificado'}</p>
                                  </div>
                                </div>
                                {form.allergies && (
                                  <div className="mt-3">
                                    <p className="font-medium text-gray-700 text-sm">Alergias</p>
                                    <p className="text-sm">{form.allergies}</p>
                                  </div>
                                )}
                                {form.healthGoals && (
                                  <div className="mt-3">
                                    <p className="font-medium text-gray-700 text-sm">Objetivos</p>
                                    <p className="text-sm">{form.healthGoals}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="physiotherapy" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Evaluaciones de Fisioterapia
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const forms = getPatientPhysiotherapyForms(selectedPatient.id);
                        if (forms.length === 0) {
                          return <p className="text-gray-600 text-center py-8">No hay evaluaciones de fisioterapia</p>;
                        }
                        return (
                          <div className="space-y-4">
                            {forms.map((form: any) => (
                              <div key={form.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-500 mb-3">
                                  Evaluación: {new Date(form.submittedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <div className="space-y-3 text-sm">
                                  {form.chiefComplaint && (
                                    <div>
                                      <p className="font-medium text-gray-700">Síntoma Principal</p>
                                      <p>{form.chiefComplaint}</p>
                                    </div>
                                  )}
                                  {form.painLocation && (
                                    <div>
                                      <p className="font-medium text-gray-700">Ubicación del Dolor</p>
                                      <p>{form.painLocation}</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-3">
                                    {form.painLevel && (
                                      <div>
                                        <p className="font-medium text-gray-700">Nivel de Dolor</p>
                                        <p>{form.painLevel}</p>
                                      </div>
                                    )}
                                    {form.painType && (
                                      <div>
                                        <p className="font-medium text-gray-700">Tipo de Dolor</p>
                                        <p className="capitalize">{form.painType}</p>
                                      </div>
                                    )}
                                  </div>
                                  {form.mobilityLevel && (
                                    <div>
                                      <p className="font-medium text-gray-700">Nivel de Movilidad</p>
                                      <p className="capitalize">{form.mobilityLevel.replace('-', ' ')}</p>
                                    </div>
                                  )}
                                  {form.goals && (
                                    <div>
                                      <p className="font-medium text-gray-700">Objetivos</p>
                                      <p>{form.goals}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
