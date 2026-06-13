/**
 * ============================================================================
 * ARCHIVO: MasterDashboard.tsx - VERSIÓN PROFESIONAL UNIFICADA
 * PROPÓSITO: Panel de Control Global (Rol Master) sincronizado con PostgreSQL.
 * STATUS: Optimizado, Limpio y Sin Errores de Tipado.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Search,
  Filter,
  GraduationCap,
  Users,
  BarChart3,
  FileEdit,
  LogOut,
  Send,
  Trash2,
  UserCheck,
  UserMinus,
  Target
} from 'lucide-react'; // CORRECCIÓN: Se eliminó 'FileText' que no se usaba
import { toast } from 'sonner';

// Importación de componentes de lógica de negocio
import PatientList from '../components/PatientList';
import StatisticsPanel from '../components/StatisticsPanel';
import NotesViewer from '../components/NotesViewer';
// CORRECCIÓN: Se eliminó la importación de 'MedicalHistoryViewer' que no se usaba aquí

export default function MasterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS PRINCIPALES
  const [practicantes, setPracticantes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'admin' | 'practicante'>('todos');


  // ESTADOS PARA COMUNICADOS
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    destino: 'todos' as 'nutricion' | 'fisioterapia' | 'todos',
    emailDestinatario: 'ninguno'
  });
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // CORRECCIÓN: Manejo de promesa en useEffect
    const inicializarDatos = async () => {
      await cargarPracticantes();
    };
    inicializarDatos();

    const interval = setInterval(() => {
      void cargarPracticantes();
    }, 45000);
    return () => clearInterval(interval);
  }, [areaFilter]);

  /**
   * CARGA DE DATOS: Sincronización con nombres de columna de la DB (nombre, rol, estado)
   */
  const cargarPracticantes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/usuarios');
      if (response.ok) {
        const data = await response.json();

        const listaMapeada = data
            .filter((u: any) => u.rol === 'practicante' || u.rol === 'admin')
            .map((p: any) => ({
              id: p.id.toString(),
              nombre: p.nombre || 'Sin Nombre',
              email: p.email || 'sin@correo.com',
              area: p.area ? p.area.toLowerCase() : 'general',
              estado: p.estado || p.status || 'activo',
              rol: p.rol
            }));

        setPracticantes(listaMapeada);
      }
    } catch (error) {
      console.error("❌ MasterDashboard -> Error DB:", error);
      toast.error('Error de conexión con el servidor PostgreSQL');
    }
  };

  const adminsDisponibles = practicantes.filter(u => {
    if (notaNueva.destino === 'todos') return u.rol === 'admin';
    return u.rol === 'admin' && u.area === notaNueva.destino;
  });

  const practicantesFiltrados = practicantes.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === 'todos' ? true : p.area === areaFilter;
    
    const matchesRole = roleFilter === 'todos' ? true : p.rol === roleFilter;

    return matchesSearch && matchesArea && matchesRole;
  });

  const handleCambiarEstado = async (id: string) => {
    const practicante = practicantes.find(p => p.id === id);
    if (!practicante) return;

    const nuevoEstado = practicante.estado === 'activo' ? 'inactivo' : 'activo';

    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        toast.success(`Estado de ${practicante.nombre} actualizado`);
        await cargarPracticantes(); // CORRECCIÓN: Se añadió await
      }
    } catch (error) {
      toast.error('Error al actualizar en la base de datos');
    }
  };

  const handleEliminarPracticante = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este registro de forma permanente?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Registro eliminado de PostgreSQL');
        await cargarPracticantes(); // CORRECCIÓN: Se añadió await
      }
    } catch (error) {
      toast.error('Error al eliminar el registro');
    }
  };

  const handlePublicarNota = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("Complete el asunto y el mensaje");
      return;
    }

    try {
      setIsEnviando(true);
      const response = await fetch('http://localhost:3001/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: notaNueva.titulo.trim(),
          contenido: notaNueva.contenido.trim(),
          destino: notaNueva.destino,
          creado_por: user?.id,
          creado_por_nombre: user?.nombre || "Administrador UTC",
          creado_por_email: user?.email,
          destinatario_especifico: notaNueva.emailDestinatario === 'ninguno' ? null : notaNueva.emailDestinatario
        })
      });

      if (response.ok) {
        toast.success(`Comunicado enviado exitosamente`);
        setIsNotaModalOpen(false);
        setNotaNueva({ titulo: '', contenido: '', destino: 'todos', emailDestinatario: 'ninguno' });
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Error al publicar nota");
    } finally {
      setIsEnviando(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión finalizada');
  };

  return (
      <div className="size-full min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60"></div>
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

        <div className="relative z-10 size-full p-4 sm:p-8">
          <header className="bg-white/90 backdrop-blur-sm shadow-sm mb-6 rounded-xl border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-900 rounded-lg shadow-md">
                  <span className="text-white font-bold text-sm">UTC</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-blue-900">Administrador </span>{' '}
                    <span className="text-orange-600">Areas</span>
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Universidad Tres Culturas</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-blue-900">{user?.nombre || 'Administrador Master'}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">{user?.rol || 'Coordinación Central'}</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="font-bold text-xs uppercase">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto space-y-6">
            {/* BUSCADOR Y FILTRO */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-4 border border-gray-100">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 w-full bg-white shadow-inner">
                <Search className="w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Buscar personal por nombre o correo..." className="flex-1 outline-none text-sm bg-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 min-w-[240px] w-full md:w-auto bg-white shadow-inner">
                <Filter className="w-5 h-5 text-blue-600" />
                <select className="flex-1 outline-none text-sm text-blue-900 bg-transparent font-bold cursor-pointer" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value as any)}>
                  <option value="todos">Todos los Departamentos</option>
                  <option value="nutricion">Área: Nutrición</option>
                  <option value="fisioterapia">Área: Fisioterapia</option>
                </select>
              </div>
            </div>

            <Tabs defaultValue="practitioners" className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 border border-gray-100 overflow-x-auto">
                <TabsList className="bg-transparent flex justify-start gap-2 h-auto p-1">
                  <TabsTrigger value="practitioners" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 font-bold uppercase text-xs tracking-tighter">
                    <GraduationCap className="w-4 h-4 mr-2" /> Personal Académico
                  </TabsTrigger>
                  <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 font-bold uppercase text-xs tracking-tighter">
                    <Users className="w-4 h-4 mr-2" /> Pacientes Globales
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 font-bold uppercase text-xs tracking-tighter">
                    <BarChart3 className="w-4 h-4 mr-2" /> Métricas
                  </TabsTrigger>
                  <TabsTrigger value="admin_notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg px-4 py-2 font-bold uppercase text-xs tracking-tighter">
                    <FileEdit className="w-4 h-4 mr-2" /> Comunicados Master
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="practitioners" className="animate-in fade-in duration-300">
                <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-gray-50/80 p-6 gap-4">
  <div>
    {/* Ajusté los textos para que coincidan exactamente con tu imagen */}
    <CardTitle className="text-blue-900 font-extrabold text-xl"> Personal Académico</CardTitle>
   
  </div>
  
  {/* NUEVO CONTENEDOR: Agrupa el filtro y el botón naranja */}
  <div className="flex items-center gap-3 w-full sm:w-auto">
    
    {/* NUEVO FILTRO POR ROL USANDO TUS COMPONENTES UI */}
   {/* NUEVO FILTRO POR ROL USANDO TUS COMPONENTES UI */}
<Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
  <SelectTrigger className="w-[180px] bg-white border-blue-200 text-blue-900 font-bold h-10 rounded-xl shadow-sm">

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <SelectValue placeholder="Filtrar por Rol" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos" className="font-bold">Todos los Roles</SelectItem>
        <SelectItem value="admin">Docentes Titulares</SelectItem>
        <SelectItem value="practicante">Practicantes</SelectItem>
      </SelectContent>
    </Select>

    {/* TU BOTÓN ORIGINAL */}
    <Button onClick={() => navigate('/administrar-practicantes')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg transition-transform hover:scale-105 rounded-xl h-10 px-4">
      Registrar Nuevo Acceso
    </Button>
  </div>
</CardHeader>
                  <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="bg-white sticky top-0 z-20 border-b shadow-sm">
                        <TableRow>
                          <TableHead className="pl-8 py-4 text-blue-900 font-black uppercase text-[11px] tracking-widest">Información</TableHead>
                          <TableHead className="text-blue-900 font-black uppercase text-[11px] tracking-widest">Área</TableHead>
                          <TableHead className="text-center text-blue-900 font-black uppercase text-[11px] tracking-widest">Estado</TableHead>
                          <TableHead className="text-right pr-8 text-blue-900 font-black uppercase text-[11px] tracking-widest">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {practicantesFiltrados.map((p) => (
                            <TableRow key={p.id} className="hover:bg-blue-50/50 transition-all">
                              <TableCell className="pl-8 py-5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-blue-950 uppercase">{p.nombre}</span>
                                  <span className="text-xs text-gray-400 font-medium italic">{p.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${p.area === 'nutricion' ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                  {p.area}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${p.estado === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {p.estado}
                            </span>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant={p.estado === 'activo' ? "outline" : "default"} onClick={() => handleCambiarEstado(p.id)} className="h-9 px-4 rounded-xl font-bold uppercase text-[10px]">
                                    {p.estado === 'activo' ? <UserMinus className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                                    {p.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleEliminarPracticante(p.id)} className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
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
              </TabsContent>

              <TabsContent value="patients">
                <PatientList />
              </TabsContent>

              <TabsContent value="stats">
                <StatisticsPanel area={areaFilter === 'todos' ? 'general' : areaFilter} />
              </TabsContent>

              <TabsContent value="admin_notes">
                <div className="bg-gradient-to-br from-orange-100/50 via-white to-blue-100/50 rounded-3xl p-10 border border-white shadow-xl">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                    <div className="text-center md:text-left">
                      <h2 className="text-3xl font-black text-blue-950 tracking-tight uppercase">Comunicación Master UTC</h2>
                      <p className="text-gray-500 font-medium italic">Difusión de normativas y avisos institucionales dirigidos.</p>
                    </div>

                    <Dialog open={isNotaModalOpen} onOpenChange={setIsNotaModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-900 hover:bg-black text-white px-8 py-7 rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:-translate-y-1">
                          <FileEdit className="w-6 h-6 text-orange-500" />
                          <span className="font-black uppercase tracking-widest text-sm">Nueva Publicación</span>
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-[550px] rounded-[2rem] border-none shadow-2xl p-8" style={arialStyle}>
                        <DialogHeader>
                          <DialogTitle className="text-blue-900 text-2xl font-black flex items-center gap-3 uppercase">
                            <Send className="w-6 h-6 text-orange-600" /> Emitir Comunicado
                          </DialogTitle>
                          <DialogDescription className="font-medium italic">Configure el alcance y la privacidad de la información.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Título del Aviso</Label>
                            <Input className="rounded-xl border-slate-200 h-12 shadow-sm" placeholder="Ej: Nueva Normativa Académica" value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Mensaje del Comunicado</Label>
                            <Textarea className="rounded-xl border-slate-200 min-h-[140px] resize-none shadow-sm" placeholder="Escriba el cuerpo del aviso aquí..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Área Destino</Label>
                              <Select value={notaNueva.destino} onValueChange={(v: any) => setNotaNueva({...notaNueva, destino: v, emailDestinatario: 'ninguno'})}>
                                <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-slate-200 font-bold text-blue-900">
                                  <SelectValue placeholder="Alcance Global" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todos">General (Todas las áreas)</SelectItem>
                                  <SelectItem value="nutricion">Solo Nutrición</SelectItem>
                                  <SelectItem value="fisioterapia">Solo Fisioterapia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-orange-600 font-black text-[11px] uppercase tracking-widest ml-1">Destinatario Específico</Label>
                              <Select value={notaNueva.emailDestinatario} onValueChange={(v) => setNotaNueva({...notaNueva, emailDestinatario: v})}>
                                <SelectTrigger className="rounded-xl h-11 border-orange-200 bg-white shadow-sm font-bold text-orange-900">
                                  <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ninguno">--- Público (Toda el área) ---</SelectItem>
                                  {adminsDisponibles.map((dest) => (
                                      <SelectItem key={dest.email} value={dest.email}>
                                        {dest.nombre} ({dest.area})
                                      </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 shadow-sm">
                            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-[10px] text-blue-800 font-bold leading-tight uppercase italic">
                              {notaNueva.emailDestinatario !== 'ninguno'
                                  ? `NOTA PRIVADA: Este comunicado solo será visible para el perfil de ${notaNueva.emailDestinatario}.`
                                  : `NOTA POR ÁREA: Todos los integrantes del departamento de ${notaNueva.destino.toUpperCase()} podrán visualizar este aviso.`}
                            </p>
                          </div>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400 uppercase text-xs">Cancelar</Button>
                          <Button onClick={handlePublicarNota} disabled={isEnviando} className="bg-blue-900 hover:bg-black text-white font-black px-10 h-12 rounded-xl shadow-lg transition-all active:scale-95">
                            {isEnviando ? "PROCESANDO..." : "PUBLICAR AHORA"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-2xl">
                    {/* NotesViewer sincronizado con el rol Master */}
                    <NotesViewer key={refreshKey} readOnly={false} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <footer className="py-12 text-center opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">
              Sistema de Gestión Clínica UTC  • 2026
            </p>
          </footer>
        </div>
      </div>
  );
}