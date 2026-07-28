import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

function pad(n: number) { return String(n).padStart(2, '0'); }

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINS  = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_H = 36;

interface DrumProps {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
}

function Drum({ items, selected, onSelect }: DrumProps) {
  const n   = items.length;
  const idx = Math.max(0, items.indexOf(selected));

  const elRef     = useRef<HTMLDivElement>(null);
  const dragRef   = useRef<{ startY: number; startIdx: number } | null>(null);
  const idxRef    = useRef(idx);
  const selectRef = useRef(onSelect);
  useEffect(() => { idxRef.current = idx; selectRef.current = onSelect; });

  const step = (dir: 1 | -1) => {
    const ni = ((idx + dir) % n + n) % n;
    onSelect(items[ni]);
  };

  useEffect(() => {
    const moveTo = (clientY: number) => {
      if (!dragRef.current) return;
      const delta = Math.round((dragRef.current.startY - clientY) / ITEM_H);
      const ni = ((dragRef.current.startIdx + delta) % n + n) % n;
      selectRef.current(items[ni]);
    };
    const onMove = (e: MouseEvent) => moveTo(e.clientY);
    const onUp = () => { dragRef.current = null; };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      moveTo(e.touches[0].clientY);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('touchcancel', onUp);
    };
  }, [n, items]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ni = ((idxRef.current + (e.deltaY > 0 ? 1 : -1)) % n + n) % n;
      selectRef.current(items[ni]);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [n, items]);

  const visible = Array.from({ length: 5 }, (_, i) => {
    const rel = i - 2;
    const vi  = ((idx + rel) % n + n) % n;
    return { val: items[vi], center: rel === 0 };
  });

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => step(-1)}
        className="w-9 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
      </button>

      <div
        ref={elRef}
        className="relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{ width: 52, height: ITEM_H * 5 }}
        onMouseDown={e => {
          e.preventDefault();
          dragRef.current = { startY: e.clientY, startIdx: idx };
        }}
        onTouchStart={e => {
          dragRef.current = { startY: e.touches[0].clientY, startIdx: idx };
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-white to-transparent" />
        <div
          className="pointer-events-none absolute inset-x-1 z-0 border-y border-blue-200 bg-blue-50 rounded-md"
          style={{ top: ITEM_H * 2, height: ITEM_H }}
        />
        {visible.map(({ val, center }, i) => (
          <div
            key={i}
            className="absolute inset-x-0 flex items-center justify-center"
            style={{ top: i * ITEM_H, height: ITEM_H }}
          >
            <span className={`tabular-nums transition-all ${
              center
                ? 'text-blue-900 font-black text-base'
                : 'text-slate-300 font-medium text-sm'
            }`}>
              {pad(val)}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => step(1)}
        className="w-9 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function TimeScrollPicker({ value, onChange, disabled }: Props) {
  const [open, setOpen]       = useState(false);
  const [textVal, setTextVal] = useState('');
  const [syncTick, setSyncTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const parts = value.split(':');
  const h = Math.min(23, Math.max(0, parseInt(parts[0] ?? '8', 10) || 0));
  const rawM = parseInt(parts[1] ?? '0', 10) || 0;
  const m = MINS.reduce((a, b) => (Math.abs(b - rawM) < Math.abs(a - rawM) ? b : a), 0);

  // Valores de display: siguen textVal en tiempo real para que los drums
  // se sincronicen mientras el usuario escribe, sin esperar a onChange
  const displayH = (() => {
    const match = textVal.match(/^(\d{1,2})/);
    if (match) {
      const v = parseInt(match[1], 10);
      if (v >= 0 && v <= 23) return v;
    }
    return h;
  })();

  const displayM = (() => {
    const match = textVal.match(/:(\d{1,2})$/);
    if (match) {
      const v = parseInt(match[1], 10);
      return MINS.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a, 0);
    }
    return m;
  })();

  // AM/PM meramente informativo junto a la hora en formato 24h — el valor
  // que se guarda y se compara (onChange/value) sigue siendo 24h siempre.
  const meridiano = displayH < 12 ? 'AM' : 'PM';

  // syncTick fuerza este efecto a re-ejecutarse incluso cuando el valor
  // recortado por el padre (ver acotarHora en HorarioPracticas.tsx) coincide
  // con el que ya tenía antes de la edición — sin esto, si el usuario
  // escribe un valor fuera de rango que el padre recorta de vuelta al mismo
  // límite ya vigente, h/m no cambian entre renders y este efecto nunca se
  // disparaba, dejando el recuadro mostrando el valor inválido tecleado
  // aunque el estado real (y lo que se guarda) ya estuviera corregido.
  // Sin cero a la izquierda en la hora mostrada (8:00, no 08:00) — el valor
  // interno que se guarda y se compara (onChange/value) sigue usando
  // pad(h) siempre, esto solo cambia lo que se ve en el recuadro.
  useEffect(() => { setTextVal(`${h}:${pad(m)}`); }, [h, m, syncTick]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Formatea los dígitos crudos que lleva tecleados el usuario (máx. 4:
  // HHMM), decidiendo cuántos son hora y cuántos minuto según cuántos haya
  // en total — así "800" se lee como 1 dígito de hora + 2 de minuto ("8:00")
  // y "1430" como 2+2 ("14:30"), sin que la persona tenga que escribir el
  // cero inicial ni los dos puntos a mano.
  const formatDigits = (digits: string) => {
    if (digits.length <= 2) return digits;
    if (digits.length === 3) return `${digits.slice(0, 1)}:${digits.slice(1)}`;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo dígitos: cualquier otra tecla (incluyendo ':' escrito a mano) se
    // descarta en vez de dejar que el usuario arme un valor raro.
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setTextVal(formatDigits(digits));

    // Confirmar (onChange, que dispara el recorte contra el horario de
    // atención en HorarioPracticas.tsx) SOLO al completar los 4 dígitos —
    // antes de eso el valor es ambiguo/a medio escribir (ej. "1:43" mientras
    // se sigue tecleando "1430"), y confirmarlo de más recortaría el buffer
    // a medias contra el horario vigente, arruinando lo que la persona
    // seguía escribiendo. El resto de los casos (1-3 dígitos) se confirman
    // hasta que el campo pierde el foco, en handleBlur.
    if (digits.length === 4) {
      const newH = parseInt(digits.slice(0, 2), 10);
      const newM = parseInt(digits.slice(2), 10);
      const snap = MINS.reduce((a, b) => Math.abs(b - newM) < Math.abs(a - newM) ? b : a, 0);
      onChange(`${pad(Math.min(23, newH))}:${pad(snap)}`);
      setSyncTick(t => t + 1);
    }
  };

  const handleBlur = () => {
    const digits = textVal.replace(/\D/g, '');
    if (digits.length === 0) return;

    // 1-2 dígitos = solo la hora (minutos en :00); 3 = 1 dígito de hora + 2
    // de minuto ("800" -> 8:00); 4 = 2 y 2 ("1430" -> 14:30).
    const hh = digits.length <= 2 ? parseInt(digits, 10)
      : digits.length === 3 ? parseInt(digits.slice(0, 1), 10)
      : parseInt(digits.slice(0, 2), 10);
    const mm = digits.length <= 2 ? 0 : parseInt(digits.slice(digits.length === 3 ? 1 : 2), 10);

    const snap = MINS.reduce((a, b) => Math.abs(b - mm) < Math.abs(a - mm) ? b : a, 0);
    const hhClamped = Math.min(23, Math.max(0, hh));
    setTextVal(`${hhClamped}:${pad(snap)}`);
    onChange(`${pad(hhClamped)}:${pad(snap)}`);
    setSyncTick(t => t + 1);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className={`
        flex items-center gap-1.5 w-full px-2.5 py-1.5
        bg-white border border-blue-200 rounded-lg
        hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300
        transition-colors
        ${disabled ? 'opacity-60' : ''}
      `}>
        <input
          type="text"
          inputMode="numeric"
          value={textVal}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onFocus={e => e.target.select()}
          onClick={e => (e.target as HTMLInputElement).select()}
          disabled={disabled}
          placeholder="HH:MM"
          maxLength={5}
          className="text-xs font-bold text-blue-900 bg-transparent border-none outline-none w-full tabular-nums placeholder-slate-300 disabled:cursor-not-allowed min-w-0 cursor-text"
        />
        <span className="flex-shrink-0 mr-1.5 text-[10px] font-bold text-slate-300 select-none pointer-events-none">
          {meridiano}
        </span>
        {/* Ícono de reloj más llamativo: fondo al hover, borde suave, más grande */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(p => !p)}
          tabIndex={-1}
          className={`
            flex-shrink-0 flex items-center justify-center
            w-6 h-6 rounded-md transition-all
            ${!disabled
              ? 'text-blue-500 hover:bg-blue-100 hover:text-blue-700 cursor-pointer ring-1 ring-blue-200 hover:ring-blue-400'
              : 'text-slate-300 cursor-not-allowed'
            }
          `}
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute z-[100] left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 px-5 py-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">
            24 h
          </p>
          <div className="flex items-center justify-center gap-2">
            <Drum
              items={HOURS}
              selected={displayH}
              onSelect={v => { onChange(`${pad(v)}:${pad(displayM)}`); setSyncTick(t => t + 1); }}
            />
            <span className="text-slate-300 font-black text-2xl select-none self-center pb-0.5">:</span>
            <Drum
              items={MINS}
              selected={displayM}
              onSelect={v => { onChange(`${pad(displayH)}:${pad(v)}`); setSyncTick(t => t + 1); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
