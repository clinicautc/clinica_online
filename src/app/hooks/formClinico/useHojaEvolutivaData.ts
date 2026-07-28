import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { notasAPI } from '../../lib/api';
import type { FormClinicoCallbacks } from '../../lib/types/formClinico';

export type HojaEvolutivaFormData = Record<string, string | boolean>;

/**
 * Carga/guarda/valida la Hoja Evolutiva (nota de seguimiento). Extraído literal de
 * HojaEvolutiva.tsx — mismo comportamiento byte a byte, solo relocalizado para ser
 * compartido entre el componente de captura y (más adelante) el de solo lectura.
 */
export function useHojaEvolutivaData(props: Partial<FormClinicoCallbacks>) {
  const params = useParams();
  const appointmentId = params.id || params.appointmentId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<HojaEvolutivaFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notaId, setNotaId] = useState<number | null>(null);
  const [yaGuardado, setYaGuardado] = useState(false);

  useEffect(() => {
    if (!appointmentId || appointmentId === 'null' || appointmentId === 'undefined') {
      console.warn("⚠️ No se detectó el appointmentId en la URL.");
      toast.error("Este historial no tiene una cita vinculada, no se pueden cargar datos.");
      setIsLoading(false);
      return;
    }

    if (!user) return;

    // En modo workspace el borrador se restaura vía restoreDraft(); saltamos la carga de BD.
    if (props.formKey) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await notasAPI.getEvolucion(appointmentId as string);

        if (data && data.id) {
          setNotaId(data.id);
        }

        if (data) {
          setFormData((prev) => ({
            ...prev,
            ...(data.cuadro_evolucion || {}),
            paciente_id: String(props.pacienteId ?? data.paciente_id ?? data.cuadro_evolucion?.paciente_id ?? ''),
            paciente_nombre: data.cuadro_evolucion?.paciente_nombre || data.nombre_completo || ''
          }));
          toast.success("Datos de evolución cargados correctamente");
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [appointmentId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = async () => {
    setIsSaving(true);
    try {
      const aId = appointmentId ? parseInt(appointmentId as string, 10) : null;
      const pId = props.pacienteId ?? (typeof formData.paciente_id === 'string' ? formData.paciente_id : null);
      const { paciente_expediente: _expedienteAnterior, ...cuadroEvolucion } = formData;

      // Siempre guardamos en notas_evolutivas — nunca en historiales_nutricion
      const payload = {
        paciente_id: pId,
        practicante_id: user?.id,
        appointment_id: aId,
        nombre_completo: props.pacienteNombre || (formData.paciente_nombre as string) || 'Sin nombre',
        edad: null,
        fecha_elaboracion: new Date().toISOString(),
        cuadro_evolucion: cuadroEvolucion,
        area: props.formKey === 'seguimiento_nutricion' ? 'nutricion' : (user?.area || 'fisioterapia')
      };
      if (notaId) {
        await notasAPI.updateEvolucion(notaId, payload);
      } else {
        await notasAPI.createEvolucion(payload);
      }

      toast.success("¡Expediente guardado correctamente!");
      setYaGuardado(true);

      if (props.onSaveSuccess) {
        props.onSaveSuccess(props.formKey ?? '');
      } else {
        setTimeout(() => navigate(`/forms/seguimiento/${appointmentId}/documento`, { replace: true }), 1000);
      }
    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error(`Error al guardar: ${error.message}`);
      props.onSaveFailure?.(props.formKey ?? '', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = !!(props.pacienteNombre?.trim() || (formData.paciente_nombre as string)?.trim());

  return {
    appointmentId,
    formData,
    setFormData,
    isLoading,
    isSaving,
    yaGuardado,
    setYaGuardado,
    doSave,
    canSave,
  };
}
