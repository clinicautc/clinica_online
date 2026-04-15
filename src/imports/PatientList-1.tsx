import React, { useState, useEffect } from 'react';
// UI: Componentes de Shadcn para tablas y contenedores
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// DATA: Tipado y datos iniciales de usuarios
import { mockUsers, User } from '../lib/mockData';
// ICONOS: Lucide para representar usuarios y correos
import { Users, Mail } from 'lucide-react';

export default function PatientList() {
  const [patients, setPatients] = useState<User[]>([]);

  useEffect(() => {
    // Recuperamos todos los usuarios y filtramos solo a los pacientes
    const stored = localStorage.getItem('utc_users');
    const allUsers = stored ? JSON.parse(stored) : mockUsers;
    
    const patientUsers = allUsers.filter((user: User) => user.role === 'paciente');
    setPatients(patientUsers);
  }, []);

  return (
    <Card className="border-blue-900/10 w-full">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-blue-900 text-xl md:text-2xl">Lista de Pacientes</CardTitle>
        <CardDescription>
          Todos los pacientes registrados en el sistema de la universidad
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        {patients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-blue-900/30 mb-3" />
            <p className="text-blue-900/60">No se encontraron pacientes</p>
          </div>
        ) : (
          <div className="border border-blue-900/10 rounded-lg overflow-hidden">
            {/* VISTA MÓVIL: Se muestran tarjetas en lugar de tabla para mejor lectura */}
            <div className="block md:hidden divide-y divide-blue-900/10">
              {patients.map((patient) => (
                <div key={patient.id} className="p-4 bg-white space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-blue-900/40">#{patient.id}</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
                  </div>
                  <p className="font-bold text-blue-900">{patient.name}</p>
                  <p className="text-sm text-blue-900/60 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> {patient.email}
                  </p>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO: Tabla estándar para pantallas grandes */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-900/5">
                    <TableHead className="text-blue-900">ID</TableHead>
                    <TableHead className="text-blue-900">Nombre</TableHead>
                    <TableHead className="text-blue-900">Email</TableHead>
                    <TableHead className="text-blue-900">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-sm text-blue-900/70">#{patient.id}</TableCell>
                      <TableCell className="font-medium text-blue-900">{patient.name}</TableCell>
                      <TableCell className="text-blue-900/70">{patient.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
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

/**

* * 1. <Card />, <CardHeader />, <CardTitle />: Componentes de Shadcn que crean 
 * la estructura de "tarjeta" que envuelve toda la lista de pacientes.

* * 2. <Table />, <TableHeader />, <TableBody />, <TableRow />, <TableCell />: 
 * Etiquetas especializadas para construir tablas de datos. Cada TableCell 
 * representa una celda o columna individual de información.

* * 3. <Badge />: Se utiliza aquí para mostrar el estado del paciente (ej: Activo) 
 * con un diseño visual llamativo.

* * 4. <div className="hidden md:block">: Esta etiqueta de Tailwind es clave; 
 * oculta la tabla en celulares (hidden) y solo la muestra en pantallas medianas 
 * o grandes (md:block).

* * 5. <div className="block md:hidden">: Lo opuesto a la anterior; muestra la 
 * información en formato de lista para celulares y la oculta en computadoras.

* * 6. <Users />, <Mail />: Iconos de la librería Lucide-React que ayudan a 
 * identificar visualmente la sección de pacientes y los correos electrónicos.

* * 7. {patients.map((patient) => (...))}: Lógica de JavaScript que genera 
 * automáticamente una fila de la tabla por cada paciente en la base de datos.
 
* * 8. <span className="font-mono">: Etiqueta de texto que aplica una fuente de 
 * "máquina de escribir" (monoespaciada), ideal para códigos o IDs numéricos.
 * ==============================================================================
 */