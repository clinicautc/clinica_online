/**
 * ============================================================================
 * ARCHIVO: DateFilterPicker.tsx
 * PROPÓSITO: Botón grande con ícono de calendario que despliega el widget de
 * selección de fecha (ui/calendar.tsx) para filtrar las citas agendadas por día.
 * NOTA: el overlay y el panel se portalean a document.body para que su z-index
 * no quede atrapado dentro del stacking context de <main> (que usa z-0) y así
 * siempre queden por encima del header de cada dashboard.
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateFilterPickerProps {
  selectedDate: string; // formato 'yyyy-MM-dd'
  onChange: (date: string) => void;
  theme?: 'blue' | 'orange';
}

const THEME_CLASSES = {
  blue: 'border-blue-200 text-blue-900 hover:bg-blue-50',
  orange: 'border-orange-200 text-orange-900 hover:bg-orange-50',
};

export default function DateFilterPicker({ selectedDate, onChange, theme = 'blue' }: DateFilterPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={handleToggle}
        className={`h-11 px-4 rounded-xl font-bold flex items-center gap-3 ${THEME_CLASSES[theme]}`}
      >
        <CalendarDays className="w-6 h-6" />
        {format(new Date(selectedDate + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
      </Button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl"
            style={{ top: panelPosition.top, right: panelPosition.right }}
          >
            <Calendar
              mode="single"
              locale={es}
              selected={new Date(selectedDate + 'T00:00:00')}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, 'yyyy-MM-dd'));
                  setIsOpen(false);
                }
              }}
              className="rounded-md"
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
