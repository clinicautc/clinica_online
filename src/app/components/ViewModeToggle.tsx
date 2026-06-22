/**
 * ============================================================================
 * ARCHIVO: ViewModeToggle.tsx
 * PROPÓSITO: Conmutador "Día / Mes" para el filtro de Citas Agendadas en los
 * dashboards de admin/master (qué tan amplio es el rango de fechas mostrado).
 * ============================================================================
 */

interface ViewModeToggleProps {
  mode: 'day' | 'month';
  onChange: (mode: 'day' | 'month') => void;
  theme?: 'blue' | 'orange';
}

const ACTIVE_CLASSES = {
  blue: 'bg-blue-900 text-white',
  orange: 'bg-orange-600 text-white',
};

export default function ViewModeToggle({ mode, onChange, theme = 'blue' }: ViewModeToggleProps) {
  return (
    <div className="h-11 flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange('day')}
        className={`px-3 h-full rounded-lg text-xs font-bold transition-colors ${mode === 'day' ? ACTIVE_CLASSES[theme] : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Día
      </button>
      <button
        type="button"
        onClick={() => onChange('month')}
        className={`px-3 h-full rounded-lg text-xs font-bold transition-colors ${mode === 'month' ? ACTIVE_CLASSES[theme] : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Mes
      </button>
    </div>
  );
}
