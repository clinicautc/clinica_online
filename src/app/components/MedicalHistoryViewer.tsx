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
  ClipboardList, ArrowLeft, TrendingUp, MessageSquare, ShieldCheck, ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, citasAPI } from '../lib/api';
import { formatExpediente } from '../lib/formatExpediente';
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
  numero_consulta?: number | null;
}

interface EvolucionRecord {
  id: string | number;
  paciente_id?: string | number;
  nombre_completo?: string;
  numero_expediente?: string;
  appointment_id?: string | number;
  fecha_elaboracion?: string;
  fecha_creacion?: string;
  cuadro_evolucion?: Record<string, any>;
  area?: string;
  creado_por_nombre?: string;
  numero_consulta?: number | null;
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
  const [evolucionRecords, setEvolucionRecords] = useState<EvolucionRecord[]>([]);
  const [loadingEvolucion, setLoadingEvolucion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [expandedEvolucionId, setExpandedEvolucionId] = useState<string | number | null>(null);
  type ConsentState = 'loading' | 'exists' | 'missing';
  const [consentStatus, setConsentStatus] = useState<Record<string | number, ConsentState>>({});
  const [consentDownloading, setConsentDownloading] = useState<string | number | null>(null);
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

        // PASO 2: Traer los historiales clínicos (Historial Médico inicial) según el área seleccionada
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
          setPatientName(prev => prev || "Sin registros previos");
        }

