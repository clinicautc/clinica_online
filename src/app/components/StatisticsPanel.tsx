/**
 * ============================================================================
 * COMPONENTE: StatisticsPanel
 * PROPÓSITO: Inteligencia Operativa y KPIs de Eficiencia Clínica.
 * MODIFICACIÓN: Sincronización con tabla 'metricas' para evitar ceros.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart3,
  Zap, AlertTriangle, TrendingUp, Users2, Activity,
  CalendarClock, Download
} from 'lucide-react';
import { parseISO, getDay } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell
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

// ---------------------------------------------------------------------------
// Paleta de tokens visuales
// ---------------------------------------------------------------------------
const C = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  border: '#e2e6ec',
  shadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 18px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)',
  text: '#1a1e2e',
  muted: '#64748b',
  faint: '#94a3b8',
  accent: {
    slate:  { top: '#475569', tint: '#f1f5f9', bar: '#64748b' },
    green:  { top: '#16a34a', tint: '#f0fdf4', bar: '#22c55e' },
    red:    { top: '#dc2626', tint: '#fef2f2', bar: '#ef4444' },
    indigo: { top: '#4f46e5', tint: '#eef2ff', bar: '#6366f1' },
    amber:  { top: '#d97706', tint: '#fffbeb', bar: '#f59e0b' },
    teal:   { top: '#0d9488', tint: '#f0fdfa', bar: '#14b8a6' },
    purple: { top: '#7c3aed', tint: '#f5f3ff', bar: '#8b5cf6' },
  },
};

// ---------------------------------------------------------------------------
// Tarjeta KPI pequeña (fila superior)
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  tag,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: keyof typeof C.accent;
  tag: string;
}) {
  const a = C.accent[accent];
  return (
    <div style={{
      background: C.surface,
      borderTop: `3px solid ${a.top}`,
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${a.top}`,
      boxShadow: C.shadow,
      borderRadius: 10,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: a.tint, borderRadius: 8, padding: 8, display: 'flex' }}>
          <Icon size={16} style={{ color: a.top }} />
        </div>
        <span style={{
          color: a.top,
          background: a.tint,
          border: `1px solid ${a.top}30`,
          borderRadius: 5,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.09em',
          padding: '2px 7px',
        }}>
          {tag}
        </span>
      </div>
      <div>
        <p style={{ color: C.faint, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </p>
        <span style={{ color: C.text, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{value}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta KPI secundaria con barra de progreso
// ---------------------------------------------------------------------------
function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  bar,
  accent,
  tag,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit?: string;
  sub: string;
  bar: number;
  accent: keyof typeof C.accent;
  tag: string;
}) {
  const a = C.accent[accent];
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${a.top}`,
      boxShadow: C.shadowMd,
      borderRadius: 10,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ background: a.tint, borderRadius: 8, padding: 9, display: 'flex' }}>
          <Icon size={17} style={{ color: a.top }} />
        </div>
        <span style={{
          color: a.top,
          background: a.tint,
          border: `1px solid ${a.top}30`,
          borderRadius: 5,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.09em',
          padding: '2px 7px',
        }}>
          {tag}
        </span>
      </div>
      <div>
        <p style={{ color: C.faint, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: C.text, fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>{unit}</span>}
        </div>
      </div>
      <div>
        <div style={{ height: 4, background: '#e9edf2', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(bar, 100)}%`,
            background: `linear-gradient(90deg, ${a.top}, ${a.bar})`,
            borderRadius: 99,
            transition: 'width 0.9s ease',
          }} />
        </div>
        <p style={{ color: C.faint, fontSize: 10, marginTop: 7 }}>{sub}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contenedor de sección para gráficas
// ---------------------------------------------------------------------------
function SectionCard({
  title,
  description,
  icon: Icon,
  accentColor,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      boxShadow: C.shadow,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: '#fafbfc',
      }}>
        {Icon && (
          <div style={{ color: accentColor || C.muted }}>
            <Icon size={15} />
          </div>
        )}
        <div>
          <p style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{title}</p>
          {description && (
            <p style={{ color: C.faint, fontSize: 11, marginTop: 1 }}>{description}</p>
          )}
        </div>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exportar a Excel (Versión Profesional con ExcelJS)
// ---------------------------------------------------------------------------
async function exportToExcel(stats: ExtendedStats) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clínica UTC';
  workbook.created = new Date();

  // Función de ayuda para darle estilo profesional a las cabeceras
  const styleHeader = (worksheet: ExcelJS.Worksheet) => {
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Azul institucional UTC
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 12
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });
    worksheet.getRow(1).height = 25;
  };

  // ==========================================
  // HOJA 1: KPIs Generales
  // ==========================================
  const ws1 = workbook.addWorksheet('KPIs Generales', { views: [{ showGridLines: false }] });
  
  ws1.columns = [
    { header: 'Métrica Operativa', key: 'metrica', width: 40 },
    { header: 'Valor', key: 'valor', width: 20 }
  ];

  ws1.addRows([
    { metrica: 'Total Citas', valor: stats.totalCitas },
    { metrica: 'Citas Completadas', valor: stats.citasCompletadas },
    { metrica: 'Citas Canceladas', valor: stats.citasCanceladas },
    { metrica: 'Citas Programadas', valor: stats.citasProgramadas },
    { metrica: 'Citas Re-agendadas', valor: stats.reagendadas },
    { metrica: 'Promedio de Consulta (minutos)', valor: stats.tiempoPromedioConsulta },
    { metrica: 'Tasa de Abandono (%)', valor: stats.tasaAbandono },
    { metrica: 'Nuevos Expedientes (7 días)', valor: stats.pacientesNuevosSemana },
    { metrica: 'Velocidad Asignación Docente (minutos)', valor: stats.velocidadAsignacionDocente }
  ]);

  styleHeader(ws1);

  // Dar estilo a las celdas de datos (filas alternas y alineación)
  ws1.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).font = { bold: true, color: { argb: 'FF0F172A' } };
      
      // Filas cebra (Gris muy claro)
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    }
  });

  // ==========================================
  // HOJA 2: Flujo Semanal (Ideal para hacer gráficas)
  // ==========================================
  const ws2 = workbook.addWorksheet('Flujo Semanal');
  ws2.columns = [
    { header: 'Día de la Semana', key: 'dia', width: 25 },
    { header: 'Nutrición', key: 'nut', width: 20 },
    { header: 'Fisioterapia', key: 'fisio', width: 20 }
  ];

  stats.datosGrafica.forEach(d => {
    ws2.addRow({ dia: d.name, nut: d.nutricion, fisio: d.fisioterapia });
  });

  styleHeader(ws2);
  ws2.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { horizontal: 'center' };
  });

  // ==========================================
  // HOJA 3: Horarios de Mayor Demanda
  // ==========================================
  const ws3 = workbook.addWorksheet('Horarios Demanda');
  ws3.columns = [
    { header: 'Posición', key: 'pos', width: 15 },
    { header: 'Horario', key: 'hora', width: 20 },
    { header: 'Total Consultas', key: 'cant', width: 25 }
  ];

  stats.horariosMasVisitados.forEach((h, i) => {
    ws3.addRow({ pos: `#${i + 1}`, hora: h.horario, cant: h.cantidad });
  });

  styleHeader(ws3);
  ws3.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { horizontal: 'center' };
  });

  // ==========================================
  // GENERAR Y DESCARGAR ARCHIVO
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const dataBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(dataBlob, `Reporte_Clinico_UTC_${new Date().getTime()}.xlsx`);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
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
    velocidadAsignacionDocente: 0,
  });

  const esMaster = user?.rol === 'master';

  useEffect(() => {
    const fetchAllMetrics = async () => {
      try {
        setLoading(true);

        // 1. Obtención de datos base y analíticos (Consumiendo la nueva tabla metricas)
        const [resCitas, resHistoriales, resDashboard] = await Promise.all([
          fetch('http://localhost:3001/api/citas', { headers: { email: user?.email || '' } }),
          fetch('http://localhost:3001/api/historiales', { headers: { email: user?.email || '' } }),
          fetch('http://localhost:3001/api/stats/dashboard', { headers: { email: user?.email || '' } }), // NUEVO: Trae datos de la tabla 'metricas'
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
        const dayData = dayNames.map((name) => ({ name, nutricion: 0, fisioterapia: 0 }));
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
          reagendadas: dbStats.reagendadas,          // Viene de tabla metricas
          datosGrafica: dayData,
          horariosMasVisitados: Object.entries(timeCount)
            .map(([horario, count]) => ({ horario, cantidad: count as number }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5),
          tiempoPromedioConsulta: dbStats.promedioConsulta, // Viene de tabla metricas
          tasaAbandono: 0, // Implementar log de abandono después
          pacientesNuevosSemana: historiales.length,
          velocidadAsignacionDocente: 0,
        });
      } catch (error) {
        console.error('Error al procesar métricas avanzadas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetrics();
  }, [area, esMaster]);

  const pieData = [
    { name: 'Completadas', value: stats.citasCompletadas, color: '#16a34a' },
    { name: 'Programadas', value: stats.citasProgramadas, color: '#4f46e5' },
    { name: 'Canceladas',  value: stats.citasCanceladas,  color: '#dc2626' },
    { name: 'Re-agendadas',value: stats.reagendadas,      color: '#7c3aed' },
  ];

  const tooltipStyle = {
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
    fontSize: 12,
    padding: '10px 14px',
    background: C.surface,
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Inteligencia Clínica
            </h1>
            <p style={{ color: C.faint, fontSize: 12, marginTop: 3 }}>
              Panel de métricas operativas · Actualización en tiempo real
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            <span style={{ color: C.faint, fontSize: 11, fontWeight: 500 }}>PostgreSQL sync activo</span>
          </div>
        </div>

        {/* ── Tarjetas KPI superiores ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <StatCard icon={Calendar}     label="Total Citas"    value={stats.totalCitas}        accent="slate"  tag="GENERAL"    />
          <StatCard icon={CheckCircle}  label="Completadas"    value={stats.citasCompletadas}  accent="green"  tag="COMPLETADO" />
          <StatCard icon={XCircle}      label="Canceladas"     value={stats.citasCanceladas}   accent="red"    tag="ALERTA"     />
          <StatCard icon={CalendarClock}label="Re-agendadas"   value={stats.reagendadas}       accent="purple" tag="AJUSTE"     />
          <StatCard icon={Calendar}     label="Programadas"    value={stats.citasProgramadas}  accent="indigo" tag="ACTIVO"     />
        </div>

        {/* ── KPIs secundarios ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <KpiCard
            icon={Clock}
            label="Promedio de Consulta"
            value={stats.tiempoPromedioConsulta}
            unit="min"
            sub="Tiempo real de carga de formulario"
            bar={(stats.tiempoPromedioConsulta / 60) * 100}
            accent="indigo"
            tag="EFICIENCIA"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Tasa de Abandono"
            value={stats.tasaAbandono}
            unit="%"
            sub="Formularios abiertos no guardados"
            bar={stats.tasaAbandono}
            accent="red"
            tag="PROCESOS"
          />
          {esMaster ? (
            <KpiCard
              icon={Zap}
              label="Respuesta Docente"
              value={stats.velocidadAsignacionDocente}
              unit="min"
              sub="Tiempo desde cita hasta asignación"
              bar={75}
              accent="amber"
              tag="MASTER"
            />
          ) : (
            <KpiCard
              icon={TrendingUp}
              label="Nuevos Expedientes"
              value={stats.pacientesNuevosSemana}
              sub="Registros en los últimos 7 días"
              bar={85}
              accent="green"
              tag="CRECIMIENTO"
            />
          )}
        </div>

        {/* ── Gráficas: Línea + Pastel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SectionCard title="Tendencia Semanal" description="Flujo de consultas por día" icon={TrendingUp} accentColor={C.accent.indigo.top}>
            <div style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.datosGrafica} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e9edf2" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: C.muted }} />
                  {(area === 'todos' || area === 'general' || area === 'nutricion' || !area) && (
                    <Line type="monotone" dataKey="nutricion" name="Nutrición"
                      stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 3 }} activeDot={{ r: 5 }} animationDuration={1500} />
                  )}
                  {(area === 'todos' || area === 'general' || area === 'fisioterapia' || !area) && (
                    <Line type="monotone" dataKey="fisioterapia" name="Fisioterapia"
                      stroke={C.accent.indigo.top} strokeWidth={2.5} dot={{ fill: C.accent.indigo.top, r: 3 }} activeDot={{ r: 5 }} animationDuration={1500} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Distribución de Estados" description="Composición total de citas" icon={BarChart3} accentColor={C.accent.purple.top}>
            <div style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100} innerRadius={56}
                    dataKey="value"
                    animationDuration={1200}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={`pie-cell-${i}`} fill={entry.color} opacity={0.88} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* ── Gráfica de Área ── */}
        <SectionCard
          title="Flujo de Consultas Semanal"
          description={area === 'todos' || area === 'general' ? 'Comparativa Nutrición vs Fisioterapia' : `Rendimiento: ${area}`}
          icon={Activity}
          accentColor={C.accent.teal.top}
        >
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={stats.datosGrafica} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaNut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#d97706" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="areaFisio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.accent.indigo.top} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={C.accent.indigo.top} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e9edf2" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: C.muted }} />
                {(area === 'todos' || area === 'general' || area === 'nutricion' || !area) && (
                  <Area type="monotone" dataKey="nutricion" name="Nutrición"
                    stroke="#d97706" strokeWidth={2.5} fill="url(#areaNut)" animationDuration={1500} />
                )}
                {(area === 'todos' || area === 'general' || area === 'fisioterapia' || !area) && (
                  <Area type="monotone" dataKey="fisioterapia" name="Fisioterapia"
                    stroke={C.accent.indigo.top} strokeWidth={2.5} fill="url(#areaFisio)" animationDuration={1500} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* ── Horarios de Mayor Demanda ── */}
        <SectionCard title="Horarios de Mayor Demanda" description="Top 5 franjas horarias" icon={Clock} accentColor={C.accent.teal.top}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {stats.horariosMasVisitados.map((item, index) => (
              <div
                key={item.horario}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `3px solid ${C.accent.teal.top}`,
                  boxShadow: C.shadow,
                  borderRadius: 8,
                  padding: '16px 12px',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: 9, fontWeight: 700,
                  color: C.accent.teal.top,
                  background: C.accent.teal.tint,
                  border: `1px solid ${C.accent.teal.top}30`,
                  borderRadius: 4,
                  padding: '1px 5px',
                }}>
                  #{index + 1}
                </span>
                <Clock size={18} style={{ color: C.accent.teal.top, margin: '0 auto 8px' }} />
                <p style={{ color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{item.horario}</p>
                <p style={{ color: C.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{item.cantidad}</p>
                <p style={{ color: C.faint, fontSize: 10, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  consultas
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Botón Exportar Excel ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => exportToExcel(stats)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '10px 20px',
              color: C.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: C.shadow,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget;
              b.style.borderColor = C.accent.green.top;
              b.style.boxShadow = C.shadowMd;
              b.style.color = C.accent.green.top;
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget;
              b.style.borderColor = C.border;
              b.style.boxShadow = C.shadow;
              b.style.color = C.text;
            }}
          >
            <Download size={15} style={{ color: 'inherit' }} />
            Exportar a Excel
          </button>
        </div>

        {/* ── Footer de sistema ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            <span style={{ color: C.faint, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Data Engine v5.2
            </span>
          </div>
          <span style={{ width: 1, height: 14, background: C.border, display: 'inline-block' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={10} style={{ color: C.faint }} />
            <span style={{ color: C.faint, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              PostgreSQL Sync Active
            </span>
          </div>
          <span style={{ width: 1, height: 14, background: C.border, display: 'inline-block' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users2 size={10} style={{ color: C.faint }} />
            <span style={{ color: C.faint, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Sistema Clínico Pro
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}