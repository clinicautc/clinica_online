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
  return apt.estado === 'completada' || esFechaPasada(apt.fecha);
}

export function getEstadoBadgeClasses(estado: string): string {
  switch (estado) {
    case 'completada':            return 'bg-green-50 text-green-700 border-green-100';
    case 'confirmada':            return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'pendiente_reprogramacion': return 'bg-red-50 text-red-600 border-red-100';
    default:                      return 'bg-amber-50 text-amber-700 border-amber-100';
  }
}

export function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'programada':               return 'Programada';
    case 'confirmada':               return 'Confirmada';
    case 'completada':               return 'Completada';
    case 'pendiente_reprogramacion': return 'Sin practicante';
    default:                         return estado;
  }
}
