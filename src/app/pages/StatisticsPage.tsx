/**
 * ============================================================================
 * ARCHIVO: StatisticsPage.tsx - VERSIÓN ANALÍTICA MASTER (DYNAMICO)
 * PROPÓSITO: Análisis avanzado de rendimiento clínico con métricas de re-agendado.
 * UBICACIÓN: src/app/pages/StatisticsPage.tsx
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, metricasAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Utensils,
  Clock,
  LayoutGrid,
  Mountain
} from 'lucide-react';
import { Appointment } from '../lib/mockData';
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const arialStyle = { fontFamily: 'Arial, sans-serif' };

  // ESTADOS PRINCIPALES
  const [citas, setCitas] = useState<Appointment[]>([]);
  const [chartType, setChartType] = useState<'mountain' | 'bars'>('mountain');

  // ESTADO PARA ESTADÍSTICAS EXTENDIDAS (Sincronizado con index.js)
  const [estadisticas, setEstadisticas] = useState({
    totalCitas: 0,
    citasHoy: 0,
    citasEstaSemana: 0,
    citasFisioterapia: 0,
    citasNutricion: 0,
    promedioDiario: 0,
    tasaAsistencia: 0,
    pacientesUnicos: 0,
    totalCanceladas: 0,      // Nuevo: Coherencia con borrado lógico
    totalReagendadas: 0      // Nuevo: Coherencia con logs de sistema
  });

  /**
   * CARGAR DATOS AL MONTAR EL COMPONENTE
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Consultamos citas y logs simultáneamente para coherencia de re-agendados
        const [dataCitas, dataLogs]: [Appointment[], any[]] = await Promise.all([
          citasAPI.getAll(),
          metricasAPI.getLogs()
        ]);

        setCitas(dataCitas);
        calcularEstadisticasExtendido(dataCitas, dataLogs);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        const stored = localStorage.getItem('utc_appointments');
        const data = stored ? JSON.parse(stored) : [];
        setCitas(data);
        calcularEstadisticasExtendido(data, []);
      }
    };
    cargarDatos();
  }, []);

  /**
   * FUNCIÓN: calcularEstadisticasExtendido
   * Sincronizada con los estados 'cancelada' y logs de re-agendado
   */
  const calcularEstadisticasExtendido = (todasLasCitas: Appointment[], logs: any[]) => {
    const hoy = new Date();
    const hoyStr = format(hoy, 'yyyy-MM-dd');
    const inicioDeSemana = subDays(hoy, 7);

    // Solo contamos como activas para métricas de hoy/semana las que NO están canceladas
    const activas = todasLasCitas.filter(c => c.status !== 'cancelada');

    const citasDeHoy = activas.filter(cita =>
      format(parseISO(cita.date || (cita as any).fecha), 'yyyy-MM-dd') === hoyStr
    );

    const fisio = activas.filter(c => ((c as any).tipo || c.type) === 'fisioterapia').length;
    const nutri = activas.filter(c => ((c as any).tipo || c.type) === 'nutricion').length;
    const completadas = activas.filter(c => c.status === 'completada').length;
    const canceladas = todasLasCitas.filter(c => c.status === 'cancelada').length;
    
    // Conteo desde logs para re-agendados
    const reagendadas = logs.filter(l => l.tipo === 'cita_reagendada').length;

    const unicos = new Set(todasLasCitas.map(c => (c as any).paciente_id || (c as any).paciente_nombre)).size;
    const promedio = activas.length / 30;

    setEstadisticas({
      totalCitas: todasLasCitas.length,
      citasHoy: citasDeHoy.length,
      citasEstaSemana: activas.filter(c => parseISO(c.date || (c as any).fecha) >= inicioDeSemana).length,
      citasFisioterapia: fisio,
      citasNutricion: nutri,
      promedioDiario: Math.round(promedio * 10) / 10,
      tasaAsistencia: activas.length > 0 ? Math.round((completadas / activas.length) * 100) : 0,
      pacientesUnicos: unicos,
      totalCanceladas: canceladas,
      totalReagendadas: reagendadas
    });
  };

  /**
   * DATA GENERATORS PARA GRÁFICOS
   */
  const obtenerCitasPorDia = () => {
    const hoy = new Date();
    const dias = eachDayOfInterval({ start: subDays(hoy, 14), end: hoy });
    return dias.map(dia => ({
      fecha: format(dia, 'dd MMM', { locale: es }),
      cantidad: citas.filter(c => (c.date || (c as any).fecha) === format(dia, 'yyyy-MM-dd') && c.status !== 'cancelada').length
    }));
  };

  const obtenerDatosHorarios = () => {
    const franjas = [
      { h: '08', label: '8-10 AM' }, { h: '10', label: '10-12 PM' },
      { h: '12', label: '12-2 PM' }, { h: '14', label: '2-4 PM' },
      { h: '16', label: '4-6 PM' }, { h: '18', label: '6-8 PM' }
    ];
    return franjas.map(f => ({
      rango: f.label,
      citas: citas.filter(c => c.time && c.time.startsWith(f.h) && c.status !== 'cancelada').length
    }));
  };

  const obtenerDiasConMasCitas = () => {
    return obtenerCitasPorDia()
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  };

  const obtenerDiasConMenosCitas = () => {
    return obtenerCitasPorDia()
      .filter(dia => dia.cantidad > 0)
      .sort((a, b) => a.cantidad - b.cantidad)
      .slice(0, 5);
  };

  const obtenerRendimientoPorArea = () => {
    const citasCompletadas = citas.filter(c => c.status === 'completada');
    const fisioC = citasCompletadas.filter(c => ((c as any).tipo || c.type) === 'fisioterapia').length;
    const nutriC = citasCompletadas.filter(c => ((c as any).tipo || c.type) === 'nutricion').length;
    const total = fisioC + nutriC;

    return [
      { area: 'Fisioterapia', citas: fisioC, porcentaje: total > 0 ? Math.round((fisioC / total) * 100) : 0 },
      { area: 'Nutrición', citas: nutriC, porcentaje: total > 0 ? Math.round((nutriC / total) * 100) : 0 },
    ];
  };

  const datosCitasPorDia = obtenerCitasPorDia();
  const rendimientoPorArea = obtenerRendimientoPorArea();
  const datosPastel = [
    { name: 'Fisioterapia', value: estadisticas.citasFisioterapia, color: '#1e3a8a' },
    { name: 'Nutrición', value: estadisticas.citasNutricion, color: '#ea580c' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" style={arialStyle}>
      <header className="bg-white border-b border-blue-900/10 shadow-sm sticky top-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg shrink-0">UTC</div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-blue-950 uppercase tracking-tighter">Inteligencia de Datos Clínica</h1>
              <p className="text-xs text-slate-500 font-medium italic">Análisis de rendimiento académico y operativo</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="font-bold border-slate-300 shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Panel
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* KPI SECTION: MODIFICADA PARA MOSTRAR CANCELADAS Y REAGENDADAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-1 bg-blue-900"></div>
            <CardHeader className="pb-1 p-4">
              <CardDescription className="text-[9px] font-black uppercase text-slate-400">Total</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-900">{estadisticas.totalCitas}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-1 bg-green-500"></div>
            <CardHeader className="pb-1 p-4">
              <CardDescription className="text-[9px] font-black uppercase text-slate-400">Eficiencia</CardDescription>
              <CardTitle className="text-2xl font-black text-green-600">{estadisticas.tasaAsistencia}%</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-1 bg-red-500"></div>
            <CardHeader className="pb-1 p-4">
              <CardDescription className="text-[9px] font-black uppercase text-slate-400">Canceladas</CardDescription>
              <CardTitle className="text-2xl font-black text-red-600">{estadisticas.totalCanceladas}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-1 bg-purple-500"></div>
            <CardHeader className="pb-1 p-4">
              <CardDescription className="text-[9px] font-black uppercase text-slate-400">Movimientos</CardDescription>
              <CardTitle className="text-2xl font-black text-purple-600">{estadisticas.totalReagendadas}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-1 bg-orange-500"></div>
            <CardHeader className="pb-1 p-4">
              <CardDescription className="text-[9px] font-black uppercase text-slate-400">Pacientes</CardDescription>
              <CardTitle className="text-2xl font-black text-orange-600">{estadisticas.pacientesUnicos}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-1 bg-blue-400"></div>
            <CardHeader className="pb-1 p-4">
              <CardDescription className="text-[9px] font-black uppercase text-slate-400">Promedio</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-400">{estadisticas.promedioDiario}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* SECCIÓN DE GRÁFICO DINÁMICO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2rem] bg-white p-6 relative">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-blue-950 font-black flex items-center gap-2 uppercase tracking-tighter">
                  {chartType === 'mountain' ? <Mountain className="text-blue-600" /> : <LayoutGrid className="text-blue-600" />}
                  Tendencia de Flujo Clínico
                </CardTitle>
                <CardDescription className="font-medium italic">Análisis comparativo de los últimos 14 días (Excluye Canceladas)</CardDescription>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                <Button 
                  variant={chartType === 'mountain' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setChartType('mountain')}
                  className={`rounded-lg h-8 px-4 font-bold ${chartType === 'mountain' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500'}`}
                >
                  <Mountain className="w-4 h-4 mr-1" /> Montaña
                </Button>
                <Button 
                  variant={chartType === 'bars' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setChartType('bars')}
                  className={`rounded-lg h-8 px-4 font-bold ${chartType === 'bars' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500'}`}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" /> Barras
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="h-[380px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'mountain' ? (
                  <AreaChart data={datosCitasPorDia}>
                    <defs>
                      <linearGradient id="colorMountain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="cantidad" name="Citas" stroke="#1e3a8a" strokeWidth={4} fillOpacity={1} fill="url(#colorMountain)" />
                  </AreaChart>
                ) : (
                  <BarChart data={datosCitasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px' }} />
                    <Bar dataKey="cantidad" name="Citas" fill="#1e3a8a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2rem] bg-white p-6">
            <CardHeader>
              <CardTitle className="text-blue-950 font-black flex items-center gap-2">
                <Activity className="text-orange-600" /> Especialidades
              </CardTitle>
              <CardDescription className="font-medium italic">Participación en volumen total</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datosPastel} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {datosPastel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* MÉTRICA DE HORARIOS PICO */}
        <Card className="border-none shadow-2xl rounded-[2rem] bg-white p-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
               <Clock className="w-8 h-8 text-orange-600 bg-orange-100 p-1.5 rounded-lg shadow-sm" />
               <div>
                  <CardTitle className="text-blue-950 font-black uppercase">Mapa de Saturación Horaria</CardTitle>
                  <CardDescription className="font-medium italic">Optimización de asignación de practicantes</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={obtenerDatosHorarios()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="rango" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'black' }} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#fff7ed'}} />
                <Bar dataKey="citas" name="Demanda" fill="#ea580c" radius={[20, 20, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RENDIMIENTO POR ÁREA (SOLO ADMINS) */}
        {user?.rol === 'admin' && (
          <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 p-6 border-b">
              <CardTitle className="text-blue-950 font-black">Eficiencia Comparativa por Departamento</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {rendimientoPorArea.map((area) => (
                <div key={area.area} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {area.area === 'Fisioterapia' ? (
                        <Activity className="w-6 h-6 text-blue-900" />
                      ) : (
                        <Utensils className="w-6 h-6 text-orange-600" />
                      )}
                      <span className="font-black text-blue-900 text-lg uppercase tracking-tighter">{area.area}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-950">{area.citas}</p>
                      <p className="text-[10px] uppercase font-black text-slate-400 italic">{area.porcentaje}% de cumplimiento</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-5 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 shadow-lg ${
                        area.area === 'Fisioterapia' ? 'bg-blue-900' : 'bg-orange-600'
                      }`}
                      style={{ width: `${area.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* RANKINGS DE ACTIVIDAD DIARIA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg bg-white rounded-3xl group hover:shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="text-green-600 w-5 h-5" /></div>
              <CardTitle className="text-blue-950 font-black">Picos de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {obtenerDiasConMasCitas().map((dia, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl hover:bg-green-50 transition-colors">
                    <span className="font-bold text-slate-600">{dia.fecha}</span>
                    <Badge className="bg-green-100 text-green-700 font-bold border-green-200">{dia.cantidad} citas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-3xl group hover:shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="text-red-500 w-5 h-5" /></div>
              <CardTitle className="text-blue-950 font-black">Baja Demanda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {obtenerDiasConMenosCitas().map((dia, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl hover:bg-red-50 transition-colors">
                    <span className="font-bold text-slate-600">{dia.fecha}</span>
                    <Badge className="bg-red-50 text-red-600 font-bold border-red-100">{dia.cantidad} citas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="py-12 text-center opacity-30 border-t mt-12">
        <p className="text-[10px] font-black uppercase tracking-[0.8em]">Suite de Análisis Clínico UTC • v2.0 • 2026</p>
      </footer>
    </div>
  );
}