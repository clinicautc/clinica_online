/**
 * ============================================================================
 * ARCHIVO: MedicalHistoryViewer.tsx (Versión Final Sincronizada)
 * PROPÓSITO: Vista de historiales médicos de paciente con navegación.
 * DISEÑO: Colores dinámicos según área (Azul para Fisioterapia, Verde para Nutrición).
 * MODIFICACIÓN: Integración de búsqueda forzada de nombre por ID para evitar "Paciente: Cargando".
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, Calendar, User, Activity, Utensils, 
  Search, Loader2, BookOpen, 
  ClipboardList, ArrowLeft, TrendingUp, MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import NutritionRecommendations from './NutritionRecommendations';

interface MedicalHistory {
  id: string | number;
  paciente_id: string | number;
  paciente_nombre: string;
  tipo: 'fisioterapia' | 'nutricion';
  datos: any;
  creado_por_nombre: string;
  fecha_creacion: string;
  appointment_id?: string | number;
}

interface MedicalHistoryViewerProps {
  filterType?: 'fisioterapia' | 'nutricion';
}

export default function MedicalHistoryViewer({ filterType }: MedicalHistoryViewerProps) {
  const { id, area } = useParams<{ id: string; area: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // 1. RESTRICCIÓN ESTRICTA DE ROLES Y ÁREA
  const isMaster = user?.rol === 'master';

  const getAreaAutorizada = (): 'nutricion' | 'fisioterapia' => {
    if (isMaster) {
      // El master puede ver el área de la URL, el prop o por defecto nutrición
      return (area as any) || filterType || 'nutricion';
    }
    // Si es docente o practicante, ignoramos la URL y forzamos SU área real
    return (user?.area?.toLowerCase() as 'nutricion' | 'fisioterapia') || 'nutricion';
  };

  // --- ESTADOS ---
  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [patientName, setPatientName] = useState(''); 
  
  // Usamos el área autorizada calculada arriba
  const [selectedArea, setSelectedArea] = useState<'nutricion' | 'fisioterapia'>(getAreaAutorizada());
  const [detectedArea, setDetectedArea] = useState<'fisioterapia' | 'nutricion'>(selectedArea);
  
  // 2. PROTECCIÓN CONTRA TRAMPAS EN LA URL
  useEffect(() => {
    // Si un practicante o docente intenta escribir otra área en la barra de direcciones, lo regresamos a la suya
    if (!isMaster && area && area.toLowerCase() !== user?.area?.toLowerCase()) {
       toast.error(`Acceso denegado. Solo puedes ver historiales de tu área asignada.`);
       navigate(`/historial/${id}/${user?.area?.toLowerCase()}`, { replace: true });
    }
  }, [area, isMaster, user, navigate, id]);

  useEffect(() => {
    if (filterType && isMaster) {
      setSelectedArea(filterType);
    }
  }, [filterType, isMaster]);

  // Corrige el área cuando user carga después del mount (admin/practicante)
  useEffect(() => {
    if (user && !isMaster) {
      setSelectedArea(getAreaAutorizada());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /**
   * 2. CARGA DE DATOS SINCRONIZADA (USUARIO + HISTORIALES)
   */
  useEffect(() => {
    const fetchEverything = async () => {
      if (!id) return;

      try {
        setLoading(true);
      
        // PASO 1: Traer el nombre real del usuario por su ID de Postgres
        // Esto garantiza que el encabezado no diga "Cargando" o "Sin Nombre"
        const userRes = await apiFetch(`/usuarios/${id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setPatientName(userData.nombre);
        }

        // PASO 2: Traer los historiales clínicos según el área seleccionada
        const response = await apiFetch(`/historiales-${selectedArea}/paciente/${id}`);

        if (response.ok) {
          const data: MedicalHistory[] = await response.json();
          setHistories(data);

          if (data.length > 0) {
            setPatientName(data[0]?.paciente_nombre || 'Paciente Registrado');
          }

          setDetectedArea(selectedArea);
        } else {
          setHistories([]);
          // Usar setter funcional para no leer patientName del closure
          setPatientName(prev => prev || "Sin registros previos");
        }
      } catch (error) {
        console.error("Error al cargar datos desde PostgreSQL:", error);
        toast.error("Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchEverything();
  }, [id, selectedArea]);

  /**
   * 3. BÚSQUEDA DINÁMICA
   */
  const filteredHistories = histories.filter((h) => {
    const searchLower = searchTerm.toLowerCase();
    const paciente = (h.paciente_nombre || '').toLowerCase();
    const profesional = (h.creado_por_nombre || '').toLowerCase();
    const fechaStr = (h.fecha_creacion || '').toLowerCase();

    return paciente.includes(searchLower) || 
           profesional.includes(searchLower) || 
           fechaStr.includes(searchLower);
  });

  const toggleExpand = (id: string | number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /**
   * 4. CONFIGURACIÓN DINÁMICA DE COLORES (THEME)
   */
  const theme = {
    color: detectedArea === 'fisioterapia' ? 'text-blue-900' : 'text-green-700',
    colorAlt: detectedArea === 'fisioterapia' ? 'text-blue-600' : 'text-green-600',
    border: detectedArea === 'fisioterapia' ? 'border-blue-900/20' : 'border-green-600/20',
    bgLight: detectedArea === 'fisioterapia' ? 'bg-blue-50' : 'bg-green-50',
    bgGradient: detectedArea === 'fisioterapia' 
      ? 'bg-gradient-to-br from-blue-50 to-blue-100' 
      : 'bg-gradient-to-br from-green-50 to-green-100',
    bgIcon: detectedArea === 'fisioterapia' ? 'bg-blue-100' : 'bg-green-100',
    btn: detectedArea === 'fisioterapia' 
      ? 'bg-blue-900 hover:bg-blue-800' 
      : 'bg-green-700 hover:bg-green-800',
    btnOutline: detectedArea === 'fisioterapia'
      ? 'border-blue-900 text-blue-900 hover:bg-blue-900'
      : 'border-green-700 text-green-700 hover:bg-green-700',
    badge: detectedArea === 'fisioterapia'
      ? 'bg-blue-900 text-white'
      : 'bg-green-700 text-white',
    header: detectedArea === 'fisioterapia'
      ? 'from-blue-600 to-blue-400'
      : 'from-green-600 to-green-400',
    tabActive: detectedArea === 'fisioterapia'
      ? 'data-[state=active]:bg-blue-900 data-[state=active]:text-white'
      : 'data-[state=active]:bg-green-700 data-[state=active]:text-white'
  };

  
  return (
    <div className="size-full min-h-screen relative overflow-hidden bg-white" style={arialStyle}>
      {/* CAPAS ESTÉTICAS UTC */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60"></div>
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500 transform rotate-45 opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-blue-800 transform rotate-45 opacity-10"></div>

      <div className="relative z-10 size-full p-4 sm:p-6">
      {/* HEADER INSTITUCIONAL */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm mb-6 rounded-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 bg-blue-900 rounded-lg shadow-md">
              {detectedArea === 'fisioterapia' ? (
                <Activity className="w-6 h-6 text-white" />
              ) : (
                <Utensils className="w-6 h-6 text-white" />
              )}
            </div>

            {isMaster && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ver Historiales de:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value as 'nutricion' | 'fisioterapia')}
                  className="h-10 rounded-xl border-slate-200 px-3 bg-white font-bold text-xs text-slate-600 outline-none shadow-sm border"
                >
                  <option value="nutricion">NUTRICIÓN</option>
                  <option value="fisioterapia">FISIOTERAPIA</option>
                </select>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-blue-900">Expediente</span>{' '}
                <span className="text-orange-600">{detectedArea.toUpperCase()}</span>
              </h1>
              <p className="text-sm text-gray-500 font-medium tracking-wide">
                Paciente: <span className="font-bold text-blue-900">{patientName || (loading ? 'Consultando...' : 'Sin Nombre')}</span>
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />Volver
          </Button>
        </div>
      </header>

      <div className="w-full space-y-7">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Consultando PostgreSQL...</p>
          </div>
        ) : (
          <Tabs defaultValue="historiales" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-1.5 border border-gray-100 overflow-x-auto">
              <TabsList className="bg-transparent flex justify-start gap-2.5 h-auto">
                <TabsTrigger value="historiales" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold"><FileText className="w-5 h-5" />Historial Médico</TabsTrigger>
                <TabsTrigger value="evolucion" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold"><TrendingUp className="w-5 h-5" />Evolución</TabsTrigger>
                <TabsTrigger value="recomendaciones" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-lg px-6 py-1.5 text-base flex items-center gap-2 transition-all font-bold"><TrendingUp className="w-5 h-5" />Recomendaciones</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="historiales">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="bg-gray-50/80 border-b p-7">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <CardTitle className="text-blue-900 font-extrabold text-2xl flex items-center gap-3"><ClipboardList /> Historiales Registrados</CardTitle>
                      <CardDescription className="font-bold italic text-slate-500">Lista completa de evaluaciones de {detectedArea}</CardDescription>
                    </div>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input placeholder="Buscar por fecha o profesional..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-xl border-blue-200" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-7">
                  {filteredHistories.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No hay historiales de {detectedArea} registrados para este paciente.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistories.map((history) => (
                        <div key={history.id} className={`group border ${history.tipo === 'fisioterapia' ? 'border-blue-100' : 'border-green-100'} rounded-2xl bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-4`}>
                          <div className="flex items-center gap-5 flex-1">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${history.tipo === 'fisioterapia' ? 'bg-blue-100' : 'bg-green-100'}`}>
                              {history.tipo === 'fisioterapia' ? <Activity className="text-blue-600" /> : <Utensils className="text-green-600" />}
                            </div>
                            <div>
                              <h3 className={`font-black text-lg uppercase ${history.tipo === 'fisioterapia' ? 'text-blue-900' : 'text-green-800'}`}>{history.tipo}</h3>
                              <div className="flex gap-4 text-[11px] font-bold text-slate-500">
                                <span><Calendar className="w-4 h-4 inline mr-1" />{format(parseISO(history.fecha_creacion), "PPP", { locale: es })}</span>
                                <span><User className="w-4 h-4 inline mr-1" />{history.creado_por_nombre}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleExpand(history.id)} className="font-bold rounded-xl">DETALLES</Button>
                            <Button 
  size="sm" 
  className={`${history.tipo === 'fisioterapia' ? 'bg-blue-900' : 'bg-green-700'} text-white font-black`} 
  onClick={() => {
    // NUEVA VALIDACIÓN: Solo navegar si existe el ID
    if (history.appointment_id) {
      navigate(`/forms/${history.tipo}/${history.appointment_id}`);
    } else {
      toast.error("No se puede abrir: Este historial no está vinculado a ninguna cita.");
    }
  }}
>
  VER EXPEDIENTE
</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evolucion">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="bg-gray-50/80 border-b p-7">
                  <CardTitle className="text-blue-900 font-extrabold text-2xl">Evolución</CardTitle>
                </CardHeader>
                <CardContent className="p-7">
                  {filteredHistories.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No hay datos de evolución para mostrar.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {filteredHistories.sort((a,b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()).map((history, index) => {
                        const d1 = history.datos?.pagina_1 || {};
                        const motivo = history.tipo === 'fisioterapia' ? (d1.motivo_0 || 'Sin motivo') : (d1.motivos_y_qx?.motivos || 'Sin motivo');
                        return (
                          <div key={history.id} className="relative pl-8 pb-8 last:pb-0">
                            <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${history.tipo === 'fisioterapia' ? 'bg-blue-200' : 'bg-green-200'}`}></div>
                            <div className={`absolute left-0 top-0 w-6 h-6 rounded-full ${history.tipo === 'fisioterapia' ? 'bg-blue-600' : 'bg-green-600'} border-4 border-white shadow-lg`}></div>
                            <div className={`border ${history.tipo === 'fisioterapia' ? 'border-blue-200' : 'border-green-200'} rounded-2xl p-6 bg-white shadow-sm`}>
                              
                              <h4 className={`font-black text-lg ${history.tipo === 'fisioterapia' ? 'text-blue-900' : 'text-green-800'}`}>
                                Nota evolutiva de {history.tipo} #{filteredHistories.length - index}
                              </h4>
                              
                              <p className="text-sm text-slate-700 mt-2">{motivo}</p>
                              
                              <div className="flex gap-3 mt-4">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/forms/${history.tipo}/${history.appointment_id}`)} className="font-bold border-slate-200">
                                  VER FORMULARIO COMPLETO
                                </Button>
                                
                               <Button 
  size="sm" 
  onClick={() => {
    
    if (history.appointment_id) {
      navigate(`/hoja-evolutiva/${history.appointment_id}`);
    } else {
      toast.error("No se pueden ver notas evolutivas: Falta el ID de la cita.");
    }
  }} 
  className={`font-bold text-white shadow-sm transition-colors ${history.tipo === 'fisioterapia' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
>
  <FileText className="w-4 h-4 mr-2" />
  Ver Notas Evolutivas
</Button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

                    <TabsContent value="recomendaciones">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className="bg-gray-50/80 border-b p-7">
                  <CardTitle className="text-blue-900 font-extrabold text-2xl flex items-center gap-3">
                    <MessageSquare className="w-6 h-6" />
                    Recomendaciones de {detectedArea === 'nutricion' ? 'Nutrición' : 'Fisioterapia'}
                  </CardTitle>
                  <CardDescription className="font-bold italic text-slate-500">
                    Planes y sugerencias asignadas a {patientName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-7">
                  {/* Aquí inyectas tu componente pasándole las variables dinámicas */}
                  <NutritionRecommendations 
                    pacienteId={id || ''} 
                    pacienteNombre={patientName}
                    area={selectedArea}
                  />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </div>

      <footer className="py-16 text-center">
        <div className="inline-block px-7 py-2.5 border-y border-gray-100">
          <p className="text-xs text-gray-400 font-black uppercase tracking-[0.6em] opacity-40">
            Sistema de Gestión de Academias UTC • 2026
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}