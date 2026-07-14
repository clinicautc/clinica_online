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

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateFilterPickerProps {
  selectedDate: string; // formato 'yyyy-MM-dd'
  onChange: (date: string) => void;
  theme?: 'blue' | 'orange';
  onPrev?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
}

const THEME_CLASSES = {
  blue:   { border: 'border-blue-200 text-blue-900', hover: 'hover:bg-blue-50' },
  orange: { border: 'border-orange-200 text-orange-900', hover: 'hover:bg-orange-50' },
};

export default function DateFilterPicker({ selectedDate, onChange, theme = 'blue', onPrev, onNext, disableNext = false }: DateFilterPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<React.CSSProperties>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const computePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const PANEL_W = 300;
    const PANEL_H = 330;
    // Si el trigger está muy a la izquierda, un `right` basado solo en el borde
    // derecho del trigger empuja el panel fuera de la pantalla por la izquierda.
    // Se acota para que el borde izquierdo del panel nunca quede a menos de 8px.
    const right = Math.min(window.innerWidth - rect.right, window.innerWidth - PANEL_W - 8);
    if (window.innerHeight - rect.bottom >= PANEL_H + 8) {
      setPanelPosition({ top: rect.bottom + 8, right });
    } else {
      setPanelPosition({ bottom: window.innerHeight - rect.top + 8, right });
    }
  };

  const handleToggle = () => {
    if (!isOpen) computePosition();
    setIsOpen(prev => !prev);
  };

  // Recalcula la posición del panel si el usuario rota el dispositivo o
  // redimensiona la ventana mientras está abierto (si no, el panel queda
  // flotando en la posición vieja, potencialmente fuera de pantalla).
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', computePosition);
    window.addEventListener('orientationchange', computePosition);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('orientationchange', computePosition);
    };
  }, [isOpen]);

  const tc = THEME_CLASSES[theme];
  const withArrows = onPrev !== undefined && onNext !== undefined;

  return (
    <div className="relative" ref={triggerRef}>
      {withArrows ? (
        // Con flechas: todo dentro del mismo recuadro
        <div className={`h-11.75 pl-1.5 pr-1.5 rounded-xl font-bold flex items-center gap-1.5 border bg-white text-base ${tc.border}`}>
          <Button type="button" variant="ghost" size="icon" className="h-8.75 w-8.75" onClick={onPrev}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <button
            type="button"
            onClick={handleToggle}
            className={`px-2 flex items-center gap-2 rounded-lg py-1 transition-colors ${tc.hover}`}
          >
            <CalendarDays className="w-5 h-5" />
            <span>{format(new Date(selectedDate + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}</span>
          </button>
          <Button type="button" variant="ghost" size="icon" className={`h-8.75 w-8.75 ${disableNext ? 'opacity-30 cursor-not-allowed' : ''}`} onClick={disableNext ? undefined : onNext} disabled={disableNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        // Sin flechas: botón simple original
        <Button
          type="button"
          variant="outline"
          onClick={handleToggle}
          className={`h-11.75 px-5 rounded-xl font-bold flex items-center gap-3 text-base ${tc.border} ${tc.hover}`}
        >
          <CalendarDays className="w-7 h-7" />
          {format(new Date(selectedDate + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
        </Button>
      )}

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl"
            style={panelPosition}
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
              disabled={disableNext ? { after: new Date() } : undefined}
              className="rounded-md"
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
