/**
 * ============================================================================
 * ARCHIVO: ManagePractitionersPage.tsx (Versión Sincronizada y Blindada)
 * PROPÓSITO: Gestión de practicantes autorizados acorde a esquema SQL e index.js
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, Trash2, UserCheck, UserX, Activity, Utensils } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagePractitionersPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [docentes, setDocentes] = useState<any[]>([]);
  const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');
  
  // Estado del formulario
  const [nuevoD, setNuevoD] = useState({
    nombre: '',
    email: '',
    area: '' as 'nutricion' | 'fisioterapia' | '',
  });

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  /**
   * EFECTO: Sincronización con el Administrador logueado
   */
  useEffect(() => {
    if (user) {
      cargarDocentes();
      // BLINDAJE: Si el admin tiene un área asignada, forzamos esa área en el formulario y filtro
      if (user.area) {
        setNuevoD(prev => ({ ...prev, area: user.area as 'nutricion' | 'fisioterapia' }));
        setAreaFilter(user.area as 'nutricion' | 'fisioterapia');
      }
    }
  }, [user]);

  // CARGAR DOCENTES (GET /api/practicantes)
  const cargarDocentes = async () => {
    try {
      const url = user?.area 
        ? `http://localhost:3001/api/practicantes?area=${user.area}` 
        : 'http://localhost:3001/api/practicantes';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Sincronización con las columnas de la tabla 'practicantes_autorizados'
        const listaMapeada = data.map((d: any) => ({
          id: d.id.toString(),
          name: d.nombre, // Cambiado de d.name a d.nombre para coincidir con index.js
          email: d.email,
          area: d.area,
          status: d.estado || 'activo', 
          dateAdded: d.fecha_autorizacion
        }));
        setDocentes(listaMapeada);
      }
    } catch (error) {
      toast.error('Error de conexión al cargar lista');
    }
  };

  // AGREGAR DOCENTE (POST /api/practicantes)
  const handleAgregarDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoD.nombre || !nuevoD.email || !nuevoD.area) {
      toast.error('Brah, faltan datos: Nombre, Email y Área son obligatorios');
      return;
    }

    if (user?.area && nuevoD.area !== user.area) {
      toast.error(`Acceso denegado: Solo puede autorizar personal para ${user.area}`);
      return;
    }

    try {
      /**
       * CORRECCIÓN DE DISCREPANCIA:
       * El backend index.js espera { nombre, email, area, estado, fecha_autorizacion }
       */
      const response = await fetch('http://localhost:3001/api/practicantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoD.nombre.trim(), // Nombre exacto que pide el INSERT en index.js
          email: nuevoD.email.trim().toLowerCase(), 
          area: nuevoD.area,
          estado: 'activo',
          fecha_autorizacion: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        toast.success(`Practicante autorizado en la base de datos PostgreSQL`);
        setNuevoD({ 
          nombre: '', 
          email: '', 
          area: (user?.area || '') as any 
        });
        setMostrandoFormulario(false);
        cargarDocentes(); 
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al guardar en BD');
      }
    } catch (error) {
      toast.error('Error de comunicación con el servidor');
    }
  };

  // CAMBIAR ESTADO (PUT /api/practicantes/:id)
  const handleCambiarEstado = async (id: string) => {
    const docente = docentes.find(d => d.id === id);
    if (!docente) return;
    const nuevoEstado = docente.status === 'activo' ? 'inactivo' : 'activo';

    try {
      const response = await fetch(`http://localhost:3001/api/practicantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        toast.success('Estado actualizado correctamente');
        cargarDocentes();
      }
    } catch (error) {
      toast.error('No se pudo actualizar el estado');
    }
  };

  // ELIMINAR (DELETE /api/practicantes/:id)
  const handleEliminarDocente = async (id: string) => {
    if (!window.confirm('¿Eliminar definitivamente la autorización?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/practicantes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Autorización removida de PostgreSQL');
        cargarDocentes();
      }
    } catch (error) {
      toast.error('Error al eliminar registro');
    }
  };

  const docentesFiltrados = docentes.filter(d => {
    if (user?.area) return d.area === user.area;
    if (areaFilter === 'todos') return true;
    return d.area === areaFilter;
  });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Sincronizando seguridad...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-blue-900/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold">UTC</div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Gestión de Personal</h1>
                <p className="text-xs text-slate-500 capitalize">Área Responsable: {user?.area || 'Administración Global'}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)} className="border-blue-900/20 text-blue-900 font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Panel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* SECCIÓN DE AUTORIZACIÓN */}
        <Card className="border-blue-900/10 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-blue-900 text-lg font-bold">Autorizar Nuevo Practicante</CardTitle>
              <CardDescription className="font-medium text-slate-500">Vincule un correo institucional para permitir el acceso al sistema.</CardDescription>
            </div>
            {!mostrandoFormulario && (
              <Button onClick={() => setMostrandoFormulario(true)} className="bg-blue-900 hover:bg-blue-800 font-bold shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            )}
          </CardHeader>

          {mostrandoFormulario && (
            <CardContent className="animate-in fade-in slide-in-from-top-2 duration-300">
              <form onSubmit={handleAgregarDocente} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-blue-50/20">
                <div className="space-y-2">
                  <Label className="text-blue-900 font-bold">Nombre Completo</Label>
                  <Input value={nuevoD.nombre} onChange={(e) => setNuevoD({...nuevoD, nombre: e.target.value})} placeholder="Nombre completo del alumno" required className="bg-white border-blue-900/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 font-bold">Correo Institucional (@utc.edu.mx)</Label>
                  <Input type="email" value={nuevoD.email} onChange={(e) => setNuevoD({...nuevoD, email: e.target.value})} placeholder="alumno@utc.edu.mx" required className="bg-white border-blue-900/20" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-blue-900 font-bold">Área de Práctica</Label>
                  <Select value={nuevoD.area} onValueChange={(v: any) => setNuevoD({...nuevoD, area: v})} disabled={!!user?.area}>
                    <SelectTrigger className="bg-white border-blue-900/20"><SelectValue placeholder="Selecciona la carrera correspondiente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nutricion">Nutrición</SelectItem>
                      <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 px-8 font-bold shadow-md">Confirmar Autorización</Button>
                  <Button type="button" variant="ghost" onClick={() => setMostrandoFormulario(false)} className="text-slate-500 font-bold">Cancelar</Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* TABLA DE REGISTROS REALES */}
        <Card className="border-blue-900/10 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-blue-900 font-bold">Personal Autorizado (PostgreSQL)</CardTitle>
            {!user?.area && (
              <Select value={areaFilter} onValueChange={(v: any) => setAreaFilter(v)}>
                <SelectTrigger className="w-[180px] bg-white border-blue-900/20"><SelectValue placeholder="Filtrar por área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los departamentos</SelectItem>
                  <SelectItem value="nutricion">Nutrición</SelectItem>
                  <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-bold text-blue-900">Nombre / Identificador</TableHead>
                    <TableHead className="font-bold text-blue-900">Área</TableHead>
                    <TableHead className="font-bold text-blue-900">Estado BD</TableHead>
                    <TableHead className="font-bold text-blue-900 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docentesFiltrados.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">No hay registros encontrados en PostgreSQL.</TableCell></TableRow>
                  ) : docentesFiltrados.map((docente) => (
                    <TableRow key={docente.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-900">{docente.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{docente.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm capitalize font-semibold">
                          {docente.area === 'fisioterapia' ? <Activity className="w-4 h-4 text-blue-900" /> : <Utensils className="w-4 h-4 text-orange-600" />}
                          {docente.area}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={docente.status === 'activo' ? 'bg-green-600 text-white font-bold' : 'bg-slate-200 text-slate-600 font-bold'}>
                          {docente.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleCambiarEstado(docente.id)} title="Alternar Estado" className="hover:bg-blue-50">
                            {docente.status === 'activo' ? <UserX className="w-4 h-4 text-orange-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEliminarDocente(docente.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}