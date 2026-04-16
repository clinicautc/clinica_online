/**
 * ============================================================================
 * ARCHIVO: PatientList.tsx (Versión Sincronizada PostgreSQL - Formato Arial)
 * PROPÓSITO: Listado en tiempo real con acceso a MedicalHistoryViewer.
 * FUNCIONALIDADES: Búsqueda dinámica, Scroll interno y Acceso a Historiales.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
// ICONOS
import { Users, Mail, Search, Loader2, UserCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

// Definimos la interfaz para que coincida con las columnas de SQL
interface Patient {
  id: number | string;
  nombre: string;
  email: string;
  rol: string;
  status?: string;
}

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // Hook para navegación

  /**
   * EFECTO: Carga inicial desde la Base de Datos
   */
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Petición a la API de Node.js
        const response = await fetch('http://localhost:3001/api/usuarios');
        
        if (response.ok) {
          const allUsers: Patient[] = await response.json();
          // Filtramos estrictamente a los que tienen rol 'paciente'
          const patientUsers = allUsers.filter(user => user.rol === 'paciente');
          setPatients(patientUsers);
        } else {
          throw new Error('Error en la respuesta del servidor');
        }
      } catch (error) {
        console.error("Error cargando pacientes:", error);
        toast.error("Error al sincronizar lista de pacientes");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
    // Sincronización automática cada 30 segundos
    const interval = setInterval(fetchPatients, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * FUNCIÓN: Ir al Historial Médico (MedicalHistoryViewer)
   */
  const handleViewHistory = (patientId: string | number) => {
    // Redirige al MedicalHistoryViewer pasando el ID del paciente como parámetro en la URL
    navigate(`/medical-history-viewer/${patientId}`);
  };

  /**
   * LÓGICA DE BÚSQUEDA DINÁMICA
   */
  const filteredPatients = patients.filter(patient => 
    patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toString().includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estilo base para forzar Arial en todo el componente
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  return (
    <Card className="border-blue-900/10 w-full bg-white shadow-lg overflow-hidden" style={arialStyle}>
      <CardHeader className="px-4 md:px-6 bg-slate-50/50 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-blue-900 text-xl md:text-2xl font-bold flex items-center gap-2" style={arialStyle}>
              <Users className="w-6 h-6" />
              Expedientes de Pacientes
            </CardTitle>
            <CardDescription className="font-medium" style={arialStyle}>
              Gestión de expedientes: Acceda a los historiales clínicos detallados.
            </CardDescription>
          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-900/20 focus:border-blue-900 rounded-full bg-white"
              style={arialStyle}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-900" />
            <p className="text-blue-900/50 font-medium" style={arialStyle}>Sincronizando con PostgreSQL...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-20 border-b border-dashed">
            <UserCircle className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium italic" style={arialStyle}>
              {searchTerm ? `No se encontraron coincidencias para "${searchTerm}"` : "No hay pacientes registrados en la base de datos."}
            </p>
          </div>
        ) : (
          /* CONTENEDOR CON SCROLL INTERNO PARA GESTIÓN DE VOLUMEN */
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/20">
            
            {/* VISTA MÓVIL: Formato de Tarjetas */}
            <div className="block md:hidden divide-y divide-blue-900/10">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="p-4 bg-white space-y-3 hover:bg-blue-50/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono font-bold text-blue-900/40">ID: {patient.id}</span>
                    <Badge className="bg-green-100 text-green-700 border-green-200 font-bold uppercase text-[9px]" style={arialStyle}>
                      REGISTRADO
                    </Badge>
                  </div>
                  <p className="font-black text-blue-950 uppercase" style={arialStyle}>{patient.nombre}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-2" style={arialStyle}>
                    <Mail className="w-3 h-3" /> {patient.email}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-900 hover:bg-blue-800 font-bold gap-2 text-xs"
                    onClick={() => handleViewHistory(patient.id)}
                  >
                    <BookOpen className="w-3 h-3" /> Historiales
                  </Button>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO: Tabla Estándar */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="text-blue-900 font-bold w-[80px]" style={arialStyle}>ID</TableHead>
                    <TableHead className="text-blue-900 font-bold" style={arialStyle}>Nombre Completo</TableHead>
                    <TableHead className="text-blue-900 font-bold" style={arialStyle}>Email Institucional</TableHead>
                    <TableHead className="text-blue-900 font-bold text-center" style={arialStyle}>Estado</TableHead>
                    <TableHead className="text-blue-900 font-bold text-right" style={arialStyle}>Expediente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-blue-50/50 transition-colors cursor-default">
                      <TableCell className="font-mono text-xs font-bold text-blue-900/60">
                        {patient.id}
                      </TableCell>
                      <TableCell className="font-bold text-blue-900 uppercase" style={arialStyle}>
                        {patient.nombre}
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium italic" style={arialStyle}>
                        {patient.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-600 text-white border-none font-black text-[9px] px-2 shadow-sm" style={arialStyle}>
                          ACTIVO
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white font-bold gap-2"
                          onClick={() => handleViewHistory(patient.id)}
                        >
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
      
      {/* FOOTER DE LA TABLA - INFORMACIÓN DE SINCRONIZACIÓN */}
      <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest" style={arialStyle}>
        <span>Total de registros: {filteredPatients.length}</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Base de Datos Conectada
        </span>
      </div>
    </Card>
  );
}