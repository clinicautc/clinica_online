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

// Semáforo: verde = completada, ámbar = cualquier otro estado activo (programada/asignada/pendiente/confirmada).
export function getEstadoBadgeClasses(estado: string): string {
  if (estado === 'completada') {
    return 'bg-green-50 text-green-700 border-green-100';
  }
  return 'bg-amber-50 text-amber-700 border-amber-100';
}
