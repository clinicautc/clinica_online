import { apiFetchJson } from './client';

export const notasAPI = {

  getEvolucion(appointmentId: string | number) {
    return apiFetchJson(`/notas-evolucion/${appointmentId}`);
  },

  createEvolucion(data: Record<string, any>) {
    return apiFetchJson('/notas-evolucion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateEvolucion(id: string | number, data: Record<string, any>) {
    return apiFetchJson(`/notas-evolucion/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Seguimiento Nutricional — exclusivo de nutrición, ver seguimientoNutricionalController.js
  getSeguimientoNutricional(appointmentId: string | number) {
    return apiFetchJson(`/seguimiento-nutricional/${appointmentId}`);
  },

  guardarSeguimientoNutricional(appointmentId: string | number, cuadroEvolucion: Record<string, unknown>) {
    return apiFetchJson(`/seguimiento-nutricional/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuadro_evolucion: cuadroEvolucion })
    });
  },

  getUniversitarias() {
    return apiFetchJson('/notas_universitarias');
  },

  createUniversitaria(data: Record<string, any>) {
    return apiFetchJson('/notas_universitarias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  responderUniversitaria(id: string | number, contenido: string) {
    return apiFetchJson(`/notas_universitarias/${id}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido })
    });
  }

};
