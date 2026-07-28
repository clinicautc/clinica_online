import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { notasAPI } from '../../lib/api';
import type { FormClinicoCallbacks } from '../../lib/types/formClinico';

export type SeguimientoNutricionalFormData = Record<string, string | boolean>;

/**
 * Carga/guarda el Seguimiento Nutricional — exclusivo de nutrición. A
 * diferencia de useHojaEvolutivaData (fisioterapia, sin bloqueo por
 * columna), aquí SIEMPRE se consulta el backend al montar (incluso en modo
 * workspace) porque columnaActual y las columnas ya cerradas de consultas
 * anteriores viven en el documento ya guardado, no en el borrador — el
 * borrador solo cubre lo que el usuario lleva tecleado de la columna en
 * curso.
 */
export function useSeguimientoNutricionalData(props: Partial<FormClinicoCallbacks>) {
  const params = useParams();
  const appointmentId = params.id || params.appointmentId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<SeguimientoNutricionalFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notaId, setNotaId] = useState<number | null>(null);
  const [yaGuardado, setYaGuardado] = useState(false);
  const [columnaActual, setColumnaActual] = useState<number | null>(null);
  const [estadoCita, setEstadoCita] = useState<string | null>(null);

  const esPrivilegiado = user?.rol === 'admin' || user?.rol === 'master';
  // Admin/master: sin bloqueo (undefined -> MatrixTable/SimpleFieldTable dejan las 6 columnas editables).
  const columnaParaBloqueo = esPrivilegiado ? undefined : (columnaActual ?? undefined);

  useEffect(() => {
    if (!appointmentId || appointmentId === 'null' || appointmentId === 'undefined') {
      toast.error("Este seguimiento no tiene una cita vinculada, no se pueden cargar datos.");
      setIsLoading(false);
      return;
    }
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await notasAPI.getSeguimientoNutricional(appointmentId as string);
        setNotaId(data.notaId ?? null);
        setColumnaActual(data.columnaActual ?? null);
        setEstadoCita(data.estadoCita ?? null);
        setFormData((prev) => ({
          ...prev,
          ...(data.cuadro_evolucion || {}),
          paciente_id: String(props.pacienteId ?? data.paciente_id ?? ''),
          paciente_nombre: data.paciente_nombre || props.pacienteNombre || '',
        }));
      } catch (error: any) {
        console.error("Error al cargar seguimiento nutricional:", error);
        toast.error(error.message ?? 'Error al cargar el seguimiento nutricional');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [appointmentId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = async () => {
    setIsSaving(true);
    try {
      const { paciente_expediente: _expedienteAnterior, ...cuadroEvolucion } = formData;
      await notasAPI.guardarSeguimientoNutricional(appointmentId as string, cuadroEvolucion);
      toast.success("¡Expediente guardado correctamente!");
      setYaGuardado(true);

      if (props.onSaveSuccess) {
        props.onSaveSuccess(props.formKey ?? '');
      } else {
        setTimeout(() => navigate(`/forms/seguimiento-nutricional/${appointmentId}/documento`, { replace: true }), 1000);
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
    columnaActual,
    columnaParaBloqueo,
    estadoCita,
    notaId,
  };
}
