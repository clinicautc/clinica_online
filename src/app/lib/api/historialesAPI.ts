import { apiFetchJson } from './client';

export const historialesAPI = {

  getAll() {
    return apiFetchJson('/historiales');
  },

  verificarRecurrencia(pacienteId: string | number, area: 'nutricion' | 'fisioterapia') {
    return apiFetchJson(`/historiales/verificar/${pacienteId}/${area}`);
  },

  updateGenerico(id: string | number, data: Record<string, any>) {
    return apiFetchJson(`/historiales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  create(data: Record<string, any>) {
    return apiFetchJson('/historiales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Para el flujo "PUT si ya existe historialId, POST si es nuevo" usado en los Master Forms.
  guardar(historialId: string | number | null, data: Record<string, any>) {
    return apiFetchJson(historialId ? `/historiales/${historialId}` : '/historiales', {
      method: historialId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getNutricionDetalle(appointmentId: string | number) {
    return apiFetchJson(`/historiales-nutricion/detalle/${appointmentId}`);
  },

  getFisioterapiaDetalle(appointmentId: string | number) {
    return apiFetchJson(`/historiales-fisioterapia/detalle/${appointmentId}`);
  },

  getNutricionByPaciente(pacienteId: string | number) {
    return apiFetchJson(`/historiales-nutricion/paciente/${pacienteId}`);
  },

  getFisioterapiaByPaciente(pacienteId: string | number) {
    return apiFetchJson(`/historiales-fisioterapia/paciente/${pacienteId}`);
  }

};
