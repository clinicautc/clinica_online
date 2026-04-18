/**
 * ============================================================================
 * ARCHIVO: MedicalHistoryViewer.tsx - Versión Final Blindada
 * PROPÓSITO: Vista de historiales médicos con protección contra datos nulos
 * CORRECCIÓN: Manejo de acentos y validación de strings para PostgreSQL
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
import { useAuth } from '../contexts/AuthContext';

interface MedicalHistory {
  [x: string]: any;
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
  const { user } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // --- NORMALIZACIÓN DE ROLES Y ÁREAS ---
  // Eliminamos acentos y convertimos a minúsculas para evitar fallos de concordancia (Nutrición vs nutricion)
  const normalizeText = (text: string) => 
    (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const userRole = normalizeText(user?.rol || '');
  const userArea = normalizeText(user?.area || '');
  
  const isMaster = userRole === 'master';
  
  // --- ESTADOS ---
  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientName, setPatientName] = useState('');
  
  // Estado inicial: Si es master empieza en nutricion, si no, en su área normalizada
  const [selectedArea, setSelectedArea] = useState<'nutricion' | 'fisioterapia'>(
    isMaster ? 'nutricion' : (userArea.includes('fisio') ? 'fisioterapia' : 'nutricion')
  );
  
  useEffect(() => {
    const fetchHistories = async () => {
      try {
        setLoading(true);
        
        // Determinamos el endpoint basado en la selección o el área del usuario
        const areaParam = isMaster ? selectedArea : (userArea.includes('fisio') ? 'fisioterapia' : 'nutricion');
        const endpoint = `http://localhost:3001/api/historiales/${areaParam}`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data: MedicalHistory[] = await response.json();
          
          // FILTRO BLINDADO: 
          // 1. Convertimos ambos a string para evitar fallos number vs string.
          // 2. Si es MASTER, durante pruebas, podrías querer ver todo comentando el filtro, 
          //    pero por ahora lo dejamos estricto al patientId de la URL.
          const filtered = data.filter(h => String(h.paciente_id) === String(patientId));
          setHistories(filtered);

          if (filtered.length > 0) {
            // Buscamos el nombre en cualquiera de los campos posibles (nombre o nombre_completo)
            const firstEntry = filtered[0];
            const nameFromData = firstEntry?.paciente_nombre || 
                                firstEntry?.datos?.pagina_1?.nombre_completo || 
                                firstEntry?.datos?.pagina_1?.nombre || 
                                'Paciente Registrado';
            setPatientName(nameFromData);
          }
        }
      } catch (error) {
        console.error("Error en Fetch:", error);
        toast.error("Error de comunicación con el servidor");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchHistories();
  }, [patientId, selectedArea, isMaster, userArea]);

  // Filtrado para la barra de búsqueda (con salvaguardas para nulos)
  const filteredHistories = histories.filter((h) => {
    const search = searchTerm.toLowerCase();
    const nombrePaciente = (h.paciente_nombre || '').toLowerCase();
    const creadoPor = (h.creado_por_nombre || '').toLowerCase();
    const tipo = (h.tipo || '').toLowerCase();
    
    return nombrePaciente.includes(search) || creadoPor.includes(search) || tipo.includes(search);
  });

  // Configuración de Tema visual dinámico
  const isFisioUI = selectedArea === 'fisioterapia';
  const theme = {
    color: isFisioUI ? 'text-blue-900' : 'text-green-700',
    bgGradient: isFisioUI ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-green-50 to-green-100',
    btn: isFisioUI ? 'bg-blue-900 hover:bg-blue-800' : 'bg-green-700 hover:bg-green-800',
    header: isFisioUI ? 'from-blue-600 to-blue-400' : 'from-green-600 to-green-400',
    tabActive: isFisioUI ? 'data-[state=active]:bg-blue-900 data-[state=active]:text-white' : 'data-[state=active]:bg-green-700 data-[state=active]:text-white'
  };

  return (
    <div className={`min-h-screen ${theme.bgGradient}`} style={arialStyle}>
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${theme.header} rounded-full flex items-center justify-center shadow-md text-white`}>
              {isFisioUI ? <Activity /> : <Utensils />}
            </div>
            
            {isMaster ? (
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selector Master:</span>
                <select 
                  value={selectedArea} 
                  onChange={(e) => setSelectedArea(e.target.value as any)}
                  className="h-9 rounded-lg border-slate-200 px-2 bg-white font-bold text-xs text-slate-600 outline-none border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nutricion">🍎 ÁREA NUTRICIÓN</option>
                  <option value="fisioterapia">♿ ÁREA FISIOTERAPIA</option>
                </select>
              </div>
            ) : (
              <div>
                <h1 className={`text-xl font-bold ${theme.color}`}>
                  EXPEDIENTE: {(patientName || 'Cargando...').toUpperCase()}
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área: {selectedArea}</p>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="font-bold border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className={`w-10 h-10 animate-spin ${theme.color}`} />
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">Sincronizando con PostgreSQL...</p>
          </div>
        ) : (
          <Tabs defaultValue="historiales" className="space-y-6">
            <TabsList className="bg-white border p-1 h-auto rounded-xl shadow-sm">
              <TabsTrigger value="historiales" className={theme.tabActive}>
                <FileText className="w-4 h-4 mr-2" /> HISTORIALES
              </TabsTrigger>
              <TabsTrigger value="evolucion" className={theme.tabActive}>
                <TrendingUp className="w-4 h-4 mr-2" /> LÍNEA DE EVOLUCIÓN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="historiales">
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/90">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <CardTitle className={`${theme.color} text-xl font-black uppercase tracking-tight`}>Registros Encontrados</CardTitle>
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar por fecha o encargado..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl bg-white border-slate-200"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {filteredHistories.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="text-slate-300 w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase italic">No se encontraron historiales clínicos</p>
                      <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest">Verifica el ID del paciente ({patientId})</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredHistories.map((h) => (
                        <div key={h.id} className="flex flex-col md:flex-row items-center justify-between p-5 border rounded-2xl bg-white hover:shadow-md transition-all gap-4 border-slate-100">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-4 rounded-2xl ${isFisioUI ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                              {isFisioUI ? <Activity className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 uppercase text-sm">Consulta de {h.tipo || 'General'}</p>
                              <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-400 uppercase mt-1">
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                  <Calendar className="w-3 h-3"/> {h.fecha_creacion ? format(parseISO(h.fecha_creacion), "dd/MM/yyyy") : 'S/F'}
                                </span>
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                  <User className="w-3 h-3"/> {(h.creado_por_nombre || 'Sin nombre').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            className={`${theme.btn} text-white font-black rounded-xl px-8 shadow-sm transition-transform active:scale-95`}
                            onClick={() => navigate(`/forms/${h.tipo}/${h.appointment_id || h.id}`)}
                          >
                            ABRIR EXPEDIENTE
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evolucion">
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/90">
                <CardContent className="p-8">
                  <div className="relative space-y-8">
                    {filteredHistories.length === 0 ? (
                      <p className="text-center text-slate-400 py-10 italic">Sin datos de evolución disponibles.</p>
                    ) : (
                      filteredHistories.map((h, idx) => {
                        // Extracción segura del motivo para evitar crash si el JSON es null
                        const d1 = h.datos?.pagina_1 || {};
                        const motivoRaw = isFisioUI ? d1.motivo_0 : d1.motivos_y_qx?.motivos;
                        const motivo = motivoRaw || "No se registró motivo de consulta en esta sesión.";

                        return (
                          <div key={h.id} className="relative pl-10">
                            {idx !== filteredHistories.length - 1 && (
                              <div className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${isFisioUI ? 'bg-blue-100' : 'bg-green-100'}`} />
                            )}
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${isFisioUI ? 'bg-blue-600' : 'bg-green-600'}`} />
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${isFisioUI ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                  {h.fecha_creacion ? format(parseISO(h.fecha_creacion), "PPP", { locale: es }) : 'Fecha no registrada'}
                                </span>
                                <Badge variant="outline" className="text-[9px] font-black border-slate-200">ID: {h.id}</Badge>
                              </div>
                              <p className="text-sm text-slate-600 italic leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                                "{motivo}"
                              </p>
                              <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <User className="w-3 h-3" /> Por: {(h.creado_por_nombre || 'Sistema').toUpperCase()}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-[10px] font-black hover:bg-slate-50 uppercase tracking-tighter" 
                                  onClick={() => navigate(`/forms/${h.tipo}/${h.appointment_id || h.id}`)}
                                >
                                  DETALLES COMPLETOS →
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="py-12 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de datos PostgreSQL conectada</p>
        </div>
        <p className="text-[9px] font-medium text-slate-300 uppercase tracking-[0.3em]">© 2026 Universidad Tres Culturas - Gestión de Clínica Universitaria</p>
      </footer>
    </div>
  );
}