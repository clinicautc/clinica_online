import { useEffect, useRef, useState } from 'react';
import { Clock, Check, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '../lib/toast';
import { horariosAPI, horariosAtencionAPI, DiaSemana, HorarioAtencionDia, Area } from '../lib/api';
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

// Ajusta un horario ya cargado (del practicante o el default) contra las
// reglas vigentes del área: si el día ahora está cerrado por la clínica se
// desactiva, y si las horas quedaron fuera del rango vigente se recortan.
// Necesario porque un horario guardado antes de que existiera (o cambiara)
// el horario de atención puede quedar inválido en silencio — sin esto, con
// solo abrir el editor y dar "Guardar" (sin tocar nada) el backend lo
// rechaza con 400, sin que la persona entienda por qué.
function reconciliarConReglas(dias: DiaSemana[], reglas: Record<number, HorarioAtencionDia>): DiaSemana[] {
  return dias.map(d => {
    const regla = reglas[d.dia_semana];
    if (!regla) return d;
    if (!regla.activo) return d.activo ? { ...d, activo: false } : d;
    if (!d.activo) return d;
    const min = regla.hora_inicio.substring(0, 5);
    const max = regla.hora_fin.substring(0, 5);
    let hora_inicio = d.hora_inicio ?? min;
    let hora_fin = d.hora_fin ?? max;
    if (hora_inicio < min) hora_inicio = min;
    if (hora_inicio > max) hora_inicio = max;
    if (hora_fin > max) hora_fin = max;
    if (hora_fin < min) hora_fin = min;
    if (hora_inicio === d.hora_inicio && hora_fin === d.hora_fin) return d;
    return { ...d, hora_inicio, hora_fin };
  });
}

interface Props {
  usuarioId?: string | number | null;
  area?: Area | '';
  onChange?: (dias: DiaSemana[]) => void;
  readOnly?: boolean;
}

export default function HorarioPracticas({ usuarioId, area, onChange, readOnly = false }: Props) {
  const [dias, setDias] = useState<DiaSemana[]>(estadoInicial);
  // Última versión cargada/guardada — sirve para saber si hay cambios sin
  // guardar y habilitar el botón solo entonces.
  const [diasOriginal, setDiasOriginal] = useState<DiaSemana[]>(estadoInicial);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Horario de atención definido por el master para el área — el horario del
  // practicante no puede salirse de ahí (no tendría sentido que un
  // practicante esté disponible cuando la clínica no atiende ese día/hora).
  const [reglasArea, setReglasArea] = useState<Record<number, HorarioAtencionDia>>({});
  const reglasAreaRef = useRef(reglasArea);
  useEffect(() => { reglasAreaRef.current = reglasArea; }, [reglasArea]);

  useEffect(() => {
    if (!area) { setReglasArea({}); return; }
    horariosAtencionAPI.getHorarios(area)
      .then(data => {
        const porDia: Record<number, HorarioAtencionDia> = {};
        data.forEach(d => { porDia[d.dia_semana] = d; });
        setReglasArea(porDia);
        // Las reglas pudieron llegar después que el horario del practicante
        // (ya cargado) — se reconcilia también aquí para no depender del
        // orden de las dos peticiones.
        setDias(prev => reconciliarConReglas(prev, porDia));
      })
      .catch(() => setReglasArea({}));
  }, [area]);

  useEffect(() => {
    if (!usuarioId) return;
    setCargando(true);
    horariosAPI.getByUsuario(usuarioId)
      .then(data => {
        const resultado = data.length > 0
          ? reconciliarConReglas(
              estadoInicial().map(d => {
                const encontrado = data.find(r => r.dia_semana === d.dia_semana);
                return encontrado ? {
                  dia_semana: d.dia_semana,
                  hora_inicio: encontrado.hora_inicio?.substring(0, 5) ?? '08:00',
                  hora_fin:    encontrado.hora_fin?.substring(0, 5)    ?? '14:00',
                  activo:      encontrado.activo,
                } : d;
              }),
              reglasAreaRef.current,
            )
          : estadoInicial();
        setDias(resultado);
        setDiasOriginal(resultado);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuarioId]);

  const reglaDelDia = (num: number) => reglasArea[num];
  const diaCerradoPorClinica = (num: number) => area && reglasArea[num] && !reglasArea[num].activo;

  const toggle = (num: number) => {
    if (diaCerradoPorClinica(num)) {
      toast.error('Ese día la clínica no atiende — cámbialo primero en el horario de atención del área.');
      return;
    }
    const nuevo = dias.map(d =>
      d.dia_semana === num ? { ...d, activo: !d.activo } : d
    );
    setDias(nuevo);
    onChange?.(nuevo);
  };

  // Recorta un valor 'HH:MM' al rango [min,max] si se sale del horario de
  // atención de la clínica para ese día. El wrapper de toast (lib/toast.ts)
  // ya reutiliza el mismo toast cuando el mensaje se repite — sin eso, cada
  // tick de scroll/flecha mientras se está en el límite apilaría un aviso
  // encimado por encima del anterior.
  const acotarHora = (num: number, valor: string) => {
    const regla = reglaDelDia(num);
    if (!regla || !regla.activo) return valor;
    const min = regla.hora_inicio.substring(0, 5);
    const max = regla.hora_fin.substring(0, 5);
    if (valor < min) { toast.error(`La clínica abre a las ${min} ese día — ajustado.`); return min; }
    if (valor > max) { toast.error(`La clínica cierra a las ${max} ese día — ajustado.`); return max; }
    return valor;
  };

  const setHora = (num: number, campo: 'hora_inicio' | 'hora_fin', valor: string) => {
    const valorAcotado = acotarHora(num, valor);
    const nuevo = dias.map(d =>
      d.dia_semana === num ? { ...d, [campo]: valorAcotado } : d
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
      setDiasOriginal(dias);
    } catch {
      toast.error('No se pudo guardar el horario.');
    } finally {
      setGuardando(false);
    }
  };

  const hayCambios = JSON.stringify(dias) !== JSON.stringify(diasOriginal);

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
          const cerrado = diaCerradoPorClinica(num);
          const regla = reglaDelDia(num);

          return (
            <div
              key={num}
              onClick={() => !readOnly && !cerrado && toggle(num)}
              className={`
                relative rounded-2xl border-2 p-4 transition-all duration-200 select-none
                ${cerrado
                  ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                  : activo
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100 cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                }
                ${readOnly ? 'cursor-default' : ''}
              `}
            >
              {/* Indicador de activo */}
              <div className={`
                absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all
                ${cerrado ? 'bg-slate-300' : activo ? 'bg-blue-500' : 'bg-slate-200'}
              `}>
                {cerrado ? <Lock className="w-2.5 h-2.5 text-white" strokeWidth={3} /> : activo && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>

              {/* Día */}
              <div className="mb-3">
                <span className={`
                  inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black mb-1
                  ${activo && !cerrado ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}
                `}>
                  {short}
                </span>
                <p className={`text-sm font-bold ${activo && !cerrado ? 'text-blue-900' : 'text-slate-400'}`}>
                  {label}
                </p>
              </div>

              {/* Horario */}
              {cerrado ? (
                <p className="text-[10px] text-slate-400 font-medium italic">Clínica cerrada este día</p>
              ) : activo ? (
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
                  {regla && (
                    <p className="text-[9px] text-slate-400 text-center">
                      Clínica: {regla.hora_inicio.substring(0,5)}–{regla.hora_fin.substring(0,5)}
                    </p>
                  )}
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
          disabled={guardando || !hayCambios}
          className="w-full bg-blue-900 hover:bg-blue-800 font-bold rounded-xl h-11 shadow-md mt-2 disabled:bg-slate-300 disabled:shadow-none"
        >
          {guardando ? 'Guardando...' : 'Guardar Horario de Prácticas'}
        </Button>
      )}
    </div>
  );
}
