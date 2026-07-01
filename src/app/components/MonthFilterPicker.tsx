/**
 * ============================================================================
 * ARCHIVO: MonthFilterPicker.tsx
 * PROPÓSITO: Navegador de mes (‹ Junio 2026 ›) usado por el modo "Mes" del
 * filtro de Citas Agendadas en los dashboards de admin/master.
 * El texto central es clickeable y abre un grid de 12 meses para selección rápida.
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, parse, setMonth, setYear, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthFilterPickerProps {
  selectedMonth: string; // formato 'yyyy-MM'
  onChange: (month: string) => void;
  theme?: 'blue' | 'orange';
  disableNext?: boolean;
}

const THEME_CLASSES = {
  blue:   { wrapper: 'border-blue-200 text-blue-900', active: 'bg-blue-600 text-white', hover: 'hover:bg-blue-50' },
  orange: { wrapper: 'border-orange-200 text-orange-900', active: 'bg-orange-500 text-white', hover: 'hover:bg-orange-50' },
};

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function MonthFilterPicker({ selectedMonth, onChange, theme = 'blue', disableNext = false }: MonthFilterPickerProps) {
  const [isOpen, setIsOpen]           = useState(false);
  const [panelPosition, setPanelPosition] = useState<React.CSSProperties>({ top: 0, left: 0 });
  const [popupYear, setPopupYear]     = useState<number>(() => parseInt(selectedMonth.split('-')[0]));
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentDate   = parse(selectedMonth, 'yyyy-MM', new Date());
  const selectedYear  = getYear(currentDate);
  const selectedMes   = getMonth(currentDate); // 0-based

  const nowYear  = getYear(new Date());
  const nowMonth = getMonth(new Date()); // 0-based

  const goToMonth = (delta: number) => {
    if (delta > 0 && disableNext) return;
    const newDate = delta > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    onChange(format(newDate, 'yyyy-MM'));
  };

  const handleOpenPicker = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const PANEL_W = 280;
      const PANEL_H = 220;
      const left = Math.min(rect.left, window.innerWidth - PANEL_W - 8);
      const top  = window.innerHeight - rect.bottom >= PANEL_H + 8
        ? rect.bottom + 8
        : rect.top - PANEL_H - 8;
      setPanelPosition({ top, left });
      setPopupYear(selectedYear);
    }
    setIsOpen(prev => !prev);
  };

  const selectMonth = (mesIndex: number) => {
    const newDate = setMonth(setYear(currentDate, popupYear), mesIndex);
    onChange(format(newDate, 'yyyy-MM'));
    setIsOpen(false);
  };

  const tc = THEME_CLASSES[theme];

  return (
    <div className="relative">
      <div className={`h-11.75 pl-1.5 pr-1.5 rounded-xl font-bold flex items-center gap-1.5 border bg-white text-base ${tc.wrapper}`}>
        <Button type="button" variant="ghost" size="icon" className="h-8.75 w-8.75" onClick={() => goToMonth(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpenPicker}
          className={`px-2 capitalize min-w-[150px] text-center rounded-lg py-1 transition-colors ${tc.hover}`}
        >
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </button>

        <Button
          type="button" variant="ghost" size="icon"
          className={`h-8.75 w-8.75 ${disableNext && selectedMonth >= format(new Date(), 'yyyy-MM') ? 'opacity-30 cursor-not-allowed' : ''}`}
          disabled={disableNext && selectedMonth >= format(new Date(), 'yyyy-MM')}
          onClick={() => goToMonth(1)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3"
            style={{ ...panelPosition, width: 280 }}
          >
            {/* Navegación de año */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setPopupYear(y => y - 1)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-800">{popupYear}</span>
              <button
                type="button"
                onClick={() => !(disableNext && popupYear >= nowYear) && setPopupYear(y => y + 1)}
                disabled={disableNext && popupYear >= nowYear}
                className={`p-1 rounded hover:bg-slate-100 ${disableNext && popupYear >= nowYear ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid 4x3 de meses */}
            <div className="grid grid-cols-4 gap-1">
              {MESES.map((mes, i) => {
                const isSelected = i === selectedMes && popupYear === selectedYear;
                const isFuture   = disableNext && (popupYear > nowYear || (popupYear === nowYear && i > nowMonth));
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !isFuture && selectMonth(i)}
                    disabled={isFuture}
                    className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                      isSelected  ? tc.active :
                      isFuture    ? 'text-slate-300 cursor-not-allowed' :
                      `text-slate-700 ${tc.hover}`
                    }`}
                  >
                    {mes}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
