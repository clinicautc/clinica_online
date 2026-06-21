import { apiFetchJson } from './client';

export const practicantesAPI = {

  getAll(area?: string) {
    return apiFetchJson(area ? `/practicantes?area=${area}` : '/practicantes');
  },

  create(data: Record<string, any>) {
    return apiFetchJson('/practicantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateStatus(id: string | number, estado: string) {
    return apiFetchJson(`/practicantes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
  },

  remove(id: string | number) {
    return apiFetchJson(`/practicantes/${id}`, { method: 'DELETE' });
  }

};
