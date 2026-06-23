/**
 * ============================================================================
 * ARCHIVO: ManagePersonnelPage.tsx (Versión Sincronizada y Blindada)
 * PROPÓSITO: Gestión de personal (practicantes y docentes) acorde a esquema SQL e index.js
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
import { ArrowLeft, Plus, Trash2, UserCheck, UserMinus, Shield, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { practicantesAPI, usuariosAPI } from '../lib/api';

export default function ManagePersonnelPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [docentes, setDocentes] = useState<any[]>([]);
  const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');

  // Tipo de acceso a registrar: practicante (alumno) o docente (responsable académico)
  const [tipoAcceso, setTipoAcceso] = useState<'practicante' | 'docente'>('practicante');

  // Estado del formulario
  const [nuevoD, setNuevoD] = useState({
    nombre: '',
    email: '',
    matricula: '',
    numero_empleado: '',
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
      const data = await practicantesAPI.getAll(user?.area || undefined);
      // Sincronización con las columnas de la tabla 'practicantes_autorizados'
      const listaMapeada = data.map((d: any) => ({
        id: d.id.toString(),
        name: d.nombre, // Cambiado de d.name a d.nombre para coincidir con index.js
        email: d.email,
        area: d.area,
        status: d.status || 'activo', // el backend devuelve "status", no "estado" — antes nunca se reflejaba el cambio real
        dateAdded: d.fecha_autorizacion,
        rol: d.rol, // 'practicante' o 'admin' (docente) — distingue el tipo en la tabla
        numeroEmpleado: d.numero_empleado
      }));
      setDocentes(listaMapeada);
    } catch (error) {
      toast.error('Error de conexión al cargar lista');
    }
  };

  // AGREGAR PERSONAL (POST /api/practicantes) — practicante o docente según tipoAcceso
  const handleAgregarDocente = async (e: React.FormEvent) => {
    e.preventDefault();

    const esDocente = tipoAcceso === 'docente';
    const identificador = esDocente ? nuevoD.numero_empleado : nuevoD.matricula;

    if (!nuevoD.nombre || !nuevoD.email || !identificador || !nuevoD.area) {
      toast.error('Brah, faltan datos: Nombre, Email, Área e Identificador son obligatorios');
      return;
    }

    if (user?.area && nuevoD.area !== user.area) {
      toast.error(`Acceso denegado: Solo puede autorizar personal para ${user.area}`);
      return;
    }

    try {
      await practicantesAPI.create({
        tipo: tipoAcceso,
        nombre: nuevoD.nombre.trim(),
        email: nuevoD.email.trim().toLowerCase(),
        matricula: esDocente ? undefined : nuevoD.matricula.trim(),
        numero_empleado: esDocente ? nuevoD.numero_empleado.trim() : undefined,
        area: nuevoD.area
      });

      toast.success(
        `${esDocente ? 'Docente' : 'Practicante'} autorizado correctamente.\nContraseña temporal: UTC${identificador}`
      );
      setNuevoD({
        nombre: '',
        email: '',
        matricula: '',
        numero_empleado: '',
        area: (user?.area || '') as any
      });
      setMostrandoFormulario(false);
      cargarDocentes();
    } catch (error: any) {
      toast.error(error.message || 'Error de comunicación con el servidor');
    }
  };

  // CAMBIAR ESTADO (PUT /api/usuarios/:id) — misma llamada que usa MasterAdminDashboard;
  // practicantesAPI.updateStatus apunta a la tabla muerta practicantes_autorizados y no
  // surte efecto real sobre usuarios.status, por eso se usa usuariosAPI aquí.
  // Activar siempre manda 'activo' y Desactivar siempre manda 'inactivo' (sin inferir por toggle).
  const handleCambiarEstado = async (id: string, nuevoEstado: 'activo' | 'inactivo') => {
    try {
      await usuariosAPI.updateStatus(id, nuevoEstado);
      toast.success('Estado actualizado correctamente');
      cargarDocentes();
    } catch (error) {
      toast.error('No se pudo actualizar el estado');
    }
  };

  // ELIMINAR (DELETE /api/usuarios/:id) — practicantesAPI.remove() apuntaba a
  // DELETE /api/practicantes/:id, ruta que nunca existió en practicantesRoutes.js
  // (404 "Cannot DELETE"). usuariosAPI.remove() sí está implementada y borra
  // el registro real de "usuarios".
  const handleEliminarDocente = async (id: string) => {
    if (!window.confirm('¿Eliminar definitivamente la autorización?')) return;
    try {
      await usuariosAPI.remove(id);
      toast.success('Autorización removida de PostgreSQL');
      cargarDocentes();
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
              <CardTitle className="text-blue-900 text-lg font-bold">
                {tipoAcceso === 'docente' ? 'Autorizar Nuevo Docente' : 'Autorizar Nuevo Practicante'}
              </CardTitle>
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
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-blue-900 font-bold">Tipo de Acceso</Label>
                  <Select
                    value={tipoAcceso}
                    onValueChange={(v: any) => {
                      setTipoAcceso(v);
                      setNuevoD({ ...nuevoD, matricula: '', numero_empleado: '' });
                    }}
                  >
                    <SelectTrigger className="bg-white border-blue-900/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practicante">Practicante</SelectItem>
                      <SelectItem value="docente">Docente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 font-bold">Nombre Completo</Label>
                  <Input value={nuevoD.nombre} onChange={(e) => setNuevoD({...nuevoD, nombre: e.target.value})} placeholder={tipoAcceso === 'docente' ? 'Nombre completo del docente' : 'Nombre completo del alumno'} required className="bg-white border-blue-900/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 font-bold">Correo Institucional</Label>
                  <Input type="email" value={nuevoD.email} onChange={(e) => setNuevoD({...nuevoD, email: e.target.value})} placeholder={tipoAcceso === 'docente' ? 'docente@utc.mx' : 'alumno@utc.edu.mx'} required className="bg-white border-blue-900/20" />
                </div>
                {tipoAcceso === 'docente' ? (
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-bold">Número de Empleado</Label>
                    <Input value={nuevoD.numero_empleado} onChange={(e) => setNuevoD({...nuevoD, numero_empleado: e.target.value.replace(/\D/g, '').slice(0, 9)})} placeholder="Número de empleado" maxLength={9} required className="bg-white border-blue-900/20" />
                  </div>
                ) : (
                  <div className="space-y-2">
                   <Label className="text-blue-900 font-bold"> Matrícula</Label>
                   <Input value={nuevoD.matricula}onChange={(e) =>setNuevoD({...nuevoD,matricula: e.target.value.replace(/\D/g, '').slice(0, 9)})} placeholder="Matricula 9 digitos" maxLength={9} required className="bg-white border-blue-900/20"/>
                  </div>
                )}
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
            <CardTitle className="text-blue-900 font-bold">Personal Autorizado </CardTitle>
            {!user?.area && (
              <Select value={areaFilter} onValueChange={(v: any) => setAreaFilter(v)}>
                <SelectTrigger className="w-[207px] bg-white border-blue-200 text-blue-900 font-bold h-10.75 rounded-xl shadow-sm text-base">
                  <div className="flex items-center gap-2.5">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <SelectValue placeholder="Filtrar por área" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                  <SelectItem value="nutricion">Nutrición</SelectItem>
                  <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[600px]">
            <Table>
              <TableHeader className="bg-white sticky top-0 z-20 border-b">
                <TableRow>
                  <TableHead className="pl-4 text-blue-900 font-black uppercase tracking-widest">Información del Docente</TableHead>
                  {/* NUEVA CABECERA ROL */}
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Rol</TableHead>
                  <TableHead className="text-blue-900 font-black uppercase tracking-widest text-center">Area</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Estado</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Activar</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Desactivar</TableHead>
                  <TableHead className="text-right pr-4 text-blue-900 font-black uppercase tracking-widest">Eliminar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docentesFiltrados.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400 italic">No hay registros encontrados en PostgreSQL.</TableCell></TableRow>
                ) : docentesFiltrados.map((docente) => (
                  <TableRow
                    key={docente.id}
                    className={`group transition-all ${docente.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'hover:bg-blue-50/50'}`}
                  >
                    <TableCell className="pl-4">
                      <div className="flex flex-col">
                        <span className={`text-base font-bold ${docente.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>
                          {docente.name}
                        </span>
                        <span className="text-sm text-gray-400 font-medium italic">{docente.email}</span>
                      </div>
                    </TableCell>

                    {/* COLUMNA ROL: DISEÑO DE BORDES COLOREADOS SIN FONDO (OUTLINE) */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge
                          variant="outline"
                          className={`bg-transparent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border-2 ${
                            docente.rol === 'admin'
                              ? "text-purple-700 border-purple-500/40"
                              : "text-blue-500 border-blue-400/40"
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {docente.rol === 'admin' ? 'Docente Titular' : 'Practicante'}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-tighter shadow-sm ${
                          docente.area === 'nutricion'
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        {docente.area || 'GENERAL'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <span className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                          docente.status === 'activo'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${docente.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                          {docente.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="default"
                        disabled={docente.status === 'activo'}
                        onClick={() => handleCambiarEstado(docente.id, 'activo')}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-30"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={docente.status === 'inactivo'}
                        onClick={() => handleCambiarEstado(docente.id, 'inactivo')}
                        className="border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl disabled:opacity-30"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEliminarDocente(docente.id)}
                          className="rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}