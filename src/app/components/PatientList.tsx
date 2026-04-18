import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Users, Mail, Search, Loader2, UserCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { endpoints } from '../lib/api'; // <-- TU API CENTRALIZADA

// Adiós a mockData! Tipado 100% SQL
interface Patient {
  id: number | string;
  nombre: string;
  email: string;
  rol: string;
}

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoints.usuarios); // <-- API

        if (response.ok) {
          const allUsers: Patient[] = await response.json();
          // Filtramos estrictamente a los pacientes
          const patientUsers = allUsers.filter(user => user.rol === 'paciente');
          setPatients(patientUsers);
        }
      } catch (error) {
        toast.error("Error al sincronizar lista de pacientes");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleViewHistory = (patientId: string | number) => {
    navigate(`/medical-history-viewer/${patientId}`);
  };

  const filteredPatients = patients.filter(patient =>
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toString().includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  return (
      <Card className="border-blue-900/10 w-full bg-white shadow-lg overflow-hidden" style={arialStyle}>
        <CardHeader className="px-4 md:px-6 bg-slate-50/50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-blue-900 text-xl md:text-2xl font-bold flex items-center gap-2" style={arialStyle}>
                <Users className="w-6 h-6" /> Expedientes de Pacientes
              </CardTitle>
              <CardDescription className="font-medium" style={arialStyle}>Gestión de expedientes: Acceda a los historiales clínicos.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  placeholder="Buscar por nombre o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-900/20 focus:border-blue-900 rounded-full bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-900" />
                <p className="text-blue-900/50 font-medium">Sincronizando con PostgreSQL...</p>
              </div>
          ) : filteredPatients.length === 0 ? (
              <div className="text-center py-20 border-b border-dashed">
                <UserCircle className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-medium italic">No se encontraron coincidencias en la base de datos.</p>
              </div>
          ) : (
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/20">
                <div className="block md:hidden divide-y divide-blue-900/10">
                  {filteredPatients.map((patient) => (
                      <div key={patient.id} className="p-4 bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono font-bold text-blue-900/40">ID: {patient.id}</span>
                          <Badge className="bg-green-100 text-green-700 border-green-200 font-bold uppercase text-[9px]">REGISTRADO</Badge>
                        </div>
                        <p className="font-black text-blue-950 uppercase">{patient.nombre}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2"><Mail className="w-3 h-3" /> {patient.email}</p>
                        <Button size="sm" className="w-full bg-blue-900 hover:bg-blue-800 font-bold gap-2 text-xs" onClick={() => handleViewHistory(patient.id)}>
                          <BookOpen className="w-3 h-3" /> Historiales
                        </Button>
                      </div>
                  ))}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="text-blue-900 font-bold w-[80px]">ID</TableHead>
                        <TableHead className="text-blue-900 font-bold">Nombre Completo</TableHead>
                        <TableHead className="text-blue-900 font-bold">Email Institucional</TableHead>
                        <TableHead className="text-blue-900 font-bold text-center">Estado</TableHead>
                        <TableHead className="text-blue-900 font-bold text-right">Expediente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                          <TableRow key={patient.id} className="hover:bg-blue-50/50 transition-colors">
                            <TableCell className="font-mono text-xs font-bold text-blue-900/60">{patient.id}</TableCell>
                            <TableCell className="font-bold text-blue-900 uppercase">{patient.nombre}</TableCell>
                            <TableCell className="text-slate-600 font-medium italic">{patient.email}</TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-600 text-white border-none font-black text-[9px] px-2 shadow-sm">ACTIVO</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white font-bold gap-2" onClick={() => handleViewHistory(patient.id)}>
                                <BookOpen className="w-4 h-4" /> Historiales
                              </Button>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
}