/**
 * ============================================================================
 * COMPONENTE: StatisticsPanel
 * PROPÓSITO: Inteligencia Operativa y KPIs de Eficiencia Clínica.
 * MODIFICACIÓN: Sincronización con tabla 'metricas' para evitar ceros.
 * ============================================================================
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasAPI, historialesAPI, metricasAPI, usuariosAPI } from '../lib/api';
import MonthFilterPicker from './MonthFilterPicker';
import WeekFilterPicker from './WeekFilterPicker';
import { Input } from './ui/input';



import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart3,
  Zap, AlertTriangle, TrendingUp, Users2, Activity,
  CalendarClock, Download, UserX, RotateCcw, ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { parseISO, getDay, startOfWeek, endOfWeek } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell,
  BarChart, Bar, LabelList
} from 'recharts';

// Tipado extendido para las nuevas métricas del servidor
interface ExtendedStats {
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  citasCanceladasLive: number; // solo filas vivas con estado='cancelada' (para el pie, que debe sumar el total exacto)
  citasProgramadas: number;
  reagendadas: number; // Métrica de seguimiento de cambios — no es un estado, no participa en el pie
  noAsistio: number;
  recuperadas: number;
  enAtencion: number;
  incompletasCount: number;
  pendienteReprogramacion: number;
  datosGrafica: { name: string; nutricion: number; fisioterapia: number }[];
  horariosMasVisitados: { horario: string; cantidad: number }[];
  tiempoPromedioConsulta: number;
  tasaIncompletas: number;
  pacientesNuevosPeriodo: number;
  tasaAsignacionAutomatica: number;
  asignacionesAutomaticas: number; // conteo crudo (citas asignadas sin fallback a docente)
}
// Estados vigentes del ciclo de vida de una cita (migraciones 008/009):
// programada → en_atencion → completada (terminal) | no_asistio (terminal)
// en_atencion → incompleta (timeout) → recuperada → en_atencion
// programada → pendiente_reprogramacion (sin practicante disponible)
// programada → cancelada (auto-cancelación del paciente, PatientDashboard.tsx
// → PUT /citas/:id { estado: 'cancelada' } — la fila se conserva).
// Reagendar (PUT con nueva fecha/hora) no cambia el estado; el borrado físico
// (DELETE /citas/:id) también existe en el backend pero hoy no lo dispara
// ningún flujo de UI activo (AppointmentManager.tsx está huérfano).
interface Cita {
  id: string | number;
  fecha?: string;
  date?: string;
  hora?: string;
  time?: string;
  tipo?: 'nutricion' | 'fisioterapia';
  area?: 'nutricion' | 'fisioterapia';
  estado: 'programada' | 'en_atencion' | 'completada' | 'no_asistio' | 'incompleta' | 'recuperada' | 'pendiente_reprogramacion' | 'cancelada';
  paciente_nombre?: string;
  practicante_id?: string | number;
  practicante_nombre?: string;
  docente_nombre?: string;
  numero_consulta?: string | number;
  appointment_id?: string | number;
  iniciada_en?: string;
  finalizada_en?: string;
  asignacion_fallback?: boolean;
}

interface EventoMetrica {
  tipo_evento: string;
  area: string;
  practicante_id?: string | number | null;
  fecha_registro: string;
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
  fecha_creacion?: string;
}

interface StatisticsPanelProps {
  area?: 'nutricion' | 'fisioterapia' | 'todos' | 'general';
}

type FilterArea = 'general' | 'nutricion' | 'fisioterapia';
type Periodo = 'semana' | 'mes' | 'trimestre' | 'ano';
type Trimestre = { anio: number; q: 1 | 2 | 3 | 4 };

const normalizeAreaFilter = (value?: StatisticsPanelProps['area']): FilterArea => {
  if (value === 'nutricion' || value === 'fisioterapia') return value;
  return 'general';
};

// Parseo de fecha en horario local (evita el corrimiento de un día que da
// `new Date('yyyy-MM-dd')` al interpretarse como UTC). Único punto de parseo
// de fecha del componente — antes estaba duplicado en tres lugares.
function parseFechaLocal(fechaStr?: string): Date | null {
  if (!fechaStr) return null;
  const [year, month, day] = fechaStr.split('T')[0].split('-');
  const fecha = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(fecha.getTime()) ? null : fecha;
}

// Porcentaje de "n" sobre "total" — usado por las tarjetas KPI superiores
// para mostrar qué proporción del total de citas representa cada estado
// (mismo criterio que ya usa la hoja de Excel: pct = n/total * 100). Se
// conserva sin redondear; el componente que lo muestra decide el formato
// (mínimo 2 decimales, salvo que el número sea cerrado — ver formatPct).
function pctOf(n: number, total: number): number {
  return total > 0 ? (n / total) * 100 : 0;
}

// Formatea un porcentaje: sin decimales si el número es cerrado (25, 100),
// con 2 decimales si no lo es (39.29). Redondea primero a 2 decimales para
// no dejar un "100" fantasma como "99.999999" por error de punto flotante.
function formatPct(n: number): string {
  const redondeado = Math.round(n * 100) / 100;
  return Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(2);
}

// Label de cada punto de Line/Area: dibuja el valor encima del punto y, solo
// en el último punto de la serie, el nombre de la serie a un lado — esto
// reemplaza la referencia que en pantalla da el <Legend>, que Recharts
// renderiza como HTML fuera del <svg> y por eso no aparece al exportar el
// gráfico como imagen para el Excel (capturarGraficaComoPng solo captura el
// <svg>). Dibujado así, ambos quedan dentro del mismo <svg> y sí se exportan.
function renderPuntoLabel(color: string, nombreSerie: string, totalPuntos: number) {
  return (props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null) return <g />;
    const esUltimo = index === totalPuntos - 1;
    return (
      <g>
        <text x={x} y={y - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
          {value}
        </text>
        {esUltimo && (
          <text x={x + 8} y={y + 4} fontSize={11} fontWeight={700} fill={color}>
            {nombreSerie}
          </text>
        )}
      </g>
    );
  };
}

// Rango de fechas [desde, hasta] para el periodo activo del selector.
// 'semana' es un rango absoluto elegido a mano (WeekFilterPicker: flechas
// recorren semana a semana, o el usuario elige un día inicio/fin arbitrario
// en el calendario); 'mes'/'trimestre'/'ano' son absolutos y responden a la
// selección manual del usuario (mes, trimestre o año específico). Se quitó
// el modo "Todo" (histórico sin límite): era una ventana que se recalculaba
// sola con cada cita nueva, sin período fijo que citar — Rango ya cubre el
// mismo caso de uso eligiendo a mano la primera y última fecha con datos.
function rangoDePeriodo(
  periodo: Periodo,
  mes: string,
  trimestre: Trimestre,
  anio: number,
  semana: { desde: Date; hasta: Date }
): { desde: Date | null; hasta: Date | null } {
  switch (periodo) {
    case 'semana':
      return { desde: semana.desde, hasta: new Date(semana.hasta.getFullYear(), semana.hasta.getMonth(), semana.hasta.getDate(), 23, 59, 59, 999) };
    case 'mes': {
      const [y, m] = mes.split('-').map(Number);
      return { desde: new Date(y, m - 1, 1), hasta: new Date(y, m, 0, 23, 59, 59, 999) };
    }
    case 'trimestre': {
      const inicioMes = (trimestre.q - 1) * 3;
      return {
        desde: new Date(trimestre.anio, inicioMes, 1),
        hasta: new Date(trimestre.anio, inicioMes + 3, 0, 23, 59, 59, 999),
      };
    }
    case 'ano':
      return { desde: new Date(anio, 0, 1), hasta: new Date(anio, 11, 31, 23, 59, 59, 999) };
  }
}

// Rasteriza el <svg> que ya está renderizado en pantalla (Recharts) a PNG,
// para poder incrustarlo como imagen en el Excel — ExcelJS no soporta
// gráficas nativas editables, así que se exporta una "foto" del gráfico tal
// como el usuario lo está viendo en ese momento (mismos datos, mismos colores).
function svgElementToPngBase64(svg: SVGSVGElement, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const rect = svg.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || 600));
    const height = Math.max(1, Math.round(rect.height || 300));
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) { reject(new Error('No se pudo crear el contexto de canvas')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png').split(',')[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo rasterizar la gráfica')); };
    img.src = url;
  });
}

// Busca el <svg> dentro del contenedor referenciado y lo convierte a PNG;
// devuelve null si la gráfica no llegó a renderizarse (evita romper la
// exportación completa por una sola gráfica faltante).
async function capturarGraficaComoPng(ref: React.RefObject<HTMLDivElement | null>): Promise<string | null> {
  const svg = ref.current?.querySelector('svg');
  if (!svg) return null;
  try {
    return await svgElementToPngBase64(svg as SVGSVGElement, 2);
  } catch {
    return null;
  }
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
    // Mismos colores que el badge de estado en el panel de Citas Agendadas
    // (citasHelpers.ts → getEstadoBadgeClasses), para que "No asistió" y
    // "Recuperadas" se reconozcan de un vistazo entre ambos paneles.
    gray:   { top: '#6b7280', tint: '#f9fafb', bar: '#9ca3af' },
    sky:    { top: '#0369a1', tint: '#f0f9ff', bar: '#38bdf8' },
    // Tono exacto pedido para 'incompleta' — mismo valor en citasHelpers.ts,
    // los filtros de estado de los dashboards, y aquí (KPI, pie, Excel).
    pink:   { top: '#FEB2E6', tint: '#fef1fb', bar: '#FEB2E6' },
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
  pct,
  unit,
  caption,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: keyof typeof C.accent;
  tag: string;
  pct?: number;
  unit?: string;
  caption?: string;
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: C.text, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>{unit}</span>}
          {pct !== undefined && (
            <span style={{ color: a.top, fontSize: 12, fontWeight: 700 }}>{formatPct(pct)}%</span>
          )}
        </div>
      </div>
      {(pct !== undefined || caption) && (
        <div>
          {pct !== undefined && (
            <div style={{ height: 4, background: '#e9edf2', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(pct, 100)}%`,
                background: `linear-gradient(90deg, ${a.top}, ${a.bar})`,
                borderRadius: 99,
                transition: 'width 0.9s ease',
              }} />
            </div>
          )}
          <p style={{ color: C.text, fontSize: 10, marginTop: pct !== undefined ? 7 : 0 }}>
            {caption || 'del total de citas'}
          </p>
        </div>
      )}
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
  count,
  sub,
  bar,
  accent,
  tag,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit?: string;
  count?: number;
  sub: string;
  bar: number;
  accent: keyof typeof C.accent;
  tag: string;
}) {
  const a = C.accent[accent];
  // Los porcentajes se muestran con mínimo 2 decimales; otras unidades
  // (min, etc.) se muestran tal cual, sin forzar decimales.
  const valorMostrado = unit === '%' && typeof value === 'number' ? formatPct(value) : value;
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
          <span style={{ color: C.text, fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{valorMostrado}</span>
          {unit && <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>{unit}</span>}
          {count !== undefined && (
            <span style={{ color: C.faint, fontSize: 13, fontWeight: 600 }}>
              ({count} {count === 1 ? 'cita' : 'citas'})
            </span>
          )}
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
        <p style={{ color: C.text, fontSize: 10, marginTop: 7 }}>{sub}</p>
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
// Ranking simple de practicantes por citas completadas — solo nombre +
// cantidad, sin barras ni porcentajes (a propósito: es un ranking rápido de
// leer, no un KPI detallado — eso ya lo cubre el Excel).
// ---------------------------------------------------------------------------
function RankingPracticantes({
  titulo,
  datos,
  color,
  hayBusqueda = false,
}: {
  titulo: string;
  datos: { id: string | number; nombre: string; email: string; completadas: number; incompletas: number }[];
  color: string;
  hayBusqueda?: boolean;
}) {
  return (
    <div>
      <p style={{ color, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{titulo}</p>
      {datos.length === 0 ? (
        <p style={{ color: C.faint, fontSize: 12 }}>
          {hayBusqueda ? 'Ningún practicante coincide con la búsqueda.' : 'Sin practicantes en esta área.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 260 }}>
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 pb-1">
            <span className="min-w-0 flex-1" style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Practicante
            </span>
            <span className="w-14 sm:w-24 shrink-0 text-center" style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Incompletas
            </span>
            <span className="w-14 sm:w-24 shrink-0 text-center" style={{ color: C.faint, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Completadas
            </span>
          </div>
          {datos.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 py-2"
              style={{
                borderRadius: 8,
                background: i % 2 === 0 ? C.bg : 'transparent',
              }}
            >
              <span className="min-w-0 flex-1 truncate" style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
                {i + 1}. {p.nombre}
              </span>
              <span className="w-14 sm:w-24 shrink-0 text-center" style={{ color: C.accent.pink.top, fontSize: 15, fontWeight: 700 }}>{p.incompletas}</span>
              <span className="w-14 sm:w-24 shrink-0 text-center" style={{ color, fontSize: 15, fontWeight: 700 }}>{p.completadas}</span>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Encabezado ligero de agrupación — mismo tipo de letra/color que ya usa el
// título+descripción de SectionCard, sin envolver las tarjetas en una caja
// nueva. Separa conceptualmente "Estado de las Citas" (partición, suma 100%)
// de "Indicadores de Proceso" (eventos/tasas, no se suman al total).
// ---------------------------------------------------------------------------
function GroupHeader({
  eyebrow,
  description,
  color,
  emphasize,
}: {
  eyebrow: string;
  description: string;
  color?: string;
  emphasize?: boolean;
}) {
  return (
    <div style={{ padding: '2px 2px 0' }}>
      <p style={{ color: color || C.text, fontWeight: 700, fontSize: emphasize ? 15 : 13 }}>{eyebrow}</p>
      <p style={{
        color: emphasize ? (color || C.text) : C.faint,
        fontWeight: emphasize ? 700 : 400,
        fontSize: emphasize ? 13 : 11,
        marginTop: 1,
      }}>
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selector manual compacto (‹ label ›) para Trimestre y Año — mismo alto y
// forma que MonthFilterPicker, sin el popup de grid (con 4 trimestres o
// años sueltos, prev/next alcanza).
// ---------------------------------------------------------------------------
function SimpleStepper({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="h-11.75 pl-1.5 pr-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-blue-200 bg-white text-base text-blue-900">
      <button type="button" onClick={onPrev} className="h-8.75 w-8.75 flex items-center justify-center rounded-lg hover:bg-blue-50">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="px-2 min-w-[110px] text-center">{label}</span>
      <button type="button" onClick={onNext} className="h-8.75 w-8.75 flex items-center justify-center rounded-lg hover:bg-blue-50">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exportar a Excel — Informe Clínico Integral (9 hojas profesionales)
// ---------------------------------------------------------------------------
async function exportToExcel(
  stats: ExtendedStats,
  rawData: { citas: any[]; usuarios: any[]; historiales?: any[] },
  eventos: EventoMetrica[],
  filtroArea: string,
  esMaster: boolean,
  etiquetaPeriodo: string,
  rangoFechasTexto: string,
  citasBitacora: any[],
  chartImages: { tendencia: string | null; distribucion: string | null; resumen: string | null; flujo: string | null },
  pracPerf: any[]
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
    pink:       'FFFEB2E6',
    pinkTint:   'FFFEF1FB',
    white:      'FFFFFFFF',
    darkText:   'FF1E293B',
    mutedText:  'FF64748B',
    border:     'FFE2E8F0',
    zebra:      'FFF8FAFC',
    headerRow:  'FFF1F5F9',
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cap = (v?: string) => !v ? '' : v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  const pct = (n: number, d: number) => d > 0 ? `${formatPct((n / d) * 100)}%` : '0%';
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
  // Reagendar no cambia el estado — citas.estado no puede responder esto,
  // metricas es la única fuente. Cancelar sí conserva la fila (estado
  // 'cancelada') por la vía real de auto-cancelación del paciente; se suma el
  // evento de metricas por si alguna vez se usa el borrado físico (hoy sin UI).
  const byEvento = (tipo: string, area: string | null) =>
    eventos.filter((e) => e.tipo_evento === tipo && (area === null || (e.area || '').toLowerCase() === area)).length;
  const byCancelada = (arr: any[], area: string | null) =>
    byStatus(arr, 'cancelada') + byEvento('cita_cancelada', area);
  // Normalizador seguro
  const getArea = (c: Cita) => (c.tipo || c.area || '').toLowerCase();

  const citasNut = allCitas.filter((c: any) => getArea(c) === 'nutricion');
  const citasFisio = allCitas.filter((c: any) => getArea(c) === 'fisioterapia');

  const nutTotal        = citasNut.length;
  const nutComp         = byStatus(citasNut,   'completada');
  const nutCanc         = byCancelada(citasNut, 'nutricion');
  const nutProg         = byStatus(citasNut,   'programada');
  const nutReag         = byEvento('cita_reagendada', 'nutricion');
  const fisioTotal      = citasFisio.length;
  const fisioComp       = byStatus(citasFisio, 'completada');
  const fisioCanc       = byCancelada(citasFisio, 'fisioterapia');
  const fisioProg       = byStatus(citasFisio, 'programada');
  const fisioReag       = byEvento('cita_reagendada', 'fisioterapia');

  // Totales globales para Excel (independientes del filtro visual)
  const exTotal = allCitas.length;
  const exComp  = byStatus(allCitas, 'completada');
  const exProg  = byStatus(allCitas, 'programada');
  const exCanc  = byCancelada(allCitas, null);
  const exReag  = byEvento('cita_reagendada', null);

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

  // pracPerf ya no se calcula aquí — llega como parámetro, calculado una
  // sola vez en el componente (useMemo) y compartido con el panel en
  // pantalla, para que ambos consuman exactamente la misma fuente.

  // Incluye los estados vigentes del ciclo de vida (migraciones 008/009).
  // 'cancelada'/'reagendada' no son valores reales de citas.estado (cancelar
  // borra la fila; reagendar no cambia el estado) — se conservan aquí sin
  // costo por si en el futuro se representan de otra forma.
  const statusColorMap: Record<string, { text: string; bg: string }> = {
    completada:                 { text: COL.green,     bg: COL.greenTint  },
    programada:                 { text: COL.indigo,    bg: COL.indigoTint },
    en_atencion:                { text: COL.blueLight, bg: COL.blueTint   },
    no_asistio:                 { text: COL.red,       bg: COL.redTint    },
    incompleta:                 { text: COL.pink,      bg: COL.pinkTint   },
    recuperada:                 { text: COL.purple,    bg: COL.purpleTint },
    pendiente_reprogramacion:   { text: COL.amber,     bg: COL.amberTint  },
    cancelada:                  { text: COL.red,       bg: COL.redTint    },
    reagendada:                 { text: COL.purple,    bg: COL.purpleTint },
    're-agendada':              { text: COL.purple,    bg: COL.purpleTint },
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
  wsP.columns = [{ width: 4 }, { width: 24 }, { width: 24 }, { width: 22 }, { width: 22 }, { width: 20 }, { width: 4 }];
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
    ['🗓️  Periodo del informe:', rangoFechasTexto],
    ['🔍  Alcance del informe:', `${textoFiltro} · ${etiquetaPeriodo}`],
    ['🛡️  Tipo de acceso:', scopeLabel],
    ['📊  Total de registros:', `${allCitas.length} citas  ·  ${rawData.usuarios.length} usuarios`],
    ['📁  Hojas incluidas:', '10 hojas: KPIs · Comparativo · Tendencia · Horarios · Estados · Citas · Practicantes · Personal · Gráficas'],
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
    ['2', '📊 Resumen',                   'KPIs globales, tasas y volumen operativo'],
    ['3', '🔀 Análisis Comparativo',      'Nutrición vs Fisioterapia en paralelo'],
    ['4', '📈 Tendencia Semanal',         'Flujo de consultas por día de la semana'],
    ['5', '⏰ Franjas Horarias',          'Top de horarios con mayor demanda y visualización'],
    ['6', '🔵 Distribución de Estados',  'Completadas / Canceladas / Programadas / Re-agendadas'],
    ['7', '📁 Bitácora de Citas',        'Registro completo con filtros automáticos'],
    ['8', '🎓 Rendimiento Practicantes', 'Efectividad, ranking, calificación A-D por alumno'],
    ['9', '👥 Directorio Personal',      'Directorio ordenado por rol con datos completos'],
    ['10', '📊 Gráficas',                'Imágenes de las gráficas del panel: Tendencia, Distribución, Resumen General y Flujo'],
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
  const wsK = workbook.addWorksheet('📊 Resumen', { views: [{ showGridLines: false }] });
  wsK.columns = [{ width: 4 }, { width: 42 }, { width: 16 }, { width: 16 }, { width: 4 }];
  wsK.getRow(2).height = 34;
  wsK.mergeCells('B2:D2');
  hCell(wsK.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsK.getCell('B2').value = `RESUMEN  ·  ${textoFiltro}`;
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
    [`Nuevos Expedientes (${etiquetaPeriodo})`, stats.pacientesNuevosPeriodo, '—',                                          COL.amber   ],
    ['Duración Promedio de Consulta',       `${stats.tiempoPromedioConsulta} min`, '—',                                    COL.blueLight],
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
    const dateObj = parseFechaLocal(c.fecha || c.date);
    const dayIdx = dateObj ? getDay(dateObj) : NaN;

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
  wsH.columns = [{ width: 4 }, { width: 8 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 36 }, { width: 4 }];
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
  wsE.columns = [{ width: 4 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 46 }, { width: 4 }];
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
    { width: 8 }, { width: 13 }, { width: 8 }, { width: 32 }, { width: 16 },
    { width: 30 }, { width: 30 }, { width: 16 }, { width: 12 },
  ];
  wsCitas.getRow(1).height = 20;
  ['ID', 'FECHA', 'HORA', 'PACIENTE', 'ÁREA', 'PRACTICANTE', 'DOCENTE / SUPERVISOR', 'ESTADO', 'CONSULTA #'].forEach((h, i) => {
    hCell(wsCitas.getRow(1).getCell(i + 1), COL.blueUTC);
    wsCitas.getRow(1).getCell(i + 1).value = h;
  });

  // La Bitácora siempre incluye ambas áreas (Nutrición y Fisioterapia) dentro
  // del periodo seleccionado — es el registro completo del rango de fechas,
  // no se acota también por el filtro de área como el resto del informe.
  const bitacoraNut   = citasBitacora.filter((c: any) => getArea(c) === 'nutricion').length;
  const bitacoraFisio = citasBitacora.filter((c: any) => getArea(c) === 'fisioterapia').length;

  citasBitacora.forEach((cita: any, i: number) => {
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

  const citasTR = citasBitacora.length + 2;
  wsCitas.getRow(citasTR).height = 18;
  [`TOTAL: ${citasBitacora.length} registros`, '', '', '', `NUT: ${bitacoraNut}  ·  FISIO: ${bitacoraFisio}`, '', '', '', ''].forEach((v, ci) => {
    const cell = wsCitas.getRow(citasTR).getCell(ci + 1);
    cell.value = v; cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COL.white } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.blueUTC } };
    cell.border = bd(COL.white); cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  wsCitas.autoFilter = { from: { row: 1, column: 1 }, to: { row: citasBitacora.length + 1, column: 9 } };

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
    { width: 10 }, { width: 32 }, { width: 34 }, { width: 16 },
    { width: 16 }, { width: 14 }, { width: 16 }, { width: 28 },
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

  // ═══════════════════════════════════════════════════════════════════════════
  // HOJA 10 — GRÁFICAS (capturas de las gráficas ya renderizadas en el panel;
  // ExcelJS no soporta gráficos nativos editables, así que se incrusta una
  // imagen tal como el usuario la ve en pantalla al momento de exportar)
  // ═══════════════════════════════════════════════════════════════════════════
  const wsGraf = workbook.addWorksheet('📊 Gráficas', { views: [{ showGridLines: false }] });
  wsGraf.columns = [{ width: 4 }, ...Array(10).fill({ width: 9 })];
  wsGraf.getRow(2).height = 34;
  wsGraf.mergeCells('B2:K2');
  hCell(wsGraf.getCell('B2'), COL.blueUTC, COL.white, 13);
  wsGraf.getCell('B2').value = 'GRÁFICAS DEL PANEL';
  wsGraf.getRow(3).height = 16;
  wsGraf.mergeCells('B3:K3');
  wsGraf.getCell('B3').value = 'Capturas de las gráficas mostradas en pantalla al momento de exportar — no son gráficos editables de Excel.';
  wsGraf.getCell('B3').font = { name: 'Arial', size: 9, italic: true, color: { argb: COL.mutedText } };
  wsGraf.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };

  const seccionesGraficas: [string, string | null][] = [
    ['Tendencia Semanal — flujo de consultas por día', chartImages.tendencia],
    ['Distribución de Estados — composición del total de citas', chartImages.distribucion],
    ['Resumen General de Estados', chartImages.resumen],
    ['Flujo de Consultas Semanal', chartImages.flujo],
  ];

  let filaGraficas = 5;
  seccionesGraficas.forEach(([titulo, base64]) => {
    wsGraf.getRow(filaGraficas).height = 20;
    wsGraf.mergeCells(`B${filaGraficas}:K${filaGraficas}`);
    hCell(wsGraf.getCell(`B${filaGraficas}`), COL.headerRow, COL.darkText, 10);
    wsGraf.getCell(`B${filaGraficas}`).value = titulo;
    filaGraficas += 1;

    if (base64) {
      const imageId = workbook.addImage({ base64, extension: 'png' });
      wsGraf.addImage(imageId, {
        tl: { col: 1, row: filaGraficas - 1 },
        ext: { width: 640, height: 300 },
      });
      filaGraficas += 17;
    } else {
      wsGraf.getCell(`B${filaGraficas}`).value = 'No se pudo capturar esta gráfica al momento de exportar.';
      wsGraf.getCell(`B${filaGraficas}`).font = { name: 'Arial', size: 9, italic: true, color: { argb: COL.mutedText } };
      filaGraficas += 2;
    }
    filaGraficas += 1;
  });

  // ── Generar y descargar archivo ───────────────────────────────────────────
  const hoyTag   = new Date();
  const dateTag  = `${String(hoyTag.getDate()).padStart(2, '0')}${String(hoyTag.getMonth() + 1).padStart(2, '0')}${hoyTag.getFullYear()}`;
  const fileName = `InformeClinico_UTC_${dateTag}.xlsx`;
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
  const [periodo, setPeriodo] = useState<Periodo>('ano');
  // Selección manual para los modos absolutos del selector de periodo.
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState<Trimestre>(() => {
    const hoy = new Date();
    return { anio: hoy.getFullYear(), q: (Math.floor(hoy.getMonth() / 3) + 1) as 1 | 2 | 3 | 4 };
  });
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(() => new Date().getFullYear());
  const [rangoSemana, setRangoSemana] = useState<{ desde: Date; hasta: Date }>(() => {
    const hoy = new Date();
    return { desde: startOfWeek(hoy, { weekStartsOn: 1 }), hasta: endOfWeek(hoy, { weekStartsOn: 1 }) };
  });
  const [rawData, setRawData] = useState<{ citas: Cita[], usuarios: Usuario[], historiales: any[] }>({ citas: [], usuarios: [], historiales: [] });
  const [eventos, setEventos] = useState<EventoMetrica[]>([]);
  // Copia de citas/eventos ya filtrados por área+periodo — el Excel exporta
  // desde aquí (no desde rawData/eventos crudos) para respetar el filtro activo.
  const [citasParaExportar, setCitasParaExportar] = useState<Cita[]>([]);
  const [eventosParaExportar, setEventosParaExportar] = useState<EventoMetrica[]>([]);
  const tendenciaRef = useRef<HTMLDivElement>(null);
  const distribucionRef = useRef<HTMLDivElement>(null);
  const resumenRef = useRef<HTMLDivElement>(null);
  const flujoRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Búsqueda por nombre o correo dentro del ranking "Citas Completadas por
  // Practicante" — solo filtra esa sección, no afecta al resto del panel.
  const [busquedaPracticante, setBusquedaPracticante] = useState('');

  const [stats, setStats] = useState<ExtendedStats>({
    totalCitas: 0,
    citasCompletadas: 0,
    citasCanceladas: 0,
    citasCanceladasLive: 0,
    citasProgramadas: 0,
    reagendadas: 0,
    noAsistio: 0,
    recuperadas: 0,
    enAtencion: 0,
    incompletasCount: 0,
    pendienteReprogramacion: 0,
    datosGrafica: [],
    horariosMasVisitados: [],
    tiempoPromedioConsulta: 0,
    tasaIncompletas: 0,
    pacientesNuevosPeriodo: 0,
    tasaAsignacionAutomatica: 0,
    asignacionesAutomaticas: 0,
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
        const [citas, historiales, eventosData, usuarios] = await Promise.all([
          citasAPI.getAll(),
          historialesAPI.getAll(),
          metricasAPI.getEventos(),
          usuariosAPI.getAll().catch(() => []),
        ]);
        setRawData({ citas, usuarios, historiales });
        setEventos(eventosData || []);
      } catch (error) {
        console.error('Error al descargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRawData();
  }, []);

  // Filtrado local — se ejecuta sin red al cambiar filtroArea o periodo
  useEffect(() => {
    if (rawData.citas.length === 0) return;

    const { desde, hasta } = rangoDePeriodo(periodo, mesSeleccionado, trimestreSeleccionado, anioSeleccionado, rangoSemana);

    const filteredCitas = rawData.citas.filter((item: Cita) => {
      if (filtroArea !== 'general' && (item.area || item.tipo)?.toLowerCase() !== filtroArea) return false;
      if (desde || hasta) {
        const fechaCita = parseFechaLocal(item.fecha || item.date);
        if (!fechaCita) return false;
        if (desde && fechaCita < desde) return false;
        if (hasta && fechaCita > hasta) return false;
      }
      return true;
    });

    // Cancelar borra la fila y reagendar no cambia el estado — se cuentan
    // desde los eventos reales de `metricas`, filtrados igual que las citas.
    const eventosFiltrados = eventos.filter((ev) => {
      if (filtroArea !== 'general' && (ev.area || '').toLowerCase() !== filtroArea) return false;
      if (desde || hasta) {
        const fechaEvento = parseFechaLocal(ev.fecha_registro);
        if (!fechaEvento) return false;
        if (desde && fechaEvento < desde) return false;
        if (hasta && fechaEvento > hasta) return false;
      }
      return true;
    });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dayData = dayNames.map((name) => ({ name, nutricion: 0, fisioterapia: 0 }));
    const timeCount: Record<string, number> = {};

    filteredCitas.forEach((apt: Cita) => {
      const dateObj = parseFechaLocal(apt.fecha || apt.date);
      const dayIdx = dateObj ? getDay(dateObj) : NaN;
      if (!isNaN(dayIdx) && dayIdx >= 0 && dayIdx <= 6) {
        const area = (apt.tipo || apt.area)?.toLowerCase();
        if (area === 'nutricion') dayData[dayIdx].nutricion++;
        if (area === 'fisioterapia') dayData[dayIdx].fisioterapia++;
      }
      const horaKey = (apt.hora || apt.time || '').substring(0, 5);
      if (horaKey) timeCount[horaKey] = (timeCount[horaKey] || 0) + 1;
    });

    const comp = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'completada').length;
    const prog = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'programada').length;
    const noAsistio = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'no_asistio').length;
    const recuperadas = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'recuperada').length;
    const enAtencion = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'en_atencion').length;
    const pendienteReprogramacion = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'pendiente_reprogramacion').length;
    // Canceladas: la vía real (auto-cancelación del paciente) conserva la fila
    // con estado='cancelada' — se cuenta igual que completadas/programadas.
    // Se suman los eventos de metricas para no perder el borrado físico
    // (DELETE), que sigue existiendo en el backend aunque hoy ninguna UI lo
    // dispare — así el número no se rompe si ese flujo vuelve a activarse.
    // `canceladaLive` (sin sumar eventos) es la que debe usar el pie de
    // Distribución de Estados, para que sus porciones sumen exactamente el
    // total de citas — las canceladas por borrado físico ya no son filas
    // de `filteredCitas` y no pueden formar parte de esa partición.
    const canceladaLive = filteredCitas.filter((c: Cita) => c.estado?.toLowerCase() === 'cancelada').length;
    const canc = canceladaLive + eventosFiltrados.filter((ev) => ev.tipo_evento === 'cita_cancelada').length;
    const reag = eventosFiltrados.filter((ev) => ev.tipo_evento === 'cita_reagendada').length;

    // Duración real de consulta (finalizada_en - iniciada_en), solo completadas.
    // Reemplaza al antiguo "tiempo de carga de formulario".
    const duraciones = filteredCitas
      .filter((c: Cita) => c.estado?.toLowerCase() === 'completada' && c.iniciada_en && c.finalizada_en)
      .map((c: Cita) => (new Date(c.finalizada_en as string).getTime() - new Date(c.iniciada_en as string).getTime()) / 60000)
      .filter((minutos) => Number.isFinite(minutos) && minutos >= 0);
    const tiempoPromedioConsulta = duraciones.length > 0
      ? Math.round(duraciones.reduce((sum, m) => sum + m, 0) / duraciones.length)
      : 0;

    // Tasa de consultas incompletas: de las que llegaron a iniciarse, cuántas
    // se cerraron por vencimiento del timer sin finalizar (estado 'incompleta').
    // Reemplaza a "Tasa de Abandono", que nunca existió en el backend.
    const universoConsulta = filteredCitas.filter((c: Cita) =>
      ['en_atencion', 'completada', 'incompleta', 'no_asistio'].includes(c.estado?.toLowerCase() || '')
    );
    const incompletas = universoConsulta.filter((c: Cita) => c.estado?.toLowerCase() === 'incompleta').length;
    const tasaIncompletas = universoConsulta.length > 0
      ? (incompletas / universoConsulta.length) * 100
      : 0;

    // Asignación automática: % de citas asignadas que NO requirieron fallback
    // a un docente. Reemplaza a "Respuesta Docente" (la asignación hoy es
    // 100% automática al crear la cita, no hay una espera de docente que medir).
    const citasAsignadas = filteredCitas.filter((c: Cita) => c.practicante_id);
    const conFallback = citasAsignadas.filter((c: Cita) => c.asignacion_fallback === true).length;
    const asignacionesAutomaticas = citasAsignadas.length - conFallback;
    const tasaAsignacionAutomatica = citasAsignadas.length > 0
      ? (asignacionesAutomaticas / citasAsignadas.length) * 100
      : 0;

    setStats({
      totalCitas:               filteredCitas.length,
      citasCompletadas:         comp,
      citasCanceladas:          canc,
      citasCanceladasLive:      canceladaLive,
      citasProgramadas:         prog,
      reagendadas:              reag,
      noAsistio,
      recuperadas,
      enAtencion,
      incompletasCount:         incompletas,
      pendienteReprogramacion,
      datosGrafica:             dayData,
      horariosMasVisitados:     Object.entries(timeCount)
        .map(([horario, count]) => ({ horario, cantidad: count }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5),
      tiempoPromedioConsulta,
      tasaIncompletas,
      // Cuenta cuentas de `usuarios` con rol='paciente' dadas de alta en el
      // rango activo (desde/hasta) — antes contaba filas de
      // `historiales_medicos`, una tabla que en la práctica queda vacía (solo
      // se escribe ahí para tipos de historial que no son nutrición/
      // fisioterapia), por lo que el conteo real de altas de pacientes nunca
      // aparecía.
      pacientesNuevosPeriodo: rawData.usuarios.filter((u: Usuario) => {
        if (u.rol !== 'paciente' || !u.fecha_creacion) return false;
        const fecha = parseISO(u.fecha_creacion);
        if (desde && fecha < desde) return false;
        if (hasta && fecha > hasta) return false;
        return true;
      }).length,
      tasaAsignacionAutomatica,
      asignacionesAutomaticas,
    });
    setCitasParaExportar(filteredCitas);
    setEventosParaExportar(eventosFiltrados);
  }, [filtroArea, periodo, mesSeleccionado, trimestreSeleccionado, anioSeleccionado, rangoSemana, rawData, eventos]);

  // Rendimiento por practicante — misma fuente que antes vivía solo dentro
  // de exportToExcel (Hoja 8), ahora calculada una única vez aquí y
  // compartida entre el panel en pantalla ("Citas Completadas por
  // Practicante") y la exportación a Excel, para que nunca puedan mostrar
  // números distintos. Ya parte de citasParaExportar/eventosParaExportar
  // (ya filtrados por área+periodo), así que no duplica esa lógica.
  const pracPerf = useMemo(() => {
    const practicantes = rawData.usuarios.filter((u: Usuario) => u.rol === 'practicante');
    const byStatus = (arr: Cita[], s: string) => arr.filter((c) => (c.estado || '').toLowerCase() === s.toLowerCase()).length;

    return practicantes.map((p: Usuario) => {
      const sc = citasParaExportar.filter((c: Cita) => String(c.practicante_id) === String(p.id));
      const comp = byStatus(sc, 'completada');
      const canc = byStatus(sc, 'cancelada')
        + eventosParaExportar.filter((e) => e.tipo_evento === 'cita_cancelada' && String(e.practicante_id) === String(p.id)).length;
      const prog = byStatus(sc, 'programada');
      const incompletas = byStatus(sc, 'incompleta');
      const tot = sc.length;
      const eff = tot > 0 ? (comp / tot) * 100 : 0;
      const grade = tot === 0 ? 'N/A' : (eff >= 90 ? 'A' : eff >= 75 ? 'B' : eff >= 60 ? 'C' : 'D');
      return { ...p, tot, comp, canc, prog, incompletas, eff, grade };
    }).sort((a, b) => b.eff - a.eff);
  }, [rawData.usuarios, citasParaExportar, eventosParaExportar]);

  // Ranking en pantalla: solo "atendió" = citas completadas (comp), agrupado
  // por área cuando el filtro está en "general" (Nutrición y Fisioterapia
  // por separado) o una sola lista cuando ya hay un área específica
  // seleccionada — respeta filtroArea, no agrega ningún filtro nuevo.
  // Orden: mayor a menor completadas; empate, alfabético por nombre.
  const rankingPracticantes = useMemo(() => {
    const ordenar = (lista: typeof pracPerf) =>
      [...lista].sort((a, b) => b.comp - a.comp || a.nombre.localeCompare(b.nombre, 'es'))
        .map((p) => ({ id: p.id, nombre: p.nombre, email: p.email || '', completadas: p.comp, incompletas: p.incompletas }));

    const porArea = (a: 'nutricion' | 'fisioterapia') =>
      ordenar(pracPerf.filter((p) => (p.area || '').toLowerCase() === a));

    if (isGeneralView) {
      return { nutricion: porArea('nutricion'), fisioterapia: porArea('fisioterapia') };
    }
    return { nutricion: filtroArea === 'nutricion' ? porArea('nutricion') : [], fisioterapia: filtroArea === 'fisioterapia' ? porArea('fisioterapia') : [] };
  }, [pracPerf, filtroArea, isGeneralView]);

  // La mayoría son valores mutuamente excluyentes de `citas.estado`; a
  // pedido se incluye también "Re-agendadas", que no es un estado (es un
  // conteo de eventos de `metricas`, una misma cita puede reagendarse varias
  // veces) — por eso, y porque "En Atención"/"Sin Practicante" se excluyen
  // a propósito, la suma del pie no tiene por qué coincidir con
  // `stats.totalCitas`.
  // Mismas 5 categorías (y mismos colores) que la tarjetas de "Estado de las
  // Citas" — partición real y excluyente de `citas.estado`, suman el 100%
  // de stats.totalCitas. Recuperadas/Re-agendadas quedan fuera a propósito:
  // son "Indicadores de Proceso", no estados.
  const pieData = [
    { name: 'Completadas',   value: stats.citasCompletadas,       color: '#16a34a' },
    { name: 'Programadas',   value: stats.citasProgramadas,       color: '#d97706' },
    { name: 'No Asistió',    value: stats.noAsistio,              color: '#6b7280' },
    { name: 'Incompletas',   value: stats.incompletasCount,       color: '#FEB2E6' },
    { name: 'Canceladas',    value: stats.citasCanceladasLive,    color: '#dc2626' },
  ];

  // Etiqueta legible del periodo activo, para las descripciones de las cajas.
  const etiquetaPeriodo = (() => {
    switch (periodo) {
      case 'semana': {
        const fmt = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        return `del ${fmt(rangoSemana.desde)} al ${fmt(rangoSemana.hasta)}`;
      }
      case 'mes': {
        const [y, m] = mesSeleccionado.split('-').map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      }
      case 'trimestre': return `T${trimestreSeleccionado.q} ${trimestreSeleccionado.anio}`;
      case 'ano': return String(anioSeleccionado);
    }
  })();

  // Mismo set de estados que las tarjetas KPI superiores, mismos colores —
  // esta gráfica de barras responde a los mismos filtros de área/periodo
  // que el resto del panel (viene de `stats`, ya filtrado).
  // Mismo criterio que pieData: solo estados reales de la cita (partición
  // excluyente que suma stats.totalCitas), no eventos/tasas de proceso.
  const barData = [
    { name: 'Completadas', value: stats.citasCompletadas,      color: '#16a34a' },
    { name: 'Programadas', value: stats.citasProgramadas,      color: '#d97706' },
    { name: 'No Asistió',  value: stats.noAsistio,             color: '#6b7280' },
    { name: 'Incompletas', value: stats.incompletasCount,      color: '#FEB2E6' },
    { name: 'Canceladas',  value: stats.citasCanceladasLive,   color: '#dc2626' },
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
    <div style={{ background: '#ffffff', borderRadius: 24, minHeight: '100vh', padding: '28px 24px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '90%', margin: '0 auto' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 4 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Inteligencia Clínica</h1>
            <p style={{ color: C.faint, fontSize: 12, marginTop: 3 }}>Panel de métricas operativas · Actualización en tiempo real</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {([['semana', 'Rango'], ['mes', 'Mes'], ['trimestre', 'Trimestre'], ['ano', 'Año']] as [Periodo, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriodo(value)}
                  className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${periodo === value ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {periodo === 'semana' && (
              <WeekFilterPicker
                desde={rangoSemana.desde}
                hasta={rangoSemana.hasta}
                onChange={(desde, hasta) => setRangoSemana({ desde, hasta })}
                theme="blue"
              />
            )}
            {periodo === 'mes' && (
              <MonthFilterPicker selectedMonth={mesSeleccionado} onChange={setMesSeleccionado} theme="blue" />
            )}
            {periodo === 'trimestre' && (
              <SimpleStepper
                label={`T${trimestreSeleccionado.q} ${trimestreSeleccionado.anio}`}
                onPrev={() => setTrimestreSeleccionado((prev) =>
                  prev.q === 1 ? { anio: prev.anio - 1, q: 4 } : { anio: prev.anio, q: (prev.q - 1) as 1 | 2 | 3 | 4 }
                )}
                onNext={() => setTrimestreSeleccionado((prev) =>
                  prev.q === 4 ? { anio: prev.anio + 1, q: 1 } : { anio: prev.anio, q: (prev.q + 1) as 1 | 2 | 3 | 4 }
                )}
              />
            )}
            {periodo === 'ano' && (
              <SimpleStepper
                label={String(anioSeleccionado)}
                onPrev={() => setAnioSeleccionado((a) => a - 1)}
                onNext={() => setAnioSeleccionado((a) => a + 1)}
              />
            )}

            {esMaster && (
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                <button onClick={() => setFiltroArea('general')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${isGeneralView ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Todo</button>
                <button onClick={() => setFiltroArea('nutricion')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filtroArea === 'nutricion' ? 'bg-orange-100 text-orange-700 shadow-sm border border-orange-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Nutrición</button>
                <button onClick={() => setFiltroArea('fisioterapia')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filtroArea === 'fisioterapia' ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Fisioterapia</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Grupo 1: Estado de las Citas — partición del total, suma 100% ── */}
        <GroupHeader
          eyebrow="Resultado Final de las Citas"
          description="Cada cita se contabiliza una única vez según su estado final."
          color={C.accent.green.top}
          emphasize
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Calendar}     label="Total Citas"    value={stats.totalCitas}           accent="slate"  tag="GENERAL"    caption="Total de citas registradas en el período seleccionado." />
          <StatCard icon={CheckCircle}  label="Completadas"    value={stats.citasCompletadas}     accent="green"  tag="COMPLETADO" pct={pctOf(stats.citasCompletadas, stats.totalCitas)} caption="Citas que finalizaron correctamente." />
          <StatCard icon={Calendar}     label="Programadas"    value={stats.citasProgramadas}     accent="amber"  tag="ACTIVO"     pct={pctOf(stats.citasProgramadas, stats.totalCitas)} caption="Citas pendientes de ser atendidas." />
          <StatCard icon={UserX}        label="No Asistió"     value={stats.noAsistio}            accent="gray"   tag="INASISTENCIA" pct={pctOf(stats.noAsistio, stats.totalCitas)} caption="Citas en las que el paciente no acudió." />
          <StatCard icon={AlertTriangle}label="Incompletas"    value={stats.incompletasCount}     accent="pink"   tag="PROCESO"    pct={pctOf(stats.incompletasCount, stats.totalCitas)} caption="Consultas iniciadas que no fueron finalizadas correctamente." />
          <StatCard icon={XCircle}      label="Canceladas"     value={stats.citasCanceladasLive}  accent="red"    tag="ALERTA"     pct={pctOf(stats.citasCanceladasLive, stats.totalCitas)} caption="Citas canceladas antes de concluir la atención." />
        </div>

        {/* ── Grupo 2: Indicadores de Proceso — eventos y tasas, no se suman al total ── */}
        <GroupHeader
          eyebrow="Indicadores del Proceso"
          description="Muestran información sobre el desarrollo de la atención de las citas. Una misma cita puede contribuir a varios indicadores."
          color="#1883FF"
          emphasize
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={CalendarClock} label="Re-agendadas"     value={stats.reagendadas} accent="teal" tag="EVENTO" pct={pctOf(stats.reagendadas, stats.totalCitas)} caption="Citas que fueron reagendadas. (Una misma cita puede contabilizarse más de una vez)." />
          <StatCard icon={RotateCcw}     label="Recuperadas"      value={stats.recuperadas} accent="sky"  tag="EVENTO" pct={pctOf(stats.recuperadas, stats.totalCitas)} caption="Citas recuperadas que no se completaron a tiempo." />
          <StatCard icon={Users2}        label="Nuevos Registros (Pacientes)" value={stats.pacientesNuevosPeriodo} accent="green" tag="CRECIMIENTO" unit="pacientes" caption={`Pacientes registrados en el período seleccionado (${etiquetaPeriodo}).`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard
            icon={Clock}
            label="Duración Promedio de Consulta"
            value={stats.tiempoPromedioConsulta}
            unit="min"
            sub="Tiempo promedio desde el inicio hasta la finalización de la consulta."
            bar={(stats.tiempoPromedioConsulta / 60) * 100}
            accent="indigo"
            tag="EFICIENCIA"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Consultas Incompletas"
            value={stats.tasaIncompletas}
            unit="%"
            count={stats.incompletasCount}
            sub="Porcentaje de consultas iniciadas que no fueron concluidas."
            bar={stats.tasaIncompletas}
            accent="pink"
            tag="PROCESOS"
          />
          {esMaster ? (
            <KpiCard
              icon={Zap}
              label="Asignación Automática"
              value={stats.tasaAsignacionAutomatica}
              unit="%"
              count={stats.asignacionesAutomaticas}
              sub="Citas asignadas automáticamente sin intervención manual."
              bar={stats.tasaAsignacionAutomatica}
              accent="amber"
              tag="MASTER"
            />
          ) : (
            <KpiCard
              icon={TrendingUp}
              label="Nuevos Expedientes"
              value={stats.pacientesNuevosPeriodo}
              sub={`Pacientes registrados en el período seleccionado (${etiquetaPeriodo}).`}
              bar={85}
              accent="green"
              tag="CRECIMIENTO"
            />
          )}
        </div>

        {/* ── Gráficas: Línea + Pastel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SectionCard title="Tendencia Semanal" description="Flujo de consultas por día" icon={TrendingUp} accentColor={C.accent.indigo.top}>
            <div ref={tendenciaRef} style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.datosGrafica} margin={{ top: 5, right: 70, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e9edf2" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: C.muted }} />
                  {isNutritionView && (
                    <Line type="monotone" dataKey="nutricion" name="Nutrición"
                      stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 3 }} activeDot={{ r: 5 }} animationDuration={1500}
                      label={renderPuntoLabel('#d97706', 'Nutrición', stats.datosGrafica.length)} />
                  )}
                  {isFisioterapiaView && (
                    <Line type="monotone" dataKey="fisioterapia" name="Fisioterapia"
                      stroke={C.accent.indigo.top} strokeWidth={2.5} dot={{ fill: C.accent.indigo.top, r: 3 }} activeDot={{ r: 5 }} animationDuration={1500}
                      label={renderPuntoLabel(C.accent.indigo.top, 'Fisioterapia', stats.datosGrafica.length)} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Distribución de Estados" description="Composición total de citas" icon={BarChart3} accentColor={C.accent.purple.top}>
            <div ref={distribucionRef} style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
  <Pie
    data={pieData}
    cx="50%" cy="50%"
    outerRadius={100} innerRadius={56}
    dataKey="value"
    animationDuration={1200}
    label={({ name, value, percent }: any) => value > 0 ? `${name}: ${value} (${Math.round(percent * 100)}%)` : null}
    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
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

        {/* ── Resumen de todos los estados (respeta filtro de área y periodo) ── */}
        <SectionCard
          title="Resumen General de Estados"
          description={`Todas las citas por estado · ${etiquetaPeriodo} · ${isGeneralView ? 'todas las áreas' : filtroArea}`}
          icon={BarChart3}
          accentColor={C.accent.slate.top}
        >
          <div ref={resumenRef} style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e9edf2" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: C.faint, fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={900} maxBarSize={64}>
                  {barData.map((entry, i) => (
                    <Cell key={`bar-cell-${i}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 700, fill: C.text }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* ── Gráfica de Área ── */}
        <SectionCard
          title="Flujo de Consultas Semanal"
          description={isGeneralView ? 'Comparativa Nutrición vs Fisioterapia' : `Rendimiento: ${filtroArea}`}

          icon={Activity}
          accentColor={C.accent.teal.top}
        >
          <div ref={flujoRef} style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={stats.datosGrafica} margin={{ top: 10, right: 70, left: -10, bottom: 0 }}>
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
                    stroke="#d97706" strokeWidth={2.5} fill="url(#areaNut)" animationDuration={1500}
                    label={renderPuntoLabel('#d97706', 'Nutrición', stats.datosGrafica.length)} />
                )}
                {isFisioterapiaView && (
                  <Area type="monotone" dataKey="fisioterapia" name="Fisioterapia"
                    stroke={C.accent.indigo.top} strokeWidth={2.5} fill="url(#areaFisio)" animationDuration={1500}
                    label={renderPuntoLabel(C.accent.indigo.top, 'Fisioterapia', stats.datosGrafica.length)} />
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

        {/* ── Citas Completadas por Practicante — solo admin/master ── */}
        {(user?.rol === 'admin' || user?.rol === 'master') && (() => {
          const q = busquedaPracticante.trim().toLowerCase();
          const filtrar = (lista: typeof rankingPracticantes.nutricion) =>
            q === '' ? lista : lista.filter((p) => p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
          const nutricionFiltrado = filtrar(rankingPracticantes.nutricion);
          const fisioterapiaFiltrado = filtrar(rankingPracticantes.fisioterapia);

          return (
            <SectionCard
              title="Citas Completadas por Practicante"
              description={`Ranking del período activo (${etiquetaPeriodo}) — solo consultas que finalizaron como completada.`}
              icon={CheckCircle}
              accentColor={C.accent.green.top}
            >
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={busquedaPracticante}
                  onChange={(e) => setBusquedaPracticante(e.target.value)}
                  className="pl-9 h-10.75 rounded-xl border-blue-200 text-blue-900 font-medium w-full"
                />
              </div>
              {isGeneralView ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <RankingPracticantes titulo="Nutrición" datos={nutricionFiltrado} color={C.accent.amber.top} hayBusqueda={q !== ''} />
                  <RankingPracticantes titulo="Fisioterapia" datos={fisioterapiaFiltrado} color={C.accent.indigo.top} hayBusqueda={q !== ''} />
                </div>
              ) : (
                <RankingPracticantes
                  titulo={filtroArea === 'nutricion' ? 'Nutrición' : 'Fisioterapia'}
                  datos={filtroArea === 'nutricion' ? nutricionFiltrado : fisioterapiaFiltrado}
                  color={filtroArea === 'nutricion' ? C.accent.amber.top : C.accent.indigo.top}
                  hayBusqueda={q !== ''}
                />
              )}
            </SectionCard>
          );
        })()}

        {/* ── Botón Exportar Excel ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
         <button
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              try {
                const [imgTendencia, imgDistribucion, imgResumen, imgFlujo] = await Promise.all([
                  capturarGraficaComoPng(tendenciaRef),
                  capturarGraficaComoPng(distribucionRef),
                  capturarGraficaComoPng(resumenRef),
                  capturarGraficaComoPng(flujoRef),
                ]);

                // Rango exacto de fechas del periodo activo, para que el
                // documento diga "de cuándo a cuándo es" y no solo cuándo
                // se generó.
                const { desde, hasta } = rangoDePeriodo(periodo, mesSeleccionado, trimestreSeleccionado, anioSeleccionado, rangoSemana);
                const formatoFecha = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const rangoFechasTexto = desde && hasta
                  ? `Del ${formatoFecha(desde)} al ${formatoFecha(hasta)}`
                  : desde
                    ? `Del ${formatoFecha(desde)} a la fecha actual`
                    : 'Histórico completo (sin límite de fecha)';

                // La Bitácora de Citas siempre lleva ambas áreas dentro del
                // periodo seleccionado, sin acotar también por el filtro de área.
                const citasBitacora = rawData.citas.filter((c: Cita) => {
                  if (!desde && !hasta) return true;
                  const f = parseFechaLocal(c.fecha || c.date);
                  if (!f) return false;
                  if (desde && f < desde) return false;
                  if (hasta && f > hasta) return false;
                  return true;
                });

                await exportToExcel(
                  stats,
                  { citas: citasParaExportar, usuarios: rawData.usuarios, historiales: rawData.historiales },
                  eventosParaExportar,
                  filtroArea,
                  esMaster,
                  etiquetaPeriodo,
                  rangoFechasTexto,
                  citasBitacora,
                  { tendencia: imgTendencia, distribucion: imgDistribucion, resumen: imgResumen, flujo: imgFlujo },
                  pracPerf
                );
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