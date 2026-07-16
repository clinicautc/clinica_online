import { useEffect, useImperativeHandle, useRef, type ForwardedRef } from 'react';
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

// Selects, checkboxes, radios, date/time pickers nativos y componentes de
// selección tipo Radix/shadcn (combobox, listbox, trigger de Select) — su
// evento "change"/"click" representa una decisión completa del usuario, a
// diferencia de un input de texto donde cada tecla dispara un evento propio.
const SELECTOR_CAMPOS_DE_SELECCION =
  'select, input[type="checkbox"], input[type="radio"], input[type="date"], ' +
  'input[type="month"], input[type="week"], input[type="time"], input[type="datetime-local"], ' +
  'input[type="range"], [role="combobox"], [role="listbox"], [data-slot="select-trigger"]';

// Carácter que marca el fin de una palabra mientras se escribe en un input/textarea.
const REGEX_FIN_DE_PALABRA = /[\s.,;:!?)\]"'\-]$/;

/**
 * Motor genérico compartido por los 4 formularios clínicos: expone el contrato
 * FormClinicoHandle vía useImperativeHandle, y decide -desde este único punto
 * central- cuándo notificar el cambio de estado para el autoguardado de
 * borrador (persistido en ConsultaWorkspace, no aquí).
 *
 * El criterio de autoguardado NO es por temporizador ni por cada tecla: se
 * dispara sobre eventos naturales de interacción, delegados a nivel documento
 * para no tener que instrumentar cada uno de los 4 formularios ni sus campos:
 *   - el usuario sale de un campo (focusout, que sí burbujea a diferencia de blur),
 *   - cambia un select/checkbox/radio/date-picker/calendar u otro control de selección,
 *   - termina de escribir una palabra (el último carácter tecleado es un separador),
 *   - cambia de sección/tab dentro del formulario (click en un TabsTrigger),
 *   - confirma el botón de guardar (ver `confirmarGuardado`),
 *   - o intenta cerrar la ventana del workspace (beforeunload).
 * Fuera de esos eventos no se llama a `onStateChange`, así que no viaja nada
 * al backend — el modelo de borrador y el endpoint de guardado no cambian.
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

  // Refs para que los listeners (registrados una sola vez) siempre lean el
  // estado/callback más recientes, sin necesidad de re-registrarlos en cada render.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  useEffect(() => {
    if (!formKeyProp) return; // fuera de modo workspace no aplica este autoguardado por eventos

    const persistir = () => {
      onStateChangeRef.current?.(formKeyProp, stateRef.current);
    };

    const handleFocusOut = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') persistir();
    };

    const handleChange = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest(SELECTOR_CAMPOS_DE_SELECCION)) persistir();
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
      if (REGEX_FIN_DE_PALABRA.test(target.value)) persistir();
    };

    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('[data-slot="tabs-trigger"]')) persistir();
    };

    const handleBeforeUnload = () => { persistir(); };

    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('change', handleChange);
    document.addEventListener('input', handleInput);
    document.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('change', handleChange);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formKeyProp]);

  const confirmarGuardado = () => {
    if (isWorkspaceMode) {
      onStateChange?.(formKeyProp ?? '', state);
      onGuardarSinFinalizar?.();
      onBack?.();
    } else {
      triggerSave();
    }
  };

  return { isWorkspaceMode, confirmarGuardado };
}
