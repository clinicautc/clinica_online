/**
 * ============================================================================
 * COMPONENTE: StatisticsPanel
 * PROPÓSITO: Inteligencia Operativa y KPIs de Eficiencia Clínica.
 * MODIFICACIÓN: Sincronización con tabla 'metricas' para evitar ceros.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, historialesAPI, metricasAPI, usuariosAPI } from '../lib/api';



import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart3,
  Zap, AlertTriangle, TrendingUp, Users2, Activity,
  CalendarClock, Download
} from 'lucide-react';
import { parseISO, getDay, subDays } from 'date-fns';
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

type FilterArea = 'general' | 'nutricion' | 'fisioterapia';

const normalizeAreaFilter = (value?: StatisticsPanelProps['area']): FilterArea => {
  if (value === 'nutricion' || value === 'fisioterapia') return value;
  return 'general';
};

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
// Exportar a Excel (Versión Avanzada con Auditoría)
// ---------------------------------------------------------------------------
async function exportToExcel(
  stats: ExtendedStats,
  rawData: { citas: any[]; usuarios: any[] },
  filtroArea: string,
  esMaster: boolean
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clínica UTC';
  workbook.created = new Date();

  const colors = {
    blueUTC: 'FF1E3A8A',
    orangeUTC: 'FFEA580C',
    emerald: 'FF10B981',
    darkSlate: 'FF334155',
    zebraGray: 'FFF8FAFC',
    borderGray: 'FFCBD5E1',
  };

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: colors.borderGray } },
    left: { style: 'thin' as const, color: { argb: colors.borderGray } },
    bottom: { style: 'thin' as const, color: { argb: colors.borderGray } },
    right: { style: 'thin' as const, color: { argb: colors.borderGray } },
  };

  const applyHeaderStyle = (cell: any, bgColor: string) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  };

  const capitalize = (value?: string) => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const normalizedFiltroArea = filtroArea === 'general' || filtroArea === 'todos' ? 'general' : filtroArea;
  const textoFiltro = normalizedFiltroArea === 'general' ? 'TODAS LAS ÁREAS' : normalizedFiltroArea.toUpperCase();
  const scopeLabel = esMaster ? 'AUDITORÍA MASTER' : 'AUDITORÍA OPERATIVA';

  const ws1 = workbook.addWorksheet('Resumen de KPIs', { views: [{ showGridLines: false }] });
  ws1.columns = [
    { width: 3 },
    { width: 35 },
    { width: 18 },
    { width: 5 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
  ];

  ws1.mergeCells('B2:G3');
  const banner = ws1.getCell('B2');
  banner.value = `${scopeLabel} - ${textoFiltro}`;
  banner.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.blueUTC } };
  banner.alignment = { vertical: 'middle', horizontal: 'center' };

  ws1.mergeCells('B6:C6');
  ws1.getCell('B6').value = 'MÉTRICAS CLAVE';
  applyHeaderStyle(ws1.getCell('B6'), colors.darkSlate);

  const kpiData = [
    ['Total Citas', stats.totalCitas],
    ['Citas Completadas', stats.citasCompletadas],
    ['Citas Canceladas', stats.citasCanceladas],
    ['Citas Programadas', stats.citasProgramadas],
    ['Promedio de Consulta (min)', stats.tiempoPromedioConsulta],
    ['Nuevos Expedientes (7 días)', stats.pacientesNuevosSemana],
  ];

  kpiData.forEach((row, index) => {
    const labelCell = ws1.getCell(`B${7 + index}`);
    const valueCell = ws1.getCell(`C${7 + index}`);
    labelCell.value = row[0];
    valueCell.value = row[1];
    labelCell.border = thinBorder;
    valueCell.border = thinBorder;
    valueCell.alignment = { horizontal: 'center' };
    if (index % 2 === 0) {
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraGray } };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraGray } };
    }
  });

  const ws2 = workbook.addWorksheet('Bitácora de Citas', { views: [{ showGridLines: true }] });
  ws2.columns = [
    { width: 8 },
    { width: 15 },
    { width: 12 },
    { width: 35 },
    { width: 15 },
    { width: 30 },
    { width: 15 },
  ];
  ws2.getRow(1).values = ['ID', 'Fecha', 'Hora', 'Paciente', 'Área', 'Practicante', 'Estado'];
  ws2.getRow(1).eachCell((cell: any) => applyHeaderStyle(cell, colors.orangeUTC));

  rawData.citas.forEach((cita, index) => {
    const row = ws2.addRow({
      id: cita.id,
      fecha: cita.fecha?.split('T')[0] || 'N/A',
      hora: cita.hora?.substring(0, 5) || 'N/A',
      paciente: capitalize(cita.paciente_nombre),
      area: cita.tipo?.toUpperCase() || 'N/A',
      practicante: capitalize(cita.practicante_nombre) || 'Sin asignar',
      estado: cita.estado?.toUpperCase() || 'N/A',
    });

    row.eachCell((cell: any) => {
      cell.border = thinBorder;
      cell.font = { size: 10 };
      if (index % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraGray } };
      }
      if (cell.value === 'COMPLETADA') {
        cell.font = { ...cell.font, color: { argb: 'FF16A34A' }, bold: true };
      }
      if (cell.value === 'CANCELADA') {
        cell.font = { ...cell.font, color: { argb: 'FFDC2626' }, bold: true };
      }
    });
  });

  const ws3 = workbook.addWorksheet('Rendimiento Alumnos', { views: [{ showGridLines: true }] });
  ws3.columns = [
    { width: 35 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 22 },
    { width: 20 },
    { width: 15 },
  ];
  ws3.getRow(1).values = ['Nombre del Alumno', 'Matrícula', 'Área', 'Estado Cuenta', 'Total Asignadas', 'Completadas (Presente)', 'Canceladas (Falta)', '% Efectividad'];
  ws3.getRow(1).eachCell((cell: any) => applyHeaderStyle(cell, colors.emerald));

  const practicantes = rawData.usuarios.filter((usuario: any) => usuario.rol === 'practicante');
  practicantes.forEach((prac, index) => {
    const susCitas = rawData.citas.filter((cita: any) => String(cita.practicante_id) === String(prac.id));
    const completadas = susCitas.filter((cita: any) => cita.estado === 'completada').length;
    const canceladas = susCitas.filter((cita: any) => cita.estado === 'cancelada').length;
    const total = susCitas.length;
    const efectividad = total > 0 ? `${((completadas / total) * 100).toFixed(1)}%` : 'N/A';

    const row = ws3.addRow({
      nombre: capitalize(prac.nombre),
      matricula: prac.matricula || 'N/A',
      area: prac.area?.toUpperCase() || 'N/A',
      estado: prac.estado?.toUpperCase() || prac.status?.toUpperCase() || 'ACTIVO',
      total,
      completadas,
      canceladas,
      efectividad,
    });

    row.eachCell((cell: any) => {
      cell.border = thinBorder;
      cell.font = { size: 10 };
      if (index % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraGray } };
      }
      if (cell.value === 'INACTIVO') {
        cell.font = { ...cell.font, color: { argb: 'FFDC2626' }, bold: true };
      }
    });
  });

  const ws4 = workbook.addWorksheet('Auditoría Personal', { views: [{ showGridLines: true }] });
  ws4.columns = [
    { width: 10 },
    { width: 35 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
  ];
  ws4.getRow(1).values = ['ID Sistema', 'Nombre', 'Correo Registrado', 'Rol', 'Área', 'Estado', 'Registrado Por'];
  ws4.getRow(1).eachCell((cell: any) => applyHeaderStyle(cell, colors.blueUTC));

  rawData.usuarios.forEach((usuario, index) => {
    const row = ws4.addRow({
      id: usuario.id,
      nombre: capitalize(usuario.nombre),
      email: usuario.email?.toLowerCase() || 'N/A',
      rol: usuario.rol?.toUpperCase() || 'N/A',
      area: usuario.area?.toUpperCase() || 'N/A',
      estado: usuario.estado?.toUpperCase() || usuario.status?.toUpperCase() || 'ACTIVO',
      creador: usuario.creado_por_nombre ? capitalize(usuario.creado_por_nombre) : 'Admin Sistema',
    });

    row.eachCell((cell: any) => {
      cell.border = thinBorder;
      cell.font = { size: 10 };
      if (index % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraGray } };
      }
    });
  });

  const fileName = `Auditoria_${textoFiltro.replace(/\s+/g, '_')}_UTC_${new Date().getTime()}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const dataBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(dataBlob, fileName);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function StatisticsPanel({ area }: StatisticsPanelProps) {
  const { user } = useAuth();
  const [_loading, setLoading] = useState(true);
  const [filtroArea, setFiltroArea] = useState<FilterArea>(() => normalizeAreaFilter(area));
  const [rawData, setRawData] = useState<{ citas: any[], usuarios: any[] }>({ citas: [], usuarios: [] });


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
  const isGeneralView = filtroArea === 'general';
  const isNutritionView = isGeneralView || filtroArea === 'nutricion';
  const isFisioterapiaView = isGeneralView || filtroArea === 'fisioterapia';

  useEffect(() => {
    setFiltroArea(normalizeAreaFilter(area));
  }, [area]);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      try {
        setLoading(true);

        // 1. Obtención de datos base y analíticos (Consumiendo la nueva tabla metricas)
        // 1. Obtención de datos base y analíticos + USUARIOS
        const [citas, historiales, dbStats, usuarios] = await Promise.all([
          citasAPI.getAll(),
          historialesAPI.getAll(),
          metricasAPI.getDashboardStats(),
          usuariosAPI.getAll().catch(() => []) // Prevenimos fallos si la API de usuarios falla
        ]);

        // --- LÓGICA DE FILTRADO SEGURO POR ÁREA ---
        const filterData = (item: any) => {
          if (filtroArea === 'general') return true;
          return item.area?.toLowerCase() === filtroArea || item.tipo?.toLowerCase() === filtroArea;
        };

        const filteredCitas = citas.filter(filterData);
        const filteredUsuarios = usuarios.filter(filterData);
        
        // Guardamos los datos puros para exportarlos luego al Excel
        setRawData({ citas: filteredCitas, usuarios: filteredUsuarios });

        // --- CÁLCULO DE MÉTRICAS CLÁSICAS PARA GRÁFICAS ---
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const dayData = dayNames.map((name) => ({ name, nutricion: 0, fisioterapia: 0 }));
        const timeCount: Record<string, number> = {};

        citas.forEach((apt: any) => {
          const fechaStr = apt.fecha || apt.date;
          if (!fechaStr) return;
          const dayIdx = getDay(parseISO(fechaStr));
          if (isNaN(dayIdx) || dayIdx < 0 || dayIdx > 6) return;
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
          pacientesNuevosSemana: historiales.filter((h: any) => {
            const fecha = h.creado_en || h.fecha || h.created_at;
            if (!fecha) return false;
            return parseISO(fecha) >= subDays(new Date(), 7);
          }).length,
          velocidadAsignacionDocente: 0,
        });
      } catch (error) {
        console.error('Error al procesar métricas avanzadas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetrics();
  }, [filtroArea, esMaster]);  

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
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Inteligencia Clínica</h1>
            <p style={{ color: C.faint, fontSize: 12, marginTop: 3 }}>Panel de métricas operativas · Actualización en tiempo real</p>
          </div>

          {esMaster && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button onClick={() => setFiltroArea('general')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${isGeneralView ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Todo</button>
              <button onClick={() => setFiltroArea('nutricion')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filtroArea === 'nutricion' ? 'bg-orange-100 text-orange-700 shadow-sm border border-orange-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Nutrición</button>
              <button onClick={() => setFiltroArea('fisioterapia')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filtroArea === 'fisioterapia' ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Fisioterapia</button>
            </div>
          )}
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
                  {isNutritionView && (
                    <Line type="monotone" dataKey="nutricion" name="Nutrición"
                      stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 3 }} activeDot={{ r: 5 }} animationDuration={1500} />
                  )}
                  {isFisioterapiaView && (
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
    outerRadius={100} innerRadius={56}
    dataKey="value"
    animationDuration={1200}
  >
    {pieData.map((entry, i) => (
      <Cell key={`pie-cell-${i}`} fill={entry.color} opacity={0.88} />
    ))}
  </Pie>
  <Tooltip contentStyle={tooltipStyle} />
  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: C.muted }} />
</PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* ── Gráfica de Área ── */}
        <SectionCard
          title="Flujo de Consultas Semanal"
          description={isGeneralView ? 'Comparativa Nutrición vs Fisioterapia' : `Rendimiento: ${filtroArea}`}

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
                {isNutritionView && (
                  <Area type="monotone" dataKey="nutricion" name="Nutrición"
                    stroke="#d97706" strokeWidth={2.5} fill="url(#areaNut)" animationDuration={1500} />
                )}
                {isFisioterapiaView && (
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
  onClick={() => exportToExcel(stats, rawData, filtroArea, esMaster)}
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