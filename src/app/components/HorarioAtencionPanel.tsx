import { useEffect, useState } from 'react';
import { Clock, Check, CalendarOff, Trash2, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { horariosAtencionAPI, Area, HorarioAtencionDia, CierreClinico } from '../lib/api';
import TimeScrollPicker from './TimeScrollPicker';

const DIAS = [
  { num: 1, label: 'Lunes',     short: 'L' },
  { num: 2, label: 'Martes',    short: 'M' },
  { num: 3, label: 'Miércoles', short: 'M' },
  { num: 4, label: 'Jueves',    short: 'J' },
  { num: 5, label: 'Viernes',   short: 'V' },
  { num: 6, label: 'Sábado',    short: 'S' },
  { num: 7, label: 'Domingo',   short: 'D' },
];

const DIA_DEFAULT: Omit<HorarioAtencionDia, 'dia_semana'> = {
  hora_inicio: '08:00',
  hora_fin: '24:00',
  activo: false,
};

function estadoInicial(): HorarioAtencionDia[] {
  return DIAS.map(d => ({ dia_semana: d.num, ...DIA_DEFAULT }));
}

export default function HorarioAtencionPanel() {
  const [area, setArea] = useState<Area>('nutricion');
  const [dias, setDias] = useState<HorarioAtencionDia[]>(estadoInicial);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [cierres, setCierres] = useState<CierreClinico[]>([]);
  const [nuevaFechaCierre, setNuevaFechaCierre] = useState('');
  const [nuevoMotivoCierre, setNuevoMotivoCierre] = useState('');
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  const cargarHorarios = () => {
    setCargando(true);
    horariosAtencionAPI.getHorarios(area)
      .then(data => {
        setDias(estadoInicial().map(d => {
          const encontrado = data.find(r => r.dia_semana === d.dia_semana);
          return encontrado ? {
            dia_semana: d.dia_semana,
            hora_inicio: encontrado.hora_inicio.substring(0, 5),
            hora_fin: encontrado.hora_fin.substring(0, 5),
            activo: encontrado.activo,
          } : d;
        }));
      })
      .catch(() => toast.error('No se pudo cargar el horario de atención.'))
      .finally(() => setCargando(false));
  };

  const cargarCierres = () => {
    horariosAtencionAPI.getCierres(area)
      .then(setCierres)
      .catch(() => {});
  };

  useEffect(() => {
    cargarHorarios();
    cargarCierres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  const toggle = (num: number) => {
    setDias(prev => prev.map(d => d.dia_semana === num ? { ...d, activo: !d.activo } : d));
  };

  const setHora = (num: number, campo: 'hora_inicio' | 'hora_fin', valor: string) => {
    setDias(prev => prev.map(d => d.dia_semana === num ? { ...d, [campo]: valor } : d));
  };

  const aplicarATodosLosActivos = (num: number) => {
    const origen = dias.find(d => d.dia_semana === num);
    if (!origen) return;
    setDias(prev => prev.map(d => d.activo ? { ...d, hora_inicio: origen.hora_inicio, hora_fin: origen.hora_fin } : d));
    toast.success('Rango de horario copiado a los demás días activos.');
  };

  const guardarHorarios = async () => {
    for (const d of dias) {
      if (d.activo && d.hora_inicio >= d.hora_fin) {
        const info = DIAS.find(x => x.num === d.dia_semana)!;
        toast.error(`${info.label}: la hora de inicio debe ser menor a la hora de fin.`);
        return;
      }
    }
    setGuardando(true);
    try {
      await horariosAtencionAPI.upsertHorarios(area, dias);
      toast.success('Horario de atención guardado. Las citas futuras que ya no encajen se reagendarán automáticamente y se notificará al paciente.');
    } catch {
      toast.error('No se pudo guardar el horario de atención.');
    } finally {
      setGuardando(false);
    }
  };

  const crearCierre = async () => {
    if (!nuevaFechaCierre) {
      toast.error('Selecciona una fecha para cerrar.');
      return;
    }
    setGuardandoCierre(true);
    try {
      await horariosAtencionAPI.crearCierre(area, nuevaFechaCierre, nuevoMotivoCierre.trim() || undefined);
      toast.success('Día cerrado correctamente. Las citas futuras en esa fecha se reagendarán automáticamente.');
      setNuevaFechaCierre('');
      setNuevoMotivoCierre('');
      cargarCierres();
    } catch {
      toast.error('No se pudo cerrar el día.');
    } finally {
      setGuardandoCierre(false);
    }
  };

  const reabrirCierre = async (id: number) => {
    try {
      await horariosAtencionAPI.eliminarCierre(id);
      toast.success('Día reabierto.');
      setCierres(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('No se pudo reabrir el día.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-900/10 shadow-sm p-5 sm:p-7 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Horario de Atención
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Controla qué días y horas puede seleccionar un paciente al agendar una cita.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setArea('nutricion')}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${area === 'nutricion' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:text-orange-600'}`}
          >
            Nutrición
          </button>
          <button
            type="button"
            onClick={() => setArea('fisioterapia')}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${area === 'fisioterapia' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-blue-700'}`}
          >
            Fisioterapia
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
          <Clock className="w-4 h-4 animate-spin" /> Cargando horario...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {DIAS.map(({ num, label, short }) => {
              const dia = dias.find(d => d.dia_semana === num)!;
              const activo = dia.activo;

              return (
                <div
                  key={num}
                  onClick={() => toggle(num)}
                  className={`relative rounded-2xl border-2 p-3 cursor-pointer transition-all duration-200 select-none ${
                    activo ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${activo ? 'bg-blue-500' : 'bg-slate-200'}`}>
                    {activo && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>

                  <div className="mb-2.5">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black mb-1 ${activo ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {short}
                    </span>
                    <p className={`text-xs font-bold ${activo ? 'text-blue-900' : 'text-slate-400'}`}>{label}</p>
                  </div>

                  {activo ? (
                    <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                      <TimeScrollPicker value={dia.hora_inicio} onChange={v => setHora(num, 'hora_inicio', v)} />
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-px bg-blue-200" />
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">a</span>
                        <div className="flex-1 h-px bg-blue-200" />
                      </div>
                      <TimeScrollPicker value={dia.hora_fin} onChange={v => setHora(num, 'hora_fin', v)} />
                      <button
                        type="button"
                        onClick={() => aplicarATodosLosActivos(num)}
                        className="w-full flex items-center justify-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wide pt-1"
                        title="Copiar este rango a los demás días activos"
                      >
                        <Copy className="w-2.5 h-2.5" /> Copiar a todos
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium italic">Sin atención</p>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={guardarHorarios}
            disabled={guardando}
            className="w-full bg-blue-900 hover:bg-blue-800 font-bold rounded-xl h-11 shadow-md"
          >
            {guardando ? 'Guardando...' : 'Guardar Horario de Atención'}
          </Button>
        </>
      )}

      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div>
          <h4 className="text-base font-black text-blue-950 flex items-center gap-2">
            <CalendarOff className="w-4.5 h-4.5 text-red-500" /> Cerrar días completos
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            Bloquea una fecha puntual (ej. día festivo) sin importar el horario recurrente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={nuevaFechaCierre}
            onChange={e => setNuevaFechaCierre(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            type="text"
            value={nuevoMotivoCierre}
            onChange={e => setNuevoMotivoCierre(e.target.value)}
            placeholder="Motivo (opcional)"
            maxLength={200}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Button
            type="button"
            onClick={crearCierre}
            disabled={guardandoCierre}
            className="bg-red-600 hover:bg-red-700 font-bold rounded-xl shrink-0"
          >
            {guardandoCierre ? 'Cerrando...' : 'Cerrar día'}
          </Button>
        </div>

        {cierres.length > 0 ? (
          <div className="space-y-2">
            {cierres.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-bold text-red-800">
                    {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {c.motivo && <p className="text-xs text-red-600/80 font-medium">{c.motivo}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => reabrirCierre(c.id)}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reabrir
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-medium italic">No hay días cerrados próximamente.</p>
        )}
      </div>
    </div>
  );
}
