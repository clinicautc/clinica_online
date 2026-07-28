/**
 * ============================================================================
 * WRAPPER DE TOAST — misma API de sonner, pero con id automático por mensaje.
 * PROPÓSITO: si el mismo mensaje se dispara varias veces seguidas (ej. un
 * aviso repetido por una interacción rápida como scroll o clics seguidos),
 * sonner reutiliza el mismo toast en pantalla en vez de apilar uno nuevo
 * encimado por cada llamada. Mensajes distintos siguen su comportamiento
 * normal: cada uno es su propio toast, apilado debajo de los demás.
 *
 * Todo el código debe importar `toast` desde aquí en vez de desde 'sonner'
 * directamente, para que este comportamiento aplique en toda la app.
 * ============================================================================
 */
import { toast as sonnerToast, type ExternalToast } from 'sonner';

type Message = Parameters<typeof sonnerToast>[0];

// El id solo se puede derivar de forma confiable cuando el mensaje es texto
// plano — si es JSX/función no hay una forma segura de convertirlo en id,
// así que en ese caso se deja el comportamiento normal de sonner (sin id).
function conIdAutomatico(fn: (message: Message, data?: ExternalToast) => string | number) {
  return (message: Message, data?: ExternalToast) => {
    const id = data?.id ?? (typeof message === 'string' ? message : undefined);
    return fn(message, id !== undefined ? { ...data, id } : data);
  };
}

export const toast = Object.assign(
  conIdAutomatico(sonnerToast),
  {
    success: conIdAutomatico(sonnerToast.success),
    error: conIdAutomatico(sonnerToast.error),
    warning: conIdAutomatico(sonnerToast.warning),
    info: conIdAutomatico(sonnerToast.info),
    message: conIdAutomatico(sonnerToast.message),
    loading: conIdAutomatico(sonnerToast.loading),
    custom: sonnerToast.custom,
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    getHistory: sonnerToast.getHistory,
    getToasts: sonnerToast.getToasts,
  },
);
