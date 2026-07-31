/**
 * ============================================================================
 * ARCHIVO: WeekFilterPicker.tsx
 * PROPÓSITO: Selector de rango de fechas para el modo "Rango" del filtro de
 * Métricas (StatisticsPanel). Las flechas mueven el rango 7 días hacia
 * adelante/atrás (permite recorrer cualquier semana de cualquier mes); el
 * texto central es clickeable y abre un calendario en modo rango para elegir
 * un día de inicio y un día de fin arbitrarios (no atado a semanas de 7 días).
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isSameMonth, isSameYear } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

interface WeekFilterPickerProps {
  desde: Date;
  hasta: Date;
  onChange: (desde: Date, hasta: Date) => void;
  theme?: 'blue' | 'orange';
}

const THEME_CLASSES = {
  blue:   { wrapper: 'border-blue-200 text-blue-900', hover: 'hover:bg-blue-50' },
  orange: { wrapper: 'border-orange-200 text-orange-900', hover: 'hover:bg-orange-50' },
};

function formatRango(desde: Date, hasta: Date): string {
  if (isSameMonth(desde, hasta) && isSameYear(desde, hasta)) {
    return `${format(desde, 'd')} – ${format(hasta, "d 'de' MMMM, yyyy", { locale: es })}`;
  }
  if (isSameYear(desde, hasta)) {
    return `${format(desde, 'd MMM', { locale: es })} – ${format(hasta, 'd MMM yyyy', { locale: es })}`;
  }
  return `${format(desde, 'd MMM yyyy', { locale: es })} – ${format(hasta, 'd MMM yyyy', { locale: es })}`;
}

export default function WeekFilterPicker({ desde, hasta, onChange, theme = 'blue' }: WeekFilterPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<React.CSSProperties>({ top: 0, left: 0 });
  const [rangoTemporal, setRangoTemporal] = useState<DateRange | undefined>({ from: desde, to: hasta });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setRangoTemporal({ from: desde, to: hasta });
  }, [desde, hasta]);

  const computePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const PANEL_W = 300;
    const PANEL_H = 340;
    const left = Math.min(rect.left, window.innerWidth - PANEL_W - 8);
    const top = window.innerHeight - rect.bottom >= PANEL_H + 8
      ? rect.bottom + 8
      : rect.top - PANEL_H - 8;
    setPanelPosition({ top, left });
  };

  const handleOpenPicker = () => {
    if (!isOpen) computePosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', computePosition);
    window.addEventListener('orientationchange', computePosition);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('orientationchange', computePosition);
    };
  }, [isOpen]);

  const handleSelectRango = (range: DateRange | undefined) => {
    setRangoTemporal(range);
    if (range?.from && range?.to) {
      onChange(range.from, range.to);
      setIsOpen(false);
    }
  };

  const tc = THEME_CLASSES[theme];

  return (
    <div className="relative">
      <div className={`h-11.75 pl-1.5 pr-1.5 rounded-xl font-bold flex items-center gap-1.5 border bg-white text-base ${tc.wrapper}`}>
        <Button type="button" variant="ghost" size="icon" className="h-8.75 w-8.75" onClick={() => onChange(subDays(desde, 7), subDays(hasta, 7))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpenPicker}
          className={`px-2 capitalize text-center rounded-lg py-1 transition-colors whitespace-nowrap ${tc.hover}`}
        >
          {formatRango(desde, hasta)}
        </button>

        <Button type="button" variant="ghost" size="icon" className="h-8.75 w-8.75" onClick={() => onChange(addDays(desde, 7), addDays(hasta, 7))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl"
            style={panelPosition}
          >
            <div className="px-3.5 pt-3 text-xs font-semibold text-slate-500">
              Elige un día de inicio y un día de fin
            </div>
            <Calendar
              mode="range"
              locale={es}
              selected={rangoTemporal}
              onSelect={handleSelectRango}
              defaultMonth={desde}
              className="rounded-md"
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
