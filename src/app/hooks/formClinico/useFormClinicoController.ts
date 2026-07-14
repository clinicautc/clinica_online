import { useEffect, useImperativeHandle, type ForwardedRef } from 'react';
import type { FormClinicoHandle, FormClinicoCallbacks } from '../../lib/types/formClinico';

interface UseFormClinicoControllerParams<TState> {
  formKeyProp?: string;
  state: TState;
  onStateChange?: FormClinicoCallbacks['onStateChange'];
  onBack?: FormClinicoCallbacks['onBack'];
  canSave: boolean;
  triggerSave: () => void | Promise<void>;
  restoreDraft: (draft: unknown) => void;
  /** Se llama en modo workspace al confirmar "Guardar" sin finalizar (marca listo y vuelve al hub, sin persistir). */
  onGuardarSinFinalizar?: () => void;
}

/**
 * Motor genérico compartido por los 3 formularios clínicos: expone el contrato
 * FormClinicoHandle vía useImperativeHandle, notifica cambios de estado para el
 * autoguardado de borrador (centralizado en ConsultaWorkspace, no aquí), y resuelve
 * qué hace el botón "Guardar" interno según el modo (workspace: no persiste, solo
 * marca listo y regresa al hub; standalone: dispara el guardado real).
 */
export function useFormClinicoController<TState>(
  params: UseFormClinicoControllerParams<TState>,
  ref: ForwardedRef<FormClinicoHandle>
) {
  const { formKeyProp, state, onStateChange, onBack, canSave, triggerSave, restoreDraft, onGuardarSinFinalizar } = params;
  const isWorkspaceMode = !!formKeyProp;

  useImperativeHandle(ref, () => ({
    triggerSave,
    canSave,
    restoreDraft,
  }));

  useEffect(() => {
    onStateChange?.(formKeyProp ?? '', state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const confirmarGuardado = () => {
    if (isWorkspaceMode) {
      onGuardarSinFinalizar?.();
      onBack?.();
    } else {
      triggerSave();
    }
  };

  return { isWorkspaceMode, confirmarGuardado };
}
