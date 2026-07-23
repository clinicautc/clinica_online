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
interface Cita {
  id: string | number;
  fecha?: string;
  date?: string;
  hora?: string;
  time?: string;
  tipo?: 'nutricion' | 'fisioterapia';
  area?: 'nutricion' | 'fisioterapia';
  estado: 'completada' | 'programada' | 'cancelada' | 'reagendada' | 're-agendada';
  paciente_nombre?: string;
  practicante_id?: string | number;
  practicante_nombre?: string;
  docente_nombre?: string;
  numero_consulta?: string | number;
  appointment_id?: string | number;
}

interface Usuario {
  id: string | number;
  rol: 'master' | 'docente' | 'practicante' | 'paciente';
  nombre: string;
  email?: string;
  area?: 'nutricion' | 'fisioterapia' | 'general';
  estado?: 'activo' | 'inactivo';
  status?: 'activo' | 'inactivo';
  matricula?: string;
  creado_por_nombre?: string;
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
// Exportar a Excel — Informe Clínico Integral (9 hojas profesionales)
// ---------------------------------------------------------------------------
async function exportToExcel(
  stats: ExtendedStats,
  rawData: { citas: any[]; usuarios: any[]; historiales?: any[] },
  filtroArea: string,
  esMaster: boolean
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Clínico UTC';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ── Paleta institucional ──────────────────────────────────────────────────
  const COL = {
    blueUTC:    'FF1E3A8A',
    blueLight:  'FF3B82F6',
    blueTint:   'FFDBEAFE',
    orange:     'FFEA580C',
    orangeTint: 'FFFFEDD5',
    green:      'FF16A34A',
    greenTint:  'FFF0FDF4',
    red:        'FFDC2626',
    redTint:    'FFFEF2F2',
    purple:     'FF7C3AED',
    purpleTint: 'FFF5F3FF',
    indigo:     'FF4F46E5',
    indigoTint: 'FFEEF2FF',
    amber:      'FFD97706',
    amberTint:  'FFFFFBEB',
    white:      'FFFFFFFF',
    darkText:   'FF1E293B',
    mutedText:  'FF64748B',
    border:     'FFE2E8F0',
    zebra:      'FFF8FAFC',
    headerRow:  'FFF1F5F9',
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cap = (v?: string) => !v ? '' : v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  const pct = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '0.0%';
  const dateNow = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeNow = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const normalizedFiltro = filtroArea === 'general' || filtroArea === 'todos' ? 'general' : filtroArea;
  const textoFiltro      = normalizedFiltro === 'general' ? 'TODAS LAS ÁREAS' : normalizedFiltro.toUpperCase();
  const scopeLabel       = esMaster ? 'INFORME MASTER' : 'INFORME OPERATIVO';

  // ── Estilos helpers ───────────────────────────────────────────────────────
  const bd = (argb = COL.border) => ({
    top:    { style: 'thin' as const, color: { argb } },
    left:   { style: 'thin' as const, color: { argb } },
    bottom: { style: 'thin' as const, color: { argb } },
    right:  { style: 'thin' as const, color: { argb } },
  });
  const hCell = (cell: any, bg: string, fg = COL.white, sz = 10) => {
    cell.font      = { name: 'Arial', size: sz, bold: true, color: { argb: fg } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border    = bd();
  };

  // ── Pre-cálculos desde rawData ────────────────────────────────────────────
  const allCitas   = rawData.citas;
  const byStatus   = (arr: any[], s: string) => arr.filter((c: any) => (c.estado || '').toLowerCase() === s.toLowerCase()).length;
  // Normalizador seguro
  const getArea = (c: Cita) => (c.tipo || c.area || '').toLowerCase();

  const citasNut = allCitas.filter((c: any) => getArea(c) === 'nutricion');
  const citasFisio = allCitas.filter((c: any) => getArea(c) === 'fisioterapia');

  const nutTotal        = citasNut.length;
  const nutComp         = byStatus(citasNut,   'completada');
  const nutCanc         = byStatus(citasNut,   'cancelada');
  const nutProg         = byStatus(citasNut,   'programada');
  const nutReag         = byStatus(citasNut,   'reagendada') + byStatus(citasNut, 're-agendada');
  const fisioTotal      = citasFisio.length;
  const fisioComp       = byStatus(citasFisio, 'completada');
  const fisioCanc       = byStatus(citasFisio, 'cancelada');
  const fisioProg       = byStatus(citasFisio, 'programada');
  const fisioReag       = byStatus(citasFisio, 'reagendada') + byStatus(citasFisio, 're-agendada');

  // Totales globales para Excel (independientes del filtro visual)
  const exTotal = allCitas.length;
  const exComp  = byStatus(allCitas, 'completada');
  const exProg  = byStatus(allCitas, 'programada');
  const exCanc  = byStatus(allCitas, 'cancelada');
  const exReag  = byStatus(allCitas, 'reagendada') + byStatus(allCitas, 're-agendada');

  const practicantes  = rawData.usuarios.filter((u: any) => u.rol === 'practicante');
  const docentes      = rawData.usuarios.filter((u: any) => u.rol === 'docente');

  const timeCount: Record<string, number> = {};
  allCitas.forEach((c: any) => {
    const h = (c.hora || c.time || '').substring(0, 5);
    if (h) timeCount[h] = (timeCount[h] || 0) + 1;
  });
  const horariosOrdenados = Object.entries(timeCount)
    .map(([horario, cantidad]) => ({ horario, cantidad: cantidad as number }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const pracPerf = practicantes.map((p: Usuario) => {
    const sc  = allCitas.filter((c: any) => String(c.practicante_id) === String(p.id));
    const comp = byStatus(sc, 'completada');
    const canc = byStatus(sc, 'cancelada');
    const prog = byStatus(sc, 'programada');
    const tot  = sc.length;
    
    // Evitar NaN en efectividad si tot es 0
    const eff  = tot > 0 ? (comp / tot) * 100 : 0; 
    
    // Lógica de calificación ajustada (si no tiene citas, N/A directo)
    const grade = tot === 0 ? 'N/A' : (eff >= 90 ? 'A' : eff >= 75 ? 'B' : eff >= 60 ? 'C' : 'D');
    
    return { ...p, tot, comp, canc, prog, eff, grade };
  }).sort((a: any, b: any) => b.eff - a.eff);

  const statusColorMap: Record<string, { text: string; bg: string }> = {
    completada:    { text: COL.green,  bg: COL.greenTint  },
    cancelada:     { text: COL.red,    bg: COL.redTint    },
    programada:    { text: COL.indigo, bg: COL.indigoTint },
    reagendada:    { text: COL.purple, bg: COL.purpleTint },
    're-agendada': { text: COL.purple, bg: COL.purpleTint },
  };
  const areaColorMap: Record<string, string> = {
    nutricion: COL.orange, fisioterapia: COL.indigo,
  };
  const gradeColor: Record<string, string> = {
    'A': COL.green, 'B': COL.blueLight, 'C': COL.amber, 'D': COL.red, 'N/A': COL.mutedText,
  };
  const rolColorMap: Record<string, string> = {
    master: COL.purple, docente: COL.blueUTC, practicante: COL.green, paciente: COL.amber,
  };
  const COLS6 = ['B', 'C', 'D', 'E', 'F', 'G'];

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 1 — PORTADA
  // ═══════════════════════════════════════════════════════════════════════════
  const wsP = workbook.addWorksheet('📋 Portada', { views: [{ showGridLines: false }] });
  wsP.columns = [{ width: 4 }, { width: 22 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 18 }, { width: 4 }];
  wsP.getRow(1).height = 12;
  wsP.getRow(2).height = 90;
  wsP.getRow(3).height = 28;

  wsP.mergeCells('B2:F2');
  const pTitle = wsP.getCell('B2');
  pTitle.value = 'CLÍNICA UTC\nINFORME CLÍNICO INTEGRAL';
  pTitle.font  = { name: 'Arial', size: 24, bold: true, color: { argb: COL.white } };
  pTitle.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.blueUTC } };
  pTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  wsP.mergeCells('B3:F3');
  const pSub = wsP.getCell('B3');
  pSub.value = 'Sistema de Gestión de Academias UTC · 2026';
  pSub.font  = { name: 'Arial', size: 11, bold: true, color: { argb: COL.white } };
  pSub.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.orange } };
  pSub.alignment = { vertical: 'middle', horizontal: 'center' };

  wsP.getRow(4).height = 10;
  const infoRows: [string, string][] = [
    ['📅  Fecha de generación:', `${dateNow}  ·  ${timeNow} hrs`],
    ['🔍  Alcance del informe:', textoFiltro],
    ['🛡️  Tipo de acceso:', scopeLabel],
    ['📊  Total de registros:', `${allCitas.length} citas  ·  ${rawData.usuarios.length} usuarios`],
    ['📁  Hojas incluidas:', '9 hojas: KPIs · Comparativo · Tendencia · Horarios · Estados · Citas · Practicantes · Personal'],
  ];
  infoRows.forEach(([label, val], i) => {
    wsP.getRow(5 + i).height = 22;
    wsP.mergeCells(`B${5 + i}:C${5 + i}`);
    wsP.mergeCells(`D${5 + i}:F${5 + i}`);
    const lc = wsP.getCell(`B${5 + i}`);
    const vc = wsP.getCell(`D${5 + i}`);
    lc.value = label; vc.value = val;
    lc.font  = { name: 'Arial', size: 9, bold: true, color: { argb: COL.mutedText } };
    lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.headerRow } };
    lc.border = bd(); lc.alignment = { vertical: 'middle', horizontal: 'left' };
    vc.font  = { name: 'Arial', size: 9, color: { argb: COL.darkText } };
    vc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.white } };
    vc.border = bd(); vc.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  wsP.getRow(11).height = 14;
  wsP.getRow(12).height = 22;
  wsP.mergeCells('B12:F12');
  hCell(wsP.getCell('B12'), COL.blueUTC, COL.white, 10);
  wsP.getCell('B12').value = 'ÍNDICE DE CONTENIDO';

  const toc = [
    ['1', '📋 Portada',                  'Esta hoja: metadatos del informe'],
    ['2', '📊 Resumen Ejecutivo',         'KPIs globales, tasas y volumen operativo'],
    ['3', '🔀 Análisis Comparativo',      'Nutrición vs Fisioterapia en paralelo'],
    ['4', '📈 Tendencia Semanal',         'Flujo de consultas por día de la semana'],
    ['5', '⏰ Franjas Horarias',          'Top de horarios con mayor demanda y visualización'],
    ['6', '🔵 Distribución de Estados',  'Completadas / Canceladas / Programadas / Re-agendadas'],
    ['7', '📁 Bitácora de Citas',        'Registro completo con filtros automáticos'],
    ['8', '🎓 Rendimiento Practicantes', 'Efectividad, ranking, calificación A-D por alumno'],
    ['9', '👥 Directorio Personal',      'Directorio ordenado por rol con datos completos'],
  ];
  toc.forEach(([num, name, desc], i) => {
    wsP.getRow(13 + i).height = 17;
    wsP.mergeCells(`D${13 + i}:F${13 + i}`);
    const nc = wsP.getCell(`B${13 + i}`);
    const nm = wsP.getCell(`C${13 + i}`);
    const dc = wsP.getCell(`D${13 + i}`);
    nc.value = num; nm.value = name; dc.value = desc;
    [nc, nm, dc].forEach((c, ci) => {
      c.font   = { name: 'Arial', size: 9, color: { argb: ci === 0 ? COL.blueUTC : COL.darkText }, bold: ci === 0 };
      c.border = bd();
      c.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'center' : 'left' };
      if (i % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 2 — RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════════════════════════════════
  const wsK = workbook.addWorksheet('📊 Resumen Ejecutivo', { views: [{ showGridLines: false }] });
  wsK.columns = [{ width: 4 }, { width: 38 }, { width: 16 }, { width: 16 }, { width: 4 }];
  wsK.getRow(2).height = 34;
  wsK.mergeCells('B2:D2');
  hCell(wsK.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsK.getCell('B2').value = `RESUMEN EJECUTIVO  ·  ${textoFiltro}`;
  wsK.getRow(3).height = 16;
  wsK.mergeCells('B3:D3');
  wsK.getCell('B3').value = `Generado: ${dateNow}  ·  ${timeNow}`;
  wsK.getCell('B3').font  = { name: 'Arial', size: 9, color: { argb: COL.mutedText } };
  wsK.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };
  wsK.getCell('B3').fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.indigoTint } };

  wsK.getRow(5).height = 20;
  hCell(wsK.getCell('B5'), COL.darkText, COL.white, 9); wsK.getCell('B5').value = 'INDICADOR';
  hCell(wsK.getCell('C5'), COL.darkText, COL.white, 9); wsK.getCell('C5').value = 'VALOR';
  hCell(wsK.getCell('D5'), COL.darkText, COL.white, 9); wsK.getCell('D5').value = '% DEL TOTAL';

  const kpiRows: [string, number | string, string, string][] = [
    ['Total de Citas (ambas áreas)',        exTotal,                        '100%',                      COL.blueUTC ],
    ['Citas Completadas',                   exComp,                         pct(exComp, exTotal),        COL.green   ],
    ['Citas Programadas (pendientes)',       exProg,                         pct(exProg, exTotal),        COL.indigo  ],
    ['Citas Canceladas',                    exCanc,                         pct(exCanc, exTotal),        COL.red     ],
    ['Citas Re-agendadas',                  exReag,                         pct(exReag, exTotal),        COL.purple  ],
    ['Nuevos Expedientes (últimos 7 días)', stats.pacientesNuevosSemana,    '—',                                           COL.amber   ],
    ['Tiempo Promedio de Consulta',         `${stats.tiempoPromedioConsulta} min`, '—',                                    COL.blueLight],
    ['Practicantes activos',                practicantes.length,            '—',                                           COL.green   ],
    ['Docentes registrados',                docentes.length,                '—',                                           COL.blueUTC ],
    ['Total de usuarios en sistema',        rawData.usuarios.length,        '—',                                           COL.darkText],
  ];
  kpiRows.forEach(([label, val, pctVal, accent], i) => {
    wsK.getRow(6 + i).height = 20;
    const lc = wsK.getCell(`B${6 + i}`);
    const vc = wsK.getCell(`C${6 + i}`);
    const pc = wsK.getCell(`D${6 + i}`);
    lc.value = label; vc.value = val; pc.value = pctVal;
    lc.font  = { name: 'Arial', size: 9, color: { argb: COL.darkText } };
    lc.border = { ...bd(), left: { style: 'medium', color: { argb: accent } } };
    lc.alignment = { vertical: 'middle', horizontal: 'left' };
    vc.font  = { name: 'Arial', size: 12, bold: true, color: { argb: accent } };
    vc.border = bd(); vc.alignment = { vertical: 'middle', horizontal: 'center' };
    pc.font  = { name: 'Arial', size: 9, color: { argb: COL.mutedText } };
    pc.border = bd(); pc.alignment = { vertical: 'middle', horizontal: 'center' };
    if (i % 2 === 0) {
      [lc, vc, pc].forEach(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 3 — ANÁLISIS COMPARATIVO
  // ═══════════════════════════════════════════════════════════════════════════
  const wsC = workbook.addWorksheet('🔀 Análisis Comparativo', { views: [{ showGridLines: false }] });
  wsC.columns = [{ width: 4 }, { width: 28 }, { width: 16 }, { width: 12 }, { width: 16 }, { width: 12 }, { width: 14 }, { width: 4 }];
  wsC.getRow(2).height = 34;
  wsC.mergeCells('B2:G2');
  hCell(wsC.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsC.getCell('B2').value = 'ANÁLISIS COMPARATIVO  ·  NUTRICIÓN vs FISIOTERAPIA';

  wsC.getRow(4).height = 22;
  ['INDICADOR', 'NUTRICIÓN', '%', 'FISIOTERAPIA', '%', 'TOTAL'].forEach((h, i) => {
    hCell(wsC.getCell(`${COLS6[i]}4`), [COL.darkText,COL.orange,COL.orange,COL.indigo,COL.indigo,COL.blueUTC][i], COL.white, 10);
    wsC.getCell(`${COLS6[i]}4`).value = h;
  });

  const compRows: [string, number, number, number][] = [
    ['Total de Citas',     nutTotal,  fisioTotal,  nutTotal + fisioTotal],
    ['Citas Completadas',  nutComp,   fisioComp,   nutComp  + fisioComp ],
    ['Citas Canceladas',   nutCanc,   fisioCanc,   nutCanc  + fisioCanc ],
    ['Citas Programadas',  nutProg,   fisioProg,   nutProg  + fisioProg ],
    ['Citas Re-agendadas', nutReag,   fisioReag,   nutReag  + fisioReag ],
  ];
  compRows.forEach(([label, nv, fv, tot], i) => {
    wsC.getRow(5 + i).height = 20;
    const vals = [label, nv, pct(nv, tot), fv, pct(fv, tot), tot];
    const colors = [COL.darkText, COL.orange, COL.mutedText, COL.indigo, COL.mutedText, COL.blueUTC];
    const bolds  = [false, true, false, true, false, true];
    vals.forEach((v, ci) => {
      const cell = wsC.getCell(`${COLS6[ci]}${5 + i}`);
      cell.value = v;
      cell.font  = { name: 'Arial', size: 10, bold: bolds[ci], color: { argb: colors[ci] } };
      cell.border = bd();
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'left' : 'center' };
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
    });
  });

  wsC.getRow(10).height = 22;
  wsC.mergeCells('B10:G10');
  hCell(wsC.getCell('B10'), COL.darkText, COL.white, 10);
  wsC.getCell('B10').value = 'TASAS DE RENDIMIENTO';

  const rateRows: [string, string, string][] = [
    ['Tasa de Completación', pct(nutComp, nutTotal), pct(fisioComp, fisioTotal)],
    ['Tasa de Cancelación',  pct(nutCanc, nutTotal), pct(fisioCanc, fisioTotal)],
    ['Tasa de Pendientes',   pct(nutProg, nutTotal), pct(fisioProg, fisioTotal)],
  ];
  rateRows.forEach(([label, nR, fR], i) => {
    wsC.getRow(11 + i).height = 18;
    wsC.mergeCells(`C${11+i}:D${11+i}`);
    wsC.mergeCells(`E${11+i}:F${11+i}`);
    const lc = wsC.getCell(`B${11+i}`); const nc = wsC.getCell(`C${11+i}`);
    const fc = wsC.getCell(`E${11+i}`); const tc = wsC.getCell(`G${11+i}`);
    lc.value = label; nc.value = nR; fc.value = fR; tc.value = '—';
    [[lc,COL.darkText,false],[nc,COL.orange,true],[fc,COL.indigo,true],[tc,COL.mutedText,false]].forEach(([c,color,bold]: any) => {
      c.font   = { name: 'Arial', size: 10, bold, color: { argb: color } };
      c.border = bd();
      c.alignment = { vertical: 'middle', horizontal: c === lc ? 'left' : 'center' };
      if (i % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 4 — TENDENCIA SEMANAL
  // ═══════════════════════════════════════════════════════════════════════════
  const wsT = workbook.addWorksheet('📈 Tendencia Semanal', { views: [{ showGridLines: true }] });
  wsT.columns = [{ width: 4 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 4 }];
  wsT.getRow(2).height = 34;
  wsT.mergeCells('B2:G2');
  hCell(wsT.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsT.getCell('B2').value = 'TENDENCIA SEMANAL — FLUJO DE CONSULTAS POR DÍA';

  wsT.getRow(4).height = 22;
  ['DÍA', 'NUTRICIÓN', 'FISIOTERAPIA', 'TOTAL', '% NUT.', '% FISIO.'].forEach((h, i) => {
    hCell(wsT.getCell(`${COLS6[i]}4`), [COL.darkText,COL.orange,COL.indigo,COL.blueUTC,COL.orange,COL.indigo][i], COL.white, 10);
    wsT.getCell(`${COLS6[i]}4`).value = h;
  });

  let sumNut = 0, sumFisio = 0;
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const excelDayData = dayNames.map((name) => ({ name, nutricion: 0, fisioterapia: 0 }));

  allCitas.forEach((c: any) => {
    const fechaStr = c.fecha || c.date;
    if (!fechaStr) return;
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dayIdx = getDay(dateObj);
    
    if (!isNaN(dayIdx) && dayIdx >= 0 && dayIdx <= 6) {
      const area = (c.tipo || c.area || '').toLowerCase();
      if (area === 'nutricion') excelDayData[dayIdx].nutricion++;
      if (area === 'fisioterapia') excelDayData[dayIdx].fisioterapia++;
    }
  });

  excelDayData.forEach((day, i) => {
    const tot = day.nutricion + day.fisioterapia;
    sumNut += day.nutricion; sumFisio += day.fisioterapia;
    wsT.getRow(5 + i).height = 18;
    [day.name, day.nutricion, day.fisioterapia, tot, pct(day.nutricion, tot), pct(day.fisioterapia, tot)].forEach((v, ci) => {
      const cell = wsT.getCell(`${COLS6[ci]}${5 + i}`);
      cell.value = v;
      cell.font  = { name: 'Arial', size: 10, bold: ci === 0 || ci === 3, color: { argb: [COL.darkText,COL.orange,COL.indigo,COL.blueUTC,COL.mutedText,COL.mutedText][ci] } };
      cell.border = bd();
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'left' : 'center' };
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
    });
  });
  const tRow = 5 + excelDayData.length;
  wsT.getRow(tRow).height = 22;
  const sumTot = sumNut + sumFisio;
  ['TOTAL SEMANA', sumNut, sumFisio, sumTot, pct(sumNut, sumTot), pct(sumFisio, sumTot)].forEach((v, ci) => {
    const cell = wsT.getCell(`${COLS6[ci]}${tRow}`);
    cell.value = v;
    cell.font  = { name: 'Arial', size: 10, bold: true, color: { argb: COL.white } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: [COL.darkText,COL.orange,COL.indigo,COL.blueUTC,COL.orange,COL.indigo][ci] } };
    cell.border = bd(COL.white);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 5 — FRANJAS HORARIAS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsH = workbook.addWorksheet('⏰ Franjas Horarias', { views: [{ showGridLines: false }] });
  wsH.columns = [{ width: 4 }, { width: 8 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 32 }, { width: 4 }];
  wsH.getRow(2).height = 34;
  wsH.mergeCells('B2:F2');
  hCell(wsH.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsH.getCell('B2').value = 'ANÁLISIS DE FRANJAS HORARIAS — DEMANDA POR TURNO';

  wsH.getRow(4).height = 22;
  ['#', 'HORARIO', 'CONSULTAS', '% DEL TOTAL', 'VISUALIZACIÓN DE DEMANDA'].forEach((h, i) => {
    hCell(wsH.getCell(`${'BCDEF'[i]}4`), COL.blueUTC, COL.white, 10);
    wsH.getCell(`${'BCDEF'[i]}4`).value = h;
  });

  const horasTotal = horariosOrdenados.reduce((s, h) => s + h.cantidad, 0);
  horariosOrdenados.slice(0, 15).forEach((item, i) => {
    wsH.getRow(5 + i).height = 18;
    const pctVal = horasTotal > 0 ? (item.cantidad / horasTotal) * 100 : 0;
    const filled = Math.round(pctVal / 3.5);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, 25 - filled));
    const accent = i < 3 ? COL.orange : i < 7 ? COL.amber : COL.mutedText;
    [i + 1, item.horario, item.cantidad, `${pctVal.toFixed(1)}%`, bar].forEach((v, ci) => {
      const cell = wsH.getCell(`${'BCDEF'[ci]}${5 + i}`);
      cell.value = v;
      cell.font  = { name: ci === 4 ? 'Courier New' : 'Arial', size: ci === 4 ? 8 : 10, bold: ci === 0 || ci === 2, color: { argb: ci === 4 ? accent : COL.darkText } };
      cell.border = bd();
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 || ci === 1 ? 'center' : ci === 4 ? 'left' : 'center' };
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 6 — DISTRIBUCIÓN DE ESTADOS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsE = workbook.addWorksheet('🔵 Distribución de Estados', { views: [{ showGridLines: false }] });
  wsE.columns = [{ width: 4 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 38 }, { width: 4 }];
  wsE.getRow(2).height = 34;
  wsE.mergeCells('B2:F2');
  hCell(wsE.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsE.getCell('B2').value = 'DISTRIBUCIÓN DE ESTADOS DE CITAS';

  wsE.getRow(4).height = 22;
  ['ESTADO', 'CANTIDAD', '% TOTAL', 'META', 'DESCRIPCIÓN'].forEach((h, i) => {
    hCell(wsE.getCell(`${'BCDEF'[i]}4`), COL.darkText, COL.white, 10);
    wsE.getCell(`${'BCDEF'[i]}4`).value = h;
  });

  [
    { estado: 'Completada',  count: exComp, col: COL.green,  bg: COL.greenTint,  meta: '≥ 80%', desc: 'Cita atendida y finalizada exitosamente' },
    { estado: 'Programada',  count: exProg, col: COL.indigo, bg: COL.indigoTint, meta: '< 25%', desc: 'Cita agendada, pendiente de atención' },
    { estado: 'Cancelada',   count: exCanc, col: COL.red,    bg: COL.redTint,    meta: '< 10%', desc: 'Cita no realizada por cualquier motivo' },
    { estado: 'Re-agendada', count: exReag, col: COL.purple, bg: COL.purpleTint, meta: '< 15%', desc: 'Cita reprogramada a nueva fecha/hora' },
  ].forEach((item, i) => {
    wsE.getRow(5 + i).height = 20;
    [item.estado, item.count, pct(item.count, exTotal), item.meta, item.desc].forEach((v, ci) => {
      const cell = wsE.getCell(`${'BCDEF'[ci]}${5 + i}`);
      cell.value = v;
      cell.font  = { name: 'Arial', size: 10, bold: ci === 0, color: { argb: ci === 0 ? item.col : COL.darkText } };
      cell.border = { ...bd(), left: ci === 0 ? { style: 'thick' as const, color: { argb: item.col } } : bd().left };
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 || ci === 4 ? 'left' : 'center' };
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 7 — BITÁCORA COMPLETA DE CITAS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsCitas = workbook.addWorksheet('📁 Bitácora de Citas', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  wsCitas.columns = [
    { width: 8 }, { width: 13 }, { width: 8 }, { width: 28 }, { width: 16 },
    { width: 26 }, { width: 26 }, { width: 14 }, { width: 10 },
  ];
  wsCitas.getRow(1).height = 20;
  ['ID', 'FECHA', 'HORA', 'PACIENTE', 'ÁREA', 'PRACTICANTE', 'DOCENTE / SUPERVISOR', 'ESTADO', 'CONSULTA #'].forEach((h, i) => {
    hCell(wsCitas.getRow(1).getCell(i + 1), COL.blueUTC);
    wsCitas.getRow(1).getCell(i + 1).value = h;
  });

  allCitas.forEach((cita: any, i: number) => {
    wsCitas.getRow(i + 2).height = 15;
    const estado = (cita.estado || '').toLowerCase();
    const area   = (cita.tipo || cita.area || '').toLowerCase();
    const sc = statusColorMap[estado] || { text: COL.darkText, bg: COL.white };
    const ac = areaColorMap[area] || COL.mutedText;
    [
      cita.id,
      cita.fecha?.split('T')[0] || 'N/A',
      (cita.hora || cita.time || 'N/A').substring(0, 5),
      cap(cita.paciente_nombre),
      area.toUpperCase() || 'N/A',
      cap(cita.practicante_nombre) || 'Sin asignar',
      cap(cita.docente_nombre) || '—',
      estado.toUpperCase() || 'N/A',
      cita.numero_consulta || cita.appointment_id || '—',
    ].forEach((v, ci) => {
      const cell = wsCitas.getRow(i + 2).getCell(ci + 1);
      cell.value = v;
      cell.border = bd();
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 || ci === 8 ? 'center' : 'left' };
      cell.font = { name: 'Arial', size: 9, color: { argb: COL.darkText } };
      if (i % 2 === 0 && ci !== 4 && ci !== 7) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
      if (ci === 4) { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: ac } }; }
      if (ci === 7) { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: sc.text } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sc.bg } }; }
    });
  });

  const citasTR = allCitas.length + 2;
  wsCitas.getRow(citasTR).height = 18;
  [`TOTAL: ${allCitas.length} registros`, '', '', '', `NUT: ${nutTotal}  ·  FISIO: ${fisioTotal}`, '', '', '', ''].forEach((v, ci) => {
    const cell = wsCitas.getRow(citasTR).getCell(ci + 1);
    cell.value = v; cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COL.white } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.blueUTC } };
    cell.border = bd(COL.white); cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  wsCitas.autoFilter = { from: { row: 1, column: 1 }, to: { row: allCitas.length + 1, column: 9 } };

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 8 — RENDIMIENTO PRACTICANTES
  // ═══════════════════════════════════════════════════════════════════════════
  const wsRend = workbook.addWorksheet('🎓 Rendimiento Practicantes', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  wsRend.columns = [
    { width: 6 }, { width: 30 }, { width: 14 }, { width: 16 }, { width: 12 },
    { width: 12 }, { width: 14 }, { width: 13 }, { width: 13 }, { width: 14 }, { width: 10 },
  ];
  wsRend.getRow(1).height = 20;
  ['RANK', 'NOMBRE', 'MATRÍCULA', 'ÁREA', 'ESTADO', 'TOTAL', 'COMPLETADAS', 'CANCELADAS', 'PROGRAMADAS', 'EFECTIVIDAD', 'CALIF.'].forEach((h, i) => {
    hCell(wsRend.getRow(1).getCell(i + 1), COL.green);
    wsRend.getRow(1).getCell(i + 1).value = h;
  });

  pracPerf.forEach((p: any, i: number) => {
    wsRend.getRow(i + 2).height = 15;
    const ac  = areaColorMap[(p.area || '').toLowerCase()] || COL.mutedText;
    const gc  = gradeColor[p.grade] || COL.mutedText;
    [i + 1, cap(p.nombre), p.matricula || 'N/A', (p.area || 'N/A').toUpperCase(),
     (p.estado || p.status || 'ACTIVO').toUpperCase(),
     p.tot, p.comp, p.canc, p.prog,
     p.tot > 0 ? `${p.eff.toFixed(1)}%` : 'N/A', p.grade,
    ].forEach((v, ci) => {
      const cell = wsRend.getRow(i + 2).getCell(ci + 1);
      cell.value = v; cell.border = bd();
      cell.alignment = { vertical: 'middle', horizontal: ci === 1 ? 'left' : 'center' };
      cell.font = { name: 'Arial', size: 9, color: { argb: COL.darkText } };
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
      if (ci === 0)  { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: i < 3 ? COL.orange : COL.mutedText } }; }
      if (ci === 3)  { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: ac } }; }
      if (ci === 9)  { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: gc } }; }
      if (ci === 10) { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COL.white } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: gc } }; }
      if (ci === 4 && v === 'INACTIVO') { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COL.red } }; }
    });
  });

  if (pracPerf.length > 0) {
    const perfTR  = pracPerf.length + 2;
    wsRend.getRow(perfTR).height = 18;
    const totComp = pracPerf.reduce((s: number, p: any) => s + p.comp, 0);
    const totCanc = pracPerf.reduce((s: number, p: any) => s + p.canc, 0);
    const totAll  = pracPerf.reduce((s: number, p: any) => s + p.tot, 0);
    const active  = pracPerf.filter((p: any) => p.tot > 0);
    const avgEff  = active.length > 0 ? active.reduce((s: number, p: any) => s + p.eff, 0) / active.length : 0;
    [`${pracPerf.length} practicantes`, '', '', '', '', totAll, totComp, totCanc, '', `${avgEff.toFixed(1)}% prom.`, ''].forEach((v, ci) => {
      const cell = wsRend.getRow(perfTR).getCell(ci + 1);
      cell.value = v; cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COL.white } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.green } };
      cell.border = bd(COL.white); cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    wsRend.autoFilter = { from: { row: 1, column: 1 }, to: { row: pracPerf.length + 1, column: 11 } };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 9 — DIRECTORIO PERSONAL
  // ═══════════════════════════════════════════════════════════════════════════
  const wsDir = workbook.addWorksheet('👥 Directorio Personal', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  wsDir.columns = [
    { width: 10 }, { width: 30 }, { width: 30 }, { width: 16 },
    { width: 16 }, { width: 14 }, { width: 16 }, { width: 24 },
  ];
  wsDir.getRow(1).height = 20;
  ['ID SISTEMA', 'NOMBRE COMPLETO', 'CORREO ELECTRÓNICO', 'ROL', 'ÁREA', 'ESTADO', 'MATRÍCULA', 'REGISTRADO POR'].forEach((h, i) => {
    hCell(wsDir.getRow(1).getCell(i + 1), COL.blueUTC);
    wsDir.getRow(1).getCell(i + 1).value = h;
  });

  const usuariosOrdenados = [...rawData.usuarios].sort((a: any, b: any) => {
    const ro: Record<string, number> = { master: 0, docente: 1, practicante: 2, paciente: 3 };
    return (ro[a.rol] ?? 9) - (ro[b.rol] ?? 9);
  });

  usuariosOrdenados.forEach((u: any, i: number) => {
    wsDir.getRow(i + 2).height = 15;
    const rol = (u.rol || '').toLowerCase();
    const rc  = rolColorMap[rol] || COL.mutedText;
    [u.id, cap(u.nombre), (u.email || 'N/A').toLowerCase(),
     rol.toUpperCase(), (u.area || 'GENERAL').toUpperCase(),
     (u.estado || u.status || 'ACTIVO').toUpperCase(),
     u.matricula || '—', cap(u.creado_por_nombre) || 'Admin Sistema',
    ].forEach((v, ci) => {
      const cell = wsDir.getRow(i + 2).getCell(ci + 1);
      cell.value = v; cell.border = bd();
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'center' : 'left' };
      cell.font = { name: 'Arial', size: 9, color: { argb: COL.darkText } };
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.zebra } };
      if (ci === 3) { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: rc } }; }
      if (ci === 4 && v !== 'GENERAL') { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: areaColorMap[(u.area || '').toLowerCase()] || COL.mutedText } }; }
      if (ci === 5 && v === 'INACTIVO') { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COL.red } }; }
    });
  });
  wsDir.autoFilter = { from: { row: 1, column: 1 }, to: { row: usuariosOrdenados.length + 1, column: 8 } };

  // ── Generar y descargar archivo ───────────────────────────────────────────
  const dateTag  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `InformeClinico_UTC_${textoFiltro.replace(/\s+/g, '_')}_${dateTag}.xlsx`;
  const buffer   = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function StatisticsPanel({ area }: StatisticsPanelProps) {
  const { user } = useAuth();
  const [_loading, setLoading] = useState(true);
  const [filtroArea, setFiltroArea] = useState<FilterArea>(() => normalizeAreaFilter(area));
  const [rawData, setRawData] = useState<{ citas: Cita[], usuarios: Usuario[], historiales: any[] }>({ citas: [], usuarios: [], historiales: [] });
  const [globalMetrics, setGlobalMetrics] = useState({ promedioConsulta: 0, tasaAbandono: 0, velocidadAsignacionDocente: 0 });
  const [isExporting, setIsExporting] = useState(false);

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

  // Carga inicial única — descarga data pesada una sola vez
  useEffect(() => {
    const fetchRawData = async () => {
      try {
        setLoading(true);
        const [citas, historiales, dbStats, usuarios] = await Promise.all([
          citasAPI.getAll(),
          historialesAPI.getAll(),
          metricasAPI.getDashboardStats(),
          usuariosAPI.getAll().catch(() => []),
        ]);
        setRawData({ citas, usuarios, historiales });
        setGlobalMetrics({
          promedioConsulta:          dbStats.promedioConsulta          || 0,
          tasaAbandono:              dbStats.tasaAbandono              || 0,
          velocidadAsignacionDocente: dbStats.velocidadAsignacionDocente || 0,
        });
      } catch (error) {
        console.error('Error al descargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRawData();
  }, []);

  // Filtrado local — se ejecuta sin red al cambiar filtroArea
  useEffect(() => {
    if (rawData.citas.length === 0) return;

    const filteredCitas = rawData.citas.filter((item: Cita) => {
      if (filtroArea === 'general') return true;
      return (item.area || item.tipo)?.toLowerCase() === filtroArea;
    });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dayData = dayNames.map((name) => ({ name, nutricion: 0, fisioterapia: 0 }));
    const timeCount: Record<string, number> = {};

    filteredCitas.forEach((apt: Cita) => {
      const fechaStr = apt.fecha || apt.date;
      if (!fechaStr) return;
      const [year, month, day] = fechaStr.split('T')[0].split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const dayIdx = getDay(dateObj);
      if (!isNaN(dayIdx) && dayIdx >= 0 && dayIdx <= 6) {
        const area = (apt.tipo || apt.area)?.toLowerCase();
        if (area === 'nutricion') dayData[dayIdx].nutricion++;
        if (area === 'fisioterapia') dayData[dayIdx].fisioterapia++;
      }
      const horaKey = (apt.hora || apt.time || '').substring(0, 5);
      if (horaKey) timeCount[horaKey] = (timeCount[horaKey] || 0) + 1;
    });

    const limiteUnaSemana = subDays(new Date(), 7);
    const comp = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'completada').length;
    const canc = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'cancelada').length;
    const prog = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'programada').length;
    const reag = filteredCitas.filter((c: Cita) => ['reagendada', 're-agendada'].includes(c.estado?.toLowerCase() || '')).length;

    setStats({
      totalCitas:               filteredCitas.length,
      citasCompletadas:         comp,
      citasCanceladas:          canc,
      citasProgramadas:         prog,
      reagendadas:              reag,
      datosGrafica:             dayData,
      horariosMasVisitados:     Object.entries(timeCount)
        .map(([horario, count]) => ({ horario, cantidad: count }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5),
      tiempoPromedioConsulta:        globalMetrics.promedioConsulta,
      tasaAbandono:                  globalMetrics.tasaAbandono,
      pacientesNuevosSemana:         rawData.historiales.filter((h: any) => {
        const fecha = h.creado_en || h.fecha || h.created_at;
        return fecha ? parseISO(fecha) >= limiteUnaSemana : false;
      }).length,
      velocidadAsignacionDocente:    globalMetrics.velocidadAsignacionDocente,
    });
  }, [filtroArea, rawData, globalMetrics]);

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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 4 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Inteligencia Clínica</h1>
            <p style={{ color: C.faint, fontSize: 12, marginTop: 3 }}>Panel de métricas operativas · Actualización en tiempo real</p>
          </div>

          {esMaster && (
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button onClick={() => setFiltroArea('general')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${isGeneralView ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Todo</button>
              <button onClick={() => setFiltroArea('nutricion')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filtroArea === 'nutricion' ? 'bg-orange-100 text-orange-700 shadow-sm border border-orange-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Nutrición</button>
              <button onClick={() => setFiltroArea('fisioterapia')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filtroArea === 'fisioterapia' ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Fisioterapia</button>
            </div>
          )}
        </div>

        {/* ── Tarjetas KPI superiores ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={Calendar}     label="Total Citas"    value={stats.totalCitas}        accent="slate"  tag="GENERAL"    />
          <StatCard icon={CheckCircle}  label="Completadas"    value={stats.citasCompletadas}  accent="green"  tag="COMPLETADO" />
          <StatCard icon={XCircle}      label="Canceladas"     value={stats.citasCanceladas}   accent="red"    tag="ALERTA"     />
          <StatCard icon={CalendarClock}label="Re-agendadas"   value={stats.reagendadas}       accent="purple" tag="AJUSTE"     />
          <StatCard icon={Calendar}     label="Programadas"    value={stats.citasProgramadas}  accent="indigo" tag="ACTIVO"     />
        </div>

        {/* ── KPIs secundarios ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              try {
                await exportToExcel(stats, rawData, filtroArea, esMaster);
              } catch (error) {
                console.error("Error al exportar:", error);
              } finally {
                setIsExporting(false);
              }
            }}
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
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              boxShadow: C.shadow,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (isExporting) return;
              const b = e.currentTarget;
              b.style.borderColor = C.accent.green.top;
              b.style.boxShadow = C.shadowMd;
              b.style.color = C.accent.green.top;
            }}
            onMouseLeave={(e) => {
              if (isExporting) return;
              const b = e.currentTarget;
              b.style.borderColor = C.border;
              b.style.boxShadow = C.shadow;
              b.style.color = C.text;
            }}
          >
            <Download size={15} style={{ color: 'inherit' }} />
            {isExporting ? 'Generando...' : 'Exportar a Excel'}
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