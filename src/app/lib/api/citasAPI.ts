import { apiFetchJson } from './client';

export const citasAPI = {

  getAll() {
    return apiFetchJson('/citas');
  },

  getByPaciente(pacienteId: string | number) {
    return apiFetchJson(`/citas/paciente/${pacienteId}`);
  },

  getDisponibilidad(fecha: string, tipo: string) {
    return apiFetchJson(`/citas/disponibilidad?fecha=${fecha}&tipo=${tipo}`);
  },

  create(data: Record<string, any>) {
    return apiFetchJson('/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  update(id: string | number, data: Record<string, any>) {
    return apiFetchJson(`/citas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  remove(id: string | number) {
    return apiFetchJson(`/citas/${id}`, { method: 'DELETE' });
  },

  asignar(id: string | number, data: { practicante_id: string | number; practicante_nombre: string }) {
    return apiFetchJson(`/citas/${id}/asignar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

};
