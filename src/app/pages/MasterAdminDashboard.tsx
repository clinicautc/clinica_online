/**
 * ============================================================================
 * ARCHIVO: MasterAdminDashboard.tsx - VERSIÓN MASTER CENTRALIZADA
 * PROPÓSITO: Gestión global de personal y difusión de comunicados segmentados.
 * MODIFICACIÓN: Inserción de columna ROL con diseño de bordes coloreados (Outline).
 * NUEVO: Barra lateral (Drawer) del Perfil de Usuario con Edición y Matrícula.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  FileText, 
  BarChart3, 
  FileEdit, 
  LogOut, 
  Send, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  Shield, 
  Target,
  User, X, Edit2, Phone, Building, AlertTriangle
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
  const [practicantes, setPracticantes] = useState<any[]>([]); // Cambiado a any para acceder a rol y área
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<'todos' | 'nutricion' | 'fisioterapia'>('todos');

  // ESTADOS PARA COMUNICADOS SEGMENTADOS
  const [notaNueva, setNotaNueva] = useState({
    titulo: '',
    contenido: '',
    destino: 'todos' as 'nutricion' | 'fisioterapia' | 'todos',
    emailDestinatario: 'ninguno' 
  });
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);

  // ==========================================
  // ESTADOS PARA LA BARRA LATERAL (PERFIL)
  // ==========================================
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nombre: '',
    telefono: '',
    matricula: '',
    email: '',
    rol: '',
    area: ''
  });
  const [backupProfile, setBackupProfile] = useState(profileData);

  // EFECTO DE CARGA INICIAL Y ACTUALIZACIÓN AUTOMÁTICA
  useEffect(() => {
    cargarPracticantes();
    const interval = setInterval(() => {
      cargarPracticantes();
    }, 30000); 
    return () => clearInterval(interval);
  }, [user, areaFilter]);

  // Inicializar datos del perfil cuando el usuario carga
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || 'Administrador Master',
        telefono: user.telefono || '',
        matricula: user.matricula || '',
        email: user.email || '',
        rol: user.rol || 'master',
        area: user.area || ''
      });
    }
  }, [user]);

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
            rol: p.rol // Sincronizado con la base de datos para mostrar el cargo
          }));
        
        setPracticantes(listaMapeada);
      }
    } catch (error) {
      console.error("Error al cargar docentes:", error);
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

  // LOGICA DE FILTRADO EN TIEMPO REAL
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
        headers: {'Content-Type': 'application/json',email: user?.email || ''},
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
      const response = await fetch(`http://localhost:3001/api/usuarios/${id}`,{method: 'DELETE',headers: {email: user?.email || ''}});
      if (response.ok) { 
        toast.success('Registro eliminado correctamente'); 
        cargarPracticantes(); 
      }
    } catch (error) { 
      toast.error('Error al eliminar el registro'); 
    }
  };

  /**
   * PUBLICAR NOTA (CON LÓGICA DE DESTINATARIO ESPECÍFICO)
   */
  const handlePublicarNota = async () => {
    if (!notaNueva.titulo || !notaNueva.contenido) {
      toast.error("El título y contenido son obligatorios");
      return;
    }

    try {
      setIsEnviando(true);
      const response = await fetch('http://localhost:3001/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: notaNueva.titulo,
          contenido: notaNueva.contenido,
          destino: notaNueva.destino,
          creado_por: user?.id,
          creado_por_nombre: user?.nombre || user?.name || "Master UTC",
          destinatario_especifico: notaNueva.emailDestinatario === 'ninguno' ? null : notaNueva.emailDestinatario
        })
      });

      if (response.ok) {
        toast.success(`Comunicado publicado exitosamente`);
        setIsNotaModalOpen(false);
        setNotaNueva({ titulo: '', contenido: '', destino: 'todos', emailDestinatario: 'ninguno' });
      }
    } catch (error) {
      toast.error("Error al publicar en la base de datos");
    } finally {
      setIsEnviando(false);
    }
  };

  // --- FUNCIONES DEL PERFIL ---
  const handleEditProfileClick = () => {
    setBackupProfile(profileData);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileData(backupProfile);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !user?.email) {
      toast.error("Error de sesión: No se pudo identificar al usuario.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'email': user.email 
        },
        body: JSON.stringify({
          nombre: profileData.nombre,
          telefono: profileData.telefono,
          matricula: profileData.matricula
        })
      });

      if (response.ok) {
        setIsEditingProfile(false);
        toast.success("Tu perfil se actualizó correctamente en el sistema.");
      } else {
        const data = await response.json();
        toast.error(data.error || "El servidor no pudo procesar la actualización.");
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast.error("Error de conexión con la base de datos.");
    }
  };

  const handleConfirmDeleteAccount = () => {
    toast.error("Función temporalmente deshabilitada.");
    setIsDeleteModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión finalizada');
  };

  // Generar iniciales para el Avatar
  const partesNombre = profileData.nombre.trim().split(' ');
  const inicialesAvatar = (partesNombre[0]?.[0] || '') + (partesNombre[1]?.[0] || '');
  const nombreCortoDisplay = `${partesNombre[0] || ''} ${partesNombre[1] || ''}`.trim() || 'Master';

  return (
    <div className="size-full min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      <div className="relative z-10 size-full p-4 sm:p-8">
        {/* HEADER INSTITUCIONAL */}
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
              {/* Perfil del Usuario Integrado (Botón que abre el Drawer) */}
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-4 text-right hidden sm:flex hover:bg-slate-50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div>
                  <p className="text-sm font-bold text-blue-900">{nombreCortoDisplay}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">Gestión de Academias</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </button>

              
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-4 border border-gray-100">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 w-full bg-white">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar personal académico por nombre o correo..."
                className="flex-1 outline-none text-sm bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 min-w-[240px] w-full md:w-auto bg-white">
              <Filter className="w-5 h-5 text-blue-600" />
              <select 
                className="flex-1 outline-none text-sm text-blue-900 bg-transparent font-bold cursor-pointer"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value as any)}
              >
                <option value="todos">Todos los Docentes</option>
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
                  <Users className="w-4 h-4" /> Pacientes
                </TabsTrigger>
                <TabsTrigger value="histories" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all font-bold">
                  <FileText className="w-4 h-4" /> Historiales
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all font-bold">
                  <BarChart3 className="w-4 h-4" /> Estadísticas
                </TabsTrigger>
                <TabsTrigger value="admin_notes" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all font-bold">
                  <FileEdit className="w-4 h-4" /> Comunicados
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTENIDO: GESTIÓN DE DOCENTES */}
            <TabsContent value="practitioners" className="animate-in fade-in duration-500">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/80 p-6">
                  <div>
                    <CardTitle className="text-blue-900 font-extrabold text-xl">Base de Datos: Personal Académico</CardTitle>
                    <CardDescription className="text-gray-500 font-medium italic">Sincronización en tiempo real con PostgreSQL</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/administrar-practicantes')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg transition-transform hover:scale-105">
                    Registrar Nuevo Acceso
                  </Button>
                </CardHeader>
                
                <CardContent className="p-0 overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="bg-white sticky top-0 z-20 border-b">
                      <TableRow>
                        <TableHead className="pl-8 py-4 text-blue-900 font-black uppercase text-[11px] tracking-widest">Información del Docente</TableHead>
                        {/* NUEVA CABECERA ROL */}
                        <TableHead className="text-center text-blue-900 font-black uppercase text-[11px] tracking-widest px-4">Rol</TableHead>
                        <TableHead className="text-blue-900 font-black uppercase text-[11px] tracking-widest text-center">Especialidad</TableHead>
                        <TableHead className="text-center text-blue-900 font-black uppercase text-[11px] tracking-widest">Estado</TableHead>
                        <TableHead className="text-right pr-8 text-blue-900 font-black uppercase text-[11px] tracking-widest">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {practicantesFiltrados.map((p) => (
                        <TableRow 
                          key={p.id} 
                          className={`group transition-all ${p.status === 'inactivo' ? 'bg-gray-100/50 opacity-70' : 'hover:bg-blue-50/50'}`}
                        >
                          <TableCell className="pl-8 py-5">
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${p.status === 'inactivo' ? 'text-gray-500' : 'text-blue-950'}`}>
                                {p.name}
                              </span>
                              <span className="text-xs text-gray-400 font-medium italic">{p.email}</span>
                            </div>
                          </TableCell>

                          {/* COLUMNA ROL: DISEÑO DE BORDES COLOREADOS SIN FONDO (OUTLINE) */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge 
                                variant="outline" 
                                className={`bg-transparent px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 border-2 ${
                                  p.rol === 'admin' 
                                    ? "text-purple-700 border-purple-500/40" 
                                    : "text-blue-500 border-blue-400/40"
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                {p.rol === 'admin' ? 'Docente Titular' : 'Practicante'}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                p.area === 'nutricion' 
                                ? "bg-orange-100 text-orange-700 border-orange-200" 
                                : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {p.area || 'GENERAL'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                p.status === 'activo' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                {p.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant={p.status === 'activo' ? "outline" : "default"}
                                onClick={() => handleCambiarEstado(p.id)} 
                                className={`h-9 px-4 flex items-center gap-2 rounded-xl transition-all font-bold ${
                                  p.status === 'activo' 
                                  ? "border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white" 
                                  : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                              >
                                {p.status === 'activo' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                <span>{p.status === 'activo' ? 'Desactivar' : 'Activar'}</span>
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleEliminarPracticante(p.id)} 
                                className="h-9 w-9 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
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
            </TabsContent>

            <TabsContent value="patients">
              <PatientList />
            </TabsContent>

            <TabsContent value="histories">
              <MedicalHistoryViewer filterType={areaFilter === 'todos' ? undefined : areaFilter} />
            </TabsContent>

            <TabsContent value="stats">
              <StatisticsPanel area={areaFilter === 'todos' ? 'general' : areaFilter} />
            </TabsContent>

            <TabsContent value="admin_notes">
              <div className="bg-gradient-to-br from-orange-100/50 via-white to-blue-100/50 rounded-3xl p-10 border border-white shadow-inner">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-blue-950 tracking-tight">Comunicación Master UTC</h2>
                    <p className="text-gray-500 font-medium">Difusión de avisos dirigidos a toda la universidad o usuarios específicos.</p>
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
                        <DialogDescription className="font-medium">
                          Configure el alcance y destino de la información oficial.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Asunto / Título</Label>
                          <Input className="rounded-xl border-slate-200 h-12" placeholder="Título del aviso..." value={notaNueva.titulo} onChange={(e) => setNotaNueva({...notaNueva, titulo: e.target.value})} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Contenido del Mensaje</Label>
                          <Textarea className="rounded-xl border-slate-200 min-h-[140px] resize-none" placeholder="Escriba el mensaje aquí..." value={notaNueva.contenido} onChange={(e) => setNotaNueva({...notaNueva, contenido: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1">Área Destino</Label>
                            <Select 
                              value={notaNueva.destino} 
                              onValueChange={(v: any) => setNotaNueva({...notaNueva, destino: v, emailDestinatario: 'ninguno'})}
                            >
                              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-slate-200 font-bold text-blue-900">
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
                            <Label className="text-blue-950 font-black text-[11px] uppercase tracking-widest ml-1 text-orange-600">Usuario Específico (Opcional)</Label>
                            <Select 
                              value={notaNueva.emailDestinatario} 
                              onValueChange={(v) => setNotaNueva({...notaNueva, emailDestinatario: v})}
                            >
                              <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                                <SelectValue placeholder="Seleccionar Persona" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* CORRECCIÓN: "ninguno" en lugar de "" para cumplir con la prop value de Radix UI */}
                                <SelectItem value="ninguno">--- Ninguno (Público) ---</SelectItem>
                                {adminsDisponibles.map((admin) => (
                                  <SelectItem key={admin.email} value={admin.email}>
                                    {admin.name} ({admin.area})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                           <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                           <p className="text-[10px] text-blue-800 font-medium leading-tight italic">
                             {notaNueva.emailDestinatario !== 'ninguno' 
                               ? `Nota Privada: Solo el usuario seleccionado verá esta publicación.` 
                               : `Nota Pública: Todos los integrantes del área de ${notaNueva.destino.toUpperCase()} verán esta publicación.`}
                           </p>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsNotaModalOpen(false)} className="font-bold text-slate-400">Cancelar</Button>
                        <Button 
                          onClick={handlePublicarNota} 
                          disabled={isEnviando}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-black px-10 h-12 rounded-xl shadow-lg transition-all"
                        >
                          {isEnviando ? "PROCESANDO..." : "PUBLICAR AHORA"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl">
                  <NotesViewer readOnly={false} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <footer className="py-16 text-center">
          <div className="inline-block px-6 py-2 border-y border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.6em] opacity-40">
              Sistema de Gestión de Academias UTC • Control Master • 2026
            </p>
          </div>
        </footer>
      </div>

      {/* ========================================== */}
      {/* PANEL LATERAL DEL PERFIL (DRAWER)          */}
      {/* ========================================== */}
      
      {/* Overlay Oscuro */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Panel Lateral */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-blue-100 transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100 bg-blue-50/50">
          <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Mi Perfil
          </h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <span className="text-3xl font-black text-blue-700">{inicialesAvatar.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-bold text-blue-950 text-center">{profileData.nombre}</h3>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1">
              Usuario Master
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Personal</span>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfileClick}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors focus:outline-none"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Datos
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Nombre Completo</Label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input 
                    type="text" 
                    value={profileData.nombre}
                    onChange={(e) => setProfileData({...profileData, nombre: e.target.value})}
                    disabled={!isEditingProfile}
                    className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Número Personal</Label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input 
                    type="text" 
                    value={profileData.telefono}
                    onChange={(e) => setProfileData({...profileData, telefono: e.target.value})}
                    disabled={!isEditingProfile}
                    className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
                  />
                </div>
              </div>

              {(profileData.rol === 'practicante' || profileData.rol === 'paciente') && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Matrícula Institucional</Label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 text-blue-400 absolute left-4" />
                    <input 
                      type="text" 
                      value={profileData.matricula}
                      onChange={(e) => setProfileData({...profileData, matricula: e.target.value})}
                      disabled={!isEditingProfile}
                      placeholder="Ej. UTC-12345"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none ${isEditingProfile ? 'bg-white border-blue-300 ring-2 ring-blue-500 border' : 'bg-slate-50 border border-slate-200 text-blue-950 disabled:cursor-not-allowed'}`}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-[11px] font-black text-blue-950/60 uppercase tracking-widest ml-1">Área Asignada</Label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-blue-400 absolute left-4" />
                  <input type="text" value="Control Global" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-400 font-medium cursor-not-allowed" />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEditProfile} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {!isEditingProfile && (
              <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                  <Trash2 className="w-4 h-4" /> Eliminar Cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MODAL ELIMINAR CUENTA */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-200 ${isDeleteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white max-w-md w-full mx-4 rounded-3xl p-6 shadow-2xl transition-all duration-200 ${isDeleteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center text-blue-950 mb-2">¿Deseas borrar tu cuenta?</h3>
          <p className="text-sm text-slate-500 text-center mb-8">
            Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, configuraciones y acceso al sistema clínico.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors">
              No, cancelar
            </button>
            <button onClick={handleConfirmDeleteAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}