import { apiFetchJson } from './client';

export const recomendacionesAPI = {

  getByPaciente(pacienteId: string | number, area: 'nutricion' | 'fisioterapia') {
    return apiFetchJson(`/recomendaciones/paciente/${pacienteId}?area=${area}`);
  },

  create(data: Record<string, any>) {
    return apiFetchJson('/recomendaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

};
