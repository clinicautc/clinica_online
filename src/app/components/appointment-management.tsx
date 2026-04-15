import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar, Clock, Search, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Appointment = {
  id: string;
  userId: string;
  service: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: string;
};

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const demoPatients = [
    { id: '1', name: 'Juan Pérez', email: 'paciente@utc.edu' },
    { id: '3', name: 'María López', email: 'maria.lopez@utc.edu' },
    { id: '4', name: 'Carlos Ramírez', email: 'carlos.ramirez@utc.edu' },
    { id: '5', name: 'Ana García', email: 'ana.garcia@utc.edu' },
  ];

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, filterService, filterDate]);

  const loadAppointments = () => {
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    setAppointments(allAppointments.sort((a: Appointment, b: Appointment) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filtrar por búsqueda (nombre del paciente)
    if (searchTerm) {
      filtered = filtered.filter((apt) => {
        const patient = demoPatients.find((p) => p.id === apt.userId);
        return patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filtrar por servicio
    if (filterService !== 'all') {
      filtered = filtered.filter((apt) => apt.service === filterService);
    }

    // Filtrar por fecha
    if (filterDate) {
      filtered = filtered.filter((apt) => apt.date === filterDate);
    }

    setFilteredAppointments(filtered);
  };

  const deleteAppointment = (id: string) => {
    const updated = appointments.filter((apt) => apt.id !== id);
    localStorage.setItem('appointments', JSON.stringify(updated));
    setAppointments(updated);
    toast.success('Cita eliminada correctamente');
  };

  const getPatientName = (userId: string) => {
    const patient = demoPatients.find((p) => p.id === userId);
    return patient?.name || 'Paciente Desconocido';
  };

  const getServiceBadge = (service: string) => {
    if (service === 'fisioterapia') {
      return <Badge className="bg-blue-100 text-blue-700">Fisioterapia</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Nutrición</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Gestión de Citas
        </CardTitle>
        <CardDescription>
          Administra todas las citas programadas en la clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Paciente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Nombre del paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filterService">Filtrar por Servicio</Label>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger id="filterService">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                <SelectItem value="nutricion">Nutrición</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filterDate">Filtrar por Fecha</Label>
            <Input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{filteredAppointments.length}</p>
            <p className="text-sm text-gray-600">Citas Encontradas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {filteredAppointments.filter((a) => a.service === 'fisioterapia').length}
            </p>
            <p className="text-sm text-gray-600">Fisioterapia</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {filteredAppointments.filter((a) => a.service === 'nutricion').length}
            </p>
            <p className="text-sm text-gray-600">Nutrición</p>
          </div>
        </div>

        {/* Tabla de citas */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron citas</p>
            <p className="text-sm text-gray-500 mt-2">Ajusta los filtros para ver más resultados</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {getPatientName(appointment.userId)}
                    </TableCell>
                    <TableCell>{getServiceBadge(appointment.service)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(appointment.date).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {appointment.time}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {appointment.reason || 'Sin especificar'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
