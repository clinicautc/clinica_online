/**
 * ============================================================================
 * ARCHIVO: MonthFilterPicker.tsx
 * PROPÓSITO: Navegador de mes (‹ Junio 2026 ›) usado por el modo "Mes" del
 * filtro de Citas Agendadas en los dashboards de admin/master.
 * ============================================================================
 */

import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthFilterPickerProps {
  selectedMonth: string; // formato 'yyyy-MM'
  onChange: (month: string) => void;
  theme?: 'blue' | 'orange';
}

const THEME_CLASSES = {
  blue: 'border-blue-200 text-blue-900',
  orange: 'border-orange-200 text-orange-900',
};

export default function MonthFilterPicker({ selectedMonth, onChange, theme = 'blue' }: MonthFilterPickerProps) {
  const currentDate = parse(selectedMonth, 'yyyy-MM', new Date());

  const goToMonth = (delta: number) => {
    const newDate = delta > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    onChange(format(newDate, 'yyyy-MM'));
  };

  return (
    <div className={`h-11 pl-1 pr-3 rounded-xl font-bold flex items-center gap-1 border bg-white ${THEME_CLASSES[theme]}`}>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => goToMonth(-1)}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="px-1 capitalize min-w-[130px] text-center">
        {format(currentDate, 'MMMM yyyy', { locale: es })}
      </span>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => goToMonth(1)}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
