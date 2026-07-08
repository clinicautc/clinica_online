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
    <div className={`min-h-screen ${theme.bgGradient}`} style={arialStyle}>
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${theme.header} rounded-full flex items-center justify-center shadow-md`}>
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
                <h1 className={`text-xl font-bold ${theme.color}`}>
                  Expediente Médico - {detectedArea.toUpperCase()}
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Paciente: <span className="font-bold">{patientName || (loading ? 'Consultando...' : 'Sin Nombre')}</span>
                </p>
              </div>
            </div>
            
<Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-gray-200">
  <ArrowLeft className="w-4 h-4 mr-2" />Volver 
</Button>

              </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className={`w-12 h-12 animate-spin ${theme.colorAlt}`} />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Consultando PostgreSQL...</p>
          </div>
        ) : (
          <Tabs defaultValue="historiales" className="space-y-6">
            <TabsList className="bg-white/80 border shadow-sm p-1 h-auto gap-1 rounded-xl">
              <TabsTrigger value="historiales" className={`${theme.tabActive} font-bold flex-col items-start gap-0.5 h-auto py-2`}>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Historial Médico</span>
                </div>
                {histories.length > 0 && (() => {
                  const latest = [...histories].sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())[0];
                  const numConsulta = latest.numero_consulta ?? latest.appointment_id;
                  return (
                    <span className="text-[10px] font-normal opacity-75 leading-none">
                      {format(parseISO(latest.fecha_creacion), "d MMM yyyy", { locale: es })}
                      {numConsulta ? ` · Consulta #${numConsulta}` : ''}
                    </span>
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger value="evolucion" className={`${theme.tabActive} font-bold`}><TrendingUp className="w-4 h-4 mr-2" />Evolución</TabsTrigger>
              <TabsTrigger value="recomendaciones" className={`${theme.tabActive} font-bold`}><TrendingUp className="w-4 h-4 mr-2" />Recomendaciones</TabsTrigger>
             
            </TabsList>

            <TabsContent value="historiales">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/95">
                <CardHeader className="bg-slate-50 border-b p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}><ClipboardList /> Historiales Registrados</CardTitle>
                      <CardDescription className="font-bold italic text-slate-500">Lista completa de evaluaciones de {detectedArea}</CardDescription>
                    </div>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input placeholder="Buscar por fecha o profesional..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
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
                        const accentBorder = isFisio ? 'border-blue-100' : 'border-green-100';
                        const accentBg    = isFisio ? 'bg-blue-50'  : 'bg-green-50';
                        const accentText  = isFisio ? 'text-blue-900' : 'text-green-800';
                        const accentIcon  = isFisio ? 'bg-blue-100' : 'bg-green-100';
                        const accentIconC = isFisio ? 'text-blue-600' : 'text-green-600';
                        const accentPill  = isFisio ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
                        const accentBtn   = isFisio ? 'bg-blue-900' : 'bg-green-700';

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
                <CardHeader className="bg-slate-50 border-b p-8">
                  <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}>
                    <TrendingUp className="w-6 h-6" />
                    Seguimientos de {detectedArea === 'nutricion' ? 'Nutrición' : 'Fisioterapia'}
                  </CardTitle>
                  <CardDescription className="font-bold italic text-slate-500">
                    Notas de evolución registradas para {patientName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  {filteredHistories.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No hay datos de evolución para mostrar.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {[...filteredHistories]
                        .sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime())
                        .map((history, index, sorted) => {
                          const isFisio = history.tipo === 'fisioterapia';
                          const accentLine  = isFisio ? 'bg-blue-200'  : 'bg-green-200';
                          const accentDot   = isFisio ? 'bg-blue-600'  : 'bg-green-600';
                          const accentBorder= isFisio ? 'border-blue-100' : 'border-green-100';
                          const accentBg    = isFisio ? 'bg-blue-50'   : 'bg-green-50';
                          const accentText  = isFisio ? 'text-blue-900': 'text-green-800';
                          const accentPill  = isFisio ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
                          const accentBtn   = isFisio ? 'bg-blue-900'  : 'bg-green-700';
                          const isExpanded  = expandedEvolucionId === history.id;
                          const numConsulta = history.numero_consulta ?? history.appointment_id;
                          const isLast      = index === sorted.length - 1;

                          return (
                            <div key={history.id} className={`relative pl-10 ${isLast ? 'pb-0' : 'pb-6'}`}>
                              {/* Línea vertical de timeline */}
                              {!isLast && (
                                <div className={`absolute left-3 top-6 bottom-0 w-0.5 ${accentLine}`} />
                              )}
                              {/* Dot */}
                              <div className={`absolute left-0 top-0 w-6 h-6 rounded-full ${accentDot} border-4 border-white shadow-md`} />

                              {/* Tarjeta */}
                              <div className={`border ${accentBorder} rounded-2xl bg-white overflow-hidden shadow-sm`}>
                                {/* Cabecera de la tarjeta */}
                                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h4 className={`font-black text-base ${accentText}`}>
                                        Seguimiento #{index + 1}
                                      </h4>
                                      {numConsulta && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${accentPill}`}>
                                          Consulta #{numConsulta}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
                                      <span><Calendar className="w-3.5 h-3.5 inline mr-1" />{format(parseISO(history.fecha_creacion), "PPP", { locale: es })}</span>
                                      <span><User className="w-3.5 h-3.5 inline mr-1" />{history.creado_por_nombre}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setExpandedEvolucionId(isExpanded ? null : history.id)}
                                      className="font-bold rounded-xl"
                                    >
                                      {isExpanded ? 'CERRAR' : 'DETALLES'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      className={`${accentBtn} text-white font-black`}
                                      onClick={() => {
                                        if (history.appointment_id) {
                                          navigate(`/forms/${history.tipo}/${history.appointment_id}`);
                                        } else {
                                          toast.error("Este registro no está vinculado a ninguna cita.");
                                        }
                                      }}
                                    >
                                      VER EXPEDIENTE
                                    </Button>
                                  </div>
                                </div>

                                {/* Panel de detalles expandido */}
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
                                      <div className="bg-white rounded-xl p-4 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Fecha de carga</p>
                                        <p className={`font-black text-sm ${accentText}`}>
                                          {format(parseISO(history.fecha_creacion), "d 'de' MMMM yyyy", { locale: es })}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          {format(parseISO(history.fecha_creacion), "HH:mm 'hrs'")}
                                        </p>
                                      </div>
                                      <div className="bg-white rounded-xl p-4 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Registrado por</p>
                                        <p className={`font-black text-sm ${accentText} leading-tight`}>{history.creado_por_nombre}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{history.tipo}</p>
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
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/95">
                <CardHeader className="bg-slate-50 border-b p-8">
                  <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}>
                    <MessageSquare className="w-6 h-6" /> 
                    Recomendaciones de {detectedArea === 'nutricion' ? 'Nutrición' : 'Fisioterapia'}
                  </CardTitle>
                  <CardDescription className="font-bold italic text-slate-500">
                    Planes y sugerencias asignadas a {patientName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
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
      </main>
    </div>
  );
}