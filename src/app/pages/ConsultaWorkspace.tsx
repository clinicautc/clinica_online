import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, FileText, Info, Loader2, Upload, UserX } from 'lucide-react';
import { citasAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { FormClinicoCallbacks, FormClinicoHandle } from '../lib/types/formClinico';
import ConfirmDialog from '../components/ConfirmDialog';
import HojaEvolutiva from './HojaEvolutiva';
import NutritionMasterForm from './NutritionMasterForm';
import PhysiotherapyMasterForm from './PhysiotherapyMasterForm';

type CitaDetalle = {
  id: number;
  numero_consulta?: number;
  estado: string;
  tipo: string;
  tipo_consulta: string | null;
  paciente_nombre: string;
  paciente_id?: number;
  fecha?: string;
  hora?: string;
  borrador: Record<string, unknown> | null;
  documentosExistentes: string[];
  documentosRequeridos: string[];
  timer_expira_en?: string | null;
};

type Fase = 'cargando' | 'iniciando' | 'activa' | 'terminal' | 'incompleta' | 'error';

const DEBOUNCE_MS = 15_000;

function resolveFormKey(area: string, tipoConsulta: string | null): string | null {
  if (area === 'nutricion'    && tipoConsulta === 'primera')     return 'historia_clinica_nutricion';
  if (area === 'nutricion'    && tipoConsulta === 'subsecuente') return 'seguimiento_nutricion';
  if (area === 'fisioterapia' && tipoConsulta === 'primera')     return 'valoracion_inicial_fisioterapia';
  if (area === 'fisioterapia' && tipoConsulta === 'subsecuente') return 'nota_evolutiva';
  return null;
}

function resolveFormName(area: string, tipoConsulta: string | null): string {
  if (area === 'nutricion'    && tipoConsulta === 'primera')     return 'Historia Clínica Nutricional';
  if (area === 'nutricion'    && tipoConsulta === 'subsecuente') return 'Nota de Evolución';
  if (area === 'fisioterapia' && tipoConsulta === 'primera')     return 'Valoración Inicial de Fisioterapia';
  if (area === 'fisioterapia' && tipoConsulta === 'subsecuente') return 'Nota de Evolución';
  return 'Documento Clínico';
}

function formatFecha(fecha?: string): string {
  if (!fecha) return '—';
  const [year, month, day] = fecha.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

function formatHora(hora?: string): string {
  if (!hora) return '—';
  return hora.substring(0, 5);
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatCountdown(segs: number): string {
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ConsultaWorkspace: React.FC = () => {
  const { id: citaId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [cita, setCita]         = useState<CitaDetalle | null>(null);
  const [fase, setFase]         = useState<Fase>('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [finalizando, setFinalizando]           = useState(false);
  const [activeView, setActiveView]             = useState<'hub' | 'form'>('hub');
  const [showConfirmFinalizar, setShowConfirmFinalizar] = useState(false);
  const [showConfirmNoAsistio, setShowConfirmNoAsistio] = useState(false);
  const [consentSubido, setConsentSubido] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<{ base64: string; mimeType: string } | null>(null);
  const [uploadingConsent, setUploadingConsent] = useState(false);
  const [deletingConsent, setDeletingConsent] = useState(false);
  const consentInputRef = useRef<HTMLInputElement>(null);
  const [lastSaved, setLastSaved]     = useState<Date | null>(null);
  const [elapsed, setElapsed]         = useState('Recién iniciada');
  const [timerSegs, setTimerSegs]     = useState<number | null>(null);
  const [formConfirmado, setFormConfirmado] = useState(false);

  const formRef            = useRef<FormClinicoHandle>(null);
  const debounceTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoBorradorStr  = useRef('');
  const startTimeRef       = useRef<Date | null>(null);

  const cargarCita = useCallback(async (): Promise<CitaDetalle | null> => {
    if (!citaId) return null;
    try {
      const data = await citasAPI.getById(citaId);
      setCita(data);
      return data;
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al cargar la cita');
      setFase('error');
      return null;
    }
  }, [citaId]);

  useEffect(() => {
    (async () => {
      const data = await cargarCita();
      if (!data) return;

      if (['completada', 'no_asistio'].includes(data.estado)) {
        setFase('terminal');
        return;
      }

      if (data.estado === 'incompleta') {
        setFase('incompleta');
        return;
      }

      if (data.estado === 'programada' || data.estado === 'recuperada') {
        setFase('iniciando');
        try {
          const iniciada = await citasAPI.iniciar(String(data.id));
          setCita((prev) => (prev ? { ...prev, ...iniciada } : iniciada));
          setFase('activa');
          startTimeRef.current = new Date();
        } catch (e: any) {
          setErrorMsg(e.message ?? 'No se pudo iniciar la consulta');
          setFase('error');
        }
        return;
      }

      if (data.estado === 'en_atencion') {
        setFase('activa');
        startTimeRef.current = new Date();
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer de duración de consulta
  useEffect(() => {
    if (fase !== 'activa') return;
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const mins = Math.floor((Date.now() - startTimeRef.current.getTime()) / 60000);
      setElapsed(mins < 1 ? 'Recién iniciada' : `${mins} min`);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fase]);

  // Countdown de 90 min — se activa cuando la cita tiene timer_expira_en
  useEffect(() => {
    if (fase !== 'activa' || !cita?.timer_expira_en) return;
    const expira = new Date(cita.timer_expira_en).getTime();

    const tick = () => {
      const segs = Math.floor((expira - Date.now()) / 1000);
      if (segs <= 0) {
        setTimerSegs(0);
        setFase('incompleta');
        return;
      }
      setTimerSegs(segs);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [fase, cita?.timer_expira_en]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restaurar borrador al montar
  useEffect(() => {
    if (fase !== 'activa' || !cita) return;
    const fk = resolveFormKey(cita.tipo, cita.tipo_consulta);
    if (!fk || !cita.borrador) return;
    const draft = cita.borrador[fk];
    if (draft) setTimeout(() => formRef.current?.restoreDraft(draft), 150);
  }, [fase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refrescar estado al recuperar foco
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && fase === 'activa') {
        cargarCita().then((data) => {
          if (!data) return;
          if (data.estado === 'incompleta') { setFase('incompleta'); return; }
          if (data.estado !== 'en_atencion') setFase('terminal');
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fase, cargarCita]);

  const guardarBorradorSilencioso = async (formKey: string, state: unknown) => {
    if (!citaId) return;
    const str = JSON.stringify(state);
    if (str === ultimoBorradorStr.current) return;
    try {
      await citasAPI.guardarBorrador(citaId, { [formKey]: state } as Record<string, unknown>);
      ultimoBorradorStr.current = str;
      setLastSaved(new Date());
    } catch {
      // fallo silencioso
    }
  };

  const handleStateChange = (formKey: string, state: unknown) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => guardarBorradorSilencioso(formKey, state), DEBOUNCE_MS);
  };

  const handleSaveSuccess = async (_formKey: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    try {
      if (pendingConsent) {
        await citasAPI.uploadConsentimiento(citaId!, pendingConsent.base64, pendingConsent.mimeType);
        setPendingConsent(null);
      }
      await citasAPI.finalizar(String(citaId));
      toast.success('Consulta finalizada correctamente');
      const updated = await cargarCita();
      if (updated) setFase('terminal');
    } catch (e: any) {
      toast.error(e.message ?? 'Error al finalizar la consulta');
    } finally {
      setFinalizando(false);
    }
  };

  const handleSaveFailure = (_formKey: string, error?: string) => {
    toast.error(error ?? 'Error al guardar el documento clínico');
    setFinalizando(false);
  };

  const requestFinalizar = () => {
    if (!formRef.current) return;
    if (!formRef.current.canSave) {
      toast.warning('Completa los campos requeridos antes de finalizar');
      setActiveView('form');
      return;
    }
    setShowConfirmFinalizar(true);
  };

  const doFinalizar = async () => {
    const refreshed = await cargarCita();
    if (!refreshed || refreshed.estado !== 'en_atencion') {
      toast.error('La consulta ya no está activa');
      return;
    }
    setFinalizando(true);
    formRef.current?.triggerSave();
  };

  const doNoAsistio = async () => {
    if (!citaId) return;
    const refreshed = await cargarCita();
    if (!refreshed || !['programada', 'en_atencion'].includes(refreshed.estado)) {
      toast.error('Estado inválido para esta acción');
      return;
    }
    try {
      await citasAPI.noAsistio(citaId);
      toast.success('Cita marcada como no asistió');
      const updated = await cargarCita();
      if (updated) setFase('terminal');
    } catch (e: any) {
      toast.error(e.message ?? 'Error');
    }
  };

  // Sincroniza consentSubido con lo que devuelve la cita al cargar/recargar.
  // Solo activa el flag (nunca lo baja): si ya hay pendingConsent, el estado es "listo".
  useEffect(() => {
    if (cita?.documentosExistentes?.includes('consentimiento')) setConsentSubido(true);
  }, [cita]);

  const handleConsentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Solo se aceptan archivos PDF, JPG o PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5 MB');
      return;
    }
    setUploadingConsent(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPendingConsent({ base64, mimeType: file.type });
      setConsentSubido(true);
      toast.success('Consentimiento listo. Se guardará al finalizar la consulta.');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al leer el archivo');
    } finally {
      setUploadingConsent(false);
      if (consentInputRef.current) consentInputRef.current.value = '';
    }
  };

  const handleConsentDelete = async () => {
    if (pendingConsent) {
      setPendingConsent(null);
      setConsentSubido(false);
      return;
    }
    if (!citaId) return;
    setDeletingConsent(true);
    try {
      await citasAPI.deleteConsentimiento(citaId);
      setConsentSubido(false);
      toast.success('Consentimiento eliminado. Puedes subir el archivo correcto.');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al eliminar el consentimiento');
    } finally {
      setDeletingConsent(false);
    }
  };

  // ── Pantallas de estado no activo ──────────────────────────────────────────

  if (fase === 'cargando' || fase === 'iniciando') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">
            {fase === 'iniciando' ? 'Iniciando consulta...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  if (fase === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200">
          <p className="text-red-600 font-bold text-lg mb-2">No se pudo abrir la consulta</p>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button onClick={() => window.close()} className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-semibold text-sm">
            Cerrar ventana
          </button>
        </div>
      </div>
    );
  }

  if (fase === 'terminal') {
    const completada = cita?.estado === 'completada';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm border border-gray-200">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${completada ? 'bg-green-100' : 'bg-gray-100'}`}>
            <CheckCircle className={`w-8 h-8 ${completada ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <p className={`font-bold text-xl mb-2 ${completada ? 'text-green-700' : 'text-gray-700'}`}>
            {completada ? 'Consulta completada' : 'Cita cerrada'}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {completada
              ? 'El expediente fue guardado correctamente.'
              : 'La cita fue marcada como no asistió.'}
          </p>
          <button onClick={() => window.close()} className="px-8 py-3 bg-blue-700 text-white rounded-lg font-bold text-sm">
            Cerrar ventana
          </button>
        </div>
      </div>
    );
  }

  if (fase === 'incompleta') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <p className="font-bold text-xl mb-2 text-amber-700">Tiempo de consulta agotado</p>
          <p className="text-gray-500 text-sm mb-2">
            La consulta no se completó dentro del tiempo disponible y quedó registrada como <span className="font-semibold">incompleta</span>.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            El borrador se conserva. Un administrador puede habilitar la cita para que puedas terminar el expediente.
          </p>
          <button onClick={() => window.close()} className="px-8 py-3 bg-amber-600 text-white rounded-lg font-bold text-sm">
            Cerrar ventana
          </button>
        </div>
      </div>
    );
  }

  // ── Fase activa ────────────────────────────────────────────────────────────

  const formKey = cita ? resolveFormKey(cita.tipo, cita.tipo_consulta) : null;
  const callbacks: Partial<FormClinicoCallbacks> = {
    formKey: formKey ?? '',
    onStateChange: handleStateChange,
    onSaveSuccess: handleSaveSuccess,
    onSaveFailure: handleSaveFailure,
    initialDraft: cita?.borrador && formKey ? cita.borrador[formKey] : undefined,
    onBack: () => { setFormConfirmado(true); setActiveView('hub'); },
    pacienteId: cita?.paciente_id,
    pacienteNombre: cita?.paciente_nombre,
  };

  const { tipo, tipo_consulta } = cita!;
  const isNutri   = tipo === 'nutricion';
  const hasBorrador = !!(cita?.borrador && formKey && cita.borrador[formKey]);
  const formName  = resolveFormName(tipo, tipo_consulta);

  const accent = isNutri ? {
    badge       : 'bg-orange-100 text-orange-700',
    bar         : 'bg-orange-500',
    cardBorder  : 'border-2 border-orange-200 bg-orange-50',
    statusText  : 'text-orange-700',
    btn         : 'bg-orange-500 hover:bg-orange-600 text-white',
    iconBg      : 'bg-orange-100',
    iconText    : 'text-orange-600',
    inProgress  : 'bg-orange-100 text-orange-700',
    cardTitleTxt: 'text-orange-900',
    savedTxt    : 'text-orange-600',
    banner      : 'bg-orange-50 border-orange-200 text-orange-800',
  } : {
    badge       : 'bg-blue-100 text-blue-700',
    bar         : 'bg-blue-600',
    cardBorder  : 'border-2 border-blue-200 bg-blue-50',
    statusText  : 'text-blue-700',
    btn         : 'bg-blue-600 hover:bg-blue-700 text-white',
    iconBg      : 'bg-blue-100',
    iconText    : 'text-blue-600',
    inProgress  : 'bg-blue-100 text-blue-700',
    cardTitleTxt: 'text-blue-900',
    savedTxt    : 'text-blue-600',
    banner      : 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const userName    = user?.nombre ?? 'Practicante';
  const userRole    = `Practicante ${isNutri ? 'Nutrición' : 'Fisioterapia'}`;
  const userInitials = getInitials(userName);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER GLOBAL (cambia según vista) ───────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
        {activeView === 'hub' ? (
          <p className="text-sm text-gray-500 font-medium">
            Consultas &rsaquo; <span className="text-gray-800 font-semibold">Consulta #{cita?.numero_consulta ?? cita?.id}</span> &rsaquo; Workspace
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('hub')}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al workspace
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-700">{formName}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          {timerSegs !== null && (
            <span className={`text-sm flex items-center gap-1.5 font-bold tabular-nums ${timerSegs <= 300 ? 'text-red-600' : timerSegs <= 600 ? 'text-amber-600' : 'text-gray-500'}`}>
              <Clock className="w-4 h-4 flex-shrink-0" />
              {formatCountdown(timerSegs)}
            </span>
          )}
          <span className="text-green-600 text-sm flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Conexión estable
          </span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold select-none">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* ── VISTA FORMULARIO (siempre montado para que el ref sea válido) ─── */}
      <div className={activeView === 'form' ? 'block' : 'hidden'}>
        {tipo === 'nutricion'    && tipo_consulta === 'primera'     && <NutritionMasterForm    ref={formRef} {...callbacks} />}
        {tipo === 'nutricion'    && tipo_consulta === 'subsecuente' && <HojaEvolutiva           ref={formRef} {...callbacks} />}
        {tipo === 'fisioterapia' && tipo_consulta === 'primera'     && <PhysiotherapyMasterForm ref={formRef} {...callbacks} />}
        {tipo === 'fisioterapia' && tipo_consulta === 'subsecuente' && <HojaEvolutiva           ref={formRef} {...callbacks} />}
        {!formKey && (
          <div className="min-h-[60vh] flex items-center justify-center text-gray-500 text-sm">
            Tipo de formulario no disponible para esta cita.
          </div>
        )}
      </div>

      {/* ── VISTA HUB ─────────────────────────────────────────────────────── */}
      {activeView === 'hub' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COLUMNA PRINCIPAL ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Encabezado de la consulta */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Consulta #{cita?.numero_consulta ?? cita?.id}</h1>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${accent.badge}`}>
                    En Atención
                  </span>
                  <p className="text-gray-500 mt-3 text-sm">
                    Fecha: {formatFecha(cita?.fecha)}&nbsp;&bull;&nbsp;Hora: {formatHora(cita?.hora)}&nbsp;&bull;&nbsp;Duración: {elapsed}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowConfirmNoAsistio(true)}
                    disabled={finalizando}
                    className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    No asistió
                  </button>
                  <button
                    onClick={requestFinalizar}
                    disabled={finalizando}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
                  >
                    {finalizando ? 'Guardando...' : 'Finalizar Consulta'}
                  </button>
                </div>
              </div>
            </div>

            {/* Banner de tiempo agotándose */}
            {timerSegs !== null && timerSegs <= 300 && (
              <div className="border border-red-300 bg-red-50 p-4 rounded-lg flex items-start gap-3 text-sm text-red-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                <span>
                  <span className="font-bold">Tiempo restante: {formatCountdown(timerSegs)}</span>
                  {' '}— Si no finalizas la consulta antes de que el tiempo se agote, quedará registrada como incompleta.
                </span>
              </div>
            )}

            {/* Banner recordatorio */}
            <div className={`border p-4 rounded-lg flex items-start gap-3 text-sm ${accent.banner}`}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Recuerda: Guarda borradores frecuentemente. Se guardan automáticamente cada 15 segundos.
                {lastSaved && (
                  <span className="ml-1 font-semibold">
                    Último guardado: {formatTime(lastSaved)}.
                  </span>
                )}
              </span>
            </div>

            {/* Documentos requeridos */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">
                Documentos Requeridos para esta Consulta
              </h2>
              {/* Input oculto para subir consentimiento */}
              <input
                ref={consentInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={handleConsentUpload}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta: Consentimiento Informado */}
                {cita?.documentosRequeridos?.includes('consentimiento') && (
                  <div className={`p-5 rounded-xl shadow-sm transition-all ${consentSubido ? accent.cardBorder : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${consentSubido ? accent.iconBg : 'bg-gray-100'}`}>
                        <FileText className={`w-4.5 h-4.5 ${consentSubido ? accent.iconText : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm ${consentSubido ? accent.cardTitleTxt : 'text-gray-800'}`}>
                          Consentimiento Informado
                        </h3>
                        {consentSubido ? (
                          <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded inline-block ${pendingConsent ? 'bg-amber-100 text-amber-800' : accent.inProgress}`}>
                            {pendingConsent ? 'LISTO' : 'GUARDADO'}
                          </span>
                        ) : (
                          <span className="mt-1 text-xs font-bold px-2 py-0.5 rounded inline-block bg-gray-100 text-gray-500">
                            PENDIENTE
                          </span>
                        )}
                      </div>
                    </div>
                    {consentSubido ? (
                      <div className="mt-4 flex flex-col gap-2">
                        <div className={`w-full py-2 rounded-lg text-xs font-bold text-center ${pendingConsent ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {pendingConsent ? 'Archivo listo · se guardará al finalizar' : 'Documento guardado ✓'}
                        </div>
                        <button
                          onClick={handleConsentDelete}
                          disabled={deletingConsent}
                          className="w-full py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deletingConsent ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />Eliminando...</> : 'Eliminar y volver a subir'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !uploadingConsent && consentInputRef.current?.click()}
                        disabled={uploadingConsent}
                        className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${accent.btn}${uploadingConsent ? ' opacity-60' : ''}`}
                      >
                        {uploadingConsent ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...</>
                        ) : (
                          <><Upload className="w-3.5 h-3.5" /> Subir Consentimiento</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {formKey ? (
                  <div className={`p-5 rounded-xl shadow-sm transition-all ${formConfirmado ? 'border-2 border-green-200 bg-green-50' : hasBorrador ? accent.cardBorder : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${formConfirmado ? 'bg-green-100' : hasBorrador ? accent.iconBg : 'bg-gray-100'}`}>
                        {formConfirmado
                          ? <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                          : <FileText className={`w-4.5 h-4.5 ${hasBorrador ? accent.iconText : 'text-gray-400'}`} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm ${formConfirmado ? 'text-green-900' : hasBorrador ? accent.cardTitleTxt : 'text-gray-800'}`}>
                          {formName}
                        </h3>
                        {formConfirmado ? (
                          <span className="mt-1 text-xs font-bold px-2 py-0.5 rounded inline-block bg-green-100 text-green-700">
                            GUARDADO
                          </span>
                        ) : hasBorrador ? (
                          <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded inline-block ${accent.inProgress}`}>
                            EN PROGRESO
                          </span>
                        ) : (
                          <span className="mt-1 text-xs font-bold px-2 py-0.5 rounded inline-block bg-gray-100 text-gray-500">
                            PENDIENTE
                          </span>
                        )}
                        {lastSaved && (
                          <p className={`text-xs mt-1 ${formConfirmado ? 'text-green-600' : hasBorrador ? accent.savedTxt : 'text-gray-400'}`}>
                            Guardado a las {formatTime(lastSaved)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveView('form')}
                      className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-colors ${formConfirmado ? 'bg-green-600 hover:bg-green-700 text-white' : accent.btn}`}
                    >
                      {formConfirmado ? 'Revisar formulario' : hasBorrador ? 'Continuar Llenando' : 'Comenzar'}
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 p-5 rounded-xl text-center text-gray-400 text-sm">
                    Tipo de consulta no definido
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ────────────────────────────────────────────────── */}
          <aside className="space-y-5">

            {/* Información del paciente */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Información del Paciente</h3>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${accent.iconBg} ${accent.iconText}`}>
                  {cita?.paciente_nombre ? getInitials(cita.paciente_nombre) : 'P'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{cita?.paciente_nombre ?? '—'}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {tipo} &bull; {tipo_consulta === 'primera' ? 'Primera consulta' : 'Subsecuente'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progreso de la consulta */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Estado de la Consulta</h3>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full w-1/2 transition-all duration-500 ${accent.bar}`} />
              </div>
              <div className="flex justify-between mt-2.5 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                <span>Programada</span>
                <span className={accent.statusText}>En Atención</span>
                <span>Completada</span>
              </div>
            </div>

            {/* Cronómetro de consulta */}
            {timerSegs !== null && (
              <div className={`p-5 rounded-xl shadow-sm border ${timerSegs <= 300 ? 'bg-red-50 border-red-200' : timerSegs <= 600 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-bold mb-3 text-sm ${timerSegs <= 300 ? 'text-red-700' : timerSegs <= 600 ? 'text-amber-700' : 'text-gray-900'}`}>
                  Tiempo Restante
                </h3>
                <div className="flex items-center gap-3">
                  <Clock className={`w-8 h-8 flex-shrink-0 ${timerSegs <= 300 ? 'text-red-500' : timerSegs <= 600 ? 'text-amber-500' : accent.iconText}`} />
                  <span className={`text-3xl font-black tabular-nums tracking-tight ${timerSegs <= 300 ? 'text-red-600' : timerSegs <= 600 ? 'text-amber-600' : accent.statusText}`}>
                    {formatCountdown(timerSegs)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  Tienes <span className="font-semibold">90 minutos</span> para completar y finalizar esta consulta. Si el tiempo se agota sin que la finalices, quedará marcada como <span className="font-semibold">incompleta</span> y deberás esperar a que un administrador la reactive.
                </p>
                {timerSegs <= 600 && (
                  <p className={`mt-2 text-xs font-semibold ${timerSegs <= 300 ? 'text-red-600' : 'text-amber-600'}`}>
                    {timerSegs <= 300
                      ? '⚠ Menos de 5 minutos. Finaliza la consulta cuanto antes.'
                      : '⚠ Menos de 10 minutos restantes.'}
                  </p>
                )}
              </div>
            )}

            {/* Acciones rápidas */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Acciones Rápidas</h3>
              <div className="flex flex-col gap-2">
                {formKey && (
                  <button
                    onClick={() => setActiveView('form')}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${formConfirmado ? 'bg-green-600 hover:bg-green-700 text-white' : accent.btn}`}
                  >
                    {formConfirmado ? 'Revisar formulario clínico' : hasBorrador ? 'Continuar llenando formulario' : 'Abrir formulario clínico'}
                  </button>
                )}
                <button
                  onClick={requestFinalizar}
                  disabled={finalizando}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  Finalizar consulta
                </button>
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* ── DIALOG — FINALIZAR CONSULTA ────────────────────────────────── */}
      <ConfirmDialog
        open={showConfirmFinalizar}
        onOpenChange={setShowConfirmFinalizar}
        icon={<CheckCircle className="w-6 h-6 text-red-500" />}
        title="Finalizar Consulta"
        description="Una vez finalizada, no podrás volver a editar el expediente clínico de esta sesión."
        infoBox={
          <>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Paciente</p>
            <p className="text-blue-900 font-black text-base">{cita?.paciente_nombre}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Consulta #{cita?.numero_consulta ?? cita?.id} &bull; {cita?.tipo === 'nutricion' ? 'Nutrición' : 'Fisioterapia'}
            </p>
          </>
        }
        confirmLabel="Sí, finalizar"
        confirmClass="flex-1 bg-red-600 hover:bg-red-700 font-bold text-white shadow-md"
        onConfirm={doFinalizar}
      />

      {/* ── DIALOG — NO ASISTIÓ ───────────────────────────────────────── */}
      <ConfirmDialog
        open={showConfirmNoAsistio}
        onOpenChange={setShowConfirmNoAsistio}
        icon={<UserX className="w-6 h-6 text-slate-500" />}
        title="Marcar como No Asistió"
        description={
          <>
            ¿Confirmas que{' '}
            <span className="font-black text-blue-900">{cita?.paciente_nombre}</span>{' '}
            no se presentó a la cita?
          </>
        }
        confirmLabel="Sí, no asistió"
        confirmClass="flex-1 bg-slate-700 hover:bg-slate-800 font-bold text-white shadow-md"
        onConfirm={doNoAsistio}
      />
    </div>
  );
};

export default ConsultaWorkspace;