        // PASO 3: Traer las notas evolutivas desde su endpoint exclusivo
        try {
          setLoadingEvolucion(true);
          const evolResponse = await apiFetch(`/notas-evolutivas/paciente/${id}`);
          if (evolResponse.ok) {
            const evolData: EvolucionRecord[] = await evolResponse.json();
            // Mostramos todos los registros de notas_evolucion; cuadro_evolucion puede llegar como objeto vacío o null según backend
            const soloEvolucion = evolData.filter((r) => r.id != null);
            setEvolucionRecords(soloEvolucion);
          } else {
            setEvolucionRecords([]);
          }
        } catch {
          setEvolucionRecords([]);
        } finally {
          setLoadingEvolucion(false);
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

  const toggleExpand = (historial: MedicalHistory) => {
    const newExpanded = expandedId === historial.id ? null : historial.id;
    setExpandedId(newExpanded);
    if (newExpanded !== null && historial.appointment_id && !(historial.appointment_id in consentStatus)) {
      const aId = historial.appointment_id;
      setConsentStatus(prev => ({ ...prev, [aId]: 'loading' as ConsentState }));
      citasAPI.checkConsentimiento(aId).then(({ existe }) => {
        setConsentStatus(prev => ({ ...prev, [aId]: (existe ? 'exists' : 'missing') as ConsentState }));
      }).catch(() => {
        setConsentStatus(prev => ({ ...prev, [aId]: 'missing' as ConsentState }));
      });
    }
  };

  const openConsentimiento = async (appointmentId: string | number) => {
    setConsentDownloading(appointmentId);
    try {
      const { blob, mimeType } = await citasAPI.downloadConsentimiento(appointmentId);
      const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error('No se pudo abrir el consentimiento informado');
    } finally {
      setConsentDownloading(null);
    }
  };

  /**
   * 4. CONFIGURACIÓN DINÁMICA DE COLORES (THEME)
   */
  const theme = {
    color: detectedArea === 'fisioterapia' ? 'text-blue-900' : 'text-orange-700',
    colorAlt: detectedArea === 'fisioterapia' ? 'text-blue-600' : 'text-orange-500',
    border: detectedArea === 'fisioterapia' ? 'border-blue-900/20' : 'border-orange-400/20',
    bgLight: detectedArea === 'fisioterapia' ? 'bg-blue-50' : 'bg-orange-50',
    bgGradient: detectedArea === 'fisioterapia'
      ? 'bg-gradient-to-br from-blue-50 to-blue-100'
      : 'bg-gradient-to-br from-orange-50 to-orange-100',
    bgIcon: detectedArea === 'fisioterapia' ? 'bg-blue-100' : 'bg-orange-100',
    btn: detectedArea === 'fisioterapia'
      ? 'bg-blue-900 hover:bg-blue-800'
      : 'bg-orange-600 hover:bg-orange-700',
    btnOutline: detectedArea === 'fisioterapia'
      ? 'border-blue-900 text-blue-900 hover:bg-blue-900'
      : 'border-orange-600 text-orange-600 hover:bg-orange-600',
    badge: detectedArea === 'fisioterapia'
      ? 'bg-blue-900 text-white'
      : 'bg-orange-600 text-white',
    header: detectedArea === 'fisioterapia'
      ? 'from-blue-600 to-blue-400'
      : 'from-orange-500 to-orange-300',
    tabActive: detectedArea === 'fisioterapia'
      ? 'data-[state=active]:bg-blue-900 data-[state=active]:text-white'
      : 'data-[state=active]:bg-orange-600 data-[state=active]:text-white'
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
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="hidden sm:flex relative items-center justify-center w-9 h-9 sm:w-12 sm:h-12 bg-blue-900 rounded-lg shadow-md shrink-0">
              {detectedArea === 'fisioterapia' ? (
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Utensils className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              )}
            </div>

            {isMaster && (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap leading-tight">
                  <span className="sm:hidden">Ver:</span>
                  <span className="hidden sm:inline">Ver Historiales de:</span>
                </span>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value as 'nutricion' | 'fisioterapia')}
                  className="h-7 sm:h-10 rounded-xl border-slate-200 px-1.5 sm:px-3 bg-white font-bold text-[10px] sm:text-xs text-slate-600 outline-none shadow-sm border"
                >
                  <option value="nutricion">NUTRICIÓN</option>
                  <option value="fisioterapia">FISIOTERAPIA</option>
                </select>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-2xl font-bold truncate">
                <span className="text-blue-900">Expediente</span>{' '}
                <span className="text-orange-600">{detectedArea.toUpperCase()}</span>
              </h1>
              <p className="text-[10px] sm:text-sm text-gray-500 font-medium tracking-wide truncate">
                Paciente: <span className="font-bold text-blue-900">{patientName || (loading ? 'Consultando...' : 'Sin Nombre')}</span>
              </p>
              <p className="text-[9px] sm:text-xs font-mono font-bold text-slate-500 truncate">Expediente: {formatExpediente(id)}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl shrink-0 px-2 sm:px-4 text-xs sm:text-sm gap-1 sm:gap-2">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Volver
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
            <TabsList className="bg-white/80 border shadow-sm p-1 h-auto gap-1 rounded-xl">
              <TabsTrigger value="historiales" className={`${theme.tabActive} font-bold`}><FileText className="w-4 h-4 mr-2" />Historial Médico</TabsTrigger>
              <TabsTrigger value="evolucion" className={`${theme.tabActive} font-bold`}><TrendingUp className="w-4 h-4 mr-2" />Seguimiento</TabsTrigger>
              <TabsTrigger value="recomendaciones" className={`${theme.tabActive} font-bold`}><TrendingUp className="w-4 h-4 mr-2" />Recomendaciones</TabsTrigger>
             
            </TabsList>

            <TabsContent value="historiales">
              <Card className="border-none shadow-2xl bg-white/95 overflow-hidden rounded-2xl">
                <CardHeader className={`${theme.bgLight} border-b p-7`}>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <CardTitle className={`${theme.color} font-extrabold text-2xl flex items-center gap-3`}><ClipboardList /> Historiales Registrados</CardTitle>
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
                      {filteredHistories.map((history, index) => {
                        const isExpanded = expandedId === history.id;
                        const isFisio = history.tipo === 'fisioterapia';
                        const accentBorder = isFisio ? 'border-blue-100' : 'border-orange-100';
                        const accentBg    = isFisio ? 'bg-blue-50'  : 'bg-orange-50';
                        const accentText  = isFisio ? 'text-blue-900' : 'text-orange-700';
                        const accentIcon  = isFisio ? 'bg-blue-100' : 'bg-orange-100';
                        const accentIconC = isFisio ? 'text-blue-600' : 'text-orange-500';
                        const accentPill  = isFisio ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';
                        const accentBtn   = isFisio ? 'bg-blue-900' : 'bg-orange-600';

                        return (
                          <div key={history.id} className={`border ${accentBorder} rounded-2xl bg-white overflow-hidden`}>
                            {/* Fila principal */}
                            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-5 flex-1">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${accentIcon}`}>
                                  {isFisio ? <Activity className={accentIconC} /> : <Utensils className={accentIconC} />}
                                </div>
                                <div>
                                  <h3 className={`font-black text-lg uppercase ${accentText}`}>{history.tipo}</h3>
                                  <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 mt-0.5">
                                    <span><Calendar className="w-3.5 h-3.5 inline mr-1" />{format(parseISO(history.fecha_creacion), "PPP", { locale: es })}</span>
                                    <span><User className="w-3.5 h-3.5 inline mr-1" />{history.creado_por_nombre}</span>
                                    {(history.numero_consulta ?? history.appointment_id) && (
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${accentPill}`}>
                                        Consulta #{history.numero_consulta ?? history.appointment_id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleExpand(history)}
                                  className="font-bold rounded-xl"
                                >
                                  {isExpanded ? 'CERRAR' : 'DETALLES'}
                                </Button>
                                <Button
                                  size="sm"
                                  className={`${accentBtn} text-white font-black`}
                                  onClick={() => {
                                    if (history.appointment_id) {
                                      navigate(`/forms/${history.tipo}/${history.appointment_id}/documento`);
                                    } else {
                                      toast.error("No se puede abrir: Este historial no está vinculado a ninguna cita.");
                                    }
                                  }}
                                >
                                  VER EXPEDIENTE
                                </Button>
                              </div>
                            </div>

                            {/* Panel de detalles expandido */}
                            {isExpanded && (
                              <div className={`border-t ${accentBorder} ${accentBg} px-6 py-5`}>
                                <p className={`text-xs font-black uppercase tracking-widest ${accentText} mb-4`}>
                                  Información del registro
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">N.º de historial</p>
                                    <p className={`font-black text-xl ${accentText}`}>#{index + 1}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">de {filteredHistories.length} registros</p>
                                  </div>
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Consulta origen</p>
                                    {history.numero_consulta ? (
                                      <>
                                        <p className={`font-black text-xl ${accentText}`}>#{history.numero_consulta}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">ID cita: {history.appointment_id}</p>
                                      </>
                                    ) : history.appointment_id ? (
                                      <p className={`font-black text-xl ${accentText}`}>ID #{history.appointment_id}</p>
                                    ) : (
                                      <p className="font-bold text-slate-400 text-sm">Sin cita vinculada</p>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Fecha de carga</p>
                                    <p className={`font-black text-sm ${accentText}`}>
                                      {format(parseISO(history.fecha_creacion), "d 'de' MMMM yyyy", { locale: es })}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {format(parseISO(history.fecha_creacion), "HH:mm 'hrs'")}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Registrado por</p>
                                    <p className={`font-black text-sm ${accentText} leading-tight`}>{history.creado_por_nombre}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{history.tipo}</p>
                                  </div>
                                </div>

                                {/* Consentimiento informado */}
                                {history.appointment_id && (
                                  <div className="mt-4 pt-4 border-t border-white/60">
                                    <p className={`text-xs font-black uppercase tracking-widest ${accentText} mb-3`}>
                                      Consentimiento Informado
                                    </p>
                                    {consentStatus[history.appointment_id] === 'loading' && (
                                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Verificando...
                                      </div>
                                    )}
                                    {consentStatus[history.appointment_id] === 'exists' && (
                                      <button
                                        onClick={() => openConsentimiento(history.appointment_id!)}
                                        disabled={consentDownloading === history.appointment_id}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${accentBtn} hover:opacity-90`}
                                      >
                                        {consentDownloading === history.appointment_id ? (
                                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Abriendo...</>
                                        ) : (
                                          <><ShieldCheck className="w-3.5 h-3.5" />Ver Consentimiento<ExternalLink className="w-3 h-3" /></>
                                        )}
                                      </button>
                                    )}
                                    {consentStatus[history.appointment_id] === 'missing' && (
                                      <p className="text-xs text-slate-400 font-medium">Sin consentimiento registrado para esta consulta.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evolucion">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/95">
                <CardHeader className={`${theme.bgLight} border-b p-7`}>
                  <CardTitle className={`${theme.color} text-2xl font-black`}>Seguimiento</CardTitle>
                </CardHeader>
                <CardContent className="p-7">
                  {loadingEvolucion ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Cargando notas evolutivas...</p>
                    </div>
                  ) : evolucionRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No hay notas de seguimiento registradas para este paciente.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {[...evolucionRecords]
                        .sort((a, b) => {
                          const dateA = a.fecha_creacion || a.fecha_elaboracion || '';
                          const dateB = b.fecha_creacion || b.fecha_elaboracion || '';
                          return new Date(dateA).getTime() - new Date(dateB).getTime();
                        })
                        .map((evol, index, sorted) => {
                          const isFisio = (evol.area || '').toLowerCase() === 'fisioterapia';
                          const accentLine   = isFisio ? 'bg-blue-200'  : 'bg-orange-200';
                          const accentDot    = isFisio ? 'bg-blue-600'  : 'bg-orange-500';
                          const accentBorder = isFisio ? 'border-blue-100' : 'border-orange-100';
                          const accentBg     = isFisio ? 'bg-blue-50'   : 'bg-orange-50';
                          const accentText   = isFisio ? 'text-blue-900': 'text-orange-700';
                          const accentPill   = isFisio ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';
                          const accentBtn    = isFisio ? 'bg-blue-900'  : 'bg-orange-600';
                          const isExpanded   = expandedEvolucionId === evol.id;
                          const numConsulta  = evol.numero_consulta ?? evol.appointment_id;
                          const isLast       = index === sorted.length - 1;
                          const fechaMostrar = evol.fecha_creacion || evol.fecha_elaboracion || '';

                          return (
                            <div key={evol.id} className={`relative pl-10 ${isLast ? 'pb-0' : 'pb-6'}`}>
                              {!isLast && (
                                <div className={`absolute left-3 top-6 bottom-0 w-0.5 ${accentLine}`} />
                              )}
                              <div className={`absolute left-0 top-0 w-6 h-6 rounded-full ${accentDot} border-4 border-white shadow-md`} />

                              <div className={`border ${accentBorder} rounded-2xl bg-white overflow-hidden shadow-sm`}>
                                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h4 className={`font-black text-base ${accentText}`}>
                                        {isFisio ? 'Notas de Evolución' : 'Seguimiento Nutricional'}
                                      </h4>
                                      {numConsulta && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${accentPill}`}>
                                          Consulta #{numConsulta}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
                                      {fechaMostrar && (
                                        <span><Calendar className="w-3.5 h-3.5 inline mr-1" />{format(parseISO(fechaMostrar), "PPP", { locale: es })}</span>
                                      )}
                                      {evol.creado_por_nombre && (
                                        <span><User className="w-3.5 h-3.5 inline mr-1" />{evol.creado_por_nombre}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setExpandedEvolucionId(isExpanded ? null : evol.id)}
                                      className="font-bold rounded-xl"
                                    >
                                      {isExpanded ? 'CERRAR' : 'DETALLES'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      className={`${accentBtn} text-white font-black`}
                                      onClick={() => {
                                        if (evol.appointment_id) {
                                          const ruta = isFisio ? 'seguimiento' : 'seguimiento-nutricional';
                                          navigate(`/forms/${ruta}/${evol.appointment_id}/documento`);
                                        } else {
                                          toast.error("Este registro no está vinculado a ninguna cita.");
                                        }
                                      }}
                                    >
                                      VER EXPEDIENTE
                                    </Button>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className={`border-t ${accentBorder} ${accentBg} px-5 py-4`}>
                                    <p className={`text-xs font-black uppercase tracking-widest ${accentText} mb-3`}>
                                      Información del registro
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div className="bg-white rounded-xl p-4 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">N.º seguimiento</p>
                                        <p className={`font-black text-xl ${accentText}`}>#{index + 1}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">de {sorted.length} registros</p>
                                      </div>
                                      <div className="bg-white rounded-xl p-4 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Consulta origen</p>
                                        {evol.numero_consulta ? (
                                          <>
                                            <p className={`font-black text-xl ${accentText}`}>#{evol.numero_consulta}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">ID cita: {evol.appointment_id}</p>
                                          </>
                                        ) : evol.appointment_id ? (
                                          <p className={`font-black text-xl ${accentText}`}>ID #{evol.appointment_id}</p>
                                        ) : (
                                          <p className="font-bold text-slate-400 text-sm">Sin cita vinculada</p>
                                        )}
                                      </div>
                                      <div className="bg-white rounded-xl p-4 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Fecha de registro</p>
                                        {fechaMostrar ? (
                                          <>
                                            <p className={`font-black text-sm ${accentText}`}>
                                              {format(parseISO(fechaMostrar), "d 'de' MMMM yyyy", { locale: es })}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                              {format(parseISO(fechaMostrar), "HH:mm 'hrs'")}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="font-bold text-slate-400 text-sm">Sin fecha</p>
                                        )}
                                      </div>
                                      <div className="bg-white rounded-xl p-4 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Área</p>
                                        <p className={`font-black text-sm ${accentText} leading-tight capitalize`}>{evol.area || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
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
                <CardHeader className={`${theme.bgLight} border-b p-7`}>
                  <CardTitle className={`${theme.color} font-extrabold text-2xl flex items-center gap-3`}>
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
