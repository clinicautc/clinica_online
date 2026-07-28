import { useEffect, useState } from 'react';
import { Clock, Check, CalendarOff, Trash2, Copy, Building2, Minus, Plus, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from '../lib/toast';
import { horariosAtencionAPI, Area, HorarioAtencionDia, CierreClinico } from '../lib/api';
import TimeScrollPicker from './TimeScrollPicker';

function formatearFecha(fecha: string): string {
  return new Date(fecha.split('T')[0] + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

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
  // Última versión cargada/guardada — sirve para saber si hay cambios sin
  // guardar y habilitar el botón solo entonces.
  const [diasOriginal, setDiasOriginal] = useState<HorarioAtencionDia[]>(estadoInicial);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [cierres, setCierres] = useState<CierreClinico[]>([]);
  const [nuevaFechaCierre, setNuevaFechaCierre] = useState('');
  const [nuevoMotivoCierre, setNuevoMotivoCierre] = useState('');
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  // Cantidad de consultorios: cuántas citas simultáneas caben en el mismo
  // horario (una por consultorio, cada una con su propio practicante).
  const [consultorios, setConsultorios] = useState(1);
  const [consultoriosOriginal, setConsultoriosOriginal] = useState(1);
  const [guardandoConsultorios, setGuardandoConsultorios] = useState(false);
  // Reducción ya programada (si la hay) para cuando ninguna fecha inmediata
  // estaba libre de conflicto con citas ya agendadas.
  const [cantidadPendiente, setCantidadPendiente] = useState<number | null>(null);
  const [vigenteDesde, setVigenteDesde] = useState<string | null>(null);
  // Modal: reducir chocó con citas ya agendadas, se propone la primera
  // fecha sin conflicto y se deja elegir esa u otra posterior.
  const [modalConflicto, setModalConflicto] = useState<{ fechaSugerida: string; fechaElegida: string } | null>(null);

  const cargarHorarios = () => {
    setCargando(true);
    horariosAtencionAPI.getHorarios(area)
      .then(data => {
        const cargado = estadoInicial().map(d => {
          const encontrado = data.find(r => r.dia_semana === d.dia_semana);
          return encontrado ? {
            dia_semana: d.dia_semana,
            hora_inicio: encontrado.hora_inicio.substring(0, 5),
            hora_fin: encontrado.hora_fin.substring(0, 5),
            activo: encontrado.activo,
          } : d;
        });
        setDias(cargado);
        setDiasOriginal(cargado);
      })
      .catch(() => toast.error('No se pudo cargar el horario de atención.'))
      .finally(() => setCargando(false));
  };

  const cargarCierres = () => {
    horariosAtencionAPI.getCierres(area)
      .then(setCierres)
      .catch(() => {});
  };

  const cargarConsultorios = () => {
    horariosAtencionAPI.getConsultorios(area)
      .then(data => {
        setConsultorios(data.cantidad);
        setConsultoriosOriginal(data.cantidad);
        setCantidadPendiente(data.cantidadPendiente);
        setVigenteDesde(data.vigenteDesde);
      })
      .catch(() => {});
  };

  useEffect(() => {
    cargarHorarios();
    cargarCierres();
    cargarConsultorios();
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
      setDiasOriginal(dias);
    } catch {
      toast.error('No se pudo guardar el horario de atención.');
    } finally {
      setGuardando(false);
    }
  };

  const hayCambiosHorario = JSON.stringify(dias) !== JSON.stringify(diasOriginal);

  const guardarConsultorios = async (fechaConfirmada?: string) => {
    setGuardandoConsultorios(true);
    try {
      const resultado = await horariosAtencionAPI.upsertConsultorios(area, consultorios, fechaConfirmada);

      if ('requiereFecha' in resultado) {
        // No se aplicó nada — se le pide al master confirmar la fecha
        // sugerida (o elegir una posterior) antes de programar el cambio.
        setModalConflicto({ fechaSugerida: resultado.fechaSugerida, fechaElegida: resultado.fechaSugerida });
        return;
      }

      setConsultoriosOriginal(consultorios);
      setCantidadPendiente(resultado.cantidadPendiente);
      setVigenteDesde(resultado.vigenteDesde);
      setModalConflicto(null);

      if (resultado.cantidadPendiente != null && resultado.vigenteDesde) {
        toast.success(`Se reducirá a ${resultado.cantidadPendiente} consultorio(s) a partir del ${formatearFecha(resultado.vigenteDesde)} — las citas ya agendadas antes de esa fecha no se ven afectadas.`);
      } else {
        toast.success('Cantidad de consultorios actualizada.');
      }
    } catch {
      toast.error('No se pudo actualizar la cantidad de consultorios.');
    } finally {
      setGuardandoConsultorios(false);
    }
  };

  const hayCambiosConsultorios = consultorios !== consultoriosOriginal;

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
            disabled={guardando || !hayCambiosHorario}
            className="w-full bg-blue-900 hover:bg-blue-800 font-bold rounded-xl h-11 shadow-md disabled:bg-slate-300 disabled:shadow-none"
          >
            {guardando ? 'Guardando...' : 'Guardar Horario de Atención'}
          </Button>
        </>
      )}

      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div>
          <h4 className="text-base font-black text-blue-950 flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-blue-600" /> Consultorios disponibles
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            Cuántas citas simultáneas caben en el mismo horario — cada consultorio atiende una a la vez, con un practicante distinto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1.5">
            <button
              type="button"
              onClick={() => setConsultorios(c => Math.max(1, c - 1))}
              disabled={consultorios <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-900 hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-lg font-black text-blue-950 tabular-nums">{consultorios}</span>
            <button
              type="button"
              onClick={() => setConsultorios(c => Math.min(10, c + 1))}
              disabled={consultorios >= 10}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-900 hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium">Máximo 10 · por defecto 1.</p>
          <Button
            type="button"
            onClick={() => guardarConsultorios()}
            disabled={guardandoConsultorios || !hayCambiosConsultorios}
            className="ml-auto bg-blue-900 hover:bg-blue-800 font-bold rounded-xl h-10 px-6 shadow-md disabled:bg-slate-300 disabled:shadow-none"
          >
            {guardandoConsultorios ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        {cantidadPendiente != null && vigenteDesde && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Cambio pendiente: bajará a <strong>{cantidadPendiente}</strong> consultorio(s) a partir del <strong>{formatearFecha(vigenteDesde)}</strong>.
            </p>
          </div>
        )}
      </div>

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
                    {new Date(c.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

      <Dialog open={!!modalConflicto} onOpenChange={(open) => !open && setModalConflicto(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl font-black flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              No se puede reducir de inmediato
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium mt-1">
              Ya hay citas agendadas que ocupan más consultorios de los {consultorios} que quieres dejar. La primera fecha en la que no hay conflicto es:
            </DialogDescription>
          </DialogHeader>

          {modalConflicto && (
            <>
              <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Fecha sugerida</p>
                <p className="text-blue-900 font-black text-lg capitalize">{formatearFecha(modalConflicto.fechaSugerida)}</p>
              </div>

              <div className="mt-3 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">O elige una fecha posterior</label>
                <input
                  type="date"
                  value={modalConflicto.fechaElegida}
                  min={modalConflicto.fechaSugerida}
                  onChange={e => setModalConflicto(prev => prev && { ...prev, fechaElegida: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => guardarConsultorios(modalConflicto.fechaElegida)}
                  disabled={guardandoConsultorios}
                  className="w-full bg-blue-900 hover:bg-blue-800 font-bold rounded-xl shadow-md"
                >
                  {guardandoConsultorios ? 'Guardando...' : `Aplicar a partir del ${formatearFecha(modalConflicto.fechaElegida)}`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalConflicto(null)}
                  className="w-full text-slate-500 font-bold"
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
