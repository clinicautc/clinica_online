/**
 * Contrato que todo formulario clínico debe implementar mediante useImperativeHandle.
 * El workspace lo usa para: guardar borrador, disparar guardado final y verificar
 * si el formulario tiene datos listos. El workspace nunca interpreta el contenido
 * del estado — es opaco desde su perspectiva.
 */
export interface FormClinicoHandle {
  /** Dispara el guardado del formulario (llamada al endpoint del historial). */
  triggerSave: () => void;
  /** true cuando el formulario tiene los campos mínimos requeridos para poder guardarse. */
  canSave: boolean;
  /** Restaura el estado del formulario desde un borrador previo (JSON opaco). */
  restoreDraft: (state: unknown) => void;
}

/**
 * Props que el workspace inyecta en cada formulario clínico.
 * El componente debe aceptarlas además de sus props propias.
 */
export interface FormClinicoCallbacks {
  /** Identificador del formulario dentro del borrador ({ [formKey]: stateJson }). */
  formKey: string;
  /** Se llama cada vez que el estado interno cambia (para auto-guardado de borrador). */
  onStateChange: (formKey: string, state: unknown) => void;
  /** Se llama cuando el guardado oficial (al historial) fue exitoso. */
  onSaveSuccess: (formKey: string) => void;
  /** Se llama cuando el guardado oficial falla. */
  onSaveFailure: (formKey: string, error?: string) => void;
  /** Estado inicial del borrador, si existe. El formulario decide cómo hidratarlo. */
  initialDraft?: unknown;
  /** Volver al hub del workspace sin salir de la consulta. */
  onBack?: () => void;
  /** ID del paciente de la cita activa — inyectado por ConsultaWorkspace. */
  pacienteId?: number;
  /** Nombre del paciente de la cita activa — inyectado por ConsultaWorkspace. */
  pacienteNombre?: string;
}
