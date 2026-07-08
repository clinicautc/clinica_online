import { apiFetch, apiFetchJson } from './client';

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

  getDiasCompletos(mes: string, tipo: string): Promise<string[]> {
    return apiFetchJson(`/citas/dias-completos?mes=${mes}&tipo=${tipo}`);
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
  },

  getById(id: string | number) {
    return apiFetchJson(`/citas/${id}`);
  },

  iniciar(id: string | number) {
    return apiFetchJson(`/citas/${id}/iniciar`, { method: 'PATCH' });
  },

  finalizar(id: string | number) {
    return apiFetchJson(`/citas/${id}/finalizar`, { method: 'PATCH' });
  },

  noAsistio(id: string | number) {
    return apiFetchJson(`/citas/${id}/no-asistio`, { method: 'PATCH' });
  },

  revertir(id: string | number, motivo: string) {
    return apiFetchJson(`/citas/${id}/revertir`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });
  },

  uploadConsentimiento(citaId: string | number, archivo: string, mimeType: string) {
    return apiFetchJson(`/citas/${citaId}/consentimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivo, mimeType })
    });
  },

  checkConsentimiento(citaId: string | number): Promise<{ existe: boolean }> {
    return apiFetchJson(`/citas/${citaId}/consentimiento`);
  },

  async downloadConsentimiento(citaId: string | number): Promise<{ blob: Blob; mimeType: string }> {
    const res = await apiFetch(`/citas/${citaId}/consentimiento/descargar`);
    if (!res.ok) throw new Error('No se pudo obtener el consentimiento');
    const blob = await res.blob();
    return { blob, mimeType: res.headers.get('Content-Type') ?? 'application/octet-stream' };
  },

  deleteConsentimiento(citaId: string | number): Promise<{ ok: boolean }> {
    return apiFetchJson(`/citas/${citaId}/consentimiento`, { method: 'DELETE' });
  },

  recuperar(id: string | number) {
    return apiFetchJson(`/citas/${id}/recuperar`, { method: 'PATCH' });
  },

  guardarBorrador(id: string | number, borrador: Record<string, unknown>) {
    return apiFetchJson(`/citas/${id}/borrador`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrador })
    });
  }

};
