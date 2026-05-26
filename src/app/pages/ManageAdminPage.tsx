/**
 * ============================================================================
 * ARCHIVO: ManageAdminPage.tsx - VERSIÓN MASTER INTEGRADA (FIXED)
 * PROPÓSITO: Gestión de Administradores y corrección de error de Select.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { 
  Search, 
  Filter, 
  GraduationCap, 
  Users, 
  FileText, 
  BarChart3, 
  FileEdit, 
  LogOut, 
  Send, 
  Trash2, 
  UserCheck, 
  UserMinus,
  Mail,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

// Importación de tipos y componentes adicionales
import { Practitioner } from '../lib/mockData';
import PatientList from '../components/PatientList';
import MedicalHistoryViewer from '../components/MedicalHistoryViewer';
import StatisticsPanel from '../components/StatisticsPanel';
import NotesViewer from '../components/NotesViewer';

export default function ManageAdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS PRINCIPALES
  const [practicantes, setPracticantes] = useState<any[]>([]); // Cambiado a any para acceder a rol y área fácilmente
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');

  // ESTADOS PARA COMUNICADOS SEGMENTADOS
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    destino: 'todos' as 'nutricion' | 'fisioterapia' | 'todos',
    emailDestinatario: 'ninguno' // CORRECCIÓN: "ninguno" en lugar de "" para evitar error de Radix UI
  });
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Clave para forzar actualización del visor

  // EFECTO DE CARGA INICIAL Y ACTUALIZACIÓN AUTOMÁTICA
  useEffect(() => {
    cargarPracticantes();
    const interval = setInterval(() => {
      cargarPracticantes();
    }, 30000); 
    return () => clearInterval(interval);
  }, [areaFilter]);

  /**
   * CARGA DE DATOS DESDE LA API (POSTGRESQL)
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
            name: p.nombre || 'Sin Nombre',
            email: p.email || 'sin@correo.com',
            area: p.area ? p.area.toLowerCase() : 'fisioterapia',
            status: p.estado || p.status || 'activo', 
            dateAdded: p.fecha_creacion || new Date().toISOString(),
            rol: p.rol
          }));
        
        setPracticantes(listaMapeada);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error('Error de conexión con el servidor PostgreSQL');
    }
  };

  /**
   * LÓGICA DE FILTRADO PARA EL DESPLEGABLE DE USUARIOS (EN VIVO)
   */
  const adminsDisponibles = practicantes.filter(u => {
    if (notaNueva.destino === 'todos') return u.rol === 'admin';
    return u.rol === 'admin' && u.area === notaNueva.destino;
  });

  // LOGICA DE FILTRADO EN TIEMPO REAL PARA LA TABLA
  const practicantesFiltrados = practicantes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === 'todos' ? true : p.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  /**
   * CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
   */
  const handleCambiarEstado = async (id: string) => {
    const practicante = practicantes.find(p => p.id === id);
    if (!practicante) return;
    
    const nuevoEstado = practicante.status === 'activo' ? 'inactivo' : 'activo';
    const backup = [...practicantes];

    setPracticantes(prev => prev.map(p => p.id === id ? { ...p, status: nuevoEstado } : p));

    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (!response.ok) throw new Error('Error en servidor');
      toast.success(`Estado actualizado a: ${nuevoEstado.toUpperCase()}`); 
    } catch (error) { 
      setPracticantes(backup);
      toast.error('No se pudo actualizar el estado en la base de datos'); 
    }
  };

  /**
   * ELIMINAR REGISTRO PERMANENTE
   */
  const handleEliminarPracticante = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar permanentemente este registro de la base de datos?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${id}`, { method: 'DELETE' });
      if (response.ok) { 
        toast.success('Registro eliminado correctamente'); 
        cargarPracticantes(); 
      }
    } catch (error) { 
      toast.error('Error al eliminar el registro'); 
    }
  };

  /**
   * PUBLICAR NOTA CORREGIDO: CIERRE DE MODAL Y REFRESH
   */
  const handlePublicarNota = async () => {
    if (!notaNueva.titulo.trim() || !notaNueva.contenido.trim()) {
      toast.error("El título y contenido son obligatorios");
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
          creado_por_nombre: user?.name || "Master UTC",
          destinatario_especifico: notaNueva.emailDestinatario === 'ninguno' ? null : notaNueva.emailDestinatario
        })
      });

      if (response.ok) {
        toast.success(`Comunicado publicado exitosamente`);
        // CORRECCIÓN: Cerramos el modal y reseteamos valores con "ninguno"
        setIsNotaModalOpen(false);
        setNotaNueva({ titulo: '', contenido: '', destino: 'todos', emailDestinatario: 'ninguno' });
        setRefreshKey(prev => prev + 1); // Forzamos actualización del visor inferior
      }
    } catch (error) {
      toast.error("Error al publicar en la base de datos");
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
                  <span className="text-blue-900">Control</span>{' '}
                  <span className="text-orange-600">Master</span>
                </h1>
                <p className="text-sm text-gray-500 font-medium tracking-wide">Universidad Tres Culturas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-blue-900">{user?.name || 'David Velázquez'}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">Coordinación Central</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 shadow-sm transition-all">
                <LogOut className="w-4 h-4" />
                <span className="font-bold text-xs">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-4 border border-gray-100">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 w-full bg-white">
              <Search className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar por nombre o correo electrónico..." className="flex-1 outline-none text-sm bg-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 min-w-[240px] w-full md:w-auto bg-white">
              <Filter className="w-5 h-5 text-blue-600" />
              <select className="flex-1 outline-none text-sm text-blue-900 bg-transparent font-bold cursor-pointer" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value as any)}>
                <option value="todos">Todos los Usuarios</option>
                <option value="nutricion">Área: Nutrición</option>
                <option value="fisioterapia">Área: Fisioterapia</option>
              </select>
            </div>
          </div>

          <Tabs defaultValue="practitioners" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 border border-gray-100 overflow-x-auto">
              <TabsList className="bg-transparent flex justify-start gap-2 h-auto">
                <TabsTrigger value="practitioners" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all font-bold">
                  <GraduationCap className="w-4 h-4" /> Personal Académico
                </TabsTrigger>
                <TabsTrigger value="patients" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all font-bold">
                  <Users className="w-4 h-4" /> Pacientes Globales
                </TabsTrigger>
                <TabsTrigger value="admin_notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all font-bold">
                  <FileEdit className="w-4 h-4" /> Comunicados Master
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="practitioners" className="animate-in fade-in duration-500">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/80 p-6">
                  <div>
                    <CardTitle className="text-blue-900 font-extrabold text-xl">Administración de Personal</CardTitle>
                    <CardDescription className="text-gray-500 font-medium italic">Base de datos PostgreSQL sincronizada</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/administrar-practicantes')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg transition-transform hover:scale-105">
                    Registrar Nuevo Acceso
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-white sticky top-0 z-20 border-b">
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
                              <span className="text-sm font-bold text-blue-950 uppercase">{p.name}</span>
                              <span className="text-xs text-gray-400 font-medium italic">{p.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${p.area === 'nutricion' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                              {p.area}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${p.status === 'activo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {p.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant={p.status === 'activo' ? "outline" : "default"} onClick={() => handleCambiarEstado(p.id)} className="h-9 px-4 rounded-xl font-bold">
                                {p.status === 'activo' ? <UserMinus className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                                {p.status === 'activo' ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleEliminarPracticante(p.id)} className="h-9 w-9 text-red-400 hover:text-red-600">
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

            <TabsContent value="admin_notes">
              <div className="bg-gradient-to-br from-orange-100/50 via-white to-blue-100/50 rounded-3xl p-10 border border-white shadow-inner">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-blue-950 tracking-tight">Comunicación Master UTC</h2>
                    <p className="text-gray-500 font-medium italic">Emisión de avisos oficiales y mensajería dirigida.</p>
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
                        <DialogTitle className="text-blue-900 text-2xl font-black flex items-center gap-3">
                          <Send className="w-6 h-6 text-orange-600" /> EMITIR COMUNICADO
                        </DialogTitle>
                        <DialogDescription className="font-medium">Configure el alcance oficial de la información.</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase ml-1">Título del Aviso</Label>
                          <Input className="rounded-xl border-slate-200 h-12" placeholder="Ej: Nueva Normativa" value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase ml-1">Mensaje</Label>
                          <Textarea className="rounded-xl border-slate-200 min-h-[140px] resize-none" placeholder="Escriba aquí..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase ml-1">Área Destino</Label>
                            <Select value={notaNueva.destino} onValueChange={(v: any) => setNotaNueva({...notaNueva, destino: v, emailDestinatario: 'ninguno'})}>
                              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-slate-200 font-bold">
                                <SelectValue placeholder="Alcance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todos">General (Todas)</SelectItem>
                                <SelectItem value="nutricion">Nutrición</SelectItem>
                                <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase ml-1 text-orange-600">Usuario Específico</Label>
                            <Select value={notaNueva.emailDestinatario} onValueChange={(v) => setNotaNueva({...notaNueva, emailDestinatario: v})}>
                              <SelectTrigger className="rounded-xl h-11 border-orange-200 bg-white">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* CORRECCIÓN: "ninguno" es el valor seguro para Radix UI */}
                                <SelectItem value="ninguno">--- Ninguno (Público) ---</SelectItem>
                                {adminsDisponibles.map((dest) => (
                                  <SelectItem key={dest.email} value={dest.email}>
                                    {dest.name} ({dest.area})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                           <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                           <p className="text-[10px] text-blue-800 font-medium leading-tight">
                             {notaNueva.emailDestinatario !== 'ninguno' 
                               ? `PUBLICACIÓN PRIVADA: Solo el administrador seleccionado recibirá esta nota.` 
                               : `PUBLICACIÓN POR ÁREA: Todos los integrantes de ${notaNueva.destino.toUpperCase()} verán esta nota.`}
                           </p>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                        <Button onClick={handlePublicarNota} disabled={isEnviando} className="bg-orange-600 hover:bg-orange-700 text-white font-black px-10 h-12 rounded-xl shadow-lg transition-all active:scale-95">
                          {isEnviando ? "PROCESANDO..." : "PUBLICAR AHORA"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl">
                  {/* NotesViewer con refreshKey para forzar actualización inmediata */}
                  <NotesViewer key={refreshKey} readOnly={false} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}