import { useEffect, useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { horariosAPI, DiaSemana } from '../lib/api';
import TimeScrollPicker from './TimeScrollPicker';

const DIAS = [
  { num: 1, label: 'Lunes',     short: 'L' },
  { num: 2, label: 'Martes',    short: 'M' },
  { num: 3, label: 'Miércoles', short: 'M' },
  { num: 4, label: 'Jueves',    short: 'J' },
  { num: 5, label: 'Viernes',   short: 'V' },
  { num: 6, label: 'Sábado',    short: 'S' },
];

const DIA_DEFAULT: Omit<DiaSemana, 'dia_semana'> = {
  hora_inicio: '08:00',
  hora_fin: '14:00',
  activo: false,
};

function estadoInicial(): DiaSemana[] {
  return DIAS.map(d => ({ dia_semana: d.num, ...DIA_DEFAULT }));
}

interface Props {
  usuarioId?: string | number | null;
  onChange?: (dias: DiaSemana[]) => void;
  readOnly?: boolean;
}

export default function HorarioPracticas({ usuarioId, onChange, readOnly = false }: Props) {
  const [dias, setDias] = useState<DiaSemana[]>(estadoInicial);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;
    setCargando(true);
    horariosAPI.getByUsuario(usuarioId)
      .then(data => {
        if (data.length > 0) {
          setDias(estadoInicial().map(d => {
            const encontrado = data.find(r => r.dia_semana === d.dia_semana);
            return encontrado ? {
              dia_semana: d.dia_semana,
              hora_inicio: encontrado.hora_inicio?.substring(0, 5) ?? '08:00',
              hora_fin:    encontrado.hora_fin?.substring(0, 5)    ?? '14:00',
              activo:      encontrado.activo,
            } : d;
          }));
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuarioId]);

  const toggle = (num: number) => {
    const nuevo = dias.map(d =>
      d.dia_semana === num ? { ...d, activo: !d.activo } : d
    );
    setDias(nuevo);
    onChange?.(nuevo);
  };

  const setHora = (num: number, campo: 'hora_inicio' | 'hora_fin', valor: string) => {
    const nuevo = dias.map(d =>
      d.dia_semana === num ? { ...d, [campo]: valor } : d
    );
    setDias(nuevo);
    onChange?.(nuevo);
  };

  const guardar = async () => {
    if (!usuarioId) return;
    setGuardando(true);
    try {
      await horariosAPI.upsert(usuarioId, dias);
      toast.success('Horario de prácticas guardado correctamente.');
    } catch {
      toast.error('No se pudo guardar el horario.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
        <Clock className="w-4 h-4 animate-spin" /> Cargando horario...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DIAS.map(({ num, label, short }) => {
          const dia = dias.find(d => d.dia_semana === num)!;
          const activo = dia.activo;

          return (
            <div
              key={num}
              onClick={() => !readOnly && toggle(num)}
              className={`
                relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 select-none
                ${activo
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }
                ${readOnly ? 'cursor-default' : ''}
              `}
            >
              {/* Indicador de activo */}
              <div className={`
                absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all
                ${activo ? 'bg-blue-500' : 'bg-slate-200'}
              `}>
                {activo && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>

              {/* Día */}
              <div className="mb-3">
                <span className={`
                  inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black mb-1
                  ${activo ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}
                `}>
                  {short}
                </span>
                <p className={`text-sm font-bold ${activo ? 'text-blue-900' : 'text-slate-400'}`}>
                  {label}
                </p>
              </div>

              {/* Horario */}
              {activo ? (
                <div
                  className="space-y-2"
                  onClick={e => e.stopPropagation()}
                >
                  <TimeScrollPicker
                    value={dia.hora_inicio ?? '08:00'}
                    onChange={v => setHora(num, 'hora_inicio', v)}
                    disabled={readOnly}
                  />
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-px bg-blue-200" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">a</span>
                    <div className="flex-1 h-px bg-blue-200" />
                  </div>
                  <TimeScrollPicker
                    value={dia.hora_fin ?? '14:00'}
                    onChange={v => setHora(num, 'hora_fin', v)}
                    disabled={readOnly}
                  />
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium italic">Sin prácticas</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen rápido de días activos */}
      {dias.some(d => d.activo) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {dias.filter(d => d.activo).map(d => {
            const info = DIAS.find(x => x.num === d.dia_semana)!;
            return (
              <span key={d.dia_semana} className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {info.short} {d.hora_inicio?.substring(0,5)} – {d.hora_fin?.substring(0,5)}
              </span>
            );
          })}
        </div>
      )}

      {/* Botón guardar (solo si tiene usuarioId y no es readOnly) */}
      {usuarioId && !readOnly && (
        <Button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-full bg-blue-900 hover:bg-blue-800 font-bold rounded-xl h-11 shadow-md mt-2"
        >
          {guardando ? 'Guardando...' : 'Guardar Horario de Prácticas'}
        </Button>
      )}
    </div>
  );
}
