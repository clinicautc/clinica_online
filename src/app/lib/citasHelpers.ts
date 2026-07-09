/**
 * ============================================================================
 * ARCHIVO: citasHelpers.ts
 * PROPÓSITO: Reglas compartidas sobre citas (color de estado, bloqueo de
 * acciones para citas pasadas/completadas) usadas por los dashboards de
 * admin/master. El backend aplica la misma regla en citasController.js
 * (update/asignar) como respaldo ante llamadas directas a la API.
 * ============================================================================
 */

import { format } from 'date-fns';

export function esFechaPasada(fecha: string): boolean {
  const cleanFecha = fecha.split('T')[0];
  const hoy = format(new Date(), 'yyyy-MM-dd');
  return cleanFecha < hoy;
}

export function esCitaBloqueada(apt: { fecha: string; estado: string }): boolean {
  return ['completada', 'en_atencion', 'no_asistio', 'cancelada', 'incompleta'].includes(apt.estado) || esFechaPasada(apt.fecha);
}

export function getEstadoBadgeClasses(estado: string): string {
  switch (estado) {
    case 'completada':               return 'bg-green-50 text-green-700 border-green-100';
    case 'en_atencion':              return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'no_asistio':               return 'bg-gray-50 text-gray-500 border-gray-200';
    case 'cancelada':                return 'bg-red-50 text-red-500 border-red-100';
    case 'pendiente_reprogramacion': return 'bg-red-50 text-red-600 border-red-100';
    case 'incompleta':               return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'recuperada':               return 'bg-sky-50 text-sky-700 border-sky-200';
    default:                         return 'bg-amber-50 text-amber-700 border-amber-100';
  }
}

export function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'programada':               return 'Programada';
    case 'en_atencion':              return 'En atención';
    case 'completada':               return 'Completada';
    case 'no_asistio':               return 'No asistió';
    case 'cancelada':                return 'Cancelada';
    case 'pendiente_reprogramacion': return 'Sin practicante';
    case 'incompleta':               return 'Incompleta';
    case 'recuperada':               return 'Recuperada';
    default:                         return estado;
  }
}
