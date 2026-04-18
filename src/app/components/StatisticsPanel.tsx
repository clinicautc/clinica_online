/**
 * ============================================================================
 * COMPONENTE: StatisticsPanel
 * Panel de estadísticas con superposición de gráficas (Nutrición + Fisioterapia)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { mockAppointments, Appointment } from '../lib/mockData';
import { parseISO, getDay } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface StatisticsPanelProps {
  area?: 'nutricion' | 'fisioterapia' | 'todos' | 'general';
}

export default function StatisticsPanel({ area }: StatisticsPanelProps) {
  const [stats, setStats] = useState({
    totalCitas: 0,
    citasCompletadas: 0,
    citasCanceladas: 0,
    citasProgramadas: 0,
    // Aquí almacenaremos los datos de ambas áreas para la gráfica
    datosGrafica: [] as { name: string; nutricion: number; fisioterapia: number }[],
    horariosMasVisitados: [] as { horario: string; cantidad: number }[],
  });

  useEffect(() => {
    const stored = localStorage.getItem('utc_appointments');
    let appointments = stored ? JSON.parse(stored) : mockAppointments;

    // 1. Filtrado para las tarjetas de resumen
    let filteredForCards = appointments;
    if (area && area !== 'todos' && area !== 'general') {
      filteredForCards = appointments.filter((apt: Appointment) => apt.type === area);
    }

    const totalCitas = filteredForCards.length;
    const citasCompletadas = filteredForCards.filter((a: Appointment) => a.status === 'completada').length;
    const citasCanceladas = filteredForCards.filter((a: Appointment) => a.status === 'cancelada').length;
    const citasProgramadas = filteredForCards.filter((a: Appointment) => a.status === 'programada').length;

    // 2. Lógica de la Gráfica de Montaña Rusa (Superpuesta)
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    // Inicializamos cada día con contadores en cero para ambas áreas
    const dayData = dayNames.map(name => ({ name, nutricion: 0, fisioterapia: 0 }));

    appointments.forEach((apt: Appointment) => {
      const dayIdx = getDay(parseISO(apt.date));
      if (apt.type === 'nutricion') {
        dayData[dayIdx].nutricion++;
      } else if (apt.type === 'fisioterapia') {
        dayData[dayIdx].fisioterapia++;
      }
    });

    // 3. Horarios
    const timeCount: Record<string, number> = {};
    filteredForCards.forEach((apt: Appointment) => {
      timeCount[apt.time] = (timeCount[apt.time] || 0) + 1;
    });

    const horariosMasVisitados = Object.entries(timeCount)
      .map(([horario, count]) => ({ horario, cantidad: count as number }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    setStats({
      totalCitas,
      citasCompletadas,
      citasCanceladas,
      citasProgramadas,
      datosGrafica: dayData,
      horariosMasVisitados,
    });
  }, [area]);

  // Color dinámico para las tarjetas según el área seleccionada
  const areaColor = area === 'nutricion' ? 'orange' : 'blue';

  return (
    <div className="space-y-6">
      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Citas</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-black text-slate-900">{stats.totalCitas}</div>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm bg-green-50/20">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> COMPLETADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-black text-green-600">{stats.citasCompletadas}</div>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm bg-red-50/20">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> CANCELADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-black text-red-600">{stats.citasCanceladas}</div>
          </CardContent>
        </Card>

        <Card className={`border-${areaColor}-100 shadow-sm bg-${areaColor}-50/20`}>
          <CardHeader className="pb-2 text-center">
            <CardTitle className={`text-sm font-medium text-${areaColor}-700 flex items-center justify-center gap-2`}>
              <Calendar className="w-4 h-4" /> PROGRAMADAS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-4xl font-black text-${areaColor}-600`}>{stats.citasProgramadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICA DE MONTAÑA RUSA SUPERPUESTA */}
      <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2 font-bold">
                <BarChart3 className="w-5 h-5 text-blue-900" />
                Flujo de Consultas Semanal
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium italic">
                {area === 'todos' || area === 'general' ? 'Comparativa de Nutrición vs Fisioterapia' : `Rendimiento de área: ${area}`}
              </CardDescription>
            </div>
            <Badge className="bg-blue-900 text-white">Tiempo Real</Badge>
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
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontWeight: 600}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'}} 
                />
                <Legend verticalAlign="top" height={40} iconType="circle" />
                
                {/* LÍNEA NARANJA (Nutrición) - Solo aparece si el área es Nutrición o 'todos' */}
                {(area === 'todos' || area === 'general' || area === 'nutricion' || !area) && (
                  <Area
                    type="monotone"
                    dataKey="nutricion"
                    name="Nutrición"
                    stroke="#f97316"
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#colorNut)"
                    animationDuration={2000}
                  />
                )}
                
                {/* LÍNEA AZUL (Fisioterapia) - Solo aparece si el área es Fisioterapia o 'todos' */}
                {(area === 'todos' || area === 'general' || area === 'fisioterapia' || !area) && (
                  <Area
                    type="monotone"
                    dataKey="fisioterapia"
                    name="Fisioterapia"
                    stroke="#1e3a8a"
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#colorFisio)"
                    animationDuration={2000}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* HORARIOS MÁS VISITADOS */}
      <Card className="border-slate-200 shadow-sm bg-slate-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-800 text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" /> HORARIOS DE MAYOR ACTIVIDAD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {stats.horariosMasVisitados.map((item) => (
              <div key={item.horario} className="flex-1 min-w-[120px] p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-xs font-bold text-slate-400 mb-1">{item.horario}</p>
                <p className="text-2xl font-black text-slate-900">{item.cantidad}</p>
                <p className="text-[10px] font-medium text-slate-500">CONSULTAS</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}