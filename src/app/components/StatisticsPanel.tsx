/**
 * ============================================================================
 * COMPONENTE: StatisticsPanel
 * PROPÓSITO: Inteligencia Operativa y KPIs de Eficiencia Clínica.
 * MODIFICACIÓN: Sincronización con tabla 'metricas' para evitar ceros.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Calendar, Clock, CheckCircle, XCircle, BarChart3, 
  Zap, AlertTriangle, TrendingUp, Users2, Activity, CalendarClock 
} from 'lucide-react';
import { parseISO, getDay, differenceInMinutes, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Tipado extendido para las nuevas métricas del servidor
interface ExtendedStats {
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  citasProgramadas: number;
  reagendadas: number; // Métrica de seguimiento de cambios
  datosGrafica: { name: string; nutricion: number; fisioterapia: number }[];
  horariosMasVisitados: { horario: string; cantidad: number }[];
  tiempoPromedioConsulta: number; 
  tasaAbandono: number;
  pacientesNuevosSemana: number;
  velocidadAsignacionDocente: number; 
}

interface StatisticsPanelProps {
  area?: 'nutricion' | 'fisioterapia' | 'todos' | 'general';
}

export default function StatisticsPanel({ area }: StatisticsPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExtendedStats>({
    totalCitas: 0,
    citasCompletadas: 0,
    citasCanceladas: 0,
    citasProgramadas: 0,
    reagendadas: 0,
    datosGrafica: [],
    horariosMasVisitados: [],
    tiempoPromedioConsulta: 0,
    tasaAbandono: 0,
    pacientesNuevosSemana: 0,
    velocidadAsignacionDocente: 0
  });

  const esMaster = user?.rol === 'master';
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  useEffect(() => {
    const fetchAllMetrics = async () => {
      try {
        setLoading(true);
        
        // 1. Obtención de datos base y analíticos (Consumiendo la nueva tabla metricas)
        const [resCitas, resHistoriales, resDashboard] = await Promise.all([
          fetch('http://localhost:3001/api/citas'),
          fetch('http://localhost:3001/api/historiales'),
          fetch('http://localhost:3001/api/stats/dashboard',{ headers: {email: user?.email || ''}}) // NUEVO: Trae datos de la tabla 'metricas'
        ]);

        const citas = await resCitas.json();
        const historiales = await resHistoriales.json();
        const dbStats = await resDashboard.json();

        // --- LÓGICA DE FILTRADO EXISTENTE ---
        let filteredCitas = citas;
        if (area && area !== 'todos' && area !== 'general') {
          filteredCitas = citas.filter((apt: any) => apt.tipo === area);
        }

        // --- CÁLCULO DE MÉTRICAS CLÁSICAS PARA GRÁFICAS ---
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const dayData = dayNames.map(name => ({ name, nutricion: 0, fisioterapia: 0 }));
        const timeCount: Record<string, number> = {};

        citas.forEach((apt: any) => {
          const dayIdx = getDay(parseISO(apt.fecha || apt.date));
          if (apt.tipo === 'nutricion') dayData[dayIdx].nutricion++;
          else if (apt.tipo === 'fisioterapia') dayData[dayIdx].fisioterapia++;
          
          if (filteredCitas.includes(apt)) {
            timeCount[apt.hora || apt.time] = (timeCount[apt.hora || apt.time] || 0) + 1;
          }
        });

        // --- INTEGRACIÓN DE DATOS DESDE LA TABLA 'METRICAS' ---
        setStats({
          totalCitas: dbStats.totalCitas,
          citasCompletadas: dbStats.citasCompletadas,
          citasCanceladas: dbStats.citasCanceladas, // Viene de tabla metricas
          citasProgramadas: dbStats.citasProgramadas,
          reagendadas: dbStats.reagendadas,         // Viene de tabla metricas
          datosGrafica: dayData,
          horariosMasVisitados: Object.entries(timeCount)
            .map(([horario, count]) => ({ horario, cantidad: count as number }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5),
          tiempoPromedioConsulta: dbStats.promedioConsulta, // Viene de tabla metricas
          tasaAbandono: 0, // Implementar log de abandono después
          pacientesNuevosSemana: historiales.length, 
          velocidadAsignacionDocente: 0
        });

      } catch (error) {
        console.error("Error al procesar métricas avanzadas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetrics();
  }, [area, esMaster]);

  const areaColor = area === 'nutricion' ? 'orange' : 'blue';

  return (
    <div className="space-y-6" style={arialStyle}>
      {/* TARJETAS DE RESUMEN PRINCIPAL - AJUSTADO A 5 COLUMNAS PARA REAGENDADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-wider text-center">Total Citas</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-black text-slate-900">{stats.totalCitas}</div>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm bg-green-50/20">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xs font-black text-green-700 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> COMPLETADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-black text-green-600">{stats.citasCompletadas}</div>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm bg-red-50/20">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xs font-black text-red-700 flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> CANCELADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-black text-red-600">{stats.citasCanceladas}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm bg-purple-50/20">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xs font-black text-purple-700 flex items-center justify-center gap-1 uppercase tracking-widest">
              <CalendarClock className="w-3 h-3" /> RE-AGENDADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-black text-purple-600">{stats.reagendadas}</div>
          </CardContent>
        </Card>

        <Card className={`border-${areaColor}-100 shadow-sm bg-${areaColor}-50/20`}>
          <CardHeader className="pb-2 text-center">
            <CardTitle className={`text-xs font-black text-${areaColor}-700 flex items-center justify-center gap-2`}>
              <Calendar className="w-4 h-4" /> PROGRAMADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-3xl font-black text-${areaColor}-600`}>{stats.citasProgramadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN DE INTELIGENCIA CLÍNICA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-white overflow-hidden border-t-4 border-t-blue-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-2 rounded-xl"><Clock className="text-blue-600" /></div>
              <Badge variant="outline" className="text-[10px] font-black">EFICIENCIA</Badge>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase">Promedio Consulta</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900">{stats.tiempoPromedioConsulta}</h3>
              <span className="text-sm font-bold text-slate-500">minutos</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">Tiempo real de carga de formulario.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white overflow-hidden border-t-4 border-t-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-50 p-2 rounded-xl"><AlertTriangle className="text-orange-600" /></div>
              <Badge variant="outline" className="text-[10px] font-black text-orange-600 border-orange-200">PROCESOS</Badge>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase">Tasa de Abandono</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900">{stats.tasaAbandono}%</h3>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">Formularios abiertos no guardados.</p>
          </CardContent>
        </Card>

        {esMaster ? (
          <Card className="border-none shadow-lg bg-white overflow-hidden border-t-4 border-t-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-50 p-2 rounded-xl"><Zap className="text-purple-600" /></div>
                <Badge className="bg-purple-600 text-white text-[9px] font-black">SOLO MASTER</Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase">Respuesta Docente</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900">{stats.velocidadAsignacionDocente}</h3>
                <span className="text-sm font-bold text-slate-500">min</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">Tiempo desde cita hasta asignación.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-lg bg-white overflow-hidden border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-50 p-2 rounded-xl"><TrendingUp className="text-green-600" /></div>
                <Badge variant="outline" className="text-[10px] font-black text-green-600 border-green-200">CRECIMIENTO</Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase">Nuevos Expedientes</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900">{stats.pacientesNuevosSemana}</h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">Registros en los últimos 7 días.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* GRÁFICA DE FLUJO SEMANAL */}
      <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2 font-bold">
                <BarChart3 className="w-5 h-5 text-blue-900" />
                Flujo de Consultas Semanal
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium italic text-[11px]">
                {area === 'todos' || area === 'general' ? 'Comparativa de Nutrición vs Fisioterapia' : `Rendimiento de área: ${area}`}
              </CardDescription>
            </div>
            <Badge className="bg-blue-900 text-white animate-pulse">Tiempo Real</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.datosGrafica} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFisio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'}} />
                <Legend verticalAlign="top" height={40} iconType="circle" />
                {(area === 'todos' || area === 'general' || area === 'nutricion' || !area) && (
                  <Area type="monotone" dataKey="nutricion" name="Nutrición" stroke="#f97316" strokeWidth={5} fillOpacity={1} fill="url(#colorNut)" animationDuration={2000} />
                )}
                {(area === 'todos' || area === 'general' || area === 'fisioterapia' || !area) && (
                  <Area type="monotone" dataKey="fisioterapia" name="Fisioterapia" stroke="#1e3a8a" strokeWidth={5} fillOpacity={1} fill="url(#colorFisio)" animationDuration={2000} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* HORARIOS DE MAYOR ACTIVIDAD */}
      <Card className="border-slate-200 shadow-sm bg-slate-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-800 text-xs font-black flex items-center gap-2 uppercase tracking-tighter">
            <Clock className="w-4 h-4" /> Horarios de mayor demanda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {stats.horariosMasVisitados.map((item) => (
              <div key={item.horario} className="flex-1 min-w-[120px] p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 mb-1">{item.horario}</p>
                <p className="text-2xl font-black text-slate-900">{item.cantidad}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Consultas</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center py-4 opacity-30 gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Engine v5.2</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={12} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">PostgreSQL Sync Active</span>
        </div>
      </div>
    </div>
  );
}