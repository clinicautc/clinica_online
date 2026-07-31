import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch, historialesAPI, citasAPI, usuariosAPI } from '../../lib/api';
import type { FormClinicoCallbacks } from '../../lib/types/formClinico';

function formatFechaHoy(): string {
  const hoy = new Date();
  const dd = String(hoy.getDate()).padStart(2, '0');
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${hoy.getFullYear()}`;
}

export interface PhysiotherapyMarker {
  x: number;
  y: number;
  id?: number;
}

export interface PhysiotherapyFormData {
  pagina_1: Record<string, any>;
  pagina_2: Record<string, any> & { markers?: PhysiotherapyMarker[] };
  pagina_3: Record<string, any> & { markers?: PhysiotherapyMarker[] };
  [key: string]: any;
}

/**
 * Carga/guarda/valida la Valoración Inicial de Fisioterapia (primera
 * consulta). Extraído de PhysiotherapyMasterForm.tsx, reconciliando las 2
 * implementaciones de guardado que existían duplicadas (padre, usado en modo
 * workspace vía props.pacienteId; PhysiotherapyPage3Component, usado en modo
 * standalone vía formData.pagina_1.paciente_id) — mismo patrón ya aplicado en
 * useNutritionHistoriaData.
 */
export function usePhysiotherapyValoracionData(props: Partial<FormClinicoCallbacks>) {
  const params = useParams();
  const appointmentId = params.id || params.appointmentId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<PhysiotherapyFormData>(() => ({
    pagina_1: { paciente_id: props.pacienteId ?? undefined },
    pagina_2: { markers: [] },
    pagina_3: { markers: [] },
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [historialId, setHistorialId] = useState<number | null>(null);
  const [yaGuardado, setYaGuardado] = useState(false);

  useEffect(() => {
    const cargarHistorialExistente = async () => {
      if (!appointmentId) { setIsLoading(false); return; }
      // En modo workspace el borrador se restaura vía restoreDraft; saltamos la carga de BD.
      if (props.formKey) { setIsLoading(false); return; }

      try {
        setIsLoading(true);
        const response = await apiFetch(`/historiales-fisioterapia/detalle/${appointmentId}`);

        if (response.ok) {
          const dataGuardada = await response.json();
          setHistorialId(dataGuardada.id);

          const datosGuardados = dataGuardada.datos || {};
          setFormData((prevData) => ({
            ...prevData,
            ...datosGuardados,
            paciente_id: dataGuardada.paciente_id,
            pagina_1: {
              ...(prevData.pagina_1 || {}),
              ...(datosGuardados.pagina_1 || {}),
              paciente_id: dataGuardada.paciente_id,
            },
          }));

          toast.success('Expediente cargado correctamente');
        }
      } catch (error) {
        console.error('Error al cargar historial:', error);
        toast.error('Hubo un problema al recuperar el expediente.');
      } finally {
        setIsLoading(false);
      }
    };

    cargarHistorialExistente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // Autocompletado al iniciar consulta: fecha del día, nombre/teléfono del
  // paciente y folio (F/N) con el número de consulta — usando datos que ya
  // existen en citas/usuarios, sin crear columnas nuevas. Solo llena campos
  // que sigan vacíos, para no pisar un borrador o expediente ya guardado.
  // Mismo mecanismo que useNutritionHistoriaData.ts.
  useEffect(() => {
    if (!appointmentId) return;

    const autocompletarDatosConsulta = async () => {
      try {
        const cita = await citasAPI.getById(appointmentId);

        let telefonoPaciente = '';
        if (cita?.paciente_id) {
          try {
            const paciente = await usuariosAPI.getById(cita.paciente_id);
            telefonoPaciente = paciente?.telefono || '';
          } catch {
            // Paciente sin teléfono registrado, o fetch fallido: se deja vacío.
          }
        }

        // numero_consulta cuenta las citas YA completadas con id <= la actual.
        // Mientras esta consulta sigue en curso (no "completada" todavía) no se
        // cuenta a sí misma, así que su folio real es ese conteo + 1; una vez
        // finalizada, el conteo ya la incluye y no hay que sumarle nada.
        let folioConsulta = '';
        if (cita?.numero_consulta != null) {
          const yaCompletada = cita.estado === 'completada';
          folioConsulta = String(yaCompletada ? cita.numero_consulta : cita.numero_consulta + 1);
        }

        setFormData((prev) => ({
          ...prev,
          pagina_1: {
            ...prev.pagina_1,
            fecha: prev.pagina_1.fecha || formatFechaHoy(),
            nombre_completo: prev.pagina_1.nombre_completo || cita?.paciente_nombre || '',
            telefono: prev.pagina_1.telefono || telefonoPaciente,
            fn: prev.pagina_1.fn || folioConsulta,
          },
        }));
      } catch (error) {
        console.error('Error al autocompletar datos de la consulta:', error);
      }
    };

    autocompletarDatosConsulta();
  }, [appointmentId]);

  const doSave = async () => {
    try {
      setIsSaving(true);

      const parsedFromForm = parseInt(formData?.pagina_1?.paciente_id, 10);
      const pId = props.pacienteId ?? (!isNaN(parsedFromForm) ? parsedFromForm : (formData?.paciente_id ?? null));
      const pNombre = props.pacienteNombre ?? formData?.pagina_1?.nombre_completo ?? 'Paciente sin nombre';
      const parsedAId = parseInt(appointmentId ?? '', 10);
      const aId = !isNaN(parsedAId) ? parsedAId : null;

      if (!pId) {
        toast.error('Error: no se pudo identificar al paciente.');
        setIsSaving(false);
        return;
      }

      // El expediente es una representación del ID del paciente; nunca se
      // persiste como dato independiente dentro del historial clínico.
      const datosParaGuardar: PhysiotherapyFormData = {
        ...formData,
        pagina_1: { ...formData.pagina_1, paciente_id: pId },
      };
      delete datosParaGuardar.pagina_1.expediente;

      const payload = {
        paciente_id: pId,
        paciente_nombre: pNombre,
        tipo: 'fisioterapia',
        datos: datosParaGuardar,
        creado_por: user?.id || 1,
        creado_por_nombre: user?.nombre || 'Practicante Fisioterapia',
        appointment_id: aId,
      };

      await historialesAPI.guardar(historialId ?? null, payload);
      toast.success('¡Historial guardado correctamente!');

      if (props.onSaveSuccess) {
        props.onSaveSuccess(props.formKey ?? '');
      } else {
        setTimeout(() => navigate(`/forms/fisioterapia/${aId}/documento`, { replace: true }), 1500);
      }
    } catch (error: any) {
      console.error('Error en el guardado final:', error);
      toast.error(`Error: ${error.message || 'Revisa la conexión con la API'}`);
      props.onSaveFailure?.(props.formKey ?? '', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = !!(formData?.pagina_1?.nombre_completo?.trim());

  const updateGlobalData = (page: string, data: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, [page]: { ...(prev as any)[page], ...data } }));
  };

  return {
    appointmentId,
    formData,
    setFormData,
    updateGlobalData,
    isLoading,
    isSaving,
    yaGuardado,
    setYaGuardado,
    doSave,
    canSave,
    historialId,
  };
}
