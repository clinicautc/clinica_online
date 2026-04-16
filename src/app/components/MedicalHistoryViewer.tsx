/**
 * ============================================================================
 * ARCHIVO: MedicalHistoryViewer.tsx - Dashboard de Historial Médico
 * PROPÓSITO: Vista de historiales médicos de paciente con navegación
 * DISEÑO: Colores dinámicos según área (Azul para Fisioterapia, Verde para Nutrición)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, Calendar, User, Activity, Utensils, 
  ChevronDown, ChevronUp, Search, Loader2, BookOpen, 
  History, ClipboardList, ArrowLeft, TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface MedicalHistory {
  [x: string]: string;
  id: string | number;
  paciente_id: string | number;
  paciente_nombre: string;
  tipo: 'fisioterapia' | 'nutricion';
  datos: any;
  creado_por_nombre: string;
  fecha_creacion: string;
  appointment_id?: string | number;
}

export default function MedicalHistoryViewer() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // --- ESTADOS ---
  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [detectedArea, setDetectedArea] = useState<'fisioterapia' | 'nutricion' | null>(null);

  /**
   * CARGA DE DATOS: Sincronización con PostgreSQL
   */
  useEffect(() => {
    const fetchHistories = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/historiales');
        if (response.ok) {
          const data: MedicalHistory[] = await response.json();
          
          // Filtrar solo los historiales del paciente actual
          const patientHistories = data.filter(h => 
            String(h.paciente_id) === String(patientId)
          );

          setHistories(patientHistories);

          // Detectar el área predominante del paciente
          if (patientHistories.length > 0) {
           setPatientName(patientHistories[0]?.paciente_nombre || 'Paciente sin nombre');
            // Contar historiales por área
            const fisioCount = patientHistories.filter(h => h.tipo === 'fisioterapia').length;
            const nutriCount = patientHistories.filter(h => h.tipo === 'nutricion').length;
            setDetectedArea(fisioCount >= nutriCount ? 'fisioterapia' : 'nutricion');
          }
        }
      } catch (error) {
        console.error("Error al cargar historiales:", error);
        toast.error("Error al conectar con la base de datos");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchHistories();
    }
  }, [patientId]);

  /**
   * BÚSQUEDA DINÁMICA
   */
  const filteredHistories = histories.filter((h) => {
  const searchLower = searchTerm.toLowerCase();
  
  // Blindaje: Si el valor es null, usamos '' para que no rompa la app
  const profesional = (h.creado_por_nombre || '').toLowerCase();
  const tipoArea = (h.tipo || '').toLowerCase();
  const fechaStr = (h.fecha_creacion || '').toLowerCase();

  return (
    profesional.includes(searchLower) ||
    tipoArea.includes(searchLower) ||
    fechaStr.includes(searchLower)
  );
});

  const toggleExpand = (id: string | number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Configuración de colores dinámica según el área detectada
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
              <div>
                <h1 className={`text-xl font-bold ${theme.color}`}>
                  Expediente Médico - {detectedArea ? detectedArea.toUpperCase() : 'CARGANDO...'}
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Paciente: <span className="font-bold">{patientName || 'Cargando...'}</span>
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className={`w-12 h-12 animate-spin ${theme.colorAlt}`} />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
              Consultando PostgreSQL...
            </p>
          </div>
        ) : (
          <Tabs defaultValue="historiales" className="space-y-6">
            {/* Tabs Navigation */}
            <TabsList className="bg-white/80 backdrop-blur-sm border shadow-sm p-1 h-auto gap-1 rounded-xl">
              <TabsTrigger 
                value="historiales" 
                className={`${theme.tabActive} font-bold`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Historial Médico
              </TabsTrigger>
              <TabsTrigger 
                value="evolucion" 
                className={`${theme.tabActive} font-bold`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Evolución
              </TabsTrigger>
            </TabsList>

            {/* TAB: Historial Médico (Lista) */}
            <TabsContent value="historiales">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/95">
                <CardHeader className="bg-slate-50/50 border-b p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}>
                        <ClipboardList className="w-7 h-7" />
                        Historiales Registrados
                      </CardTitle>
                      <CardDescription className="font-bold italic text-slate-500 mt-1">
                        Lista completa de evaluaciones médicas del paciente
                      </CardDescription>
                    </div>

                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        placeholder="Buscar por fecha o profesional..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-slate-200 shadow-inner bg-white font-medium"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  {filteredHistories.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-[2rem] border-slate-100 bg-slate-50/50">
                      <FileText className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold italic">
                        {searchTerm 
                          ? 'No se encontraron historiales con ese criterio.' 
                          : 'No hay historiales registrados para este paciente.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistories.map((history) => (
                        <div
                          key={history.id}
                          className={`group border ${theme.border} rounded-2xl bg-white hover:shadow-lg transition-all duration-300 overflow-hidden`}
                        >
                          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Info del historial */}
                            <div className="flex items-center gap-5 flex-1">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 ${theme.bgIcon}`}>
                                {history.tipo === 'fisioterapia' ? 
                                  <Activity className={`w-7 h-7 ${theme.colorAlt}`} /> : 
                                  <Utensils className={`w-7 h-7 ${theme.colorAlt}`} />
                                }
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-black text-blue-950 text-lg uppercase tracking-tight">
                                    {history.tipo.toUpperCase()}
                                  </h3>
                                  <Badge className={`${theme.badge} border-none px-3 rounded-lg text-[10px] font-black`}>
                                    ID: {history.id}
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-slate-500">
                                  <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {format(parseISO(history.fecha_creacion), "PPP", { locale: es })}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {history.creado_por_nombre}
                                  </span>
                                  {history.appointment_id && (
                                    <span className="flex items-center gap-2">
                                      <History className="w-4 h-4" />
                                      Cita #{history.appointment_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleExpand(history.id)}
                                className={`${theme.btnOutline} hover:text-white font-bold rounded-xl px-4 transition-all`}
                              >
                                {expandedId === history.id ? (
                                  <>
                                    <ChevronUp className="mr-2 w-4 h-4"/> CERRAR
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="mr-2 w-4 h-4"/> VER DETALLES
                                  </>
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                className={`${theme.btn} text-white font-black text-xs rounded-xl px-4 shadow-lg`}
                                onClick={() => navigate(`/forms/${history.tipo}/${history.appointment_id}`)}
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                FORMULARIO
                              </Button>
                            </div>
                          </div>

                          {/* DETALLE EXPANDIDO */}
                          {expandedId === history.id && (
                            <div className="px-6 pb-6 pt-2 border-t border-dashed border-slate-200 animate-in slide-in-from-top-4 duration-500">
                              <div className="flex items-center gap-2 mb-6 mt-4">
                                <div className={`w-1 h-6 ${detectedArea === 'fisioterapia' ? 'bg-blue-900' : 'bg-green-600'} rounded-full`}></div>
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                  Información Detallada
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(history.datos?.pagina_1 || {})
                                  .filter(([_, value]) => value && String(value).trim() !== "" && typeof value !== 'object')
                                  .map(([key, value]) => (
                                    <div 
                                      key={key}
                                      className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 hover:bg-white hover:border-blue-100 transition-all shadow-sm"
                                    >
                                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
                                        {key.replace(/_/g, ' ')}
                                      </p>
                                      <p className="text-sm font-bold text-blue-950">
                                        {String(value)}
                                      </p>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Footer */}
                <div className="bg-slate-50 p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="rounded-lg border-slate-200 bg-white text-slate-500 font-black px-4 py-1">
                      TOTAL: {filteredHistories.length} REGISTROS
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Base de Datos: Online
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">
                    Universidad Tres Culturas • Sistema de Gestión Clínica v3.0
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* TAB: Evolución */}
            <TabsContent value="evolucion">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/95">
                <CardHeader className="bg-slate-50/50 border-b p-8">
                  <CardTitle className={`${theme.color} text-2xl font-black flex items-center gap-3`}>
                    <TrendingUp className="w-7 h-7" />
                    Evolución del Paciente
                  </CardTitle>
                  <CardDescription className="font-bold italic text-slate-500 mt-1">
                    Seguimiento cronológico del progreso médico
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                  {filteredHistories.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-[2rem] border-slate-100 bg-slate-50/50">
                      <TrendingUp className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold italic">
                        No hay datos suficientes para mostrar la evolución.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Timeline de evolución */}
                      <div className="relative">
                        {filteredHistories
                          .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
                          .map((history, index) => {
                            // Extraer información clave para el resumen
                            const datos = history.datos?.pagina_1 || {};
                            const motivo = datos.motivo_consulta || datos.motivo || datos.razon_consulta || '';
                            const diagnostico = datos.diagnostico || datos.diagnostico_principal || datos.impresion_diagnostica || '';
                            const observaciones = datos.observaciones || datos.notas || datos.comentarios || '';
                            const planTratamiento = datos.plan_tratamiento || datos.tratamiento || datos.plan || '';
                            
                            return (
                              <div key={history.id} className="relative pl-8 pb-8 last:pb-0">
                                {/* Línea vertical */}
                                {index !== filteredHistories.length - 1 && (
                                  <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${detectedArea === 'fisioterapia' ? 'bg-blue-200' : 'bg-green-200'}`}></div>
                                )}
                                
                                {/* Punto en la línea */}
                                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full ${detectedArea === 'fisioterapia' ? 'bg-blue-600' : 'bg-green-600'} border-4 border-white shadow-lg`}></div>
                                
                                {/* Contenido */}
                                <div className={`border ${theme.border} rounded-2xl p-6 bg-white hover:shadow-lg transition-all`}>
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <p className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {format(parseISO(history.fecha_creacion), "PPP", { locale: es })}
                                      </p>
                                      <h4 className="font-black text-blue-950 text-lg">
                                        Evaluación de {history.tipo}
                                      </h4>
                                    </div>
                                    <Badge className={`${theme.badge} border-none px-3 rounded-lg text-xs font-black`}>
                                      {history.tipo.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-slate-600 font-medium mb-4">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Realizado por: {history.creado_por_nombre}
                                  </p>

                                  {/* RESUMEN DE LA CONSULTA */}
                                  <div className="space-y-3 mb-4 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                      Resumen de la Consulta
                                    </h5>
                                    
                                    {motivo && (
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                          Motivo de Consulta:
                                        </p>
                                        <p className="text-sm text-blue-950 font-medium leading-relaxed">
                                          {motivo}
                                        </p>
                                      </div>
                                    )}

                                    {diagnostico && (
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                          Diagnóstico / Impresión:
                                        </p>
                                        <p className="text-sm text-blue-950 font-medium leading-relaxed">
                                          {diagnostico}
                                        </p>
                                      </div>
                                    )}

                                    {planTratamiento && (
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                          Plan de Tratamiento:
                                        </p>
                                        <p className="text-sm text-blue-950 font-medium leading-relaxed">
                                          {planTratamiento}
                                        </p>
                                      </div>
                                    )}

                                    {observaciones && (
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                          Observaciones Adicionales:
                                        </p>
                                        <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                                          {observaciones}
                                        </p>
                                      </div>
                                    )}

                                    {!motivo && !diagnostico && !planTratamiento && !observaciones && (
                                      <p className="text-xs text-slate-400 italic text-center py-2">
                                        No hay resumen disponible para esta consulta
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/forms/${history.tipo}/${history.appointment_id}`)}
                                    className={`${theme.btnOutline} hover:text-white font-bold rounded-xl`}
                                  >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Ver Formulario Completo
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
