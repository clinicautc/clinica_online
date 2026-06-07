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
  ClipboardList, ArrowLeft, TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

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
  /**
   * 1. CAPTURA DE PARÁMETROS DINÁMICOS
   */
  const { id, area } = useParams<{ id: string; area: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // --- ESTADOS ---
  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [patientName, setPatientName] = useState(''); 
  
  // Sincronización visual con el área de la URL o el filtro prop
  const [detectedArea, setDetectedArea] = useState<'fisioterapia' | 'nutricion'>((area as any) || 'nutricion');
  
  // Selector de área para usuarios MASTER
  const [selectedArea, setSelectedArea] = useState<'nutricion' | 'fisioterapia'>((area as any) || filterType || 'nutricion');
  
  useEffect(() => {
    if (filterType) {
      setSelectedArea(filterType);
    }
  }, [filterType]);
  
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
        const userRes = await fetch(`http://localhost:3001/api/usuarios/${id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setPatientName(userData.nombre); 
        }

        // PASO 2: Traer los historiales clínicos según el área seleccionada
        const endpoint = `http://localhost:3001/api/historiales-${selectedArea}/paciente/${id}`;
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data: MedicalHistory[] = await response.json();
          setHistories(data);

          // Si hay registros, el nombre del historial suele ser más preciso para la ficha
          if (data.length > 0) {
            setPatientName(data[0]?.paciente_nombre || 'Paciente Registrado');
          }
          
          setDetectedArea(selectedArea);
        } else {
          setHistories([]);
          if (!patientName) setPatientName("Sin registros previos");
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

  const isMaster = user?.rol === 'master' || user?.rol === 'admin';

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
              <TabsTrigger value="historiales" className={`${theme.tabActive} font-bold`}><FileText className="w-4 h-4 mr-2" />Historial Médico</TabsTrigger>
              <TabsTrigger value="evolucion" className={`${theme.tabActive} font-bold`}><TrendingUp className="w-4 h-4 mr-2" />Evolución</TabsTrigger>
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
                            <Button size="sm" className={`${history.tipo === 'fisioterapia' ? 'bg-blue-900' : 'bg-green-700'} text-white font-black`} onClick={() => navigate(`/forms/${history.tipo}/${history.appointment_id}`)}>VER EXPEDIENTE</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evolucion">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/95">
                <CardHeader className="bg-slate-50 border-b p-8"><CardTitle className={`${theme.color} text-2xl font-black`}>Evolución</CardTitle></CardHeader>
                <CardContent className="p-8">
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
                              <h4 className={`font-black text-lg ${history.tipo === 'fisioterapia' ? 'text-blue-900' : 'text-green-800'}`}>Consulta de {history.tipo} #{filteredHistories.length - index}</h4>
                              <p className="text-sm text-slate-700 mt-2">{motivo}</p>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/forms/${history.tipo}/${history.appointment_id}`)} className="mt-4 font-bold border-slate-200">VER FORMULARIO COMPLETO</Button>
                            </div>
                          </div>
                        );
                      })}
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