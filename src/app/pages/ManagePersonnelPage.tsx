/**
 * ============================================================================
 * ARCHIVO: ManagePersonnelPage.tsx
 * PROPÓSITO: Gestión de personal — registro, horario de prácticas y asistencia.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import {
  ArrowLeft, Plus, Trash2, UserCheck, UserMinus, Shield,
  Filter, CalendarClock, ClipboardCheck, CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { practicantesAPI, usuariosAPI, asistenciaAPI, PracticanteAsistencia, AsistenciaMesEntry, DiaSemana } from '../lib/api';
import { capitalizeWords } from '../lib/textFormat';
import HorarioPracticas from '../components/HorarioPracticas';
import ViewModeToggle from '../components/ViewModeToggle';
import DateFilterPicker from '../components/DateFilterPicker';
import MonthFilterPicker from '../components/MonthFilterPicker';

export default function ManagePersonnelPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [docentes, setDocentes] = useState<any[]>([]);
  const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');
  const [tipoAcceso, setTipoAcceso] = useState<'practicante' | 'docente'>('practicante');
  const [nuevoD, setNuevoD] = useState({
    nombre: '',
    email: '',
    matricula: '',
    numero_empleado: '',
    area: '' as 'nutricion' | 'fisioterapia' | '',
  });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [confirmAlta, setConfirmAlta] = useState(false);

  // Horario durante el registro (sin usuarioId aún)
  const [horarioNuevo, setHorarioNuevo] = useState<DiaSemana[]>([]);
  // ID del practicante recién creado para upsert del horario post-registro
  const [pendienteHorarioId, setPendienteHorarioId] = useState<number | null>(null);

  // Modal de edición de horario por fila
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);
  const [horarioModalId, setHorarioModalId] = useState<string | null>(null);
  const [horarioModalNombre, setHorarioModalNombre] = useState('');

  // Asistencia
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const [viewModeAsistencia, setViewModeAsistencia] = useState<'day' | 'month'>('day');
  const [selectedDateAsistencia, setSelectedDateAsistencia] = useState(hoy);
  const [selectedMonthAsistencia, setSelectedMonthAsistencia] = useState(format(new Date(), 'yyyy-MM'));
  const [asistencia, setAsistencia] = useState<PracticanteAsistencia[]>([]);
  const [asistenciasMes, setAsistenciasMes] = useState<AsistenciaMesEntry[]>([]);
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<number, 'presente' | 'ausente'>>({});
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [cargandoAsistencia, setCargandoAsistencia] = useState(false);
  const [cargandoMes, setCargandoMes] = useState(false);

  useEffect(() => {
    if (user) {
      cargarDocentes();
      if (user.area) {
        setNuevoD(prev => ({ ...prev, area: user.area as 'nutricion' | 'fisioterapia' }));
        setAreaFilter(user.area as 'nutricion' | 'fisioterapia');
      }
      if (user.rol === 'admin') setTipoAcceso('practicante');
    }
  }, [user]);

  useEffect(() => {
    if (!user || viewModeAsistencia !== 'day') return;
    cargarAsistencia();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewModeAsistencia, selectedDateAsistencia]);

  useEffect(() => {
    if (!user || viewModeAsistencia !== 'month') return;
    cargarAsistenciaMes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewModeAsistencia, selectedMonthAsistencia]);

  // Cuando se crea un practicante, persiste su horario si fue configurado
  useEffect(() => {
    if (!pendienteHorarioId || horarioNuevo.length === 0) return;
    const diasActivos = horarioNuevo.filter(d => d.activo);
    if (diasActivos.length === 0) { setPendienteHorarioId(null); return; }
    import('../lib/api').then(({ horariosAPI }) => {
      horariosAPI.upsert(pendienteHorarioId, horarioNuevo)
        .then(() => toast.success('Horario de prácticas guardado.'))
        .catch(() => toast.error('El practicante fue registrado pero no se pudo guardar el horario.'))
        .finally(() => { setPendienteHorarioId(null); setHorarioNuevo([]); });
    });
  }, [pendienteHorarioId]);

  const cargarDocentes = async () => {
    try {
      const data = await practicantesAPI.getAll(user?.area || undefined);
      setDocentes(data.map((d: any) => ({
        id: d.id.toString(),
        name: d.nombre,
        email: d.email,
        area: d.area,
        status: d.status || 'activo',
        dateAdded: d.fecha_autorizacion,
        rol: d.rol,
        numeroEmpleado: d.numero_empleado,
      })));
    } catch {
      toast.error('Error de conexión al cargar lista');
    }
  };

  const cargarAsistencia = useCallback(async () => {
    setCargandoAsistencia(true);
    try {
      const data = await asistenciaAPI.getByFecha(selectedDateAsistencia, user?.area || undefined);
      setAsistencia(data);
      const init: Record<number, 'presente' | 'ausente'> = {};
      data.forEach(p => {
        if (p.asistencia === 'presente' || p.asistencia === 'ausente') {
          init[p.id] = p.asistencia;
        }
      });
      setEstadosAsistencia(init);
    } catch {
    } finally {
      setCargandoAsistencia(false);
    }
  }, [selectedDateAsistencia, user?.area]);

  const cargarAsistenciaMes = useCallback(async () => {
    setCargandoMes(true);
    try {
      const data = await asistenciaAPI.getByMes(selectedMonthAsistencia, user?.area || undefined);
      setAsistenciasMes(data);
    } catch {
    } finally {
      setCargandoMes(false);
    }
  }, [selectedMonthAsistencia, user?.area]);

  const handleAgregarDocente = (e: React.FormEvent) => {
    e.preventDefault();
    const esDocente = tipoAcceso === 'docente';
    const identificador = esDocente ? nuevoD.numero_empleado : nuevoD.matricula;
    if (!nuevoD.nombre || !nuevoD.email || !identificador || !nuevoD.area) {
      toast.error('Faltan datos: Nombre, Email, Área e Identificador son obligatorios');
      return;
    }
    if (user?.area && nuevoD.area !== user.area) {
      toast.error(`Acceso denegado: Solo puede autorizar personal para ${user.area}`);
      return;
    }
    setConfirmAlta(true);
  };

  const handleConfirmarAlta = async () => {
    setConfirmAlta(false);
    const esDocente = tipoAcceso === 'docente';
    const identificador = esDocente ? nuevoD.numero_empleado : nuevoD.matricula;
    try {
      const creado = await practicantesAPI.create({
        tipo: tipoAcceso,
        nombre: capitalizeWords(nuevoD.nombre),
        email: nuevoD.email.trim().toLowerCase(),
        matricula: esDocente ? undefined : nuevoD.matricula.trim(),
        numero_empleado: esDocente ? nuevoD.numero_empleado.trim() : undefined,
        area: nuevoD.area,
      });
      toast.success(`${esDocente ? 'Docente' : 'Practicante'} autorizado.\nContraseña temporal: UTC${identificador}`);
      if (!esDocente && creado?.id) setPendienteHorarioId(creado.id);
      setNuevoD({ nombre: '', email: '', matricula: '', numero_empleado: '', area: (user?.area || '') as any });
      setMostrandoFormulario(false);
      cargarDocentes();
    } catch (error: any) {
      toast.error(error.message || 'Error de comunicación con el servidor');
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: 'activo' | 'inactivo') => {
    try {
      await usuariosAPI.updateStatus(id, nuevoEstado);
      toast.success('Estado actualizado correctamente');
      cargarDocentes();
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const handleEliminarDocente = async (id: string) => {
    if (!window.confirm('¿Eliminar definitivamente la autorización?')) return;
    try {
      await usuariosAPI.remove(id);
      toast.success('Autorización removida');
      cargarDocentes();
    } catch {
      toast.error('Error al eliminar registro');
    }
  };

  const abrirHorarioModal = (id: string, nombre: string) => {
    setHorarioModalId(id);
    setHorarioModalNombre(nombre);
    setHorarioModalOpen(true);
  };

  const toggleAsistencia = (id: number) => {
    setEstadosAsistencia(prev => {
      const actual = prev[id];
      if (actual === 'presente') return { ...prev, [id]: 'ausente' };
      if (actual === 'ausente') { const nuevo = { ...prev }; delete nuevo[id]; return nuevo; }
      return { ...prev, [id]: 'presente' };
    });
  };

  const handleGuardarAsistencia = async () => {
    const registros = Object.entries(estadosAsistencia).map(([uid, estado]) => ({
      usuario_id: Number(uid),
      estado,
    }));
    if (registros.length === 0) {
      toast.error('Marca al menos un practicante antes de guardar.');
      return;
    }
    setGuardandoAsistencia(true);
    try {
      await asistenciaAPI.registrar(selectedDateAsistencia, registros);
      toast.success(`Asistencia del ${format(new Date(selectedDateAsistencia + 'T00:00:00'), 'dd/MM/yyyy')} registrada.`);
      cargarDocentes();
      cargarAsistencia();
    } catch {
      toast.error('Error al registrar asistencia.');
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  const docentesFiltrados = docentes.filter(d => {
    if (user?.area) return d.area === user.area;
    if (areaFilter === 'todos') return true;
    return d.area === areaFilter;
  });

  const practicantesFiltrados = asistencia.filter(p => {
    if (user?.area) return p.area === user.area;
    if (areaFilter === 'todos') return true;
    return p.area === areaFilter;
  });

  const asistenciasMesFiltradas = asistenciasMes.filter(e => {
    if (user?.area) return e.area === user.area;
    if (areaFilter === 'todos') return true;
    return e.area === areaFilter;
  });

  const diasConAsistencia = Object.entries(
    asistenciasMesFiltradas.reduce((acc, e) => {
      if (!acc[e.fecha]) acc[e.fecha] = [];
      acc[e.fecha].push(e);
      return acc;
    }, {} as Record<string, AsistenciaMesEntry[]>)
  ).sort(([a], [b]) => b.localeCompare(a));

  const esHoySeleccionado = selectedDateAsistencia === hoy;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Sincronizando seguridad...</div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60" />
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10" />
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10" />

      <header className="relative z-10 bg-white/90 backdrop-blur-sm border-b border-blue-900/10 shadow-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold">UTC</div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Gestión de Personal</h1>
              <p className="text-xs text-slate-500 capitalize">Área: {user?.area || 'Administración Global'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} className="border-blue-900/20 text-blue-900 font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Panel
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6 relative z-10">

        {/* ======================================================
            SECCIÓN 1 — REGISTRO DE PERSONAL
        ====================================================== */}
        <Card className="border-blue-900/10 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-blue-900 text-lg font-bold">
                {tipoAcceso === 'docente' ? 'Autorizar Nuevo Docente' : 'Autorizar Nuevo Practicante'}
              </CardTitle>
              <CardDescription className="font-medium text-slate-500">
                Vincule un correo institucional para permitir el acceso al sistema.
              </CardDescription>
            </div>
            {!mostrandoFormulario && (
              <Button onClick={() => setMostrandoFormulario(true)} className="bg-blue-900 hover:bg-blue-800 font-bold shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            )}
          </CardHeader>

          {mostrandoFormulario && (
            <CardContent className="animate-in fade-in slide-in-from-top-2 duration-300">
              <form
                onSubmit={handleAgregarDocente}
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                className="space-y-4 p-4 border rounded-xl bg-blue-50/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de acceso */}
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-blue-900 font-bold">Tipo de Acceso</Label>
                    <Select value={tipoAcceso} onValueChange={(v: any) => {
                      setTipoAcceso(v);
                      setNuevoD({ ...nuevoD, matricula: '', numero_empleado: '' });
                    }}>
                      <SelectTrigger className="bg-white border-blue-900/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practicante">Practicante</SelectItem>
                        {user?.rol === 'master' && <SelectItem value="docente">Docente</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-bold">Nombre Completo</Label>
                    <Input
                      value={nuevoD.nombre}
                      onChange={e => setNuevoD({ ...nuevoD, nombre: e.target.value })}
                      placeholder={tipoAcceso === 'docente' ? 'Nombre completo del docente' : 'Nombre completo del alumno'}
                      required className="bg-white border-blue-900/20"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-bold">Correo Institucional</Label>
                    <Input
                      type="email"
                      value={nuevoD.email}
                      onChange={e => setNuevoD({ ...nuevoD, email: e.target.value })}
                      placeholder={tipoAcceso === 'docente' ? 'docente@utc.mx' : 'alumno@utc.edu.mx'}
                      required className="bg-white border-blue-900/20"
                    />
                  </div>

                  {/* Matrícula / No. Empleado */}
                  {tipoAcceso === 'docente' ? (
                    <div className="space-y-2">
                      <Label className="text-blue-900 font-bold">Número de Empleado</Label>
                      <Input
                        value={nuevoD.numero_empleado}
                        onChange={e => setNuevoD({ ...nuevoD, numero_empleado: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="9 dígitos" maxLength={9} required className="bg-white border-blue-900/20"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-blue-900 font-bold">Matrícula</Label>
                      <Input
                        value={nuevoD.matricula}
                        onChange={e => setNuevoD({ ...nuevoD, matricula: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="9 dígitos" maxLength={9} required className="bg-white border-blue-900/20"
                      />
                    </div>
                  )}

                  {/* Área */}
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-blue-900 font-bold">Área de Práctica</Label>
                    <Select value={nuevoD.area} onValueChange={(v: any) => setNuevoD({ ...nuevoD, area: v })} disabled={!!user?.area}>
                      <SelectTrigger className="bg-white border-blue-900/20">
                        <SelectValue placeholder="Selecciona la carrera correspondiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nutricion">Nutrición</SelectItem>
                        <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Horario de prácticas (solo practicantes) */}
                {tipoAcceso === 'practicante' && (
                  <div className="mt-2 pt-4 border-t border-blue-900/10">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarClock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-blue-900 font-bold text-sm">Horario de Prácticas</p>
                        <p className="text-xs text-slate-500">Opcional al registrar — editable en cualquier momento desde la tabla.</p>
                      </div>
                    </div>
                    <HorarioPracticas onChange={setHorarioNuevo} />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 px-8 font-bold shadow-md">
                    Confirmar Autorización
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setMostrandoFormulario(false); setHorarioNuevo([]); }} className="text-slate-500 font-bold">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* ======================================================
            SECCIÓN 2 — TABLA DE PERSONAL
        ====================================================== */}
        <Card className="border-blue-900/10 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-blue-900 font-bold">Personal Autorizado</CardTitle>
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
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Rol</TableHead>
                  <TableHead className="text-blue-900 font-black uppercase tracking-widest text-center">Área</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Estado</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Horario</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Activar</TableHead>
                  <TableHead className="text-center text-blue-900 font-black uppercase tracking-widest">Desactivar</TableHead>
                  <TableHead className="text-right pr-4 text-blue-900 font-black uppercase tracking-widest">Eliminar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docentesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-400 italic">
                      No hay registros encontrados.
                    </TableCell>
                  </TableRow>
                ) : docentesFiltrados.map(docente => (
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

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge variant="outline" className={`bg-transparent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border-2 ${
                          docente.rol === 'admin' ? 'text-purple-700 border-purple-500/40' : 'text-blue-500 border-blue-400/40'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          {docente.rol === 'admin' ? 'Docente Titular' : 'Practicante'}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-tighter shadow-sm ${
                        docente.area === 'nutricion' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {docente.area || 'GENERAL'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <span className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                          docente.status === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${docente.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                          {docente.status}
                        </span>
                      </div>
                    </TableCell>

                    {/* Botón Horario — solo para practicantes */}
                    <TableCell className="text-center">
                      {docente.rol === 'practicante' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirHorarioModal(docente.id, docente.name)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-xs px-3 gap-1.5"
                        >
                          <CalendarClock className="w-3.5 h-3.5" /> Horario
                        </Button>
                      ) : (
                        <span className="text-slate-300 text-xs italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        size="icon" variant="default"
                        disabled={docente.status === 'activo'}
                        onClick={() => handleCambiarEstado(docente.id, 'activo')}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-30"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        size="icon" variant="outline"
                        disabled={docente.status === 'inactivo'}
                        onClick={() => handleCambiarEstado(docente.id, 'inactivo')}
                        className="border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl disabled:opacity-30"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => handleEliminarDocente(docente.id)}
                        className="rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ======================================================
            SECCIÓN 3 — ASISTENCIA
        ====================================================== */}
        <Card className="border-blue-900/10 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Título */}
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-blue-900 font-bold">Asistencia</CardTitle>
                  <CardDescription className="font-medium text-slate-500">
                    {viewModeAsistencia === 'day'
                      ? (esHoySeleccionado
                          ? `Hoy — ${format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}`
                          : format(new Date(selectedDateAsistencia + 'T00:00:00'), "EEEE dd 'de' MMMM, yyyy", { locale: es }))
                      : format(new Date(selectedMonthAsistencia + '-01'), "MMMM yyyy", { locale: es })
                    }
                  </CardDescription>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <ViewModeToggle mode={viewModeAsistencia} onChange={setViewModeAsistencia} theme="blue" />
                {viewModeAsistencia === 'day'
                  ? <DateFilterPicker selectedDate={selectedDateAsistencia} onChange={setSelectedDateAsistencia} theme="blue" />
                  : <MonthFilterPicker selectedMonth={selectedMonthAsistencia} onChange={setSelectedMonthAsistencia} theme="blue" />
                }
                {viewModeAsistencia === 'day' && esHoySeleccionado && (
                  <Button
                    onClick={handleGuardarAsistencia}
                    disabled={guardandoAsistencia || Object.keys(estadosAsistencia).length === 0}
                    className="bg-blue-900 hover:bg-blue-800 font-bold rounded-xl shadow-md gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {guardandoAsistencia ? 'Guardando...' : 'Registrar'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* ── VISTA DÍA ── */}
            {viewModeAsistencia === 'day' && (
              <>
                {cargandoAsistencia ? (
                  <p className="text-slate-400 text-sm italic py-4 text-center">Cargando practicantes...</p>
                ) : practicantesFiltrados.length === 0 ? (
                  <p className="text-slate-400 text-sm italic py-4 text-center">No hay practicantes registrados en esta área.</p>
                ) : (
                  <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                    {practicantesFiltrados.map(p => {
                      const estado = estadosAsistencia[p.id];
                      const locked = !esHoySeleccionado || p.asistencia === 'presente' || p.asistencia === 'ausente';
                      return (
                        <div
                          key={p.id}
                          onClick={() => !locked && toggleAsistencia(p.id)}
                          className={`flex items-center justify-between px-4 py-3.5 transition-all select-none ${
                            locked
                              ? 'bg-slate-50/60 cursor-default'
                              : estado === 'presente'
                              ? 'bg-green-50/60 cursor-pointer hover:bg-green-50'
                              : estado === 'ausente'
                              ? 'bg-red-50/60 cursor-pointer hover:bg-red-50'
                              : 'bg-white cursor-pointer hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                              estado === 'presente' ? 'bg-green-200 text-green-800' :
                              estado === 'ausente'  ? 'bg-red-200 text-red-700'    : 'bg-slate-100 text-slate-500'
                            }`}>
                              {p.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${
                                estado === 'presente' ? 'text-green-800' :
                                estado === 'ausente'  ? 'text-red-700'  : 'text-slate-700'
                              }`}>{p.nombre}</p>
                              <p className="text-xs text-slate-400 capitalize">{p.area}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {locked && <Lock className="w-3.5 h-3.5 text-slate-300" />}
                            <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-3 py-1.5 rounded-full ${
                              estado === 'presente' ? 'bg-green-200 text-green-800' :
                              estado === 'ausente'  ? 'bg-red-200 text-red-700'    : 'bg-slate-100 text-slate-400'
                            }`}>
                              {estado === 'presente' ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Presente</>
                              ) : estado === 'ausente' ? (
                                <><XCircle className="w-3.5 h-3.5" /> Ausente</>
                              ) : 'Sin marcar'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {esHoySeleccionado && (
                  <p className="text-[10px] text-slate-400 mt-3 italic">
                    Clic en una fila para alternar: Sin marcar → Presente → Ausente. Las filas con <Lock className="w-3 h-3 inline mb-0.5" /> ya fueron registradas.
                  </p>
                )}
              </>
            )}

            {/* ── VISTA MES ── */}
            {viewModeAsistencia === 'month' && (
              cargandoMes ? (
                <p className="text-slate-400 text-sm italic py-4 text-center">Cargando...</p>
              ) : diasConAsistencia.length === 0 ? (
                <p className="text-slate-400 text-sm italic py-4 text-center">
                  Sin registros de asistencia en{' '}
                  {format(new Date(selectedMonthAsistencia + '-01'), 'MMMM yyyy', { locale: es })}.
                </p>
              ) : (
                <div className="space-y-5">
                  {diasConAsistencia.map(([fecha, entradas]) => {
                    const fechaDate = new Date(fecha + 'T00:00:00');
                    const presentes = entradas.filter(e => e.estado === 'presente').length;
                    const ausentes  = entradas.filter(e => e.estado === 'ausente').length;
                    return (
                      <div key={fecha}>
                        {/* Encabezado del día */}
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap">
                            {format(fechaDate, "EEEE dd 'de' MMMM", { locale: es })}
                          </p>
                          <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{presentes} pres.</span>
                          <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{ausentes} aus.</span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>
                        {/* Lista de entradas */}
                        <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                          {entradas.map(e => (
                            <div
                              key={e.id}
                              className={`flex items-center justify-between px-4 py-2.5 ${
                                e.estado === 'presente' ? 'bg-green-50/60' : 'bg-red-50/60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                  e.estado === 'presente' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-700'
                                }`}>
                                  {e.nombre.charAt(0).toUpperCase()}
                                </div>
                                <p className={`font-bold text-sm ${
                                  e.estado === 'presente' ? 'text-green-800' : 'text-red-700'
                                }`}>{e.nombre}</p>
                              </div>
                              <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full ${
                                e.estado === 'presente' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-700'
                              }`}>
                                {e.estado === 'presente'
                                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Presente</>
                                  : <><XCircle className="w-3.5 h-3.5" /> Ausente</>
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </main>

      {/* ======================================================
          DIALOG — CONFIRMACIÓN DE ALTA
      ====================================================== */}
      <Dialog open={confirmAlta} onOpenChange={setConfirmAlta}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl font-black flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              Confirmar Alta
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium mt-1">
              ¿Seguro que deseas dar de alta a{' '}
              <span className="font-black text-blue-900">{nuevoD.nombre}</span>{' '}
              como{' '}
              <span className="capitalize font-bold">{tipoAcceso}</span>{' '}
              en el área de{' '}
              <span className="capitalize font-bold">{nuevoD.area}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Contraseña temporal</p>
            <p className="text-blue-900 font-black text-lg font-mono tracking-wider">
              UTC{tipoAcceso === 'docente' ? nuevoD.numero_empleado : nuevoD.matricula}
            </p>
            <p className="text-[11px] text-slate-500">El usuario deberá cambiarla en su primer inicio de sesión.</p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmAlta(false)}
              className="flex-1 font-bold border border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarAlta}
              className="flex-1 bg-blue-900 hover:bg-blue-800 font-bold shadow-md"
            >
              Sí, dar de alta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          MODAL — EDITAR HORARIO POR FILA
      ====================================================== */}
      <Dialog open={horarioModalOpen} onOpenChange={setHorarioModalOpen}>
        <DialogContent className="sm:max-w-[640px] rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl font-black flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-600" /> Horario de Prácticas
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500 italic">
              {horarioModalNombre}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            {horarioModalId && (
              <HorarioPracticas
                usuarioId={horarioModalId}
                onChange={() => {}}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
