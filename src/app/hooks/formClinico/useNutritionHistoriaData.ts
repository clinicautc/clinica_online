import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch, historialesAPI } from '../../lib/api';
import type { FormClinicoCallbacks } from '../../lib/types/formClinico';

export interface NutritionFormData {
  pagina_1: Record<string, any>;
  pagina_2: Record<string, any>;
  pagina_3: Record<string, any>;
  pagina_4: Record<string, any>;
  [key: string]: any;
}

/**
 * Carga/guarda/valida la Historia Clínica Nutricional (primera consulta).
 * Extraído de NutritionMasterForm.tsx, reconciliando las 2 implementaciones
 * de guardado que existían duplicadas (una en el componente padre, usada en
 * modo workspace vía props.pacienteId; otra en NutritionPage4Component, usada
 * en modo standalone vía formData.pagina_1.paciente_id) en una sola función
 * con fallback — en workspace props.pacienteId siempre viene poblado (nunca
 * cae al fallback); en standalone siempre viene undefined (siempre cae al
 * fallback) — mismo comportamiento que las 2 versiones originales, unificado.
 */
export function useNutritionHistoriaData(props: Partial<FormClinicoCallbacks>) {
  const params = useParams();
  const appointmentId = params.id || params.appointmentId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<NutritionFormData>(() => ({
    pagina_1: { paciente_id: props.pacienteId ?? undefined },
    pagina_2: {},
    pagina_3: {},
    pagina_4: {},
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
        const response = await apiFetch(`/historiales-nutricion/detalle/${appointmentId}`);

        if (response.ok) {
          const filaCompleta = await response.json();
          setHistorialId(filaCompleta.id);

          const datosGuardados = filaCompleta.datos || {};
          setFormData((prevData) => ({
            ...prevData,
            ...datosGuardados,
            paciente_id: filaCompleta.paciente_id,
            pagina_1: {
              ...(prevData.pagina_1 || {}),
              ...(datosGuardados.pagina_1 || {}),
              paciente_id: filaCompleta.paciente_id,
            },
          }));

          toast.success('Expediente cargado correctamente');
        }
      } catch (error) {
        console.error('Error al cargar historial nutricional:', error);
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
      const pNombre = props.pacienteNombre ?? formData?.pagina_1?.nombre ?? 'Paciente sin nombre';
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
        tipo: 'nutricion',
        datos: formData,
        creado_por: user?.id || 1,
        creado_por_nombre: user?.nombre || 'Practicante Nutrición',
        appointment_id: aId,
      };

      await historialesAPI.guardar(historialId ?? null, payload);
      toast.success('Expediente guardado correctamente');

      if (props.onSaveSuccess) {
        props.onSaveSuccess(props.formKey ?? '');
      } else {
        setTimeout(() => navigate(`/historial/${pId}/nutricion`, { replace: true }), 1000);
      }
    } catch (error: any) {
      console.error('Error crítico:', error);
      toast.error('Error al guardar en la base de datos.');
      props.onSaveFailure?.(props.formKey ?? '', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = !!(formData?.pagina_1?.nombre?.trim());

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
