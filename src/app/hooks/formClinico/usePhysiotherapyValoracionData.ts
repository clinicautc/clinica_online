import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch, historialesAPI } from '../../lib/api';
import type { FormClinicoCallbacks } from '../../lib/types/formClinico';

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

      const payload = {
        paciente_id: pId,
        paciente_nombre: pNombre,
        tipo: 'fisioterapia',
        datos: formData,
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
